// components/RoleProtection.tsx
'use client'

import { useContext, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { Result, Button } from 'antd'
import { ExclamationCircleOutlined } from '@ant-design/icons'

interface RoleProtectionProps {
  children: React.ReactNode
  allowedRoles: string[]
  fallbackPath?: string
}

export default function RoleProtection({ 
  children, 
  allowedRoles, 
  fallbackPath = '/dashboard' 
}: RoleProtectionProps) {
  const { user, loading, isAuthenticated } = useAuth()
  const router = useRouter()

  const hasAccess = (): boolean => {
    if (!user || !user.role) return false
    
    // Admin can access everything
    if (user.role === 'admin') return true
    
    // Check if user's role is in the allowed roles array
    return allowedRoles.includes(user.role)
  }

  // Show loading while authentication is being checked
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated || !user) {
    router.push('/login')
    return null
  }

  // Show access denied if user doesn't have required role
  if (!hasAccess()) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Result
          status="403"
          title="403"
          subTitle="Sorry, you are not authorized to access this page."
          extra={
            <Button 
              type="primary" 
              onClick={() => router.push(fallbackPath)}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              Back to Dashboard
            </Button>
          }
        />
      </div>
    )
  }

  // Render children if user has access
  return <>{children}</>
}

// Higher-order component for easier usage
export function withRoleProtection(
  WrappedComponent: React.ComponentType<any>,
  allowedRoles: string[],
  fallbackPath?: string
) {
  return function ProtectedComponent(props: any) {
    return (
      <RoleProtection allowedRoles={allowedRoles} fallbackPath={fallbackPath}>
        <WrappedComponent {...props} />
      </RoleProtection>
    )
  }
}