import Anthropic from "@anthropic-ai/sdk";

export type ParsedBloodworkResult = {
  test_name: string;
  value: string;
  unit: string | null;
  reference_range: string | null;
  flag: "low" | "high" | "normal" | "abnormal" | null;
};

export type ParsedBloodwork = {
  summary: string;
  results: ParsedBloodworkResult[];
  weight: { value: number; unit: "lb" | "kg" } | null;
};

const SUPPORTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"] as const;

const EXTRACTION_TOOL = {
  name: "record_bloodwork_results",
  description:
    "Records structured lab test results extracted from a veterinary bloodwork report.",
  input_schema: {
    type: "object" as const,
    properties: {
      summary: {
        type: "string" as const,
        description:
          "A 1-2 sentence plain-language summary of the overall results, noting anything abnormal.",
      },
      results: {
        type: "array" as const,
        items: {
          type: "object" as const,
          properties: {
            test_name: {
              type: "string" as const,
              description:
                "The standard/common name for this lab test (e.g. 'BUN', 'Creatinine', 'ALT', 'WBC'), not the lab's internal code, so the same test can be matched up across multiple reports over time.",
            },
            value: { type: "string" as const },
            unit: { type: "string" as const },
            reference_range: { type: "string" as const },
            flag: {
              type: "string" as const,
              enum: ["low", "high", "normal", "abnormal"],
            },
          },
          required: ["test_name", "value"],
        },
      },
      weight: {
        type: "object" as const,
        description:
          "The patient's body weight recorded on this report, if shown (many vet lab reports include it). Omit this field entirely if no weight appears.",
        properties: {
          value: { type: "number" as const, description: "The weight as a plain number." },
          unit: { type: "string" as const, enum: ["lb", "kg"] },
        },
        required: ["value", "unit"],
      },
    },
    required: ["summary", "results"],
  },
};

// The model doesn't always follow the schema exactly (e.g. "12.7" as a
// string, or "lbs"/"pounds" instead of the enum value) — normalize instead
// of rejecting, and log when something's present but still doesn't resolve
// so a real extraction gap is visible rather than silently becoming null.
function parseWeight(raw: unknown): { value: number; unit: "lb" | "kg" } | null {
  if (raw === undefined || raw === null) return null;
  const rawObj = raw as { value?: unknown; unit?: unknown };

  const numericValue =
    typeof rawObj.value === "number"
      ? rawObj.value
      : typeof rawObj.value === "string"
        ? Number(rawObj.value.replace(/[^0-9.]/g, ""))
        : NaN;

  const unitText = typeof rawObj.unit === "string" ? rawObj.unit.trim().toLowerCase() : "";
  const unit: "lb" | "kg" | null = unitText.startsWith("kg")
    ? "kg"
    : unitText.startsWith("lb") || unitText.startsWith("pound")
      ? "lb"
      : null;

  if (Number.isFinite(numericValue) && numericValue > 0 && unit) {
    return { value: numericValue, unit };
  }

  console.error("parseBloodworkFile: weight present but unparseable", raw);
  return null;
}

// Best-effort: returns null if there's no API key configured or the model
// call/parse fails for any reason. Callers treat null as "couldn't parse"
// rather than throwing, since a bloodwork upload should still succeed even
// when automatic extraction isn't available.
export async function parseBloodworkFile(
  fileBytes: Buffer,
  mimeType: string
): Promise<ParsedBloodwork | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  try {
    const client = new Anthropic({ apiKey });
    const base64Data = fileBytes.toString("base64");

    const contentBlock =
      mimeType === "application/pdf"
        ? {
            type: "document" as const,
            source: {
              type: "base64" as const,
              media_type: "application/pdf" as const,
              data: base64Data,
            },
          }
        : {
            type: "image" as const,
            source: {
              type: "base64" as const,
              media_type: (SUPPORTED_IMAGE_TYPES as readonly string[]).includes(mimeType)
                ? (mimeType as (typeof SUPPORTED_IMAGE_TYPES)[number])
                : "image/jpeg",
              data: base64Data,
            },
          };

    const message = await client.messages.create({
      model: "claude-sonnet-5",
      max_tokens: 8192,
      messages: [
        {
          role: "user",
          content: [
            contentBlock,
            {
              type: "text",
              text: "Extract every lab test result from this veterinary bloodwork report and call record_bloodwork_results with the structured data.",
            },
          ],
        },
      ],
      tools: [EXTRACTION_TOOL],
      tool_choice: { type: "tool", name: "record_bloodwork_results" },
    });

    const toolUse = message.content.find(
      (block): block is Anthropic.ToolUseBlock => block.type === "tool_use"
    );
    if (!toolUse) {
      console.error("parseBloodworkFile: no tool_use block", {
        stopReason: message.stop_reason,
        content: message.content,
      });
      return null;
    }

    let input = toolUse.input as {
      summary?: string;
      results?: unknown;
      weight?: unknown;
    };

    // On large reports the model has occasionally packed the whole
    // {summary, results} object as a JSON *string* into the "results"
    // field instead of splitting it into proper top-level properties —
    // likely a formatting slip on bigger tool calls. Recover it rather
    // than discarding an otherwise-successful extraction.
    if (!input.summary && typeof input.results === "string") {
      try {
        const reparsed = JSON.parse(input.results);
        if (reparsed && typeof reparsed === "object") {
          input = reparsed as typeof input;
        }
      } catch {
        // leave input as-is; the check below will fail and log it
      }
    }

    if (!input.summary || !Array.isArray(input.results)) {
      console.error("parseBloodworkFile: malformed tool input", input);
      return null;
    }

    const results: ParsedBloodworkResult[] = input.results.flatMap((raw) => {
      if (typeof raw !== "object" || raw === null) return [];
      const r = raw as Record<string, unknown>;
      if (typeof r.test_name !== "string" || r.test_name.trim() === "") return [];
      const flag =
        r.flag === "low" || r.flag === "high" || r.flag === "normal" || r.flag === "abnormal"
          ? r.flag
          : null;
      return [
        {
          test_name: r.test_name,
          value: String(r.value ?? ""),
          unit: typeof r.unit === "string" && r.unit ? r.unit : null,
          reference_range:
            typeof r.reference_range === "string" && r.reference_range
              ? r.reference_range
              : null,
          flag,
        },
      ];
    });

    const weight = parseWeight(input.weight);

    return { summary: input.summary, results, weight };
  } catch (err) {
    console.error("parseBloodworkFile failed:", err);
    return null;
  }
}
