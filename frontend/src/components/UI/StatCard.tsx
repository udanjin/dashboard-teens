import { ReactNode } from 'react'

interface StatCardProps {
  title: string
  value: number | string
  icon: ReactNode
  trend?: 'up' | 'down' | 'neutral'
}

export default function StatCard({ title, value, icon, trend = 'neutral' }: StatCardProps) {
  const trendColors = {
    up: 'text-green-500',
    down: 'text-red-500',
    neutral: 'text-gray-500'
  }

  return (
    <div className="bg-white p-4 rounded-lg shadow flex items-center space-x-4">
      <div className={`p-3 rounded-full bg-blue-50 text-blue-600`}>
        {icon}
      </div>
      <div>
        <p className="text-gray-500 text-sm">{title}</p>
        <p className="text-2xl font-bold">{value}</p>
      </div>
    </div>
  )
}