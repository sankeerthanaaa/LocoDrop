import { createContext, useContext, useEffect, useState } from 'react'
import { io } from 'socket.io-client'
import { useAuth } from './AuthContext'

const SocketContext = createContext(null)

export const SocketProvider = ({ children }) => {
  const { token } = useAuth()
  const [socket, setSocket] = useState(null)

  useEffect(() => {
    if (!token) { socket?.disconnect(); setSocket(null); return }

    const s = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', {
      auth: { token },
      transports: ['websocket'],
    })

    s.on('connect', () => console.log('Socket connected'))
    s.on('connect_error', (e) => console.error('Socket error:', e.message))

    setSocket(s)
    return () => { s.disconnect() }
  }, [token])

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  )
}

export const useSocket = () => useContext(SocketContext)