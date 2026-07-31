import axios from 'axios'

// Point this at your FastAPI backend. Override via .env -> VITE_API_BASE_URL
const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

const api = axios.create({
  baseURL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error?.response?.data?.detail ||
      error?.message ||
      'Something went wrong talking to the backend.'
    return Promise.reject(new Error(message))
  },
)

export default api
