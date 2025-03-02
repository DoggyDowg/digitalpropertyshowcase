'use client'

import { Button } from '@/components/ui/button'
import { CalendarIcon } from '@heroicons/react/24/outline'
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogPortal,
} from '@/components/ui/alert-dialog'
import React from 'react'
import Image from 'next/image'

interface AddToCalendarProps {
  name: string
  description?: string
  location?: string
  startDate: string // Format: YYYY-MM-DD
  startTime: string // Format: HH:mm
  endTime?: string  // Format: HH:mm
  timezone?: string // IANA timezone identifier (e.g., "Australia/Melbourne")
}

export function AddToCalendar({
  name,
  description = '',
  location = '',
  startDate,
  startTime,
  endTime,
  timezone = 'Australia/Melbourne' // Default to Melbourne if not provided
}: AddToCalendarProps) {
  const [open, setOpen] = React.useState(false)

  // Create a Date object in the property's timezone
  const createLocalDate = (date: string, time: string): string => {
    // Create a date string in ISO format with the timezone
    const [year, month, day] = date.split('-')
    const [hours, minutes] = time.split(':')
    
    // Format the date components into the format Google Calendar expects
    // This creates a date string without any timezone conversion
    return `${year}${month}${day}T${hours}${minutes}00`
  }

  // Calculate end time (30 minutes after start if not provided)
  const getEndTime = (): string => {
    if (endTime) return endTime

    const [hours, minutes] = startTime.split(':').map(Number)
    let endMinutes = minutes + 30
    let endHours = hours

    if (endMinutes >= 60) {
      endHours += Math.floor(endMinutes / 60)
      endMinutes = endMinutes % 60
    }

    return `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`
  }

  // Format for Google Calendar
  const getGoogleCalendarUrl = () => {
    const startDateTime = createLocalDate(startDate, startTime)
    const endDateTime = createLocalDate(startDate, getEndTime())

    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: name,
      details: description,
      location: location,
      dates: `${startDateTime}/${endDateTime}`,
      ctz: timezone // Use the property's timezone
    })

    return `https://calendar.google.com/calendar/render?${params.toString()}`
  }

  // Format for Outlook
  const getOutlookUrl = () => {
    // For Outlook, we need to provide the full ISO string
    const start = new Date(`${startDate}T${startTime}:00${getTimezoneOffset(timezone)}`)
    const end = new Date(`${startDate}T${getEndTime()}:00${getTimezoneOffset(timezone)}`)

    return `https://outlook.live.com/calendar/0/deeplink/compose?subject=${encodeURIComponent(name)}&body=${encodeURIComponent(description)}&startdt=${start.toISOString()}&enddt=${end.toISOString()}&location=${encodeURIComponent(location)}`
  }

  // Format for iCal
  const getICalUrl = () => {
    const startDateTime = createLocalDate(startDate, startTime)
    const endDateTime = createLocalDate(startDate, getEndTime())

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'BEGIN:VEVENT',
      `DTSTART;TZID=${timezone}:${startDateTime}`,
      `DTEND;TZID=${timezone}:${endDateTime}`,
      `SUMMARY:${name}`,
      `DESCRIPTION:${description}`,
      `LOCATION:${location}`,
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\n')

    return `data:text/calendar;charset=utf8,${encodeURIComponent(icsContent)}`
  }

  // Helper function to get timezone offset string for Outlook
  const getTimezoneOffset = (timezone: string): string => {
    try {
      const date = new Date()
      const options = { timeZone: timezone, timeZoneName: 'short' } as Intl.DateTimeFormatOptions
      const timeString = new Intl.DateTimeFormat('en-US', options).format(date)
      const match = timeString.match(/GMT([+-]\d{1,2})/)
      if (match) {
        const offset = match[1]
        return offset.padStart(3, '+') + '00'
      }
      return '+1100' // Default to Melbourne time if we can't determine the offset
    } catch (error) {
      console.error('Error getting timezone offset:', error)
      return '+1100' // Default to Melbourne time
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button 
          variant="outline" 
          className="bg-white/80 hover:bg-white text-brand-dark border border-gray-300"
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          Add to Calendar
        </Button>
      </AlertDialogTrigger>
      <AlertDialogPortal>
        <div 
          className="fixed inset-0 z-50 bg-brand-dark/90 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
          onClick={() => setOpen(false)}
        >
          <div 
            className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-[300px] translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-0 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-white rounded-lg">
              <div className="flex flex-col divide-y divide-gray-100 rounded-lg overflow-hidden relative">
                <a
                  href={getGoogleCalendarUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors cursor-pointer first:rounded-t-lg"
                  onClick={() => setOpen(false)}
                >
                  <div className="w-5 h-5 relative flex-shrink-0">
                    <Image
                      src="/icons/calendar/google-cal.png"
                      alt="Google Calendar"
                      fill
                      className="object-contain"
                    />
                  </div>
                  <span className="text-sm font-medium">Google Calendar</span>
                </a>
                <a
                  href={getOutlookUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => setOpen(false)}
                >
                  <div className="w-5 h-5 relative flex-shrink-0">
                    <Image
                      src="/icons/calendar/outlook-cal.png"
                      alt="Outlook"
                      fill
                      className="object-contain"
                    />
                  </div>
                  <span className="text-sm font-medium">Outlook</span>
                </a>
                <a
                  href={getICalUrl()}
                  download="event.ics"
                  className="flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors cursor-pointer last:rounded-b-lg"
                  onClick={() => setOpen(false)}
                >
                  <div className="w-5 h-5 relative flex-shrink-0">
                    <Image
                      src="/icons/calendar/apple-cal.png"
                      alt="Apple Calendar"
                      fill
                      className="object-contain"
                    />
                  </div>
                  <span className="text-sm font-medium">Apple Calendar / iCal</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </AlertDialogPortal>
    </AlertDialog>
  )
} 