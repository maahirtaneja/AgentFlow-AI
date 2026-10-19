import { randomUUID } from "node:crypto"
import { getAuth } from "firebase-admin/auth"
import { app } from "../config/firebase.js"
import User from "../models/user.model.js"
import redis from "../../../shared/redis/redis.js"

const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60

const toSessionUser = (user) => ({
  _id: user._id,
  userId: user._id,
  name: user.name,
  firstName: user.firstName,
  lastName: user.lastName,
  email: user.email,
  avatar: user.avatar,
  plan: user.plan,
  credits: user.credits,
  totalCredits: user.totalCredits,
  planExpiresAt: user.planExpiresAt
})

const sessionData = (user) => JSON.stringify(toSessionUser(user))

const refreshActiveSession = async (user) => {
  try {
    const sessionId = await redis.get(`user-session-${user._id}`)
    if (sessionId) {
      await redis.set(`session-${sessionId}`, sessionData(user), "EX", SESSION_TTL_SECONDS)
    }
  } catch (error) {
    console.error("Failed to refresh active session:", error.message)
  }
}

export const login = async (req, res) => {
  try {
    const { token } = req.body
    if (!token) return res.status(400).json({ message: "Firebase token is required" })

    const decoded = await getAuth(app).verifyIdToken(token)
    let user = await User.findOne({ firebaseUid: decoded.uid })

    if (!user) {
      const nameParts = decoded.name?.trim().split(/\s+/) || []
      const fallbackFirstName = nameParts.shift() || ""
      const fallbackLastName = nameParts.join(" ")
      user = await User.create({
        firebaseUid: decoded.uid,
        name: decoded.name,
        firstName: decoded.given_name || fallbackFirstName,
        lastName: decoded.family_name || fallbackLastName,
        email: decoded.email,
        avatar: decoded.picture
      })
    }

    const sessionId = randomUUID()
    await redis.set(`user-session-${user._id}`, sessionId, "EX", SESSION_TTL_SECONDS)
    await redis.set(`session-${sessionId}`, sessionData(user), "EX", SESSION_TTL_SECONDS)
    return res.cookie("session", sessionId, { httpOnly: true, secure: false, sameSite: "strict", maxAge: SESSION_TTL_SECONDS * 1000 }).status(200).json(user)
  } catch (error) {
    return res.status(500).json({ message: `login error ${error.message}` })
  }
}

export const logOut = async (req, res) => {
  try {
    const sessionId = req.cookies?.session
    if (sessionId) {
      await redis.del(`session-${sessionId}`)
    }
    return res.clearCookie("session").status(200).json({ message: "logout successfully" })
  } catch (error) {
    return res.status(500).json({ message: `logout error ${error.message}` })
  }
}

export const updateProfile = async (req, res) => {
  try {
    const userId = req.headers["x-user-id"]
    if (!userId) return res.status(401).json({ message: "Unauthorized" })

    const firstName = typeof req.body.firstName === "string" ? req.body.firstName.trim() : ""
    const lastName = typeof req.body.lastName === "string" ? req.body.lastName.trim() : ""
    if (!firstName || firstName.length > 80 || lastName.length > 80) {
      return res.status(400).json({ message: "First and last names must be 80 characters or fewer, and first name is required" })
    }

    const user = await User.findById(userId)
    if (!user) return res.status(404).json({ message: "User not found" })
    user.firstName = firstName
    user.lastName = lastName
    user.name = [firstName, lastName].filter(Boolean).join(" ")
    await user.save()
    await refreshActiveSession(user)
    return res.status(200).json(user)
  } catch (error) {
    return res.status(500).json({ message: `update profile error ${error.message}` })
  }
}

export const updateUserPayment = async (req, res) => {
  try {
    const { plan, credits, userId } = req.body
    const user = await User.findById(userId)
    if (!user) return res.status(404).json({ message: "User not found" })
    user.plan = plan
    user.credits += credits
    user.totalCredits += credits
    user.planExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    await user.save()
    const sessionId = await redis.get(`user-session-${userId}`)
    if (sessionId) await redis.set(`session-${sessionId}`, sessionData(user), "EX", SESSION_TTL_SECONDS)
    return res.status(200).json({ success: true, user: toSessionUser(user) })
  } catch (error) {
    return res.status(500).json({ message: `update user payment error ${error.message}` })
  }
}

const CREDIT_COST = {
  chat: 1,
  search: 5,
  coding: 10,
  pdf: 10,
  ppt: 10,
  vision: 10
}

export const deductCredits = async (req, res) => {
  try {
    const { userId, agent } = req.body
    const requiredCredits = CREDIT_COST[agent]
    if (!userId || !requiredCredits) {
      return res.status(400).json({ message: "A valid user and agent are required" })
    }

    const user = await User.findById(userId)
    if (!user) return res.status(404).json({ message: "User not found" })
    if (user.credits < requiredCredits) return res.status(402).json({ message: "Not enough credits." })
    user.credits -= requiredCredits
    await user.save()
    const sessionId = await redis.get(`user-session-${userId}`)
    if (sessionId) await redis.set(`session-${sessionId}`, sessionData(user), "EX", SESSION_TTL_SECONDS)
    return res.status(200).json({ success: true, credits: user.credits, charged: requiredCredits })
  } catch (error) {
    return res.status(500).json({ message: `deduct credits error ${error.message}` })
  }
}
