'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface WithAuthProps {
  allowedRoles?: string[]
}

export function withAuth<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  { allowedRoles = [] }: WithAuthProps = {}
) {
  return function WithAuthComponent(props: P) {
    const router = useRouter()

    useEffect(() => {
      const checkAuth = () => {
        const token = localStorage.getItem('token')
        const userStr = localStorage.getItem('user')

        if (!token || !userStr) {
          router.push('/sign-in')
          return
        }

        try {
          const user = JSON.parse(userStr)
          
          // Check if user has the required role
          if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
            // Redirect to appropriate dashboard based on role
            switch (user.role) {
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
                router.push('/sign-in')
            }
            return
          }
        } catch (error) {
          console.error('Error parsing user data:', error)
          router.push('/sign-in')
        }
      }

      checkAuth()
    }, [router, allowedRoles])

    // Render nothing while checking authentication
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
    if (!token) {
      return null
    }

    return <WrappedComponent {...props} />
  }
}

// Higher-order component for role-based protection
export const withRole = (allowedRoles: string[]) => {
  return function<P extends object>(Component: React.ComponentType<P>) {
    return withAuth(Component, { allowedRoles })
  }
}

// Convenience HOCs for specific roles
export const withAdminAuth = withRole(['admin'])
export const withTeacherAuth = withRole(['teacher'])
export const withParentAuth = withRole(['parent'])
export const withTeacherOrParentAuth = withRole(['teacher', 'parent'])
