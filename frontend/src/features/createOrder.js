import api from "../../utils/axios"

export const createOrder=async (purchase) => {
    try {
        const {data}=await api.post("/api/billing/create",purchase)
        return data
    } catch (error) {
        console.log(error)
        throw error
    }
}
