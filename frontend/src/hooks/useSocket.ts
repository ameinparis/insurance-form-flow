import { useEffect, useRef, useCallback } from "react"
import { io, Socket } from "socket.io-client"

const SOCKET_URL = import.meta.env.VITE_API_BASE_URL?.replace(/\/api$/, "") || "http://localhost:5002"

let socket: Socket | null = null

const ensureSocket = (): Socket | null => {
  if (socket?.connected) return socket
  if (socket) return socket

  try {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null
    if (!token) return null

    socket = io(SOCKET_URL, {
      auth: { token },
      transports: ["websocket", "polling"],
      autoConnect: true,
    })

    socket.on("connect", () => {
      console.log("Socket connected")
    })

    socket.on("connect_error", (err) => {
      console.warn("Socket connection error:", err.message)
    })
  } catch (err) {
    console.warn("Socket initialization failed:", err)
    socket = null
  }

  return socket
}

type SocketNotification = {
  id?: string
  draftId: string
  kind: "assignment" | "approved" | "rejected" | "reassigned"
  status: "pending" | "approved" | "rejected" | "superseded"
  recipientId: string | null
  recipientName?: string | null
  advisorName?: string | null
  clientName?: string | null
  policyType?: string | null
  reason?: string | null
}

const listeners = new Set<(payload: SocketNotification) => void>()

const setupListeners = () => {
  try {
    const s = ensureSocket()
    if (!s) return

    s.off("notification:new")
    s.on("notification:new", (payload: SocketNotification) => {
      listeners.forEach((fn) => {
        try {
          fn(payload)
        } catch {
          // ignore listener errors
        }
      })
    })
  } catch (err) {
    console.warn("Socket listener setup failed:", err)
  }
}

export const useSocket = () => {
  const initialized = useRef(false)

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true

    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null
      if (!token) return

      const onStorage = () => {
        try {
          const newToken = localStorage.getItem("token")
          if (!newToken && socket) {
            socket.disconnect()
            socket = null
            return
          }
          if (newToken && !socket) {
            setupListeners()
          }
        } catch {
          // ignore storage errors
        }
      }

      setupListeners()
      window.addEventListener("storage", onStorage)

      return () => {
        window.removeEventListener("storage", onStorage)
      }
    } catch (err) {
      console.warn("Socket hook setup failed:", err)
    }
  }, [])

  const emitApprovalAssign = useCallback((payload: SocketNotification) => {
    try {
      const s = ensureSocket()
      if (s?.connected) s.emit("approval:assign", payload)
    } catch {
      // ignore emit errors
    }
  }, [])

  const emitApprovalResolve = useCallback((payload: SocketNotification) => {
    try {
      const s = ensureSocket()
      if (s?.connected) s.emit("approval:resolve", payload)
    } catch {
      // ignore emit errors
    }
  }, [])

  const onNotification = useCallback((fn: (payload: SocketNotification) => void) => {
    listeners.add(fn)
    return () => {
      listeners.delete(fn)
    }
  }, [])

  return { emitApprovalAssign, emitApprovalResolve, onNotification }
}
