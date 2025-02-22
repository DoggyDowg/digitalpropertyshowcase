'use client'

import { useRef, useState, useEffect } from 'react'
import Image from 'next/image'
import { useAgent } from '@/hooks/useAgent'
import type { Property } from '@/types/property'
import { Toaster, toast } from 'react-hot-toast'
import emailjs from '@emailjs/browser'

// Initialize EmailJS with new method
try {
  emailjs.init({
    publicKey: process.env.NEXT_PUBLIC_EMAILJS_USER_ID!,
  });
  console.log('EmailJS initialized successfully');
} catch (error) {
  console.error('EmailJS initialization failed:', error);
}

interface ContactProps {
  property: Property
}

export function Contact({ property }: ContactProps) {
  const { agent, loading } = useAgent(property.agent_id)
  const agencyLogo = property.agency_settings?.branding.logo.dark
  const [isVisible, setIsVisible] = useState(false)
  const sectionRef = useRef<HTMLElement>(null)

  // Verify EmailJS configuration on mount
  useEffect(() => {
    console.log('EmailJS Configuration Check:', {
      serviceId: process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID?.substring(0, 4) + '...',
      templateId: process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID?.substring(0, 4) + '...',
      hasUserId: !!process.env.NEXT_PUBLIC_EMAILJS_USER_ID,
      environment: process.env.NODE_ENV,
      domain: window.location.origin
    });
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true)
            observer.disconnect()
          }
        })
      },
      { 
        threshold: 0.15,
        rootMargin: '-50px 0px'
      }
    )

    if (sectionRef.current) {
      observer.observe(sectionRef.current)
    }

    return () => observer.disconnect()
  }, [])

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target
    setFormData(prev => ({
      ...prev,
      [id]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    console.log('Submit handler triggered');
    e.preventDefault();
    console.log('Default prevented');
    setIsSubmitting(true);

    try {
      // First, get the agent's name from the API
      console.log('Fetching agent data...');
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          agentId: property.agent_id
        }),
      });

      console.log('Agent API response status:', response.status);
      const agentData = await response.json();
      
      if (!response.ok) {
        throw new Error(agentData.error || 'Failed to fetch agent information');
      }

      console.log('Agent data received successfully');

      // Prepare template parameters with complete agent data
      const templateParams = {
        to_email: agent?.email,
        to_name: agentData.firstName, // Using the firstName from API response
        from_name: formData.name,
        from_email: formData.email,
        phone: formData.phone,
        message: formData.message,
        property_name: property.name,
        form_type: 'enquiry',
        subject: 'New Property Enquiry'
      };

      console.log('Sending email with params:', {
        ...templateParams,
        to_email: '***@***.com' // Mask email for security in logs
      });

      // Send with explicit public key as backup
      const result = await emailjs.send(
        process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID!,
        process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID!,
        templateParams,
        process.env.NEXT_PUBLIC_EMAILJS_USER_ID! // Adding public key here as backup
      );

      console.log('EmailJS Response:', result);
      
      toast.success(
        'Thank you for your enquiry. We will be in touch soon.',
        {
          duration: 15000,
          position: 'bottom-center',
          style: {
            background: 'var(--brand-light)',
            color: 'var(--brand-dark)',
            padding: '16px',
            borderRadius: '8px',
          },
        }
      );
      
      setFormData({ name: '', email: '', phone: '', message: '' });
    } catch (error) {
      console.error('Detailed error:', {
        error,
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      
      toast.error(
        error instanceof Error ? error.message : 'Failed to send enquiry',
        {
          duration: 15000,
          position: 'bottom-center',
          style: {
            background: '#FEE2E2',
            color: '#991B1B',
            padding: '16px',
            borderRadius: '8px',
          },
        }
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section id="contact" ref={sectionRef} className="w-full py-12 sm:py-16 px-4 sm:px-6 lg:px-12 relative">
      <div className="absolute inset-0 bg-brand-dark/90" />
      <Toaster />
      <div className="max-w-7xl mx-auto h-full relative">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-stretch">
          {/* Agent Details - Left Side */}
          <div 
            className="flex flex-col items-center text-center justify-center space-y-6 sm:space-y-8 p-6 sm:p-8 rounded-lg shadow-lg transition-all duration-1000 h-full backdrop-blur-[12px]"
            style={{ 
              backgroundColor: 'rgba(var(--brand-light-rgb), 0.7)',
              opacity: isVisible ? 1 : 0,
              transform: `translateY(${isVisible ? '0' : '40px'})`
            }}
          >
            {/* Agent Image and Name */}
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="relative w-24 sm:w-32 h-24 sm:h-32 rounded-full overflow-hidden bg-gray-100">
                {loading ? (
                  <div className="absolute inset-0 animate-pulse bg-gray-200" />
                ) : agent?.avatar_url ? (
                  <Image
                    src={agent.avatar_url}
                    alt={agent.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                    <svg
                      className="h-16 w-16 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                  </div>
                )}
              </div>
              <div>
                <h3 className="text-2xl font-light text-brand-dark">
                  {loading ? (
                    <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
                  ) : (
                    agent?.name || 'Agent Name'
                  )}
                </h3>
                {loading ? (
                  <div className="h-6 w-32 bg-gray-200 rounded animate-pulse mt-2" />
                ) : (
                  <p className="text-brand-dark mt-1">
                    {agent?.position || 'Property Consultant'}
                  </p>
                )}
              </div>
            </div>

            {/* Contact Details */}
            <div className="space-y-4 text-center">
              <div>
                <div className="text-sm text-brand-dark opacity-80">Phone</div>
                {loading ? (
                  <div className="h-6 w-32 mx-auto bg-gray-200 rounded animate-pulse" />
                ) : agent?.phone ? (
                  <a 
                    href={`tel:${agent.phone}`}
                    className="text-brand-dark hover:text-brand-primary transition-colors"
                  >
                    {agent.phone}
                  </a>
                ) : (
                  <div className="text-brand-dark">Phone number not available</div>
                )}
              </div>
              <div>
                <div className="text-sm text-brand-dark opacity-80">Email</div>
                {loading ? (
                  <div className="h-6 w-48 mx-auto bg-gray-200 rounded animate-pulse" />
                ) : agent?.email ? (
                  <a 
                    href={`mailto:${agent.email}`}
                    className="text-brand-dark hover:text-brand-primary transition-colors"
                  >
                    {agent.email}
                  </a>
                ) : (
                  <div className="text-brand-dark">Email not available</div>
                )}
              </div>
            </div>

            {/* Agency Logo */}
            {agencyLogo && (
              <div className="relative w-32 sm:w-48 h-12 sm:h-16">
                <Image
                  src={agencyLogo}
                  alt={`${property.agency_name} Logo`}
                  fill
                  className="object-contain"
                />
              </div>
            )}
          </div>

          {/* Contact Form - Right Side */}
          <div 
            className="flex items-center w-full transition-all duration-1000"
            style={{ 
              opacity: isVisible ? 1 : 0,
              transform: `translateY(${isVisible ? '0' : '40px'})`,
              transitionDelay: '300ms'
            }}
          >
            <div 
              className="w-full h-full p-6 sm:p-8 rounded-lg shadow-lg flex flex-col justify-center backdrop-blur-[12px]"
              style={{ backgroundColor: 'rgba(var(--brand-light-rgb), 0.7)' }}
            >
              <h3 className="text-xl sm:text-2xl font-light text-brand-dark mb-4 sm:mb-6">Make an Enquiry</h3>
              <form 
                onSubmit={(e) => {
                  console.log('Form submission started')
                  handleSubmit(e)
                }} 
                className="space-y-4 sm:space-y-6" 
                noValidate
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div>
                    <label htmlFor="name" className="block text-sm text-brand-dark mb-2">
                      Your Name
                    </label>
                    <input
                      type="text"
                      id="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full px-3 sm:px-4 py-2 border border-brand-light rounded-md focus:outline-none focus:ring-2 focus:ring-brand-primary/50 text-brand-dark"
                      placeholder="Enter your name"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm text-brand-dark mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      id="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full px-3 sm:px-4 py-2 border border-brand-light rounded-md focus:outline-none focus:ring-2 focus:ring-brand-primary/50 text-brand-dark"
                      placeholder="Enter your email"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm text-brand-dark mb-2">
                    Phone
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full px-3 sm:px-4 py-2 border border-brand-light rounded-md focus:outline-none focus:ring-2 focus:ring-brand-primary/50 text-brand-dark"
                    placeholder="Enter your phone number"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm text-brand-dark mb-2">
                    Message
                  </label>
                  <textarea
                    id="message"
                    rows={4}
                    value={formData.message}
                    onChange={handleInputChange}
                    className="w-full px-3 sm:px-4 py-2 border border-brand-light rounded-md focus:outline-none focus:ring-2 focus:ring-brand-primary/50 text-brand-dark"
                    placeholder="Enter your message"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`w-full px-6 sm:px-8 py-3 text-brand-light bg-brand-dark active:translate-y-[3px] transition-all hover:bg-brand-dark/90 rounded-md text-sm sm:text-base ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isSubmitting ? 'Sending...' : 'Send Message'}
                </button>

              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}