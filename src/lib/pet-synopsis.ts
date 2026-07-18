import Anthropic from "@anthropic-ai/sdk";

export type PetSynopsis = {
  currentState: string;
  trend: string;
  prognosis: string;
  suggestions: string[];
};

const SYNOPSIS_TOOL = {
  name: "record_pet_synopsis",
  description: "Records a structured health synopsis for a pet based on tracked data.",
  input_schema: {
    type: "object" as const,
    properties: {
      current_state: {
        type: "string" as const,
        description:
          "2-4 sentence plain-language description of the pet's current overall condition, based only on the data provided.",
      },
      trend: {
        type: "string" as const,
        description:
          "2-4 sentences on how the pet's condition has changed over the tracked period — improving, worsening, stable, or mixed — citing specific data points (dates, values, symptom frequency).",
      },
      prognosis: {
        type: "string" as const,
        description:
          "A brief, appropriately hedged outlook. Do not overstate certainty, note where the data is too limited to project confidently, and recommend veterinary follow-up where relevant.",
      },
      suggestions: {
        type: "array" as const,
        items: { type: "string" as const },
        description:
          "2-5 concrete, specific things the owner could try or bring up with their vet that are not already reflected in the current tracked routine.",
      },
    },
    required: ["current_state", "trend", "prognosis", "suggestions"],
  },
};

// Best-effort: returns null if there's no API key configured or the model
// call/parse fails for any reason, same convention as the bloodwork parser.
export async function generatePetSynopsis(dataSummary: string): Promise<PetSynopsis | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  try {
    const client = new Anthropic({ apiKey });
    const message = await client.messages.create({
      model: "claude-sonnet-5",
      max_tokens: 2048,
      messages: [
        {
          role: "user",
          content:
            "You are reviewing home-tracked health data for a pet, gathered by their owner through a tracking app. " +
            "Based on the data below, call record_pet_synopsis with an evidence-based synopsis. Be specific and reference " +
            "the actual data where possible. This is not a substitute for veterinary care, so hedge appropriately and " +
            "recommend vet follow-up where warranted rather than presenting a diagnosis.\n\n" +
            dataSummary,
        },
      ],
      tools: [SYNOPSIS_TOOL],
      tool_choice: { type: "tool", name: "record_pet_synopsis" },
    });

    const toolUse = message.content.find(
      (block): block is Anthropic.ToolUseBlock => block.type === "tool_use"
    );
    if (!toolUse) {
      console.error("generatePetSynopsis: no tool_use block in response", message.content);
      return null;
    }

    const input = toolUse.input as {
      current_state?: unknown;
      trend?: unknown;
      prognosis?: unknown;
      suggestions?: unknown;
    };
    if (
      typeof input.current_state !== "string" ||
      typeof input.trend !== "string" ||
      typeof input.prognosis !== "string" ||
      !Array.isArray(input.suggestions)
    ) {
      console.error("generatePetSynopsis: malformed tool input", input);
      return null;
    }

    return {
      currentState: input.current_state,
      trend: input.trend,
      prognosis: input.prognosis,
      suggestions: input.suggestions.filter((s): s is string => typeof s === "string"),
    };
  } catch (err) {
    console.error("generatePetSynopsis failed:", err);
    return null;
  }
}
