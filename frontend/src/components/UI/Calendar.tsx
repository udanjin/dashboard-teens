'use client'

import { Calendar as AntCalendar } from 'antd'
import type { Dayjs } from 'dayjs'

export default function Calendar() {
  return (
    <div className="p-6 w-full">
      <h2 className="text-xl font-semibold mb-4">Event Calendar</h2>
      <div className="bg-white rounded-lg shadow p-6 w-full">
        <AntCalendar 
          fullscreen={false}
          className="w-full"
          headerRender={({ value, onChange }) => (
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">
                {value.format('MMMM YYYY')}
              </h3>
              <div className="space-x-2">
                <button 
                  onClick={() => onChange(value.subtract(1, 'month'))}
                  className="p-2 rounded hover:bg-gray-100"
                >
                  &lt;
                </button>
                <button 
                  onClick={() => onChange(value.add(1, 'month'))}
                  className="p-2 rounded hover:bg-gray-100"
                >
                  &gt;
                </button>
              </div>
            </div>
          )}
        />
      </div>
    </div>
  )
}