import { useEffect } from 'react'
import { useSocket } from '../context/SocketContext'

/**
 * Listen to a socket event and clean it up automatically.
 * Usage: useSocketEvent('order:status', (data) => { ... })
 */
const useSocketEvent = (event, handler) => {
  const socket = useSocket()
  useEffect(() => {
    if (!socket || !event) return
    socket.on(event, handler)
    return () => socket.off(event, handler)
  }, [socket, event, handler])
}

export default useSocketEvent