'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'

interface User {
  id: number
  email: string
  role: 'admin' | 'teacher' | 'parent'
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (data: RegisterData) => Promise<void>
  logout: () => void
  isAuthenticated: boolean
  checkRole: (allowedRoles: string[]) => boolean
}

interface RegisterData {
  email: string
  password: string
  role: 'teacher' | 'parent'
  firstName: string
  lastName: string
  phoneNumber: string
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token')
    const userStr = localStorage.getItem('user')

    if (token && userStr) {
      try {
        const userData = JSON.parse(userStr)
        setUser(userData)
        
        // Set default axios header
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
      } catch (error) {
        console.error('Error parsing user data:', error)
        localStorage.removeItem('token')
        localStorage.removeItem('user')
      }
    }
    
    setLoading(false)
  }, [])

  const login = async (email: string, password: string) => {
    try {
      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`, {
        email,
        password
      })

      const { token, user: userData } = response.data

      // Store token and user data
      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(userData))

      // Set default axios header
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`

      setUser(userData)

      // Redirect based on role
      switch (userData.role) {
        case 'admin':
          router.push('/admin/dashboard')
          break
        case 'teacher':
          router.push('/teacher/dashboard')
          break
        case 'parent':
          router.push('/parent/dashboard')
          break
        default:
          router.push('/')
      }
    } catch (error) {
      console.error('Login error:', error)
      throw error
    }
  }

  const register = async (data: RegisterData) => {
    try {
      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/register`, data)

      const { token, user: userData } = response.data

      // Store token and user data
      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(userData))

      // Set default axios header
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`

      setUser(userData)

      // Redirect based on role
      if (userData.role === 'teacher') {
        router.push('/teacher/onboarding')
      } else {
        router.push('/parent/dashboard')
      }
    } catch (error) {
      console.error('Registration error:', error)
      throw error
    }
  }

  const logout = () => {
    // Clear local storage
    localStorage.removeItem('token')
    localStorage.removeItem('user')

    // Clear axios default header
    delete axios.defaults.headers.common['Authorization']

    setUser(null)
    router.push('/sign-in')
  }

  const checkRole = (allowedRoles: string[]) => {
    if (!user) return false
    return allowedRoles.includes(user.role)
  }

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user,
    checkRole
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// HOC for protecting routes
export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  allowedRoles?: string[]
) {
  return function WithAuthComponent(props: P) {
    const { user, loading, isAuthenticated, checkRole } = useAuth()
    const router = useRouter()

    useEffect(() => {
      if (!loading) {
        if (!isAuthenticated) {
          router.push('/sign-in')
        } else if (allowedRoles && !checkRole(allowedRoles)) {
          // Redirect to appropriate dashboard based on role
          switch (user?.role) {
            case 'admin':
              router.push('/admin/dashboard')
              break
            case 'teacher':
              router.push('/teacher/dashboard')
              break
            case 'parent':
              router.push('/parent/dashboard')
              break
            default:
              router.push('/')
          }
        }
      }
    }, [loading, isAuthenticated, user, router])

    if (loading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      )
    }

    if (!isAuthenticated || (allowedRoles && !checkRole(allowedRoles))) {
      return null
    }

    return <Component {...props} />
  }
}
