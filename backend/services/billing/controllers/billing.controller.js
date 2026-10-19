import axios from "axios"
import { CREDIT_BUNDLES, MAX_CUSTOM_CREDITS, MIN_CUSTOM_CREDITS, priceCreditsInRupees } from "../config/Plans.js"
import { getUsdInrRate } from "../config/exchangeRate.js"
import razorpay from "../config/razorpay.js"
import Payment from "../models/payment.model.js"
import crypto from "node:crypto"
export const createOrder = async (req, res) => {
    try {
        const { plan, credits } = req.body
        const userId = req.headers["x-user-id"]
        const bundle = plan ? CREDIT_BUNDLES.find((item) => item.id === plan) : null

        if (plan && !bundle) {
            return res.status(404).json({ message: "plan not found" })
        }

        const requestedCredits = bundle ? bundle.credits : Number(credits)
        if (!Number.isInteger(requestedCredits) || requestedCredits < MIN_CUSTOM_CREDITS || requestedCredits > MAX_CUSTOM_CREDITS) {
            return res.status(400).json({ message: `Credits must be a whole number between ${MIN_CUSTOM_CREDITS} and ${MAX_CUSTOM_CREDITS}` })
        }

        const exchange = await getUsdInrRate()
        const discountPercent = bundle?.discountPercent ?? 0
        const amount = priceCreditsInRupees(requestedCredits, exchange.rate, discountPercent)
        const selectedPlan = {
            id: bundle?.id ?? "custom",
            name: bundle?.name ?? "Custom credits",
            credits: requestedCredits,
            discountPercent,
            amount,
            exchangeRate: exchange.rate,
            rateDate: exchange.date,
        }

        const order = await razorpay.orders.create({
            amount: amount * 100,
            currency: "INR",
            receipt: `receipt-${Date.now()}`
        })

        await Payment.create({
            userId,
            orderId: order.id,
            amount,
            credits: selectedPlan.credits,
            plan: selectedPlan.id,
            exchangeRate: exchange.rate,
            currency: order.currency,
            status: "created"
        })

        return res.status(200).json({ order, plan: selectedPlan })



    } catch (error) {
        return res.status(500).json({ message: `create order error ${error}` })
    }
}

export const getBillingQuote = async (req, res) => {
    try {
        const exchange = await getUsdInrRate()
        const bundles = CREDIT_BUNDLES.map((bundle) => ({
            ...bundle,
            amount: priceCreditsInRupees(bundle.credits, exchange.rate, bundle.discountPercent),
            regularAmount: priceCreditsInRupees(bundle.credits, exchange.rate),
        }))

        return res.status(200).json({
            rate: exchange.rate,
            rateDate: exchange.date,
            bundles,
            minCustomCredits: MIN_CUSTOM_CREDITS,
            maxCustomCredits: MAX_CUSTOM_CREDITS,
        })
    } catch (error) {
        return res.status(503).json({ message: error.message })
    }
}


export const verifyPayment = async (req,res) => {
    try {
        const {razorpay_order_id, razorpay_payment_id,razorpay_signature} = req.body
        const generateSignature=crypto
                               .createHmac("sha256",process.env.RAZORPAY_KEY_SECRET)
                               .update(`${razorpay_order_id}|${razorpay_payment_id}`)
                               .digest("hex")
        if(generateSignature !== razorpay_signature){
            return res.status(400).json({message:"Payment Verification Failed"})
        }
        const payment=await Payment.findOne({orderId:razorpay_order_id})
        if(!payment){
            return res.status(404).json({message:"Payment Not Found"})
        }
        if (payment.status === "paid") {
            return res.status(200).json({ message: "Payment already verified" })
        }
        const authUpdate = await axios.post(`${process.env.AUTH_SERVICE}/update-plan`,{
            userId:payment.userId, plan:payment.plan, credits:payment.credits
        })
        payment.status="paid"
        payment.paymentId=razorpay_payment_id
        await payment.save()
        return res.status(200).json({ message: "Payment Verified", user: authUpdate.data?.user })
    } catch (error) {
        return res.status(500).json({message:`verify payment error ${error}`})
    }
}
