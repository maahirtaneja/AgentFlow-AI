import axios from "axios"
import { graph } from "../graph/graph.js"
import { addMessage } from "../config/memory.js"

export const agent = async (req, res, next) => {
    try {
        const { prompt = "", conversationId, agent } = req.body
        const file = req.file
        const userId = req.headers["x-user-id"]

        const userMessageContent = prompt || (file ? `Uploaded ${file.originalname}` : "")

        try {
            await axios.post(`${process.env.CHAT_SERVICE}/save-message`, {
                conversationId,
                role: "user",
                content: userMessageContent
            })
        } catch (saveErr) {
            console.error("Failed to persist user message:", saveErr.message)
        }

        const result = await graph.invoke({
            prompt: prompt || (file?.mimetype === "application/pdf" ? "Summarize and explain this PDF document." : "Analyze this image."),
            conversationId,
            agent,
            userId,
            file
        })

        const aiResponse = result?.aiResponse || "No response generated."

        try {
            await addMessage(conversationId, "user", userMessageContent)
            await addMessage(conversationId, "assistant", aiResponse)
        } catch (cacheErr) {
            console.error("Failed to update conversation memory:", cacheErr.message)
        }

        try {
            await axios.post(`${process.env.CHAT_SERVICE}/save-message`, {
                conversationId,
                role: "assistant",
                content: aiResponse,
                images: result?.images || [],
                artifacts: result?.artifacts || []
            })
        } catch (saveErr) {
            console.error("Failed to persist conversation messages:", saveErr.message)
        }

        return res.status(200).json({
            answer: aiResponse,
            images: result?.images || [],
            artifacts: result?.artifacts || []
        })

    } catch (error) {
        next(error)
    }
}
