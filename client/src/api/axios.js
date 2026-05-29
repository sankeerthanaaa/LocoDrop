import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL
    ? `${import.meta.env.VITE_API_URL}/api`
    : 'http://localhost:5000/api',
  timeout: 10000,
})

// Attach JWT to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('dx_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Global error handler
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('dx_token')
      localStorage.removeItem('dx_user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default api