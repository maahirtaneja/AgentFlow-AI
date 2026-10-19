export const safeJsonParse = (str) => {
    if (typeof str !== "string") return str;

    const trimmed = str.trim();
    try {
        return JSON.parse(trimmed);
    } catch (_) {
        // Strip markdown code fences if present (e.g. ```json ... ```)
        let cleaned = trimmed;
        if (cleaned.startsWith("```json")) {
            cleaned = cleaned.slice(7);
        } else if (cleaned.startsWith("```")) {
            cleaned = cleaned.slice(3);
        }
        if (cleaned.endsWith("```")) {
            cleaned = cleaned.slice(0, -3);
        }
        cleaned = cleaned.trim();

        try {
            return JSON.parse(cleaned);
        } catch (__) {
            // Find the outermost JSON object braces
            const firstBrace = cleaned.indexOf("{");
            const lastBrace = cleaned.lastIndexOf("}");
            if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
                return JSON.parse(cleaned.substring(firstBrace, lastBrace + 1));
            }

            // Find the outermost JSON array brackets
            const firstBracket = cleaned.indexOf("[");
            const lastBracket = cleaned.lastIndexOf("]");
            if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
                return JSON.parse(cleaned.substring(firstBracket, lastBracket + 1));
            }

            throw new Error(`Failed to parse JSON from model output: ${str.slice(0, 100)}...`);
        }
    }
};
