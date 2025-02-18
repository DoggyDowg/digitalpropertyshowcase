'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Phone, Mail, Facebook, Instagram } from 'lucide-react'
import { useFooterImage } from '@/hooks/useFooterImage'
import type { Property, FooterLink, OfficeAddress } from '@/types/property'

interface FooterProps {
  property: Property;
}

export function Footer({ property }: FooterProps) {
  const { imageUrl, loading } = useFooterImage(property.id, property.is_demo)
  
  // Find all links
  const phoneLink = property.footer_links?.find((link: FooterLink) => link.id === 'phone')
  const emailLink = property.footer_links?.find((link: FooterLink) => link.id === 'email')
  const socialLinks = property.footer_links?.filter((link: FooterLink) => 
    link.id === 'facebook' || link.id === 'instagram'
  ) || []
  
  // Find custom links (including home link)
  const customLinks = property.footer_links?.filter((link: FooterLink) => 
    !['phone', 'email', 'facebook', 'instagram'].includes(link.id)
  ) || []

  // Get agency logo and office details
  const agencyLogo = property.agency_settings?.branding?.logo?.light
  
  console.log('Property:', property)
  console.log('Agency Settings:', property.agency_settings)
  console.log('Agency Logo:', agencyLogo)
  console.log('Property office_id:', property.office_id)
  console.log('Office Addresses:', property.agency_settings?.office_addresses)
  
  const office: OfficeAddress | undefined = property.office_id && property.agency_settings?.office_addresses ? 
    property.agency_settings.office_addresses.find((office: OfficeAddress) => {
      console.log('Checking office:', office)
      console.log('Against office_id:', property.office_id)
      return office.id === property.office_id
    }) 
    : undefined

  console.log('Selected Office:', office)

  console.log('Office:', office) // Debug log
  console.log('Footer Links:', property.footer_links) // Debug log
  console.log('Custom Links:', customLinks) // Debug log

  return (
    <footer id="contact" className="bg-brand-dark text-brand-light">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-8">
        <div className="mb-4">
          <p className="text-lg mt-1">IS THIS THE ONE?</p>
          <p className="font-heading text-xl text-brand-light/80 mt-2">
            {property.street_address}, {property.suburb}, {property.state}
          </p>
        </div>
        
        <hr className="border-brand-light my-6" />
        
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr_1fr_1fr] gap-8">
          {/* First Column - Property Image */}
          <div className="relative h-[200px] sm:h-[300px] lg:h-full w-full max-w-[600px] lg:max-w-none">
            {loading ? (
              <div className="absolute inset-0 bg-gray-800 animate-pulse rounded-lg" />
            ) : imageUrl ? (
              <Image
                src={imageUrl}
                alt="Property Footer Image"
                fill
                className="object-cover rounded-lg"
              />
            ) : (
              <div className="absolute inset-0 bg-gray-800 flex items-center justify-center rounded-lg">
                <p className="text-brand-light/50">No footer image available</p>
              </div>
            )}
          </div>
          
          {/* Second Column - Call to Action with Separator */}
          <div className="flex">
            <div className="flex-1">
              <h3 className="text-2xl font-light mb-4">Need to learn more about this prestigious home?</h3>
              <p className="text-brand-light/80 mb-6">Get in touch with us to learn more. Don&apos;t miss out!</p>
            </div>
            {/* Vertical Separator - Hide on mobile/tablet */}
            <div className="hidden lg:block w-px bg-brand-light ml-8 h-full" />
          </div>

          {/* Third Column - All Links */}
          <div className="space-y-3">
            {/* Contact Links */}
            {phoneLink && (
              <div className="flex items-center gap-2 text-sm hover:text-gray-300">
                <Phone size={18} />
                {phoneLink.url ? (
                  <Link 
                    href={phoneLink.url}
                    className="hover:text-gray-300"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {phoneLink.title}
                  </Link>
                ) : (
                  <span>{phoneLink.title}</span>
                )}
              </div>
            )}
            
            {emailLink && (
              <div className="flex items-center gap-2 text-sm hover:text-gray-300">
                <Mail size={18} />
                {emailLink.url ? (
                  <Link 
                    href={emailLink.url}
                    className="hover:text-gray-300"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {emailLink.title}
                  </Link>
                ) : (
                  <span>{emailLink.title}</span>
                )}
              </div>
            )}

            {/* Social Links */}
            {socialLinks.map(social => (
              <div key={social.id} className="flex items-center gap-2 text-sm hover:text-gray-300">
                {social.id === 'facebook' && <Facebook size={18} />}
                {social.id === 'instagram' && <Instagram size={18} />}
                {social.url ? (
                  <Link 
                    href={social.url}
                    className="hover:text-gray-300"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {social.title}
                  </Link>
                ) : (
                  <span>{social.title}</span>
                )}
              </div>
            ))}

            {/* Custom Links */}
            {customLinks.map(link => (
              <div key={link.id} className="text-sm hover:text-gray-300">
                {link.url ? (
                  <Link 
                    href={link.url}
                    className="hover:text-gray-300"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {link.title} →
                  </Link>
                ) : (
                  <span>{link.title} →</span>
                )}
              </div>
            ))}
          </div>
          
          {/* Fourth Column - Logo and Address */}
          <div className="flex flex-col justify-end">
            {agencyLogo && (
              <div className="flex justify-start w-full h-16 sm:h-11 mb-6">
                <Image
                  src={agencyLogo}
                  alt={property.agency_name || 'Agency Logo'}
                  width={300}
                  height={44}
                  className="w-[75%] h-full object-contain object-left"
                  priority
                />
              </div>
            )}
            
            {/* Separator Line */}
            <div className="w-[75%]">
              <hr className="border-brand-light mb-6" />
            </div>
            
            {/* Office Address */}
            {office && (
              <div className="space-y-2">
                <p className="text-lg font-medium">{office.name}</p>
                <p className="text-sm">{office.street_address}</p>
                <p className="text-sm">{office.suburb}, {office.state_postcode}</p>
                <p className="text-sm">{office.phone}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Section with Copyright */}
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 pb-8">
        <hr className="border-brand-light" />
        <p className="text-center text-brand-light/80 text-sm py-4">
          {property?.agency_settings?.copyright || `© ${property.agency_name}. All rights reserved.`}
          {' '}Website by{' '}
          <Link 
            href="https://digipropshow.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="hover:text-brand-light hover:underline"
          >
            Digital Property Showcase
          </Link>
          .
        </p>
        <hr className="border-brand-light" />
      </div>
    </footer>
  )
}

export default Footer 