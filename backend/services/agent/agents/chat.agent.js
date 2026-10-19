import { AIMessage, HumanMessage, SystemMessage } from "@langchain/core/messages"
import { getModel } from "../config/llmModels.js"
import { getMemory } from "../config/memory.js"
import { deductCredits } from "../utils/deductCredits.js"
import { checkAgentLimit } from "../config/agentLimit.js"

export const chatAgent = async (state) => {
try {

        await checkAgentLimit(state.userId,"chat")
const llm = await getModel("chat")

    const history = await getMemory(state.conversationId)

   const searchContext=state.searchResults?`
   Web Search Results:

${JSON.stringify(state.searchResults)}

Answer the user using only the above search results.
`:""


    const systemPrompt = `
    You are AgentFlow AI, an intelligent AI assistant developed by Maahir Taneja.

    Developer Information:
    - Creator & Developer: Maahir Taneja
    - LinkedIn Profile: https://www.linkedin.com/in/maahirtaneja/
    - Education: Computer Science and Engineering (CSE) at Malaviya National Institute of Technology (MNIT), Jaipur
    - Areas of Focus: Full-Stack Web Development, Microservices Architecture, LLM & Multi-Agent Systems, RAG Pipelines, Cloud & Distributed Applications
    - Core Projects: AgentFlow AI (microservices-based intelligent agentic workflow platform)
    
    CRITICAL RULE FOR QUESTIONS ABOUT THE DEVELOPER / CREATOR:
    - When asked about who created or developed this website/app, or asked for details/bio/more information about Maahir Taneja:
      1. Give accurate, honest information based ONLY on the Developer Information above.
      2. NEVER hallucinate fake experience (e.g. DO NOT claim "8+ years of experience", fake companies, or unrelated colleges).
      3. ALWAYS include a direct markdown link to his LinkedIn profile: [Maahir Taneja on LinkedIn](https://www.linkedin.com/in/maahirtaneja/) so the user can explore his complete profile, projects, and connect with him.

    ${searchContext}

    If searchContext exists:
- Use search results to answer.
- Do not mention internal tools.

    Rules:
- For simple questions, greetings, and short queries, respond naturally in plain text.
- For technical, educational, coding, or detailed topics, use clean Markdown.

    Formatting:
- Use # for titles and ## for sections.
- Leave a blank line after headings.
- Use bullet points for lists.
- Use numbered lists for steps.
- Use fenced code blocks with language tags for code.
- Keep paragraphs short and readable.
- Never write headings and content on the same line.
- Never generate large walls of text.
`
    const messages = [
        new SystemMessage(systemPrompt)
    ]

    history.forEach(msg => {
        if (msg.role == "user") {
            messages.push(new HumanMessage(msg.content))
        }
        if (msg.role == "assistant") {
            messages.push(new AIMessage(msg.content))
        }
    });

    messages.push(new HumanMessage(state.prompt))





    const response = await llm.invoke(messages)
    await deductCredits(state.userId,"chat")
    return {
        ...state,
        aiResponse: response.content,
        
    }
    } catch (error) {
        console.log(error)
return {
            ...state,
            aiResponse:error?.data?.message || "failed to generate chat"
        }
        
    
    }
   
}
