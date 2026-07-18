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
      max_tokens: 4096,
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
    if (!toolUse) return null;

    const input = toolUse.input as {
      summary?: string;
      results?: unknown[];
      weight?: unknown;
    };
    if (!input.summary || !Array.isArray(input.results)) return null;

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

    const rawWeight = input.weight as { value?: unknown; unit?: unknown } | undefined;
    const weight =
      rawWeight &&
      typeof rawWeight.value === "number" &&
      Number.isFinite(rawWeight.value) &&
      rawWeight.value > 0 &&
      (rawWeight.unit === "lb" || rawWeight.unit === "kg")
        ? { value: rawWeight.value, unit: rawWeight.unit as "lb" | "kg" }
        : null;

    return { summary: input.summary, results, weight };
  } catch {
    return null;
  }
}
