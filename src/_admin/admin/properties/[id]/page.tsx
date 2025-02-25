'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Property, PropertyContent, PropertyFeature, FooterLink } from '@/types/property'
import { AgencySelect } from '@/components/shared/AgencySelect'
import { AgentSelect } from '@/components/shared/AgentSelect'
import { 
  ViewingsManager,
  PropertyLocations,
  PropertyAssets,
  PropertyMoreInfo,
  PropertyDeployment
} from '@/components/admin'
import { templateManager } from '@/lib/templateManager'
import { toast } from 'sonner'
import { OfficeSelect } from '@/components/shared/OfficeSelect'
import type { MoreInfoData } from '@/components/admin/PropertyMoreInfo'
import { PropertyScraperModal } from '@/components/admin/property-scraper/PropertyScraperModal'
import { AlertCircle } from 'lucide-react'
import type { PostgrestError } from '@supabase/supabase-js'

// Initial property state without ID
const initialProperty: Omit<Property, 'id'> = {
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  name: '',
  is_demo: false,
  template_name: 'dubai',
  street_address: '',
  suburb: '',
  state: '',
  price: '',
  status: 'draft',
  agency_id: null,
  agency_name: null,
  agent_id: null,
  office_id: null,
  custom_domain: null,
  deployment_url: null,
  footer_links: [
    { id: 'home', title: 'Visit Us', url: '' },
    { id: 'phone', title: 'Call Us', url: '' },
    { id: 'email', title: 'Email Us', url: '' },
    { id: 'facebook', title: 'Facebook', url: '' },
    { id: 'instagram', title: 'Instagram', url: '' },
    { id: 'link1', title: 'Sell Your Home', url: '' },
    { id: 'link2', title: 'Rent Your Home', url: '' },
    { id: 'link3', title: 'Buy a Home', url: '' }
  ],
  metadata: {
    template_version: '1.0.0'
  },
  template_version: '1.0.0',
  content: {
    hero: {
      headline: '',
      subheadline: ''
    },
    features: {
      items: Array.from({ length: 15 }, (_, i) => ({
        rank: i + 1,
        feature: ''
      })),
      header: '',
      headline: '',
      banner_title: 'Your Home',
      description: ''
    },
    lifestyle: {
      header: '',
      headline: '',
      description: '',
      banner_title: 'Your Lifestyle'
    },
    neighbourhood: {
      text: '',
      part1_headline: '',
      part1_text: '',
      part2_headline: '',
      part2_text: '',
      part3_headline: '',
      part3_text: '',
      banner_title: 'Your Neighbourhood'
    },
    seo: {
      title: '',
      description: ''
    },
    og: {
      title: '',
      description: ''
    }
  }
}

type Tab = 'content' | 'visual_assets' | 'viewings' | 'locations' | 'more_info' | 'deployment'

function PropertyEditContent({ id }: { id: string }) {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [property, setProperty] = useState<Property>({ ...initialProperty, id } as Property)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [activeTab, setActiveTab] = useState<Tab>('content')
  const [upgradeAvailable, setUpgradeAvailable] = useState(false)
  const moreInfoRef = useRef<{ handleSave: () => Promise<void> }>(null)
  const [isScraperOpen, setIsScraperOpen] = useState(false)
  const [validationErrors, setValidationErrors] = useState<Record<string, string | undefined>>({})

  // Load existing property if editing
  useEffect(() => {
    async function loadProperty() {
      if (id === 'new') {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const { data, error } = await supabase
          .from('properties')
          .select(`
            *,
            agency_settings:agency_settings!agency_id (
              *
            )
          `)
          .eq('id', id)
          .single()

        if (error) throw error

        if (data) {
          console.log('Loaded property data:', data)
          console.log('Agency settings:', data.agency_settings)
          console.log('Office addresses:', data.agency_settings?.office_addresses)

          // Add cache busting to logo URLs
          if (data.agency_settings?.branding?.logo) {
            const timestamp = Date.now()
            const branding = {
              ...data.agency_settings.branding,
              logo: {
                ...data.agency_settings.branding.logo
              }
            }
            if (branding.logo.dark) {
              branding.logo.dark = `${branding.logo.dark}?t=${timestamp}`
            }
            if (branding.logo.light) {
              branding.logo.light = `${branding.logo.light}?t=${timestamp}`
            }
            data.agency_settings.branding = branding
          }

          // Initialize content with default structure if missing
          const content = {
            og: data.content?.og || { title: '', description: '' },
            seo: data.content?.seo || { title: '', description: '' },
            hero: data.content?.hero || { headline: '', subheadline: '' },
            features: {
              items: Array.from({ length: 15 }, (_, i) => ({
                rank: i + 1,
                feature: data.content?.features?.items?.[i]?.feature || ''
              })),
              header: data.content?.features?.header || '',
              headline: data.content?.features?.headline || '',
              banner_title: data.content?.features?.banner_title || 'Your Home',
              description: data.content?.features?.description || ''
            },
            lifestyle: {
              header: data.content?.lifestyle?.header || '',
              headline: data.content?.lifestyle?.headline || '',
              description: data.content?.lifestyle?.description || '',
              banner_title: data.content?.lifestyle?.banner_title || 'Your Lifestyle'
            },
            neighbourhood: {
              text: data.content?.neighbourhood?.text || '',
              part1_headline: data.content?.neighbourhood?.part1_headline || '',
              part1_text: data.content?.neighbourhood?.part1_text || '',
              part2_headline: data.content?.neighbourhood?.part2_headline || '',
              part2_text: data.content?.neighbourhood?.part2_text || '',
              part3_headline: data.content?.neighbourhood?.part3_headline || '',
              part3_text: data.content?.neighbourhood?.part3_text || '',
              banner_title: data.content?.neighbourhood?.banner_title || 'Your Neighbourhood'
            }
          }

          // Initialize metadata with default structure if missing
          const metadata = {
            ...data.metadata,
            more_info: {
              additionalInfo: data.metadata?.more_info?.additionalInfo || Array.from({ length: 5 }, () => ({ info: '', detail: '' })),
              ctaButtons: data.metadata?.more_info?.ctaButtons || {
                primary: { label: '', type: 'link', url: '' },
                secondary: { label: '', type: 'link', url: '' }
              },
              documents: data.metadata?.more_info?.documents || Array.from({ length: 5 }, () => ({ label: '', url: '' }))
            }
          }
          
          // Ensure all default footer links exist
          const defaultFooterLinks: FooterLink[] = [
            { id: 'home', title: 'Visit Us', url: '' },
            { id: 'phone', title: 'Call Us', url: '' },
            { id: 'email', title: 'Email Us', url: '' },
            { id: 'facebook', title: 'Facebook', url: '' },
            { id: 'instagram', title: 'Instagram', url: '' },
            { id: 'link1', title: 'Sell Your Home', url: '' },
            { id: 'link2', title: 'Rent Your Home', url: '' },
            { id: 'link3', title: 'Buy a Home', url: '' }
          ]
          const existingLinks: FooterLink[] = data.footer_links || []
          const mergedFooterLinks = defaultFooterLinks.map(defaultLink => {
            const existingLink = existingLinks.find(link => link.id === defaultLink.id)
            return existingLink || defaultLink
          })
          
          setProperty({ 
            ...data, 
            content, 
            metadata,
            footer_links: mergedFooterLinks,
            agency_settings: data.agency_settings,
            updated_at: new Date().toISOString() // Force refresh
          })
        }
      } catch (err) {
        console.error('Error loading property:', err)
        setError(err instanceof Error ? err : new Error('Failed to load property'))
      } finally {
        setLoading(false)
      }
    }

    loadProperty()
  }, [supabase, id])

  // Load templates
  useEffect(() => {
    async function loadTemplates() {
      try {
        const { error } = await supabase
          .from('templates')
          .select('*')
          .order('created_at', { ascending: false })

        if (error) throw error

        // Check if upgrade is available
        if (property.template_version) {
          setUpgradeAvailable(templateManager.isUpgradeAvailable(property.template_version))
        }
      } catch (err) {
        console.error('Error loading templates:', err)
      }
    }

    loadTemplates()
  }, [property.template_version, supabase])

  // Handle template upgrade
  const handleUpgradeTemplate = async () => {
    try {
      const latestVersion = templateManager.getCurrentVersion()
      if (!templateManager.canUpgrade(property.template_version, latestVersion)) {
        throw new Error('Cannot upgrade to this version')
      }

      const upgradedContent = await templateManager.upgradeContent(
        property.content,
        property.template_version,
        latestVersion
      )

      setProperty(prev => ({
        ...prev,
        content: upgradedContent,
        template_version: latestVersion
      }))
    } catch (err) {
      console.error('Error upgrading template:', err)
      setError(err instanceof Error ? err : new Error('Failed to upgrade template'))
    }
  }

  // Handle basic property info updates
  const handlePropertyChange = (
    field: keyof Omit<Property, 'id' | 'created_at' | 'updated_at' | 'content' | 'metadata'>,
    value: string | boolean
  ) => {
    setProperty(prev => ({
      ...prev,
      [field]: value,
      updated_at: new Date().toISOString()
    }))
  }

  // Handle content updates
  const handleContentChange = (section: keyof PropertyContent, field: string, value: string | PropertyFeature[]) => {
    setProperty(prev => {
      const currentSectionContent = prev.content?.[section] || {}
      return {
        ...prev,
        content: {
          ...prev.content,
          [section]: {
            ...currentSectionContent,
            [field]: value
          }
        },
        updated_at: new Date().toISOString()
      }
    })
  }

  // Handle feature list updates
  const handleFeatureChange = (index: number, value: string) => {
    const newFeatures = [...property.content.features.items]
    newFeatures[index] = {
      rank: index + 1,
      feature: value
    }
    handleContentChange('features', 'items', newFeatures)
  }

  const validateForm = () => {
    const errors: Record<string, string> = {}
    
    if (!property.name) {
      errors.name = 'Name is required'
    }
    if (!property.street_address) {
      errors.street_address = 'Street address is required'
    }
    if (!property.suburb) {
      errors.suburb = 'Suburb is required'
    }
    if (!property.state) {
      errors.state = 'State is required'
    }
    if (!property.agency_id) {
      errors.agency_id = 'Agency is required'
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Handle save
  const handleSave = async (skipMoreInfoSave = false) => {
    try {
      setSaving(true)
      setError(null)
      setValidationErrors({})

      // Validate form
      if (!validateForm()) {
        toast.error('Please fill in all required fields')
        return
      }

      // If we're on the More Info tab and not skipping the save, save that data first
      if (activeTab === 'more_info' && !skipMoreInfoSave && moreInfoRef.current?.handleSave) {
        await moreInfoRef.current.handleSave();
        return; // Let the More Info save handle the property save
      }

      console.log('Starting save with property:', property)

      // Fetch agency name if needed
      if (property.agency_id && !property.agency_name) {
        console.log('Fetching agency name for id:', property.agency_id)
        const { data: agency } = await supabase
          .from('agency_settings')
          .select('name')
          .eq('id', property.agency_id)
          .single()

        if (agency) {
          console.log('Found agency:', agency)
          property.agency_name = agency.name
        }
      }

      const propertyData = {
        name: property.name,
        street_address: property.street_address,
        suburb: property.suburb,
        state: property.state,
        price: property.price,
        status: property.status,
        agency_id: property.agency_id,
        office_id: property.office_id,
        agent_id: property.agent_id,
        content: property.content,
        metadata: property.metadata,
        is_demo: property.is_demo,
        template_name: property.template_name,
        updated_at: new Date().toISOString()
      }

      // Debug logging
      console.log('Property state before save:', property)
      console.log('Property data being saved:', propertyData)

      if (id === 'new') {
        console.log('Creating new property')
        const { data, error } = await supabase
          .from('properties')
          .insert([propertyData])
          .select()
          .single()

        if (error) {
          console.error('Database error:', error)
          throw error
        }

        console.log('Successfully created property:', data)
        router.push(`/admin/properties/${data.id}`)
      } else {
        console.log('Updating existing property:', id)
        const { error } = await supabase
          .from('properties')
          .update(propertyData)
          .eq('id', id)

        if (error) throw error

        console.log('Successfully updated property')
      }

      toast.success('Changes saved successfully')
    } catch (err: unknown) {
      console.error('Error saving property:', err)
      setError(err instanceof Error ? err : new Error('Failed to save property'))
      
      // Show a more detailed error message
      if (typeof err === 'object' && err !== null && 'code' in err && err.code === '23502') {
        const field = (err as PostgrestError).message.match(/column "([^"]+)"/)?.[1]
        toast.error(`Failed to save: ${field || 'A required field'} is missing`)
      } else {
        toast.error(err instanceof Error ? err.message : 'Failed to save changes')
      }
    } finally {
      setSaving(false)
    }
  }

  const handleMoreInfoSave = async (updatedMetadata: { more_info: MoreInfoData }) => {
    console.groupCollapsed('🚨 More Info Save Process');
    console.log('Metadata received:', updatedMetadata);
    
    // Update state first
    setProperty(prev => {
      const newState = {
        ...prev,
        metadata: {
          ...prev.metadata,
          more_info: updatedMetadata.more_info
        }
      };
      
      console.log('Updated property state:', newState);
      return newState;
    });

    // Wait for state to be updated
    await new Promise(resolve => setTimeout(resolve, 100));
    
    console.log('Triggering save...');
    await handleSave(true); // Pass true to skip More Info save
    console.groupEnd();
  }

  // Add these functions inside the component
  async function handleContentUpdate(content: Record<string, unknown>) {
    try {
      // Validate content structure with more lenient validation
      const isValid = (
        content && typeof content === 'object' &&
        content.hero && typeof content.hero === 'object' &&
        content.features && typeof content.features === 'object' &&
        content.lifestyle && typeof content.lifestyle === 'object' &&
        content.neighbourhood && typeof content.neighbourhood === 'object' &&
        content.seo && typeof content.seo === 'object' &&
        content.og && typeof content.og === 'object'
      )

      if (!isValid) {
        console.error('Invalid content format: Missing required sections')
        toast.error('Failed to apply content: Invalid format')
        return
      }

      // Safe to cast after validation
      const typedContent = content as unknown as PropertyContent

      // Update property state with new content, preserving existing structure
      setProperty(property => ({
        ...property,
        content: {
          ...property.content,
          hero: {
            ...property.content.hero,
            headline: typedContent.hero.headline || property.content.hero.headline,
            subheadline: typedContent.hero.subheadline || property.content.hero.subheadline
          },
          features: {
            ...property.content.features,
            items: (typedContent.features.items as Array<{ feature: string }>)?.map((item: { feature: string }, index: number) => ({
              rank: index + 1,
              feature: item.feature
            })) || property.content.features.items,
            header: typedContent.features.headline || property.content.features.header,
            headline: typedContent.features.headline || property.content.features.headline,
            description: typedContent.features.description || property.content.features.description,
            banner_title: property.content.features.banner_title
          },
          lifestyle: {
            ...property.content.lifestyle,
            header: typedContent.lifestyle.header || property.content.lifestyle.header,
            headline: typedContent.lifestyle.headline || property.content.lifestyle.headline,
            description: typedContent.lifestyle.description || property.content.lifestyle.description,
            banner_title: property.content.lifestyle.banner_title
          },
          neighbourhood: {
            ...property.content.neighbourhood,
            part1_headline: typedContent.neighbourhood.part1_headline || property.content.neighbourhood.part1_headline,
            part1_text: typedContent.neighbourhood.part1_text || property.content.neighbourhood.part1_text,
            part2_headline: typedContent.neighbourhood.part2_headline || property.content.neighbourhood.part2_headline,
            part2_text: typedContent.neighbourhood.part2_text || property.content.neighbourhood.part2_text,
            part3_headline: typedContent.neighbourhood.part3_headline || property.content.neighbourhood.part3_headline,
            part3_text: typedContent.neighbourhood.part3_text || property.content.neighbourhood.part3_text,
            banner_title: property.content.neighbourhood.banner_title
          },
          seo: {
            ...property.content.seo,
            title: typedContent.seo.title || property.content.seo.title,
            description: typedContent.seo.description || property.content.seo.description
          },
          og: {
            ...property.content.og,
            title: typedContent.og.title || property.content.og.title,
            description: typedContent.og.description || property.content.og.description
          }
        }
      }))

      toast.success('Content applied successfully')
      setIsScraperOpen(false)
    } catch (error) {
      console.error('Error applying content:', error)
      toast.error('Failed to apply content')
    }
  }

  async function handleMediaUpdate(assets: Array<{
    id: string;
    category: string;
    name: string;
    storage_path: string;
    file: File;
  }>) {
    try {
      console.group('Processing media assets')
      
      // Get unique categories being saved
      const categoriesToUpdate = [...new Set(assets.map(a => a.category))]
      console.log('Categories to update:', categoriesToUpdate)
      
      // Delete existing assets for these categories
      console.log('Cleaning up existing assets...')
      for (const category of categoriesToUpdate) {
        console.group(`Cleaning up ${category}`)
        
        // Get existing assets for this category
        const { data: existingAssets, error: fetchError } = await supabase
          .from('assets')
          .select('storage_path')
          .eq('property_id', id)
          .eq('category', category)
        
        if (fetchError) {
          console.error('Error fetching existing assets:', fetchError)
          throw fetchError
        }
        
        if (existingAssets && existingAssets.length > 0) {
          // Delete files from storage
          const { error: storageError } = await supabase.storage
            .from('property-assets')
            .remove(existingAssets.map(a => a.storage_path))
            
          if (storageError) {
            console.error('Error deleting files from storage:', storageError)
            throw storageError
          }
          
          // Delete records from database
          const { error: dbError } = await supabase
            .from('assets')
            .delete()
            .eq('property_id', id)
            .eq('category', category)
            
          if (dbError) {
            console.error('Error deleting asset records:', dbError)
            throw dbError
          }
          
          console.log(`Deleted ${existingAssets.length} existing assets for ${category}`)
        }
        console.groupEnd()
      }
      
      console.log('Cleanup complete, proceeding with new asset upload')

      // Upload each asset to Supabase storage and create asset records
      for (const asset of assets) {
        console.group(`Processing asset: ${asset.name}`)
        
        try {
          // Create a clean filename
          const cleanFileName = asset.name.toLowerCase()
            .replace(/[^a-z0-9.]/g, '_')
            .replace(/_+/g, '_');

          // Create the storage path based on category
          const path = `${id}/${asset.category}/${cleanFileName}`;

          console.log('Prepared upload details:', {
            name: asset.name,
            category: asset.category,
            path,
            fileType: asset.file?.type,
            fileSize: asset.file?.size
          });

          // Validate file data
          if (!asset.file || asset.file.size === 0) {
            throw new Error(`Invalid file data for ${asset.name}`);
          }

          // Upload file to Supabase storage
          console.log('Starting storage upload...');
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('property-assets')
            .upload(path, asset.file, {
              contentType: asset.file.type,
              cacheControl: '3600',
              upsert: true
            });

          if (uploadError) {
            console.error('Storage upload error:', uploadError);
            throw uploadError;
          }

          if (!uploadData?.path) {
            throw new Error('No upload path returned from storage');
          }

          console.log('File uploaded successfully:', uploadData);

          // Create asset record in database
          const assetRecord = {
            property_id: id,
            category: asset.category,
            type: asset.file.type.startsWith('video/') ? 'video' : 'image',
            filename: cleanFileName,
            storage_path: uploadData.path,
            status: 'active',
            title: asset.name.split('.')[0].replace(/_/g, ' '),
            alt_text: `${asset.category} - ${asset.name.split('.')[0].replace(/_/g, ' ')}`
          };

          console.log('Creating database record:', {
            ...assetRecord,
            fileInfo: {
              type: asset.file.type,
              size: asset.file.size,
              name: asset.name
            }
          });

          const { data: insertData, error: dbError } = await supabase
            .from('assets')
            .insert([assetRecord])
            .select()
            .single();

          if (dbError) {
            console.error('Database error:', {
              error: dbError,
              record: assetRecord
            });
            throw dbError;
          }

          console.log('Asset record created successfully:', insertData);
        } catch (error) {
          console.error(`Failed to process asset ${asset.name}:`, error);
          toast.error(`Failed to save ${asset.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
          console.groupEnd();
        }
      }

      console.log('All assets processed');
      toast.success('Media assets saved successfully');
      setIsScraperOpen(false);
    } catch (error) {
      console.error('Error in media save process:', error);
      toast.error('Failed to save media assets');
    } finally {
      console.groupEnd();
    }
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

  const tabs: { id: Tab; label: string }[] = [
    { id: 'content', label: 'Content' },
    { id: 'visual_assets', label: 'Visual Assets' },
    { id: 'viewings', label: 'Viewings' },
    { id: 'locations', label: 'Locations' },
    { id: 'more_info', label: 'More Info' },
    { id: 'deployment', label: 'Deployment' }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="border-b bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center px-6 h-16">
            <h1 className="text-2xl font-bold">
              {id === 'new' ? 'New Property' : 'Edit Property'}
            </h1>
            <div className="flex gap-4">
              <button
                onClick={() => router.push('/admin/properties')}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              {id !== 'new' && (
                <a
                  href={`/properties/${id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 flex items-center gap-1"
                >
                  View Website
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                  </svg>
                </a>
              )}
              <button
                onClick={() => handleSave()}
                disabled={saving}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Property'}
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-t">
            <nav className="flex -mb-px">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    px-6 py-3 text-sm font-medium border-b-2 whitespace-nowrap
                    ${activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6">
        {activeTab === 'content' && (
          <div className="space-y-8">
            {/* Basic Property Info */}
            <section className="bg-white rounded-lg shadow">
              <div className="p-6">
                <h2 className="text-xl font-semibold mb-4">Basic Information</h2>
                <div className="space-y-4">
                  <div className="flex gap-4 items-center">
                    <div className="flex-1">
                      <label className="block text-sm font-medium mb-1">
                        Property Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={property.name}
                        onChange={(e) => {
                          handlePropertyChange('name', e.target.value)
                          setValidationErrors(prev => ({ ...prev, name: undefined }))
                        }}
                        className={`w-full p-2 border rounded ${
                          validationErrors.name 
                            ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                            : 'border-gray-300'
                        }`}
                        placeholder="Enter property name"
                      />
                      {validationErrors.name && (
                        <p className="mt-1 text-sm text-red-600 flex items-center">
                          <AlertCircle className="w-4 h-4 mr-1" />
                          {validationErrors.name}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center mt-6">
                      <input
                        type="checkbox"
                        id="is_demo"
                        checked={property.is_demo || false}
                        onChange={(e) => handlePropertyChange('is_demo', e.target.checked)}
                        className="h-4 w-4 text-blue-600 rounded border-gray-300"
                      />
                      <label htmlFor="is_demo" className="ml-2 text-sm font-medium text-gray-700">
                        Demo Property
                      </label>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Street Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={property.street_address}
                      onChange={(e) => {
                        handlePropertyChange('street_address', e.target.value)
                        setValidationErrors(prev => ({ ...prev, street_address: undefined }))
                      }}
                      className={`w-full p-2 border rounded ${
                        validationErrors.street_address 
                          ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                          : 'border-gray-300'
                      }`}
                      placeholder="Enter street address"
                    />
                    {validationErrors.street_address && (
                      <p className="mt-1 text-sm text-red-600 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {validationErrors.street_address}
                      </p>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="template" className="block text-sm font-medium mb-1">
                        Template <span className="text-red-500">*</span>
                      </label>
                      <select
                        id="template"
                        value={property.template_name}
                        onChange={(e) => handlePropertyChange('template_name', e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="dubai">Dubai</option>
                        <option value="cusco">Cusco</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Suburb <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={property.suburb}
                        onChange={(e) => {
                          handlePropertyChange('suburb', e.target.value)
                          setValidationErrors(prev => ({ ...prev, suburb: undefined }))
                        }}
                        className={`w-full p-2 border rounded ${
                          validationErrors.suburb 
                            ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                            : 'border-gray-300'
                        }`}
                        placeholder="Enter suburb"
                      />
                      {validationErrors.suburb && (
                        <p className="mt-1 text-sm text-red-600 flex items-center">
                          <AlertCircle className="w-4 h-4 mr-1" />
                          {validationErrors.suburb}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        State <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={property.state}
                        onChange={(e) => {
                          handlePropertyChange('state', e.target.value)
                          setValidationErrors(prev => ({ ...prev, state: undefined }))
                        }}
                        className={`w-full p-2 border rounded ${
                          validationErrors.state 
                            ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                            : 'border-gray-300'
                        }`}
                        placeholder="Enter state"
                      />
                      {validationErrors.state && (
                        <p className="mt-1 text-sm text-red-600 flex items-center">
                          <AlertCircle className="w-4 h-4 mr-1" />
                          {validationErrors.state}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Status</label>
                      <select
                        value={property.status}
                        onChange={(e) => handlePropertyChange('status', e.target.value)}
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                      >
                        <option value="draft">Draft</option>
                        <option value="published">Published</option>
                        <option value="archived">Archived</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Template</label>
                      <select
                        value={property.template_name}
                        onChange={(e) => handlePropertyChange('template_name', e.target.value)}
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                      >
                        <option value="cusco">Cusco</option>
                        <option value="dubai">Dubai</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Agency <span className="text-red-500">*</span>
                      </label>
                      <AgencySelect
                        value={property.agency_id || ''}
                        onChange={(value) => {
                          // When agency changes, clear the agent and office selection and update the timestamp
                          setProperty({ 
                            ...property, 
                            agency_id: value || null,
                            agent_id: null,
                            office_id: null,
                            updated_at: new Date().toISOString()
                          })
                        }}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Agent
                      </label>
                      <AgentSelect
                        value={property.agent_id || ''}
                        agencyId={property.agency_id}
                        onChange={(value) => setProperty({ 
                          ...property, 
                          agent_id: value || null,
                          updated_at: new Date().toISOString()
                        })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Sales Office
                      </label>
                      <OfficeSelect
                        value={property.office_id || ''}
                        agencyId={property.agency_id}
                        onChange={(value) => setProperty({ 
                          ...property, 
                          office_id: value || null,
                          updated_at: new Date().toISOString()
                        })}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Property Scraper Section */}
            <section className="bg-white rounded-lg shadow">
              <div className="p-6">
                <h2 className="text-xl font-semibold mb-4">Import from Website</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Import content from website
                      <span className="block text-sm text-gray-500 font-normal mt-1">
                        Enter a property listing URL to automatically extract content and media assets.
                      </span>
                    </label>
                    <button
                      onClick={() => setIsScraperOpen(true)}
                      className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                    >
                      Import from Website
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* JSON Import Section */}
            <section className="bg-white rounded-lg shadow">
              <div className="p-6">
                <h2 className="text-xl font-semibold mb-4">Import Content</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Import content from JSON file
                      <span className="block text-sm text-gray-500 font-normal mt-1">
                        Upload a JSON file to populate the content fields (Hero, Features, Lifestyle, Neighbourhood, SEO, Social Media settings and Additional Information)
                      </span>
                      <span className="block text-sm text-gray-500 font-normal mt-1">
                        Note: Features should be provided as an array of objects, each with a &quot;feature&quot; property. You can include up to 15 features.
                      </span>
                    </label>
                    <input
                      type="file"
                      accept="application/json"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (!file) return

                        const reader = new FileReader()
                        reader.onload = (event) => {
                          try {
                            const json = JSON.parse(event.target?.result as string)
                            
                            // Validate the JSON structure
                            const requiredSections = ['hero', 'features', 'lifestyle', 'neighbourhood']
                            const missingSection = requiredSections.find(section => !json[section])
                            if (missingSection) {
                              alert(`Invalid JSON format: Missing ${missingSection} section`)
                              return
                            }

                            // Update the content sections
                            const newContent = {
                              ...property.content,
                              hero: {
                                ...property.content.hero,
                                ...json.hero
                              },
                              features: {
                                ...property.content.features,
                                items: json.features.items?.map((item: { feature: string }, index: number) => ({
                                  rank: index + 1,
                                  feature: item.feature
                                })) || property.content.features.items,
                                header: json.features.headline,
                                headline: json.features.headline,
                                banner_title: property.content.features.banner_title,
                                description: json.features.description || ''
                              },
                              lifestyle: {
                                ...property.content.lifestyle,
                                ...json.lifestyle
                              },
                              neighbourhood: {
                                ...property.content.neighbourhood,
                                ...json.neighbourhood,
                                banner_title: 'YOUR NEIGHBOURHOOD'
                              },
                              seo: {
                                ...property.content.seo,
                                ...json.seo
                              },
                              og: {
                                ...property.content.og,
                                ...json.og
                              }
                            }

                            // Update metadata with additional info
                            const newMetadata = {
                              ...property.metadata,
                              more_info: {
                                ...property.metadata?.more_info,
                                additionalInfo: json.more_info?.additionalInfo || [],
                                ctaButtons: property.metadata?.more_info?.ctaButtons || {
                                  primary: { label: '', type: 'link', url: '' },
                                  secondary: { label: '', type: 'link', url: '' }
                                },
                                documents: property.metadata?.more_info?.documents || []
                              }
                            }

                            // Update the property state with new content and metadata
                            setProperty(property => ({
                              ...property,
                              content: newContent,
                              metadata: newMetadata
                            }))

                            alert('Content imported successfully!')
                          } catch (error) {
                            console.error('Error parsing JSON:', error)
                            alert('Error importing JSON file. Please check the file format.')
                          }
                        }
                        reader.readAsText(file)
                      }}
                      className="block w-full text-sm text-gray-500
                        file:mr-4 file:py-2 file:px-4
                        file:rounded-md file:border-0
                        file:text-sm file:font-semibold
                        file:bg-brand-dark file:text-white
                        hover:file:bg-brand-dark/90
                        file:cursor-pointer"
                    />
                    <div className="mt-4">
                      <button
                        type="button"
                        onClick={(e) => {
                          const target = e.currentTarget
                          const formatSection = target.nextElementSibling
                          
                          if (formatSection) {
                            formatSection.classList.toggle('hidden')
                            target.querySelector('svg')?.classList.toggle('rotate-180')
                          }
                        }}
                        className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900"
                      >
                        <span>View Expected JSON Format</span>
                        <svg 
                          xmlns="http://www.w3.org/2000/svg" 
                          width="16" 
                          height="16" 
                          viewBox="0 0 24 24" 
                          fill="none" 
                          stroke="currentColor" 
                          strokeWidth="2" 
                          strokeLinecap="round" 
                          strokeLinejoin="round"
                          className="transition-transform duration-200"
                        >
                          <path d="m6 9 6 6 6-6"/>
                        </svg>
                      </button>
                      <div className="hidden mt-2">
                        <pre className="bg-gray-50 p-4 rounded-md text-xs overflow-auto">
{`{
  "hero": {
    "headline": "string",
    "subheadline": "string"
  },
  "features": {
    "headline": "string",
    "description": "string",
    "items": [
      { "feature": "🛏️ 4 Luxurious Bedrooms" },
      { "feature": "🛁 3.5 Designer Bathrooms" },
      { "feature": "🚗 Double Garage" },
      { "feature": "🏊‍♂️ Resort-style Pool" }
      // ... up to 15 features total
    ]
  },
  "lifestyle": {
    "headline": "string",
    "description": "string"
  },
  "neighbourhood": {
    "text": "string",
    "part1_headline": "string",
    "part1_text": "string",
    "part2_headline": "string",
    "part2_text": "string",
    "part3_headline": "string",
    "part3_text": "string"
  },
  "seo": {
    "title": "string",
    "description": "string"
  },
  "og": {
    "title": "string",
    "description": "string"
  },
  "more_info": {
    "additionalInfo": [
      {
        "info": "Info Label 1",
        "detail": "Detail 1"
      },
      {
        "info": "Info Label 2",
        "detail": "Detail 2"
      },
      {
        "info": "Info Label 3",
        "detail": "Detail 3"
      }
    ]
  }
}`}
                        </pre>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Hero Section */}
            <section className="bg-white rounded-lg shadow">
              <div className="p-6">
                <h2 className="text-xl font-semibold mb-4">Hero Section</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Headline</label>
                    <input
                      type="text"
                      value={property.content.hero.headline}
                      onChange={(e) => handleContentChange('hero', 'headline', e.target.value)}
                      className="w-full p-2 border rounded"
                      placeholder="e.g., Ultimate Luxury Entertainer"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Subheadline</label>
                    <input
                      type="text"
                      value={property.content.hero.subheadline}
                      onChange={(e) => handleContentChange('hero', 'subheadline', e.target.value)}
                      className="w-full p-2 border rounded"
                      placeholder="e.g., Opulence in North Adelaide's Heart"
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Features Section */}
            <section className="bg-white rounded-lg shadow">
              <div className="p-6">
                <h2 className="text-xl font-semibold mb-4">Features Section</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Banner Title</label>
                    <input
                      type="text"
                      value={property.content.features.banner_title || ''}
                      onChange={(e) => handleContentChange('features', 'banner_title', e.target.value)}
                      className="w-full p-2 border rounded"
                      placeholder="e.g., YOUR HOME"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Headline</label>
                    <input
                      type="text"
                      value={property.content.features.headline}
                      onChange={(e) => handleContentChange('features', 'headline', e.target.value)}
                      className="w-full p-2 border rounded"
                      placeholder="e.g., Every Luxury, Every Detail Perfected"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Description</label>
                    <textarea
                      value={property.content.features.description || ''}
                      onChange={(e) => handleContentChange('features', 'description', e.target.value)}
                      className="w-full p-2 border rounded h-24"
                      placeholder="Describe the key features and highlights of the property..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Feature List</label>
                    
                    {/* Bulk Edit Textarea */}
                    <div className="mb-4">
                      <label className="block text-sm text-gray-500 mb-2">
                        Bulk Edit (One feature per line)
                      </label>
                      <textarea
                        value={Array.from({ length: 15 }, (_, i) => {
                          const feature = property.content.features.items[i] || { rank: i + 1, feature: '' }
                          return `${String(feature.rank).padStart(2, '0')} ${feature.feature}`
                        }).join('\n')}
                        onChange={(e) => {
                          const lines = e.target.value.split('\n')
                          const newFeatures = Array.from({ length: 15 }, (_, i) => {
                            const line = lines[i] || ''
                            const feature = line.replace(/^\d+\s*/, '').trim()
                            return {
                              rank: i + 1,
                              feature
                            }
                          })
                          handleContentChange('features', 'items', newFeatures)
                        }}
                        onKeyDown={(e) => {
                          if (e.key === ' ') {
                            e.stopPropagation()
                          }
                        }}
                        className="w-full p-2 border rounded h-64 font-mono text-sm"
                        placeholder="01 🛏️ 4 Luxurious Bedrooms&#10;02 🛁 4.5 Designer Bathrooms&#10;03 🚗 3-Car Secure Garage"
                      />
                    </div>

                    {/* Individual Edit Fields */}
                    <div className="space-y-2">
                      <label className="block text-sm text-gray-500 mb-2">
                        Individual Edit
                      </label>
                      {Array.from({ length: 15 }, (_, i) => {
                        const feature = property.content.features.items[i] || { rank: i + 1, feature: '' }
                        return (
                          <div key={i} className="flex gap-2">
                            <span className="w-8 text-sm text-gray-500 pt-2">
                              {String(i + 1).padStart(2, '0')}
                            </span>
                            <input
                              type="text"
                              value={feature.feature}
                              onChange={(e) => handleFeatureChange(i, e.target.value)}
                              className="flex-1 p-2 border rounded"
                              placeholder={`e.g., 🛏️ 4 Luxurious Bedrooms`}
                            />
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Lifestyle Section */}
            <section className="bg-white rounded-lg shadow">
              <div className="p-6">
                <h2 className="text-xl font-semibold mb-4">Lifestyle Section</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Banner Title</label>
                    <input
                      type="text"
                      value={property.content.lifestyle.banner_title || ''}
                      onChange={(e) => handleContentChange('lifestyle', 'banner_title', e.target.value)}
                      className="w-full p-2 border rounded"
                      placeholder="e.g., YOUR LIFESTYLE"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Headline</label>
                    <input
                      type="text"
                      value={property.content.lifestyle.headline}
                      onChange={(e) => {
                        handleContentChange('lifestyle', 'headline', e.target.value)
                        // Keep header in sync with headline for backward compatibility
                        handleContentChange('lifestyle', 'header', e.target.value)
                      }}
                      className="w-full p-2 border rounded"
                      placeholder="e.g., Luxury Living at its Finest"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Description</label>
                    <textarea
                      value={property.content.lifestyle.description}
                      onChange={(e) => handleContentChange('lifestyle', 'description', e.target.value)}
                      className="w-full p-2 border rounded h-24"
                      placeholder="Describe the luxury lifestyle and amenities..."
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Neighbourhood Section */}
            <section className="bg-white rounded-lg shadow">
              <div className="p-6">
                <h2 className="text-xl font-semibold mb-4">Neighbourhood Section</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Banner Title</label>
                    <input
                      type="text"
                      value={property.content.neighbourhood.banner_title || ''}
                      onChange={(e) => handleContentChange('neighbourhood', 'banner_title', e.target.value)}
                      className="w-full p-2 border rounded"
                      placeholder="e.g., YOUR NEIGHBOURHOOD"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Main Text</label>
                    <textarea
                      value={property.content.neighbourhood.text}
                      onChange={(e) => handleContentChange('neighbourhood', 'text', e.target.value)}
                      className="w-full p-2 border rounded h-32"
                      placeholder="Describe the neighbourhood location and surroundings..."
                    />
                  </div>

                  {/* Part 1 */}
                  <div>
                    <label className="block text-sm font-medium mb-1">Part 1 Headline</label>
                    <input
                      type="text"
                      value={property.content.neighbourhood.part1_headline}
                      onChange={(e) => handleContentChange('neighbourhood', 'part1_headline', e.target.value)}
                      className="w-full p-2 border rounded"
                      placeholder="e.g., Premier Shopping & Entertainment"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Part 1 Text</label>
                    <textarea
                      value={property.content.neighbourhood.part1_text}
                      onChange={(e) => handleContentChange('neighbourhood', 'part1_text', e.target.value)}
                      className="w-full p-2 border rounded h-24"
                      placeholder="Describe nearby shopping centers, restaurants, and entertainment venues..."
                    />
                  </div>

                  {/* Part 2 */}
                  <div>
                    <label className="block text-sm font-medium mb-1">Part 2 Headline</label>
                    <input
                      type="text"
                      value={property.content.neighbourhood.part2_headline}
                      onChange={(e) => handleContentChange('neighbourhood', 'part2_headline', e.target.value)}
                      className="w-full p-2 border rounded"
                      placeholder="e.g., Educational Excellence"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Part 2 Text</label>
                    <textarea
                      value={property.content.neighbourhood.part2_text}
                      onChange={(e) => handleContentChange('neighbourhood', 'part2_text', e.target.value)}
                      className="w-full p-2 border rounded h-24"
                      placeholder="Describe nearby schools, universities, and educational facilities..."
                    />
                  </div>

                  {/* Part 3 */}
                  <div>
                    <label className="block text-sm font-medium mb-1">Part 3 Headline</label>
                    <input
                      type="text"
                      value={property.content.neighbourhood.part3_headline}
                      onChange={(e) => handleContentChange('neighbourhood', 'part3_headline', e.target.value)}
                      className="w-full p-2 border rounded"
                      placeholder="e.g., Parks & Recreation"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Part 3 Text</label>
                    <textarea
                      value={property.content.neighbourhood.part3_text}
                      onChange={(e) => handleContentChange('neighbourhood', 'part3_text', e.target.value)}
                      className="w-full p-2 border rounded h-24"
                      placeholder="Describe nearby parks, recreational facilities, and outdoor spaces..."
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Additional Info Section */}
            <section className="bg-white rounded-lg shadow">
              <div className="p-6">
                <h2 className="text-xl font-semibold mb-4">Additional Information</h2>
                <div className="space-y-4">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <div key={index} className="bg-gray-50 p-4 rounded-lg">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-1">Info Label</label>
                          <input
                            type="text"
                            value={property.metadata?.more_info?.additionalInfo?.[index]?.info || ''}
                            onChange={(e) => {
                              const newMetadata = {
                                ...property.metadata,
                                more_info: {
                                  ...property.metadata?.more_info,
                                  additionalInfo: [
                                    ...(property.metadata?.more_info?.additionalInfo || []),
                                  ]
                                }
                              }
                              newMetadata.more_info.additionalInfo[index] = {
                                ...newMetadata.more_info.additionalInfo[index],
                                info: e.target.value,
                                detail: property.metadata?.more_info?.additionalInfo?.[index]?.detail || ''
                              }
                              setProperty(prev => ({
                                ...prev,
                                metadata: newMetadata
                              }))
                            }}
                            className="w-full p-2 border rounded"
                            placeholder="e.g., Council Rates"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Detail</label>
                          <input
                            type="text"
                            value={property.metadata?.more_info?.additionalInfo?.[index]?.detail || ''}
                            onChange={(e) => {
                              const newMetadata = {
                                ...property.metadata,
                                more_info: {
                                  ...property.metadata?.more_info,
                                  additionalInfo: [
                                    ...(property.metadata?.more_info?.additionalInfo || []),
                                  ]
                                }
                              }
                              newMetadata.more_info.additionalInfo[index] = {
                                ...newMetadata.more_info.additionalInfo[index],
                                info: property.metadata?.more_info?.additionalInfo?.[index]?.info || '',
                                detail: e.target.value
                              }
                              setProperty(prev => ({
                                ...prev,
                                metadata: newMetadata
                              }))
                            }}
                            className="w-full p-2 border rounded"
                            placeholder="e.g., $1000pa"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* SEO Section */}
            <section className="bg-white rounded-lg shadow">
              <div className="p-6">
                <h2 className="text-xl font-semibold mb-4">SEO Settings</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">SEO Title</label>
                    <input
                      type="text"
                      value={property.content.seo.title}
                      onChange={(e) => handleContentChange('seo', 'title', e.target.value)}
                      className="w-full p-2 border rounded"
                      placeholder="e.g., Ultimate Luxury Family Entertainer in North Adelaide"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">SEO Description</label>
                    <textarea
                      value={property.content.seo.description}
                      onChange={(e) => handleContentChange('seo', 'description', e.target.value)}
                      className="w-full p-2 border rounded h-24"
                      placeholder="Enter meta description for search results..."
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Social Media Section */}
            <section className="bg-white rounded-lg shadow">
              <div className="p-6">
                <h2 className="text-xl font-semibold mb-4">Social Media Settings</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">OG Title</label>
                    <input
                      type="text"
                      value={property.content.og.title}
                      onChange={(e) => handleContentChange('og', 'title', e.target.value)}
                      className="w-full p-2 border rounded"
                      placeholder="e.g., Opulent Living in North Adelaide"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">OG Description</label>
                    <textarea
                      value={property.content.og.description}
                      onChange={(e) => handleContentChange('og', 'description', e.target.value)}
                      className="w-full p-2 border rounded h-24"
                      placeholder="Enter description for social media sharing..."
                    />
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}

        {activeTab === 'visual_assets' && (
          <div className="bg-white rounded-lg shadow p-6">
            <PropertyAssets 
              propertyId={id} 
              isDemoProperty={property.is_demo}
              onSave={() => {
                // Show success message in the parent's error/success handling system
                setError(null)
                setSaving(false)
              }} 
            />
          </div>
        )}

        {activeTab === 'viewings' && (
          <div className="bg-white rounded-lg shadow p-6">
            <ViewingsManager propertyId={id} />
          </div>
        )}

        {activeTab === 'locations' && (
          <div className="bg-white rounded-lg shadow p-6">
            <PropertyLocations 
              propertyId={id} 
              onSave={() => {
                // Show success message in the parent's error/success handling system
                setError(null)
                setSaving(false)
              }} 
            />
          </div>
        )}

        {activeTab === 'more_info' && (
          <div className="bg-white rounded-lg shadow p-6">
            <PropertyMoreInfo
              ref={moreInfoRef}
              propertyId={id}
              onSave={handleMoreInfoSave}
            />
          </div>
        )}

        {activeTab === 'deployment' && (
          <PropertyDeployment 
            property={property}
            onSave={handleSave}
          />
        )}
      </div>

      {/* Template Version Information */}
      <div className="bg-white p-6 rounded-lg shadow mt-6">
        <h2 className="text-xl font-semibold mb-4">Template Version</h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-600">
              Current Version: <span className="font-semibold">{property.template_version}</span>
            </p>
            {upgradeAvailable && (
              <p className="text-sm text-blue-600 mt-1">
                New version available: {templateManager.getCurrentVersion()}
              </p>
            )}
          </div>
          {upgradeAvailable && (
            <button
              onClick={handleUpgradeTemplate}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Upgrade Template
            </button>
          )}
        </div>
      </div>

      {/* Add the PropertyScraperModal component at the end of the return statement */}
      <PropertyScraperModal
        isOpen={isScraperOpen}
        onClose={() => setIsScraperOpen(false)}
        onSelect={async ({ content, assets }) => {
          console.group('🚨 Property Update Process')
          console.log('Starting update with:', {
            assetsCount: assets?.length || 0,
            hasContent: !!content
          })

          // Handle content save first if present
          if (content && !assets?.length) {
            await handleContentUpdate(content)
          }
          
          // Handle media save if present
          if (assets?.length && !content) {
            await handleMediaUpdate(assets)
          }

          console.groupEnd()
        }}
      />
    </div>
  )
}

// Server Component
export default function PropertyEditPage() {
  const params = useParams<{ id: string }>();
  
  if (!params?.id) {
    return <div>No property ID provided</div>;
  }
  
  return <PropertyEditContent id={params.id} />;
}