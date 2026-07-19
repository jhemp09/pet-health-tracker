import Anthropic from "@anthropic-ai/sdk";

export type PetSynopsis = {
  currentState: string;
  recentChanges: string;
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
      recent_changes: {
        type: "string" as const,
        description:
          "1-3 sentences flagging anything from roughly the past week in the tracked data that is new, worsening, or otherwise stands out from her baseline — a new symptom, a sudden weight change, a fresh abnormal lab flag, an appetite shift, etc. If nothing from the past week stands out, say that explicitly rather than omitting the section.",
      },
      trend: {
        type: "string" as const,
        description:
          "2-4 sentences on how the pet's condition has changed over the whole tracked period — improving, worsening, stable, or mixed — citing specific data points (dates, values, symptom frequency).",
      },
      prognosis: {
        type: "string" as const,
        description:
          "A specific, medically-grounded outlook given her existing diagnosis (noted in the data below). Explicitly assess whether the current data is consistent with expected progression of that diagnosis, or whether anything — a specific symptom, lab value, or trend — is inconsistent with that diagnosis alone and could point to an additional or separate problem. If something looks inconsistent, say plainly what it might suggest rather than staying vague. Still note the limits of home-tracked data and that this isn't a diagnosis, but don't let that hedge crowd out being concrete about what the data does or doesn't fit.",
      },
      suggestions: {
        type: "array" as const,
        items: { type: "string" as const },
        description:
          "3-6 concrete, medically specific, actionable recommendations tied to her diagnosis and the data — e.g. specific additional or repeat lab tests to ask the vet about, specific supplements or medications commonly used for her condition worth discussing, specific diet/food recommendations, or concrete monitoring changes. Avoid generic advice like 'monitor closely' or 'see your vet' on its own — name the specific test, supplement, medication class, or food type where possible.",
      },
    },
    required: ["current_state", "recent_changes", "trend", "prognosis", "suggestions"],
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
            "Based on the data below, call record_pet_synopsis with an evidence-based synopsis. Be specific and " +
            "reference the actual data where possible, and be as medically concrete and actionable as the data " +
            "supports — specific tests, medications, supplements, or diet changes rather than generic advice. " +
            "This is not a substitute for veterinary care and not a diagnosis, so note the limits of home-tracked " +
            "data and recommend vet follow-up where warranted, but don't let that caveat make the synopsis vague.\n\n" +
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
      recent_changes?: unknown;
      trend?: unknown;
      prognosis?: unknown;
      suggestions?: unknown;
    };

    // The model occasionally returns suggestions as a single string instead
    // of an array of strings despite the schema — accept either shape
    // rather than discarding an otherwise-good synopsis over it.
    const suggestions = Array.isArray(input.suggestions)
      ? input.suggestions.filter((s): s is string => typeof s === "string")
      : typeof input.suggestions === "string"
        ? [input.suggestions]
        : null;

    if (
      typeof input.current_state !== "string" ||
      typeof input.recent_changes !== "string" ||
      typeof input.trend !== "string" ||
      typeof input.prognosis !== "string" ||
      suggestions === null
    ) {
      console.error("generatePetSynopsis: malformed tool input", input);
      return null;
    }

    return {
      currentState: input.current_state,
      recentChanges: input.recent_changes,
      trend: input.trend,
      prognosis: input.prognosis,
      suggestions,
    };
  } catch (err) {
    console.error("generatePetSynopsis failed:", err);
    return null;
  }
}
