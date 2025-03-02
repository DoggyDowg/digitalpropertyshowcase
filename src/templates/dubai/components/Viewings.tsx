'use client'

import { siteContent } from '@/config/content'
import { useState } from 'react'
import { useUpcomingViewing } from '@/hooks/useUpcomingViewing'
import { useHeroVideo } from '@/hooks/useHeroVideo'
import { format } from 'date-fns'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button, buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { CalendarIcon } from '@heroicons/react/24/outline'
import type { Property } from '@/types/property'
import emailjs from '@emailjs/browser'

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
  const { upcomingViewing, loading } = useUpcomingViewing(property.id)
  const { videoUrl: backgroundVideoUrl } = useHeroVideo(property.id)

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

  // Format the viewing date and time if available
  const formattedViewing = upcomingViewing && upcomingViewing.length > 0 ? {
    date: format(new Date(upcomingViewing[0].viewing_datetime), 'EEEE, MMMM do'),
    time: format(new Date(upcomingViewing[0].viewing_datetime), 'h:mm a')
  } : null

  return (
    <section id="viewings" className="relative py-20">
      {/* Video Background */}
      <div className="absolute inset-0 overflow-hidden -z-10">
        {backgroundVideoUrl ? (
          <video
            className="absolute h-[100vh] w-full object-cover"
            autoPlay
            muted
            loop
            playsInline
          >
            <source src={backgroundVideoUrl} type="video/mp4" />
          </video>
        ) : null}
        <div className="absolute inset-0 bg-black/60" />
      </div>

      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center mb-12">
          <h2 className="text-4xl font-bold text-white mb-4">{viewings.title}</h2>
        </div>

        {/* Upcoming Viewing Display */}
        {loading ? (
          <div className="max-w-2xl mx-auto bg-white/10 backdrop-blur-sm rounded-lg p-6 mb-8 text-center">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200/20 rounded w-48 mx-auto mb-4"></div>
              <div className="h-6 bg-gray-200/20 rounded w-64 mx-auto"></div>
            </div>
          </div>
        ) : upcomingViewing && upcomingViewing.length > 0 ? (
          <div className="max-w-2xl mx-auto bg-white/10 backdrop-blur-sm rounded-lg p-6 mb-8 text-center">
            <h3 className="text-2xl font-semibold text-white mb-4">Next Available Viewings</h3>
            <div className="space-y-4">
              {upcomingViewing.map((viewing, index) => (
                <p key={index} className="text-xl text-gray-200">
                  {format(new Date(viewing.viewing_datetime), 'EEEE, MMMM do')} at {format(new Date(viewing.viewing_datetime), 'h:mm a')}
                </p>
              ))}
            </div>
          </div>
        ) : null}

        {/* Contact Form */}
        <div className="max-w-2xl mx-auto bg-white/10 backdrop-blur-sm rounded-lg p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-200 mb-2">
                Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                required
                value={formData.name}
                onChange={handleInputChange}
                className="w-full px-4 py-2 rounded-md bg-white/20 border border-gray-400 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Your name"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-200 mb-2">
                Email *
              </label>
              <input
                type="email"
                id="email"
                name="email"
                required
                value={formData.email}
                onChange={handleInputChange}
                className="w-full px-4 py-2 rounded-md bg-white/20 border border-gray-400 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Your email"
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-200 mb-2">
                Phone *
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                required
                value={formData.phone}
                onChange={handleInputChange}
                className="w-full px-4 py-2 rounded-md bg-white/20 border border-gray-400 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Your phone number"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-200">
                Preferred Viewing Date and Time *
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-full justify-start text-left font-normal bg-white/20 border-gray-400 text-white hover:text-white hover:bg-white/30',
                          !formData.preferredDate && 'text-gray-300'
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.preferredDate ? format(formData.preferredDate, 'PPP') : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.preferredDate}
                        onSelect={(date) => setFormData(prev => ({ ...prev, preferredDate: date }))}
                        initialFocus
                        disabled={(date) => date < now}
                        className="bg-white rounded-md"
                        classNames={{
                          months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                          month: "space-y-4",
                          caption: "flex justify-center pt-1 relative items-center",
                          caption_label: "text-sm font-medium text-gray-900",
                          nav: "space-x-1 flex items-center",
                          nav_button: cn(
                            buttonVariants({ variant: "outline" }),
                            "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 border-gray-300 text-gray-700"
                          ),
                          nav_button_previous: "absolute left-1",
                          nav_button_next: "absolute right-1",
                          table: "w-full border-collapse space-y-1",
                          head_row: "flex",
                          head_cell: "text-gray-600 rounded-md w-9 font-normal text-[0.8rem] flex-1 text-center",
                          row: "flex w-full mt-2",
                          cell: "text-center text-sm p-0 relative flex-1 [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                          day: cn(
                            buttonVariants({ variant: "ghost" }),
                            "h-9 w-9 p-0 font-normal mx-auto aria-selected:opacity-100"
                          ),
                          day_range_end: "day-range-end",
                          day_selected: "bg-blue-600 text-white hover:bg-blue-700 hover:text-white focus:bg-blue-700 focus:text-white rounded-md",
                          day_today: "bg-gray-100 text-gray-900 rounded-md",
                          day_outside: "text-gray-500 opacity-50",
                          day_disabled: "text-gray-400 opacity-50",
                          day_hidden: "invisible"
                        }}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div>
                  <select
                    name="preferredTime"
                    value={formData.preferredTime}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 rounded-md bg-white/20 border border-gray-400 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="" className="bg-gray-800">Select a time</option>
                    {timeSlots.map((time) => (
                      <option key={time} value={time} className="bg-gray-800">
                        {time}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <p className="text-sm text-gray-300">
                All viewing times are local to the property&apos;s location
              </p>
            </div>

            <div>
              <label htmlFor="message" className="block text-sm font-medium text-gray-200 mb-2">
                Message (Optional)
              </label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-4 py-2 rounded-md bg-white/20 border border-gray-400 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Any additional information..."
              />
            </div>

            {submitStatus && (
              <div className={`p-4 rounded-md ${submitStatus.type === 'success' ? 'bg-green-600/20' : 'bg-red-600/20'}`}>
                <p className="text-sm text-white">{submitStatus.message}</p>
              </div>
            )}

            <div className="text-center">
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Sending...' : 'Request Viewing'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  )
}