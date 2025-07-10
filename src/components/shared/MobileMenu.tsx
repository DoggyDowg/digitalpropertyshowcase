'use client'

import { Fragment } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { X } from 'lucide-react'
import { usePropertyLogo } from '@/hooks/usePropertyLogo'
import { TrackedImage } from '@/components/shared/AssetTracker'
import type { Property } from '@/types/property'

interface MenuItem {
  label: string
  href: string
}

interface MobileMenuProps {
  isOpen: boolean
  setIsOpen: (isOpen: boolean) => void
  menuItems: MenuItem[]
  property: Property
}

export function MobileMenu({ isOpen, setIsOpen, menuItems, property }: MobileMenuProps) {
  const { logoUrl } = usePropertyLogo(property.id, property.is_demo)

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-[200]" onClose={setIsOpen}>
        <Transition.Child
          as={Fragment}
          enter="ease-in-out duration-500"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in-out duration-500"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
              <Transition.Child
                as={Fragment}
                enter="transform transition ease-in-out duration-500"
                enterFrom="translate-x-full"
                enterTo="translate-x-0"
                leave="transform transition ease-in-out duration-500"
                leaveFrom="translate-x-0"
                leaveTo="translate-x-full"
              >
                <Dialog.Panel className="pointer-events-auto relative w-screen max-w-md">
                  <div className="flex h-full flex-col overflow-y-auto bg-brand-light py-6 shadow-xl">
                    <div className="px-4 sm:px-6">
                      <div className="flex items-start justify-between">
                        {/* Logo */}
                        <div className="h-12">
                          {logoUrl ? (
                            <TrackedImage
                              src={logoUrl}
                              alt={`${property.agency_name} Logo`}
                              width={160}
                              height={48}
                              className="object-contain h-full w-auto"
                              priority
                            />
                          ) : (
                            <div className="bg-gray-200 h-full flex items-center justify-center px-4 rounded">
                              <span className="text-gray-400 text-sm">Logo not found</span>
                            </div>
                          )}
                        </div>
                        <div className="ml-3 flex h-7 items-center">
                          <button
                            type="button"
                            className="relative rounded-md text-brand-dark hover:text-brand-dark/80"
                            onClick={() => setIsOpen(false)}
                          >
                            <span className="absolute -inset-2.5" />
                            <span className="sr-only">Close panel</span>
                            <X className="h-6 w-6" aria-hidden="true" />
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="relative mt-6 flex-1 px-4 sm:px-6">
                      <div className="flex flex-col space-y-4">
                        {menuItems.map((item) => (
                          <a
                            key={item.href}
                            href={item.href}
                            className="text-brand-dark hover:text-brand-dark/80 transition-colors text-lg"
                            onClick={() => setIsOpen(false)}
                          >
                            {item.label}
                          </a>
                        ))}
                      </div>
                    </div>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  )
} 