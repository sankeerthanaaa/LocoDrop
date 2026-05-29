import api from './axios'

export const createOrder     = (data)     => api.post('/orders', data)
export const getPriceEstimate = (data)    => api.post('/orders/estimate', data)
export const getAgentActive  = ()         => api.get('/orders/agent-active')
export const getMyOrders     = ()         => api.get('/orders/my')
export const getNearbyOrders = ()         => api.get('/orders/nearby')
export const getAllOrders     = (params)   => api.get('/orders', { params })
export const getOrderById    = (id)       => api.get(`/orders/${id}`)
export const acceptOrder     = (id)       => api.put(`/orders/${id}/accept`)
export const updateStatus    = (id, status) => api.put(`/orders/${id}/status`, { status })
export const cancelOrder     = (id)       => api.put(`/orders/${id}/cancel`)
export const rateOrder       = (id, rating) => api.put(`/orders/${id}/rate`, { rating })