'use client'

import { createContext, useContext, useState, useEffect } from 'react'
import api from '@/lib/axiosInstance'
import { useRouter } from 'next/navigation'

interface UserInfo {
  name: string
  username: string
  email?: string
  role?: string // Added role as optional to maintain compatibility
  // Add other user fields as needed
}

interface AuthContextType {
  isAuthenticated: boolean
  user: UserInfo | null
  login: (username: string, password: string) => Promise<boolean>
  logout: () => void
  loading: boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false) // Start as false
  const [user, setUser] = useState<UserInfo | null>(null) // Start as null
  const [loading, setLoading] = useState(true) // Start as true to show loading initially
  const router = useRouter()

  // Check existing auth state on initial load
  useEffect(() => {
    const token = localStorage.getItem('authToken')
    const userInfo = localStorage.getItem('userInfo')

    if (token && userInfo) {
      try {
        const parsedUser = JSON.parse(userInfo)
        // Ensure backward compatibility - add role if it doesn't exist
        if (!parsedUser.role) {
          parsedUser.role = 'user' // Default role
        }
        setUser(parsedUser)
        setIsAuthenticated(true)
      } catch (error) {
        console.error('Error parsing stored user info:', error)
        // Clear corrupted data
        localStorage.removeItem('authToken')
        localStorage.removeItem('userInfo')
        setIsAuthenticated(false)
        setUser(null)
      }
    }
    setLoading(false) // Always set loading to false after checking
  }, [])

  const login = async (username: string, password: string) => {
    try {
      setLoading(true)
      const response = await api.post('/users/login', {
        username,
        password
      })

      const { token, user } = response.data
      
      // Ensure user has role property for role-based access control
      if (!user.role) {
        user.role = 'user' // Default role if not provided by backend
      }
      
      localStorage.setItem('authToken', token)
      localStorage.setItem('userInfo', JSON.stringify(user))
      
      setUser(user)
      setIsAuthenticated(true)
      return true
    } catch (error) {
      console.error('Login error:', error)
      logout()
      return false
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    localStorage.removeItem('authToken')
    localStorage.removeItem('userInfo')
    setIsAuthenticated(false)
    setUser(null)
    router.push('/login')
  }

  return (
    <AuthContext.Provider value={{ 
      isAuthenticated, 
      user, 
      login, 
      logout,
      loading // Now included
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export { AuthContext }