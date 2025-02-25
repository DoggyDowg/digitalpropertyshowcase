'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Agent } from '@/types/agent'
import { v4 as uuidv4 } from 'uuid'
import Image from 'next/image'
import { UserCircle2, AlertCircle } from 'lucide-react'
import { AgencySelect } from '@/components/shared/AgencySelect'
import { AgentScraperModal } from '@/components/admin/agent-scraper/AgentScraperModal'
import { toast } from 'sonner'

// Initial agent state without ID
const initialAgent: Omit<Agent, 'id'> = {
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  agency_id: '',
  name: '',
  email: '',
  phone: '',
  position: '',
  status: 'active',
  metadata: {}
}

export default function AgentEditPage() {
  const params = useParams()
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [agent, setAgent] = useState<Agent>({ ...initialAgent, id: '' } as Agent)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isScraperOpen, setIsScraperOpen] = useState(false)
  const [validationErrors, setValidationErrors] = useState<{
    agency_id?: string;
    name?: string;
    email?: string;
    phone?: string;
    position?: string;
  }>({})

  useEffect(() => {
    if (!params?.id) {
      setError(new Error('No agent ID provided'));
      setLoading(false);
      return;
    }

    async function loadAgent() {
      try {
        const id = params?.id;
        if (!id) {
          setError(new Error('No agent ID provided'));
          setLoading(false);
          return;
        }
        
        if (id === 'new') {
          setAgent({
            id: '',
            name: '',
            position: '',
            email: '',
            phone: '',
            avatar_url: '',
            agency_id: '',
            created_at: '',
            updated_at: '',
            status: 'active',
            metadata: {}
          });
          setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from('agents')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;
        setAgent(data);
        setLoading(false);
      } catch (err) {
        console.error('Error loading agent:', err);
        setError(err instanceof Error ? err : new Error('Failed to load agent'));
        setLoading(false);
      }
    }

    loadAgent();
  }, [supabase, params?.id]);

  const validateForm = () => {
    const errors: typeof validationErrors = {}
    
    if (!agent.agency_id) {
      errors.agency_id = 'Please select an agency'
    }
    if (!agent.name) {
      errors.name = 'Name is required'
    }
    if (!agent.email) {
      errors.email = 'Email is required'
    }
    if (!agent.phone) {
      errors.phone = 'Phone is required'
    }
    if (!agent.position) {
      errors.position = 'Position is required'
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleAvatarUpload = async (file: File) => {
    try {
      setUploadProgress(0)
      setError(null)

      // Check file size (2MB limit)
      const MAX_SIZE = 2 * 1024 * 1024 // 2MB in bytes
      if (file.size > MAX_SIZE) {
        throw new Error('File size exceeds 2MB limit')
      }

      // Generate a unique filename
      const fileExt = file.name.split('.').pop()
      const fileName = `${agent.id}/avatar-${Date.now()}.${fileExt}`

      // Upload file
      const { data, error } = await supabase.storage
        .from('agent-assets')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        })

      if (error) {
        throw error
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('agent-assets')
        .getPublicUrl(data.path)

      setAgent(prev => ({
        ...prev,
        avatar_url: urlData.publicUrl
      }))

      setUploadProgress(100)
      toast.success('Avatar uploaded successfully')
    } catch (err) {
      console.error('Error uploading avatar:', err)
      setError(err instanceof Error ? err : new Error('Failed to upload avatar'))
      setUploadProgress(0)
      toast.error('Failed to upload avatar')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!agent) return
    if (!params?.id) {
      setError(new Error('No agent ID provided'))
      return
    }

    // Clear previous validation errors
    setValidationErrors({})

    // Validate form
    if (!validateForm()) {
      toast.error('Please fill in all required fields')
      return
    }

    try {
      setSaving(true)
      setError(null)

      const updatedAgent = {
        ...agent,
        id: params.id === 'new' ? uuidv4() : agent.id,
        updated_at: new Date().toISOString(),
        created_at: params.id === 'new' ? new Date().toISOString() : agent.created_at
      }

      const isNew = params.id === 'new'
      const { error } = isNew
        ? await supabase.from('agents').insert([updatedAgent]).select()
        : await supabase
            .from('agents')
            .update(updatedAgent)
            .eq('id', updatedAgent.id)
            .select()

      if (error) {
        throw new Error(`Failed to save agent: ${error.message}`)
      }

      // Refresh the agencies page to update agent counts
      const { error: agencyError } = await supabase
        .from('agency_settings')
        .select('*')
        .eq('id', updatedAgent.agency_id)
        .single()

      if (agencyError) {
        console.error('Error refreshing agency:', agencyError)
      }

      toast.success('Agent saved successfully')
      router.push('/admin/agents')
    } catch (err) {
      console.error('Error saving agent:', err)
      setError(err instanceof Error ? err : new Error('Failed to save agent'))
      toast.error('Failed to save agent')
    } finally {
      setSaving(false)
    }
  }

  interface ScraperCallbackParams {
    avatar?: File
    agentDetails?: {
      name?: string
      email?: string
      phone?: string
      position?: string
    }
  }

  const handleScraperSelect = async ({ agentDetails }: ScraperCallbackParams) => {
    if (agentDetails) {
      setAgent(prev => ({
        ...prev,
        ...agentDetails
      }))
    }
    setIsScraperOpen(false)
  }

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

  const isFormValid = agent.agency_id && agent.name && agent.email && agent.phone && agent.position

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">
          {params?.id === 'new' ? 'New Agent' : 'Edit Agent'}
        </h1>
        <button
          onClick={() => setIsScraperOpen(true)}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
        >
          Import Details
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Avatar Upload */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium mb-4">Avatar</h2>
          <div className="flex items-center gap-6">
            <div className="flex-shrink-0">
              {agent.avatar_url ? (
                <Image
                  src={agent.avatar_url}
                  alt={`${agent.name} avatar`}
                  width={96}
                  height={96}
                  className="rounded-full object-cover"
                />
              ) : (
                <UserCircle2 className="w-24 h-24 text-gray-400" />
              )}
            </div>
            <div className="flex-1">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    handleAvatarUpload(file)
                  }
                }}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              {uploadProgress > 0 && uploadProgress < 100 && (
                <div className="mt-2">
                  <div className="bg-gray-200 rounded-full h-2.5">
                    <div
                      className="bg-blue-600 h-2.5 rounded-full"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Basic Information */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium mb-4">Basic Information</h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Name
              </label>
              <input
                type="text"
                value={agent.name}
                onChange={(e) => {
                  setAgent({ ...agent, name: e.target.value })
                  setValidationErrors(prev => ({ ...prev, name: undefined }))
                }}
                className={`mt-1 block w-full rounded-md border px-3 py-2 ${
                  validationErrors.name 
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                    : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                }`}
                required
              />
              {validationErrors.name && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {validationErrors.name}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Position
              </label>
              <input
                type="text"
                value={agent.position}
                onChange={(e) => {
                  setAgent({ ...agent, position: e.target.value })
                  setValidationErrors(prev => ({ ...prev, position: undefined }))
                }}
                className={`mt-1 block w-full rounded-md border px-3 py-2 ${
                  validationErrors.position 
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                    : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                }`}
                required
              />
              {validationErrors.position && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {validationErrors.position}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                value={agent.email}
                onChange={(e) => {
                  setAgent({ ...agent, email: e.target.value })
                  setValidationErrors(prev => ({ ...prev, email: undefined }))
                }}
                className={`mt-1 block w-full rounded-md border px-3 py-2 ${
                  validationErrors.email 
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                    : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                }`}
                required
              />
              {validationErrors.email && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {validationErrors.email}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Phone
              </label>
              <input
                type="tel"
                value={agent.phone}
                onChange={(e) => {
                  setAgent({ ...agent, phone: e.target.value })
                  setValidationErrors(prev => ({ ...prev, phone: undefined }))
                }}
                className={`mt-1 block w-full rounded-md border px-3 py-2 ${
                  validationErrors.phone 
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                    : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                }`}
                required
              />
              {validationErrors.phone && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {validationErrors.phone}
                </p>
              )}
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700">
                Agency
              </label>
              <div className={`mt-1 ${validationErrors.agency_id ? 'border border-red-300 rounded-md' : ''}`}>
                <AgencySelect
                  value={agent.agency_id}
                  onChange={(value) => {
                    setAgent({ ...agent, agency_id: value })
                    setValidationErrors(prev => ({ ...prev, agency_id: undefined }))
                  }}
                  className={validationErrors.agency_id ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}
                />
              </div>
              {validationErrors.agency_id && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {validationErrors.agency_id}
                </p>
              )}
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700">
                Status
              </label>
              <select
                value={agent.status}
                onChange={(e) => setAgent({ ...agent, status: e.target.value as 'active' | 'inactive' })}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={() => router.push('/admin/agents')}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving || !isFormValid}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : 'Save Agent'}
          </button>
        </div>
      </form>

      <AgentScraperModal
        isOpen={isScraperOpen}
        onClose={() => setIsScraperOpen(false)}
        onSelect={handleScraperSelect}
        onStoreAvatar={handleAvatarUpload}
      />
    </div>
  )
}