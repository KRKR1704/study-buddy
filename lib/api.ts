import axios from "axios"

const API_BASE = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE || ""

export const api = axios.create({
  baseURL: API_BASE,
})

// Attach Authorization header with stored token for all requests
api.interceptors.request.use((config) => {
  try {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token")
      if (token) {
        config.headers = config.headers || {}
        // preserve existing Authorization header if already set
        if (!config.headers["Authorization"] && !config.headers["authorization"]) {
          config.headers["Authorization"] = `Bearer ${token}`
        }
      }
    }
  } catch (e) {
    // ignore
  }
  return config
})

export default api
