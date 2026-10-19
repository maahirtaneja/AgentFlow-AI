import express from "express"
import { createConversation, deleteConversation, getConversations, getMessages, saveMessage, updateConversation } from "../controllers/chat.controller.js"

const router=express.Router()

router.get("/create-conversation",createConversation)
router.get("/get-conversations",getConversations)
router.post("/update-conversation",updateConversation)
router.delete("/delete-conversation/:conversationId",deleteConversation)
router.post("/save-message",saveMessage)
router.get("/get-messages/:conversationId",getMessages)
export default router
