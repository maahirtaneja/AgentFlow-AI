import axios from "axios"

const RATE_URL = "https://api.frankfurter.dev/v2/rate/usd/inr"
const CACHE_TTL_MS = 5 * 60 * 1000

let cachedRate

export const getUsdInrRate = async () => {
  if (cachedRate && Date.now() - cachedRate.fetchedAt < CACHE_TTL_MS) {
    return cachedRate
  }

  try {
    const { data } = await axios.get(RATE_URL, { timeout: 5000 })
    const rate = Number(data?.rate)
    if (!Number.isFinite(rate) || rate <= 0) throw new Error("Exchange rate response was invalid")

    cachedRate = {
      rate,
      date: data.date,
      fetchedAt: Date.now(),
    }
    return cachedRate
  } catch (error) {
    // The source publishes reference rates daily. Keep the last good quote
    // available during a temporary outage, but don't invent a fallback rate.
    if (cachedRate) return cachedRate
    throw new Error(`Unable to load the USD to INR exchange rate: ${error.message}`)
  }
}
