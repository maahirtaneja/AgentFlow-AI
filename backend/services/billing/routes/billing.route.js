import express from "express"
import { createOrder, getBillingQuote, verifyPayment } from "../controllers/billing.controller.js"
const router=express.Router()
router.get("/quote",getBillingQuote)
router.post("/create",createOrder)
router.post("/verify",verifyPayment)

export default router
