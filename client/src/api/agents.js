import api from './axios'

export const updateLocation  = (lat, lng)   => api.put('/agents/location', { lat, lng })
export const toggleOnline    = ()           => api.put('/agents/toggle-online')
export const getAllAgents     = ()           => api.get('/agents')
export const getMyProfile    = ()           => api.get('/agents/my-profile')
export const updateMyProfile = (data)       => api.put('/agents/my-profile', data)
export const getAgentById    = (id)         => api.get(`/agents/${id}`)