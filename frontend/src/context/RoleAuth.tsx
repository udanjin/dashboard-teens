// components/RoleProtection.tsx
'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { Result, Button, Spin } from 'antd'

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

  // 1. Update hasAccess function to check an array of roles
  const hasAccess = (): boolean => {
    if (!user || !user.roles) return false
    
    // Admin can access everything
    if (user.roles.includes('admin')) return true
    
    // Check if user has at least one of the allowed roles
    return user.roles.some(role => allowedRoles.includes(role))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spin size="large" />
      </div>
    )
  }

  // Use useEffect to handle redirection after loading is complete
  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        router.push('/login');
      } else if (!hasAccess()) {
        // We don't redirect here, we show the 403 component below
      }
    }
  }, [loading, isAuthenticated, user, router]);

  if (!isAuthenticated) {
    // Return null or a loader while redirecting
    return null;
  }
  
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

  return <>{children}</>
}

// Higher-order component remains the same
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