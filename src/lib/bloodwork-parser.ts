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
            test_name: { type: "string" as const },
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

    const input = toolUse.input as { summary?: string; results?: unknown[] };
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

    return { summary: input.summary, results };
  } catch {
    return null;
  }
}
