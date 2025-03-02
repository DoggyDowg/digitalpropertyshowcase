'use client'

import { siteContent } from '@/config/content'
import { useState, useEffect, useCallback } from 'react'
import { useUpcomingViewing } from '@/hooks/useUpcomingViewing'
import { format } from 'date-fns'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { CalendarIcon } from '@heroicons/react/24/outline'
import type { Property } from '@/types/property'
import emailjs from '@emailjs/browser'
import { AddToCalendar } from './AddToCalendar'

// Initialize EmailJS
emailjs.init(process.env.NEXT_PUBLIC_EMAILJS_USER_ID!);

interface ViewingsProps {
  property: Property
}

interface FormData {
  name: string;
  email: string;
  phone: string;
  message: string;
  preferredDate: Date | undefined;
  preferredTime: string;
}

interface AgentData {
  firstName: string;
  email: string;
}

interface Viewing {
  viewing_datetime: string;
}

export function Viewings({ property }: ViewingsProps) {
  const { viewings } = siteContent
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    phone: '',
    message: '',
    preferredDate: undefined,
    preferredTime: ''
  })
  const { upcomingViewing: fetchedViewing, loading } = useUpcomingViewing(property.id)
  const [demoViewing, setDemoViewing] = useState<Viewing[]>([])

  // Set up demo viewings if needed
  useEffect(() => {
    if (property.is_demo) {
      console.log('Setting up demo viewings');
      const demoViewings = [
        {
          viewing_datetime: new Date('2026-03-08T09:30:00').toISOString()
        },
        {
          viewing_datetime: new Date('2026-03-09T14:00:00').toISOString()
        },
        {
          viewing_datetime: new Date('2026-03-10T11:30:00').toISOString()
        }
      ];
      console.log('Demo viewings:', demoViewings);
      setDemoViewing(demoViewings);
    }
  }, [property.is_demo])

  // Use demo viewings if it's a demo property, otherwise use fetched viewings
  const upcomingViewings = property.is_demo 
    ? demoViewing 
    : Array.isArray(fetchedViewing) 
      ? fetchedViewing 
      : fetchedViewing 
        ? [fetchedViewing] 
        : []
  
  console.log('Current upcomingViewings:', upcomingViewings);

  // Get current date
  const now = new Date()

  // Generate time slots in 15-minute intervals between 8:00 AM and 7:30 PM
  const timeSlots = Array.from({ length: 47 }, (_, i) => {
    const baseMinutes = 8 * 60 // Start at 8:00 AM
    const minutes = baseMinutes + (i * 15)
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    const ampm = hours >= 12 ? 'PM' : 'AM'
    const displayHours = hours % 12 || 12
    return `${displayHours}:${mins.toString().padStart(2, '0')} ${ampm}`
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null)

  // Update the handleSubmit function to properly type the agent data
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.preferredDate || !formData.preferredTime) {
      setSubmitStatus({
        type: 'error',
        message: 'Please select both date and time for your viewing.'
      })
      return
    }

    // Validate time format
    const timeRegex = /^(1[0-2]|0?[1-9]):[0-5][0-9] (AM|PM)$/
    if (!timeRegex.test(formData.preferredTime)) {
      setSubmitStatus({
        type: 'error',
        message: 'Invalid time format. Please select a valid time.'
      })
      return
    }

    setIsSubmitting(true)
    setSubmitStatus(null)

    try {
      // First, get the agent's name from the API
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          agentId: property.agent_id
        }),
      })

      const agentData: AgentData = await response.json()
      if (!response.ok) {
        throw new Error('Failed to fetch agent information')
      }

      // Parse time components
      const [time, period] = formData.preferredTime.split(' ')
      const [hours, minutes] = time.split(':')
      let hour = parseInt(hours)
      
      // Convert to 24-hour format
      if (period === 'PM' && hour !== 12) hour += 12
      if (period === 'AM' && hour === 12) hour = 0
      
      const preferredDateTime = new Date(formData.preferredDate)
      preferredDateTime.setHours(hour)
      preferredDateTime.setMinutes(parseInt(minutes))

      // Validate the resulting date
      if (isNaN(preferredDateTime.getTime())) {
        throw new Error('Invalid date/time combination')
      }

      // Format date and time for the email template
      const formattedDate = format(preferredDateTime, 'EEEE, MMMM do, yyyy')
      const formattedTime = format(preferredDateTime, 'h:mm a')

      // Prepare template parameters
      const templateParams = {
        to_email: agentData.email,
        to_name: agentData.firstName,
        from_name: formData.name,
        from_email: formData.email,
        phone: formData.phone,
        message: formData.message,
        property_name: property.name,
        form_type: 'viewing',
        subject: 'New Viewing Request',
        viewing_date: formattedDate,
        viewing_time: formattedTime
      }

      // Send email using EmailJS client-side
      await emailjs.send(
        process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID!,
        process.env.NEXT_PUBLIC_EMAILJS_VIEWINGTEMPLATE_ID!,
        templateParams
      )

      setSubmitStatus({
        type: 'success',
        message: 'Thank you for your viewing request. We will be in touch soon.'
      })
      setFormData({
        name: '',
        email: '',
        phone: '',
        message: '',
        preferredDate: undefined,
        preferredTime: ''
      })
    } catch (error) {
      setSubmitStatus({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to send viewing request'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Format the viewing date for the calendar
  const formatViewingForCalendar = useCallback((viewingDatetime: string) => {
    try {
      const date = new Date(viewingDatetime)
      if (isNaN(date.getTime())) {
        throw new Error('Invalid date')
      }

      // Format the date and time strings
      const formattedDate = format(date, 'yyyy-MM-dd')
      const formattedTime = format(date, 'HH:mm')
      
      // Calculate end time (30 minutes after start)
      const endDate = new Date(date.getTime() + 30 * 60000)
      const endTime = format(endDate, 'HH:mm')

      // Create location string
      const formattedAddress = property.street_address && property.suburb
        ? `${property.street_address}, ${property.suburb}`
        : property.maps_address || ''

      // Format event title with street address and suburb
      const eventTitle = `Viewing - ${formattedAddress}`

      // Format a detailed description
      const formattedDateTime = format(date, 'EEEE, MMMM do, yyyy h:mm a')
      let description = `Property viewing at ${formattedAddress}\n\n`
      description += `📅 Date & Time: ${formattedDateTime}\n`
      description += `📍 Location: ${formattedAddress}\n`
      
      return {
        date: formattedDate,
        time: formattedTime,
        endTime,
        timezone: property.local_timezone,
        description,
        title: eventTitle,
        location: formattedAddress,
        formattedDate: format(date, 'EEEE, MMMM do, yyyy'),
        formattedTime: format(date, 'h:mm a')
      }
    } catch (error) {
      console.error('Error formatting viewing date:', error)
      return null
    }
  }, [property.street_address, property.suburb, property.maps_address, property.local_timezone])

  // If there are upcoming viewings, show them (up to 3)
  const renderUpcomingViewings = () => {
    if (upcomingViewings.length === 0) {
      console.log('No upcoming viewings to display');
      return null;
    }

    console.log('Rendering viewings:', upcomingViewings);
    return (
      <div className="mb-12 p-4 bg-brand-primary/10 rounded-lg text-center">
        <h3 className="text-4xl font-light text-brand-light mb-6">Next Available Viewings</h3>
        <div className="space-y-4">
          {upcomingViewings.slice(0, 3).map((viewing, index) => {
            console.log('Processing viewing:', viewing, 'at index:', index);
            const calendarData = formatViewingForCalendar(viewing.viewing_datetime)
            if (!calendarData) {
              console.log('Failed to format calendar data for viewing:', viewing);
              return null;
            }

            return (
              <div key={index} className="flex items-center justify-center gap-6">
                <p className="text-brand-light text-xl">
                  {calendarData.formattedDate} at {calendarData.formattedTime}
                </p>
                <AddToCalendar
                  name={calendarData.title}
                  description={calendarData.description}
                  location={calendarData.location}
                  startDate={calendarData.date}
                  startTime={calendarData.time}
                  endTime={calendarData.endTime}
                  timezone={calendarData.timezone}
                />
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <section id="viewings" className="relative py-12 sm:py-16 px-4 sm:px-6 lg:px-12">
      <div className="absolute inset-0 bg-brand-dark/90" />
      <div className="max-w-7xl mx-auto relative">
        {/* Upcoming Viewing Display */}
        {loading ? (
          <div className="max-w-2xl mx-auto backdrop-blur-[12px] rounded-lg p-6 mb-8 text-center" style={{ backgroundColor: 'rgba(var(--brand-light-rgb), 0.7)' }}>
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200/20 rounded w-48 mx-auto mb-4"></div>
              <div className="h-6 bg-gray-200/20 rounded w-64 mx-auto"></div>
            </div>
          </div>
        ) : renderUpcomingViewings()}

        <div className="max-w-4xl mx-auto text-center mb-12">
          <h2 className="text-4xl font-light text-brand-light mb-4">{viewings.title}</h2>
        </div>

        {/* Contact Form */}
        <div className="max-w-2xl mx-auto backdrop-blur-[12px] rounded-lg p-8 shadow-lg" style={{ backgroundColor: 'rgba(var(--brand-light-rgb), 0.7)' }}>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name and Phone Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-brand-dark mb-2">
                  Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 rounded-md bg-white/80 border border-gray-300 text-brand-dark placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                  placeholder="Your name"
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-brand-dark mb-2">
                  Phone *
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  required
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 rounded-md bg-white/80 border border-gray-300 text-brand-dark placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                  placeholder="Your phone number"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-brand-dark mb-2">
                Email *
              </label>
              <input
                type="email"
                id="email"
                name="email"
                required
                value={formData.email}
                onChange={handleInputChange}
                className="w-full px-4 py-2 rounded-md bg-white/80 border border-gray-300 text-brand-dark placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                placeholder="Your email"
              />
            </div>

            {/* Date and Time Grid - Always side by side */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label htmlFor="preferredDate" className="block text-sm font-medium text-brand-dark mb-2">
                  Preferred Date *
                </label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal bg-white/80 border border-gray-300 text-brand-dark hover:bg-white/90 h-[42px] px-4",
                        !formData.preferredDate && "text-gray-500"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.preferredDate ? format(formData.preferredDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.preferredDate}
                      onSelect={(date) => setFormData(prev => ({ ...prev, preferredDate: date }))}
                      disabled={(date) => date < now}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <label htmlFor="preferredTime" className="block text-sm font-medium text-brand-dark mb-2">
                  Preferred Time *
                </label>
                <select
                  id="preferredTime"
                  name="preferredTime"
                  required
                  value={formData.preferredTime}
                  onChange={handleInputChange}
                  className="w-full px-4 h-[42px] rounded-md bg-white/80 border border-gray-300 text-brand-dark placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                >
                  <option value="">Select a time</option>
                  {timeSlots.map((time) => (
                    <option key={time} value={time}>{time}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="message" className="block text-sm font-medium text-brand-dark mb-2">
                Message
              </label>
              <textarea
                id="message"
                name="message"
                rows={4}
                value={formData.message}
                onChange={handleInputChange}
                className="w-full px-4 py-2 rounded-md bg-white/80 border border-gray-300 text-brand-dark placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                placeholder="Any additional information..."
              />
            </div>

            {submitStatus && (
              <div className={`p-4 rounded-md ${submitStatus.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {submitStatus.message}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full px-6 py-3 rounded-md bg-brand-dark text-brand-light hover:bg-brand-dark/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary transition-colors ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isSubmitting ? 'Submitting...' : 'Request Viewing'}
            </button>
          </form>
        </div>
      </div>
    </section>
  )
}