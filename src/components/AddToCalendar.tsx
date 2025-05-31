'use client'

import { Button } from '@/components/ui/button'
import { CalendarIcon } from '@heroicons/react/24/outline'
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogPortal,
} from '@/components/ui/alert-dialog'
import React, { useEffect, useState } from 'react'
import Image from 'next/image'

interface AgentDetails {
  name: string;
  email: string;
  phone: string;
}

interface AgencyDetails {
  name: string;
  website: string;
}

interface AddToCalendarProps {
  name: string
  description?: string
  location?: string
  startDate: string // Format: YYYY-MM-DD
  startTime: string // Format: HH:mm
  endTime?: string  // Format: HH:mm
  timezone?: string // IANA timezone identifier (e.g., "Australia/Melbourne")
  propertyId?: string // Optional property ID to fetch agent & agency details
  agentId?: string // Optional agent ID to fetch agent & agency details
}

export function AddToCalendar({
  name,
  description = '',
  location = '',
  startDate,
  startTime,
  endTime,
  timezone = 'Australia/Melbourne', // Default to Melbourne if not provided
  propertyId,
  agentId
}: AddToCalendarProps) {
  const [open, setOpen] = React.useState(false)
  const [agentDetails, setAgentDetails] = useState<AgentDetails | null>(null)
  const [agencyDetails, setAgencyDetails] = useState<AgencyDetails | null>(null)
  const [enhancedDescription, setEnhancedDescription] = useState(description)

  // Debug info
  useEffect(() => {
    console.log('AddToCalendar Props:', {
      startDate,
      startTime,
      endTime: endTime || 'Not provided (will calculate 30 mins after start)',
      timezone,
      propertyId: propertyId || 'None',
      agentId: agentId || 'None'
    });
  }, [startDate, startTime, endTime, timezone, propertyId, agentId]);

  // Fetch agent and agency details
  useEffect(() => {
    const fetchDetails = async () => {
      if (!propertyId && !agentId) return;
      
      try {
        const response = await fetch('/api/agent-details', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            propertyId,
            agentId
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to fetch agent and agency details');
        }

        const data = await response.json();
        
        if (data.agent) {
          setAgentDetails({
            name: data.agent.name,
            email: data.agent.email,
            phone: data.agent.phone
          });
        }
        
        if (data.agency) {
          setAgencyDetails({
            name: data.agency.name,
            website: data.agency.website
          });
        }
      } catch (error) {
        console.error('Error fetching agent/agency details:', error);
      } finally {
        // Still keep the finally block for proper cleanup
      }
    };

    fetchDetails();
  }, [propertyId, agentId]);

  // Create enhanced description with agent and agency details when they become available
  useEffect(() => {
    let newDescription = description;
    
    if (agencyDetails || agentDetails) {
      newDescription += '\n\n------------------------------------------\n\n';
      
      if (agencyDetails?.name) {
        newDescription += `${agencyDetails.name}\n`;
      }
      
      if (agentDetails?.name) {
        newDescription += `Agent: ${agentDetails.name}\n`;
      }
      
      if (agentDetails?.phone) {
        newDescription += `${agentDetails.phone}\n`;
      }
      
      if (agentDetails?.email) {
        newDescription += `${agentDetails.email}\n`;
      }
      
      if (agencyDetails?.website) {
        newDescription += `${agencyDetails.website}`;
      }
    }
    
    setEnhancedDescription(newDescription);
  }, [description, agentDetails, agencyDetails]);

  // Calculate end time (30 minutes after start if not provided)
  const getEndTime = (): string => {
    if (endTime) return endTime;

    const [hours, minutes] = startTime.split(':').map(Number);
    let endMinutes = minutes + 30;
    let endHours = hours;

    if (endMinutes >= 60) {
      endHours += Math.floor(endMinutes / 60);
      endMinutes = endMinutes % 60;
    }

    return `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`;
  };

  // Create a UTC ISO date string from date and time components
  const createUTCISOString = (date: string, time: string): string => {
    // This creates a date in the browser's local timezone
    const localDate = new Date(`${date}T${time}:00`);
    
    // Convert to UTC ISO string
    return localDate.toISOString();
  };

  // Create a basic format date string (YYYYMMDDTHHMMSSZ) for Google Calendar
  const createGoogleCalendarDateString = (date: string, time: string): string => {
    const utcDate = new Date(`${date}T${time}:00`);
    const year = utcDate.getUTCFullYear();
    const month = String(utcDate.getUTCMonth() + 1).padStart(2, '0');
    const day = String(utcDate.getUTCDate()).padStart(2, '0');
    const hours = String(utcDate.getUTCHours()).padStart(2, '0');
    const minutes = String(utcDate.getUTCMinutes()).padStart(2, '0');
    const seconds = String(utcDate.getUTCSeconds()).padStart(2, '0');
    
    // Format in the format Google Calendar expects (YYYYMMDDTHHMMSSZ)
    return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
  };

  // Format for Google Calendar - Using proper UTC format
  const getGoogleCalendarUrl = () => {
    // Convert local times to UTC format that Google Calendar expects
    const startDateTimeUTC = createGoogleCalendarDateString(startDate, startTime);
    const endDateTimeUTC = createGoogleCalendarDateString(startDate, getEndTime());
    
    console.log('Google Calendar UTC dates:', {
      startUTC: startDateTimeUTC,
      endUTC: endDateTimeUTC,
      timezone
    });

    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: name,
      details: enhancedDescription,
      location: location,
      dates: `${startDateTimeUTC}/${endDateTimeUTC}`,
      ctz: timezone // Still include the timezone for display purposes
    });

    return `https://calendar.google.com/calendar/render?${params.toString()}`;
  };

  // Format for Outlook - Using ISO strings
  const getOutlookUrl = () => {
    // For Outlook, we use ISO strings directly
    const startISO = createUTCISOString(startDate, startTime);
    const endISO = createUTCISOString(startDate, getEndTime());
    
    console.log('Outlook Calendar dates:', {
      startISO,
      endISO,
      timezone
    });

    return `https://outlook.live.com/calendar/0/deeplink/compose?subject=${encodeURIComponent(name)}&body=${encodeURIComponent(enhancedDescription)}&startdt=${startISO}&enddt=${endISO}&location=${encodeURIComponent(location)}`;
  };

  // Format for iCal - Using proper UTC format with timezone info
  const getICalUrl = () => {
    // Convert to UTC for proper iCal format
    const startUTC = new Date(`${startDate}T${startTime}:00`);
    const endUTC = new Date(`${startDate}T${getEndTime()}:00`);
    
    // Format dates in iCal format (YYYYMMDDTHHMMSSZ)
    const formatToICalDate = (date: Date) => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };
    
    const startDateTimeUTC = formatToICalDate(startUTC);
    const endDateTimeUTC = formatToICalDate(endUTC);
    
    console.log('iCal dates:', {
      startUTC: startDateTimeUTC,
      endUTC: endDateTimeUTC,
      timezone
    });

    // Need to escape commas, semicolons, and newlines for iCal format
    const escapedDescription = enhancedDescription
      .replace(/,/g, '\\,')
      .replace(/;/g, '\\;')
      .replace(/\n/g, '\\n');

    const escapedLocation = location
      .replace(/,/g, '\\,')
      .replace(/;/g, '\\;');

    const escapedSummary = name
      .replace(/,/g, '\\,')
      .replace(/;/g, '\\;');

    // Create the iCal content with UTC times (Z suffix)
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Digital Property Showcase//Calendar Event//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `DTSTART:${startDateTimeUTC}`,
      `DTEND:${endDateTimeUTC}`,
      `SUMMARY:${escapedSummary}`,
      `DESCRIPTION:${escapedDescription}`,
      `LOCATION:${escapedLocation}`,
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    return `data:text/calendar;charset=utf8,${encodeURIComponent(icsContent)}`;
  };

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