import express from "express"
import dotenv from "dotenv"
import proxy from "express-http-proxy"
import cors from "cors"
import cookieParser from "cookie-parser"
import protect from "./middleware/auth.middleware.js"
import { proxyWithHeader } from "./utils/proxyWithHeader.js"
import morgan from "morgan"
dotenv.config()
const port =process.env.PORT

const app=express()
app.use(cors({
    origin:process.env.FRONTEND_URL,
    credentials:true
}))
app.use(morgan("dev"))
app.use(cookieParser())
app.put("/api/auth/profile",protect,proxyWithHeader(process.env.AUTH_SERVICE,() => "/profile"))
app.get("/api/me",protect,(req,res)=>{
    return res.status(200).json({
        ...req.user,
        _id: req.user?._id || req.user?.userId,
    })
})
app.use("/api/auth",proxy(process.env.AUTH_SERVICE))
app.use("/api/chat",protect,proxyWithHeader(process.env.CHAT_SERVICE))
app.use("/api/agent",protect,proxyWithHeader(process.env.AGENT_SERVICE))
app.use("/api/billing",protect,proxyWithHeader(process.env.BILLING_SERVICE))
app.get("/",(req,res)=>{
    res.json({message:"hello from gateway v5"})
})

app.listen(port,()=>{
    console.log(`gateway started at ${port}`)
})
