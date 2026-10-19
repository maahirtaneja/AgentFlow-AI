import { getModel } from "../config/llmModels.js"

export const router = async (state) => {
  // 1. Files take highest precedence: if a file was uploaded, route to its dedicated analyzer
  if (state.file) {
    if (state.file.mimetype === "application/pdf") {
      return {
        ...state,
        agent: "pdfRag"
      }
    }

    if (state.file.mimetype.startsWith("image/")) {
      return {
        ...state,
        agent: "imageAnalyzer"
      }
    }
  }

  // 2. Explicit agent selection (when not "auto")
  if (state.agent && state.agent !== "auto") {
    return {
      ...state,
      agent: state.agent
    }
  }

  // 3. Fallback to LLM classifier
  const llm = await getModel("router")
  const prompt = `You are an agent router.

Available agents:
- chat
- search
- coding
- pdf
- ppt
- vision 

Rules:
chat: General conversation, explanations, learning, questions.
search: Current events, latest information, news, recent developments, internet lookup.
coding: Generate code, debug code, build projects, architecture, API design.
pdf: Questions about generating PDFs or document templates.
ppt: Questions about generating presentations or slide decks.
vision: Generate image, create image.

Return ONLY one word (chat, search, coding, pdf, ppt, vision):

User Query:
${state.prompt || "Hello"}
`

  try {
    const response = await llm.invoke(prompt)
    const content = String(response.content || "").toLowerCase().trim()

    const validAgents = ["chat", "search", "coding", "pdf", "ppt", "vision"]
    const matched = validAgents.find((a) => content.includes(a))

    return {
      ...state,
      agent: matched || "chat"
    }
  } catch (error) {
    console.error("Router classification error:", error)
    return {
      ...state,
      agent: "chat"
    }
  }
}