'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import type { Property } from '@/types/property'
import { Check, ChevronsUpDown, Trash2, Search, SortAsc, SortDesc } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface PropertyWithAgent extends Property {
  agent?: {
    name: string
    position: string
  }
}

type SortField = 'name' | 'suburb' | 'updated_at' | 'status'
type SortDirection = 'asc' | 'desc'

function PropertiesContent() {
  const supabase = createClientComponentClient()
  const searchParams = useSearchParams()
  const [properties, setProperties] = useState<PropertyWithAgent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  
  // Updated filter states
  const [searchQuery, setSearchQuery] = useState('')
  const [sortField, setSortField] = useState<SortField>('updated_at')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [showOnlyPublished, setShowOnlyPublished] = useState(false)
  const [selectedAgent, setSelectedAgent] = useState('')
  const [selectedAgency, setSelectedAgency] = useState('')
  const [agentOpen, setAgentOpen] = useState(false)
  const [agencyOpen, setAgencyOpen] = useState(false)

  // Handle agency filter from URL
  useEffect(() => {
    if (!searchParams) return
    const agencyFromUrl = searchParams.get('agency')
    if (agencyFromUrl) {
      setSelectedAgency(agencyFromUrl)
    }
  }, [searchParams])

  // Derived state for unique agents and agencies
  const agents = Array.from(new Set(properties
    .filter(p => p.agent?.name)
    .map(p => ({ value: p.agent!.name, label: p.agent!.name }))))
    .sort((a, b) => a.label.localeCompare(b.label))

  const agencies = Array.from(new Set(properties
    .filter(p => p.agency_name)
    .map(p => ({ value: p.agency_name!, label: p.agency_name! }))))
    .sort((a, b) => a.label.localeCompare(b.label))

  const loadProperties = useCallback(async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('properties')
        .select(`
          *,
          agent:agent_id (
            name,
            position
          ),
          agency_settings:agency_id (
            id,
            branding
          )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Add cache busting to logo URLs
      const propertiesWithCacheBusting = data?.map(property => {
        if (property.agency_settings?.branding?.logo) {
          const timestamp = Date.now()
          const branding = {
            ...property.agency_settings.branding,
            logo: {
              ...property.agency_settings.branding.logo
            }
          }
          if (branding.logo.dark) {
            branding.logo.dark = `${branding.logo.dark}?t=${timestamp}`
          }
          if (branding.logo.light) {
            branding.logo.light = `${branding.logo.light}?t=${timestamp}`
          }
          return {
            ...property,
            agency_settings: {
              ...property.agency_settings,
              branding
            }
          }
        }
        return property
      }) || []

      setProperties(propertiesWithCacheBusting)
    } catch (err) {
      console.error('Error loading properties:', err)
      setError(err instanceof Error ? err : new Error('Failed to load properties'))
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    loadProperties()
  }, [loadProperties])

  const handleDelete = async (propertyId: string) => {
    try {
      const { error } = await supabase
        .from('properties')
        .delete()
        .eq('id', propertyId)

      if (error) throw error

      setProperties(prev => prev.filter(p => p.id !== propertyId))
      toast.success('Property deleted successfully')
    } catch (err) {
      console.error('Error deleting property:', err)
      toast.error('Failed to delete property')
    }
  }

  // Filter and sort properties
  const filteredAndSortedProperties = properties
    .filter(property => {
      // Apply published filter
      if (showOnlyPublished && property.status !== 'published') {
        return false
      }
      
      // Apply agent filter
      if (selectedAgent && property.agent?.name !== selectedAgent) {
        return false
      }

      // Apply agency filter
      if (selectedAgency && property.agency_name !== selectedAgency) {
        return false
      }
      
      // Apply search filter
      const searchLower = searchQuery.toLowerCase()
      return (
        searchQuery === '' ||
        property.name?.toLowerCase().includes(searchLower) ||
        property.suburb?.toLowerCase().includes(searchLower) ||
        property.state?.toLowerCase().includes(searchLower) ||
        property.agent?.name?.toLowerCase().includes(searchLower) ||
        property.agency_name?.toLowerCase().includes(searchLower)
      )
    })
    .sort((a, b) => {
      if (sortField === 'name') {
        return sortDirection === 'asc'
          ? (a.name || '').localeCompare(b.name || '')
          : (b.name || '').localeCompare(a.name || '')
      }
      if (sortField === 'suburb') {
        return sortDirection === 'asc'
          ? (a.suburb || '').localeCompare(b.suburb || '')
          : (b.suburb || '').localeCompare(a.suburb || '')
      }
      if (sortField === 'updated_at') {
        const dateA = new Date(a.updated_at || a.created_at).getTime()
        const dateB = new Date(b.updated_at || b.created_at).getTime()
        return sortDirection === 'asc' ? dateA - dateB : dateB - dateA
      }
      if (sortField === 'status') {
        return sortDirection === 'asc'
          ? (a.status || '').localeCompare(b.status || '')
          : (b.status || '').localeCompare(a.status || '')
      }
      return 0
    })

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-red-800 font-medium">Error</h3>
          <p className="text-red-600 mt-1">{error.message}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Properties</h1>
        <Link
          href="/admin/properties/new"
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
        >
          Add Property
        </Link>
      </div>

      {/* Updated Toolbar */}
      <div className="mb-6 space-y-4">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search properties..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Agent Filter */}
          <Popover open={agentOpen} onOpenChange={setAgentOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={agentOpen}
                className="w-[200px] justify-between"
              >
                {selectedAgent
                  ? agents.find((agent) => agent.value === selectedAgent)?.label
                  : "Select agent..."}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-0">
              <Command>
                <CommandInput placeholder="Search agents..." />
                <CommandList>
                  <CommandEmpty>No agent found.</CommandEmpty>
                  <CommandGroup>
                    <CommandItem
                      value=""
                      onSelect={() => {
                        setSelectedAgent('')
                        setAgentOpen(false)
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          !selectedAgent ? "opacity-100" : "opacity-0"
                        )}
                      />
                      All Agents
                    </CommandItem>
                    {agents.map((agent) => (
                      <CommandItem
                        key={agent.value}
                        value={agent.value}
                        onSelect={(currentValue) => {
                          setSelectedAgent(currentValue === selectedAgent ? "" : currentValue)
                          setAgentOpen(false)
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            selectedAgent === agent.value ? "opacity-100" : "opacity-0"
                          )}
                        />
                        {agent.label}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>

          {/* Agency Filter */}
          <Popover open={agencyOpen} onOpenChange={setAgencyOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={agencyOpen}
                className="w-[200px] justify-between"
              >
                {selectedAgency
                  ? agencies.find((agency) => agency.value === selectedAgency)?.label
                  : "Select agency..."}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-0">
              <Command>
                <CommandInput placeholder="Search agencies..." />
                <CommandList>
                  <CommandEmpty>No agency found.</CommandEmpty>
                  <CommandGroup>
                    <CommandItem
                      value=""
                      onSelect={() => {
                        setSelectedAgency('')
                        setAgencyOpen(false)
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          !selectedAgency ? "opacity-100" : "opacity-0"
                        )}
                      />
                      All Agencies
                    </CommandItem>
                    {agencies.map((agency) => (
                      <CommandItem
                        key={agency.value}
                        value={agency.value}
                        onSelect={(currentValue) => {
                          setSelectedAgency(currentValue === selectedAgency ? "" : currentValue)
                          setAgencyOpen(false)
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            selectedAgency === agency.value ? "opacity-100" : "opacity-0"
                          )}
                        />
                        {agency.label}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>

          {/* Published Switch */}
          <div className="flex items-center gap-2">
            <Switch
              id="published-mode"
              checked={showOnlyPublished}
              onCheckedChange={setShowOnlyPublished}
            />
            <label
              htmlFor="published-mode"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Only Published
            </label>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => {
                  if (sortField === 'name') {
                    setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
                  } else {
                    setSortField('name')
                    setSortDirection('asc')
                  }
                }}
              >
                <div className="flex items-center gap-2">
                  Property
                  {sortField === 'name' && (
                    sortDirection === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />
                  )}
                </div>
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => {
                  if (sortField === 'suburb') {
                    setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
                  } else {
                    setSortField('suburb')
                    setSortDirection('asc')
                  }
                }}
              >
                <div className="flex items-center gap-2">
                  Location
                  {sortField === 'suburb' && (
                    sortDirection === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />
                  )}
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Agency
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Agent
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => {
                  if (sortField === 'status') {
                    setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
                  } else {
                    setSortField('status')
                    setSortDirection('asc')
                  }
                }}
              >
                <div className="flex items-center gap-2">
                  Status
                  {sortField === 'status' && (
                    sortDirection === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />
                  )}
                </div>
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => {
                  if (sortField === 'updated_at') {
                    setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
                  } else {
                    setSortField('updated_at')
                    setSortDirection('asc')
                  }
                }}
              >
                <div className="flex items-center gap-2">
                  Last Updated
                  {sortField === 'updated_at' && (
                    sortDirection === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />
                  )}
                </div>
              </th>
              <th className="w-10"></th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredAndSortedProperties.map((property) => (
              <tr key={property.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <Link href={`/admin/properties/${property.id}`} className="group">
                    <div className="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                      {property.name || 'Untitled Property'}
                    </div>
                    <div className="text-sm text-gray-500 group-hover:text-blue-500 transition-colors">
                      {property.content.hero.headline}
                    </div>
                  </Link>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {property.suburb}
                  </div>
                  <div className="text-sm text-gray-500">
                    {property.state}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">
                    {property.agency_name || 'No Agency'}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {property.agent ? (
                    <div>
                      <div className="text-sm text-gray-900">
                        {property.agent.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {property.agent.position}
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500">
                      No Agent
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    property.status === 'published'
                      ? 'bg-green-100 text-green-800'
                      : property.status === 'archived'
                      ? 'bg-gray-100 text-gray-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {property.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(property.updated_at || property.created_at).toLocaleDateString()}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-right">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <button
                        className="p-2 text-gray-400 hover:text-red-500 transition-colors rounded-full hover:bg-gray-100"
                        aria-label="Delete property"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Property</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete this property? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(property.id)}
                          className="bg-red-600 hover:bg-red-700 text-white"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </td>
              </tr>
            ))}
            {filteredAndSortedProperties.length === 0 && (
              <tr>
                <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">
                  {properties.length === 0 
                    ? "No properties found. Click \"Add Property\" to create one."
                    : "No properties match your search criteria."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default function PropertiesPage() {
  return (
    <Suspense fallback={
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    }>
      <PropertiesContent />
    </Suspense>
  )
}