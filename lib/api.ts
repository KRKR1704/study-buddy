import axios from "axios"

const API_BASE = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE || ""

export const api = axios.create({
  baseURL: API_BASE,
})

export default api
