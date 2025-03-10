'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import Link from 'next/link'
import Image from 'next/image'
import { toast } from 'sonner'
import type { Agency } from '@/types/agency'

function DeleteDialog({ 
  isOpen, 
  onClose, 
  onConfirm, 
  agencyName 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onConfirm: () => void; 
  agencyName: string;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h2 className="text-xl font-semibold mb-4">Delete Agency</h2>
        <p className="text-gray-600 mb-6">
          Are you sure you want to delete {agencyName}? This action cannot be undone and will delete all associated assets.
        </p>
        <div className="flex justify-end gap-4">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

interface AgencyWithCounts extends Agency {
  propertyCount: number;
  agentCount: number;
}

export default function AgenciesPage() {
  const supabase = createClientComponentClient()
  const [agencies, setAgencies] = useState<AgencyWithCounts[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [agencyToDelete, setAgencyToDelete] = useState<Agency | null>(null)

  const loadAgencies = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase
        .from('agency_settings')
        .select(`
          *,
          agents:agents(count),
          properties:properties(count)
        `)
        .order('name', { ascending: true })

      if (error) throw error

      // Transform the data to match our interface
      const agenciesWithCounts = (data || []).map(agency => ({
        ...agency,
        propertyCount: agency.properties?.[0]?.count || 0,
        agentCount: agency.agents?.[0]?.count || 0
      }))

      setAgencies(agenciesWithCounts)
    } catch (err) {
      console.error('Error loading agencies:', err)
      setError(err instanceof Error ? err : new Error('Failed to load agencies'))
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    loadAgencies();
  }, [loadAgencies]);  // Include loadAgencies in the dependency array

  const handleDeleteAgency = async (agency: Agency) => {
    try {
      console.log('Starting delete process for agency:', agency.id)

      // First, delete all assets from storage
      const { data: storageData, error: storageError } = await supabase.storage
        .from('agency-assets')
        .list(agency.id)

      if (storageError) {
        console.error('Error listing agency assets:', storageError)
        throw new Error(`Failed to list agency assets: ${storageError.message}`)
      }

      console.log('Found storage data:', storageData)

      // Delete each file in the agency's folder
      if (storageData && storageData.length > 0) {
        const filePaths = storageData.map(file => `${agency.id}/${file.name}`)
        console.log('Attempting to delete files:', filePaths)

        const { error: deleteError } = await supabase.storage
          .from('agency-assets')
          .remove(filePaths)

        if (deleteError) {
          console.error('Error deleting agency assets:', deleteError)
          throw new Error(`Failed to delete agency assets: ${deleteError.message}`)
        }
      }

      // Then delete the agency record
      const { error: deleteAgencyError } = await supabase
        .from('agency_settings')
        .delete()
        .eq('id', agency.id)

      if (deleteAgencyError) {
        console.error('Error deleting agency record:', deleteAgencyError)
        throw new Error(`Failed to delete agency record: ${deleteAgencyError.message}`)
      }

      // Refresh the agencies list
      await loadAgencies()
      toast.success('Agency deleted successfully')
      setAgencyToDelete(null)
    } catch (error) {
      console.error('Error in delete process:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to delete agency')
    }
  }

  return (
    <>
      <DeleteDialog
        isOpen={agencyToDelete !== null}
        onClose={() => setAgencyToDelete(null)}
        onConfirm={() => agencyToDelete && handleDeleteAgency(agencyToDelete)}
        agencyName={agencyToDelete?.name || ''}
      />

      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">Agencies</h1>
            <p className="text-gray-600">Manage your agencies and their properties</p>
          </div>
          <Link
            href="/admin/agencies/new"
            className="inline-flex items-center gap-2 px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Agency
          </Link>
        </div>

        {loading ? (
          <div className="animate-pulse">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-gray-200 rounded-lg h-32"></div>
              ))}
            </div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h3 className="text-red-800 font-medium">Error</h3>
            <p className="text-red-600 mt-1">{error.message}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {agencies.map((agency) => (
              <div key={agency.id} className="bg-white rounded-lg shadow overflow-hidden">
                <Link 
                  href={`/admin/agencies/${agency.id}`}
                  className="block p-4 hover:bg-gray-50"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium">{agency.name}</h3>
                    <div className="h-12 w-auto max-w-[60px] relative">
                      {agency.branding?.logo?.dark ? (
                        <Image 
                          src={agency.branding.logo.dark}
                          alt={`${agency.name} logo`}
                          width={60}
                          height={48}
                          className="h-full w-auto object-contain"
                          quality={100}
                          priority={true}
                          unoptimized={true} // Skip Next.js image optimization for Supabase URLs
                        />
                      ) : (
                        <Image 
                          src="/placeholder-logo.png"
                          alt="Placeholder logo"
                          width={60}
                          height={48}
                          className="h-full w-auto object-contain opacity-50"
                          priority={true}
                        />
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 mb-3">
                    <svg className="h-5 w-5 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                    {agency.propertyCount > 0 ? (
                      <Link 
                        href={`/admin/properties?agency=${encodeURIComponent(agency.name)}`}
                        className="text-gray-600 hover:text-blue-600 transition-colors"
                      >
                        {agency.propertyCount} Properties
                      </Link>
                    ) : (
                      <span className="text-gray-600">{agency.propertyCount} Properties</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <svg className="h-5 w-5 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span className="text-gray-600">{agency.agentCount || 0} Agents</span>
                  </div>
                </Link>

                <div className="px-4 py-3 bg-gray-50 flex justify-between items-center">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    agency.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {agency.status === 'active' ? 'Active' : 'Inactive'}
                  </span>
                  
                  <button
                    onClick={() => setAgencyToDelete(agency)}
                    className="text-gray-400 hover:text-red-600"
                    title="Delete Agency"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}