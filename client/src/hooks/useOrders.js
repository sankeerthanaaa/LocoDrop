import { useState, useEffect, useCallback } from 'react'
import { getMyOrders, getNearbyOrders } from '../api/orders'

export const useSenderOrders = () => {
  const [orders,  setOrders]  = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  const fetch = useCallback(async () => {
    try {
      setLoading(true)
      const res = await getMyOrders()
      setOrders(res.data)
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load orders')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetch() }, [fetch])
  return { orders, setOrders, loading, error, refetch: fetch }
}

export const useNearbyOrders = () => {
  const [orders,  setOrders]  = useState([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    try {
      setLoading(true)
      const res = await getNearbyOrders()
      setOrders(res.data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetch() }, [fetch])
  return { orders, setOrders, loading, refetch: fetch }
}