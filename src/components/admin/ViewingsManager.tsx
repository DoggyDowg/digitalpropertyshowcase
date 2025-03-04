'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { PlusIcon, CalendarIcon, TrashIcon } from '@heroicons/react/24/outline'

interface Viewing {
  id: string
  property_id: string
  viewing_datetime: string
  type: 'public' | 'private'
  status: 'scheduled' | 'completed' | 'cancelled'
  notes?: string
  created_at: string
  updated_at: string
}

interface ViewingsManagerProps {
  propertyId: string
  propertyTimezone: string
}

export default function ViewingsManager({ propertyId, propertyTimezone }: ViewingsManagerProps) {
  const supabase = createClientComponentClient()
  const [viewings, setViewings] = useState<Viewing[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [isAddingViewing, setIsAddingViewing] = useState(false)
  const [newViewing, setNewViewing] = useState<Partial<Viewing>>({
    property_id: propertyId,
    type: 'public',
    status: 'scheduled'
  })

  const loadViewings = useCallback(async () => {
    if (!propertyId) return

    try {
      setLoading(true)
      setError(null)
      console.log('Loading viewings for property:', propertyId)

      const { data, error } = await supabase
        .from('viewings')
        .select('*')
        .eq('property_id', propertyId)
        .order('viewing_datetime', { ascending: true })

      if (error) {
        console.error('Supabase error loading viewings:', error)
        throw new Error(`Failed to load viewings: ${error.message}`)
      }

      console.log('Loaded viewings:', data)
      setViewings(data || [])
    } catch (err) {
      console.error('Error loading viewings:', err)
      setError(err instanceof Error ? err : new Error('An unexpected error occurred while loading viewings'))
    } finally {
      setLoading(false)
    }
  }, [propertyId, supabase])

  useEffect(() => {
    if (!propertyId) {
      console.error('PropertyId is required for ViewingsManager')
      setError(new Error('Property ID is required'))
      setLoading(false)
      return
    }
    loadViewings()
  }, [propertyId, loadViewings])

  async function handleAddViewing(e: React.FormEvent) {
    e.preventDefault()
    try {
      const date = (document.getElementById('viewing-date') as HTMLInputElement).value
      const time = (document.getElementById('viewing-time') as HTMLInputElement).value
      
      console.log('Input values:', { date, time, propertyTimezone })
      
      // Parse the input date and time as being in the property's timezone
      const [year, month, day] = date.split('-').map(Number)
      const [hours, minutes] = time.split(':').map(Number)
      
      console.log('Parsed values:', { year, month, day, hours, minutes })
      
      // Create a UTC date by adjusting for the property's timezone offset
      const tempDate = new Date(Date.UTC(year, month - 1, day, hours, minutes))
      console.log('Initial UTC date:', tempDate.toISOString())
      
      // Get the timezone offset for the property's timezone at this date
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: propertyTimezone,
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        hour12: false,
        timeZoneName: 'shortOffset'
      })
      
      const parts = formatter.formatToParts(tempDate)
      console.log('Formatter parts:', parts)
      
      const timeZonePart = parts.find(part => part.type === 'timeZoneName')
      console.log('Timezone part:', timeZonePart)
      
      if (!timeZonePart?.value) {
        throw new Error(`Invalid timezone: ${propertyTimezone}`)
      }
      
      // Handle both GMT+11 and GMT+1100 formats
      const offsetMatch = timeZonePart.value.match(/GMT([+-])(\d{1,2})(?:(\d{2})|)/)
      console.log('Offset match:', offsetMatch)
      
      if (!offsetMatch) {
        throw new Error(`Could not parse timezone offset from: ${timeZonePart.value}`)
      }
      
      const [, offsetSign, offsetHours, offsetMinutes = '00'] = offsetMatch
      const offset = (parseInt(offsetHours) * 60 + parseInt(offsetMinutes)) * (offsetSign === '+' ? -1 : 1)
      console.log('Calculated offset (minutes):', offset)
      
      // Adjust the UTC time by the offset to get the correct UTC time
      const utcDate = new Date(Date.UTC(
        year,
        month - 1,
        day,
        hours + Math.floor(offset / 60),
        minutes + (offset % 60)
      ))
      console.log('Final UTC date to store:', utcDate.toISOString())

      const { data, error } = await supabase
        .from('viewings')
        .insert([{
          ...newViewing,
          property_id: propertyId,
          viewing_datetime: utcDate.toISOString()
        }])
        .select()

      if (error) {
        console.error('Supabase error:', error)
        throw error
      }

      console.log('Saved viewing:', data)
      setViewings([...viewings, data[0]])
      setIsAddingViewing(false)
      setNewViewing({
        property_id: propertyId,
        type: 'public',
        status: 'scheduled'
      })
    } catch (err) {
      console.error('Error details:', err)
      alert(`Failed to add viewing: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }

  async function handleDeleteViewing(id: string) {
    if (!confirm('Are you sure you want to delete this viewing?')) return

    try {
      const { error } = await supabase
        .from('viewings')
        .delete()
        .eq('id', id)

      if (error) throw error

      setViewings(viewings.filter(v => v.id !== id))
    } catch (err) {
      console.error('Error deleting viewing:', err)
      alert('Failed to delete viewing. Please try again.')
    }
  }

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <h3 className="text-red-800 font-medium">Error</h3>
        <p className="text-red-600">{error.message}</p>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Property Viewings</h2>
        <button
          onClick={() => setIsAddingViewing(true)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
        >
          <PlusIcon className="w-4 h-4" />
          Add Viewing
        </button>
      </div>

      {isAddingViewing && (
        <form onSubmit={handleAddViewing} className="mb-8 bg-gray-50 p-4 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date (Timezone: {propertyTimezone})
              </label>
              <input
                id="viewing-date"
                type="date"
                required
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Time (Timezone: {propertyTimezone})
              </label>
              <input
                id="viewing-time"
                type="time"
                required
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select
                value={newViewing.type}
                onChange={e => setNewViewing({ ...newViewing, type: e.target.value as 'public' | 'private' })}
                className="w-full p-2 border rounded"
              >
                <option value="public">Public</option>
                <option value="private">Private</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={newViewing.status}
                onChange={e => setNewViewing({ ...newViewing, status: e.target.value as 'scheduled' | 'completed' | 'cancelled' })}
                className="w-full p-2 border rounded"
              >
                <option value="scheduled">Scheduled</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              value={newViewing.notes || ''}
              onChange={e => setNewViewing({ ...newViewing, notes: e.target.value })}
              className="w-full p-2 border rounded h-24"
              placeholder="Add any notes about the viewing..."
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsAddingViewing(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
            >
              Add Viewing
            </button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {viewings.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            <CalendarIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No viewings</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by adding a new viewing.</p>
            <div className="mt-6">
              <button
                onClick={() => setIsAddingViewing(true)}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
              >
                <PlusIcon className="w-4 h-4 mr-2" />
                Add Viewing
              </button>
            </div>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date & Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Notes
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {viewings.map((viewing) => {
                // Format the viewing time in the property's timezone
                const viewingDate = new Date(viewing.viewing_datetime);
                const formatter = new Intl.DateTimeFormat('en-US', {
                  timeZone: propertyTimezone,
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                  hour12: true
                });
                const formattedDateTime = formatter.format(viewingDate);

                return (
                  <tr key={viewing.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {formattedDateTime}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {viewing.type}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {viewing.status}
                    </td>
                    <td className="px-6 py-4">
                      {viewing.notes}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button
                        onClick={() => handleDeleteViewing(viewing.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
} 