'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Agency, FooterLink, MenuItems } from '@/types/agency'
import { BrandScraperModal } from '@/components/admin/brand-scraper/BrandScraperModal'
import { FileUpload } from '@/components/shared/file-upload'
import { toast } from 'sonner'
import type { BrandAsset } from '@/types/brand'
import { v4 as uuidv4 } from 'uuid'

// Initial state
const defaultBranding = {
  colors: {
    dark: '#000000',
    light: '#ffffff',
    accent: '#cccccc'
  },
  logo: {
    dark: '',
    light: ''
  },
  favicon: '',
  typography: {
    headingFont: {
      url: '',
      format: ''
    },
    bodyFont: {
      url: '',
      format: ''
    }
  }
} as const;

const defaultAgency: Agency = {
  id: '',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  name: '',
  email: '',
  phone: '',
  website: '',
  status: 'active',
  copyright: '',
  branding: defaultBranding,
  menu_items: {
    contact: 'Contact',
    features: 'Features',
    viewings: 'Viewings',
    lifestyle: 'Lifestyle',
    neighbourhood: 'Neighbourhood'
  },
  footer_links: [],
  office_addresses: []
};

// Add this constant at the top of the file after imports
const PREDEFINED_FOOTER_LINKS = [
  { id: 'home', label: 'Home Page', defaultTitle: 'Visit Us' },
  { id: 'phone', label: 'Phone', defaultTitle: 'Call Us' },
  { id: 'email', label: 'Email', defaultTitle: 'Email Us' },
  { id: 'facebook', label: 'Facebook', defaultTitle: 'Facebook' },
  { id: 'instagram', label: 'Instagram', defaultTitle: 'Instagram' },
  { id: 'link1', label: 'Link 1', defaultTitle: 'Sell Your Home' },
  { id: 'link2', label: 'Link 2', defaultTitle: 'Rent Your Home' },
  { id: 'link3', label: 'Link 3', defaultTitle: 'Buy a Home' }
] as const;

// Add this constant near the top with other constants
const DEFAULT_MENU_ITEMS = {
  contact: 'Contact',
  features: 'Features',
  viewings: 'Viewings',
  lifestyle: 'Lifestyle',
  neighbourhood: 'Neighbourhood'
} as const;

export default function AgencyEditPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const supabase = createClientComponentClient()
  
  // State
  const [agency, setAgency] = useState<Agency | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isBrandScraperOpen, setIsBrandScraperOpen] = useState(false)

  // Load agency data
  useEffect(() => {
    if (!params?.id) {
      setError(new Error('No agency ID provided'));
      setLoading(false);
      return;
    }

    async function loadAgency() {
      try {
        const id = params?.id;
        if (!id) {
          setError(new Error('No agency ID provided'));
          setLoading(false);
          return;
        }
        
        if (id === 'new') {
          setAgency({
            ...defaultAgency,
            menu_items: {
              contact: 'Contact',
              features: 'Features',
              viewings: 'Viewings',
              lifestyle: 'Lifestyle',
              neighbourhood: 'Neighbourhood'
            }
          });
          setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from('agencies')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;

        // Add cache busting to logo URLs
        const timestamp = Date.now();
        const branding = {
          colors: {
            ...defaultBranding.colors,
            ...(data.branding?.colors || {})
          },
          logo: {
            dark: data.branding?.logo?.dark ? `${data.branding.logo.dark}?t=${timestamp}` : '',
            light: data.branding?.logo?.light ? `${data.branding.logo.light}?t=${timestamp}` : ''
          },
          favicon: data.branding?.favicon || '',
          typography: {
            ...defaultBranding.typography,
            ...(data.branding?.typography || {})
          }
        };

        // Ensure branding structure exists and arrays are initialized
        const agencyWithDefaults = {
          ...data,
          menu_items: {
            contact: data.menu_items?.contact || DEFAULT_MENU_ITEMS.contact,
            features: data.menu_items?.features || DEFAULT_MENU_ITEMS.features,
            viewings: data.menu_items?.viewings || DEFAULT_MENU_ITEMS.viewings,
            lifestyle: data.menu_items?.lifestyle || DEFAULT_MENU_ITEMS.lifestyle,
            neighbourhood: data.menu_items?.neighbourhood || DEFAULT_MENU_ITEMS.neighbourhood
          },
          footer_links: Array.isArray(data.footer_links) ? data.footer_links : [],
          branding
        };

        setAgency(agencyWithDefaults);
      } catch (err) {
        console.error('Error loading agency:', err);
        setError(err instanceof Error ? err : new Error('Failed to load agency'));
      } finally {
        setLoading(false);
      }
    }

    loadAgency();
  }, [params?.id, supabase]);

  const handleStoreLogo = async (file: File, variant: 'dark' | 'light') => {
    if (!agency) return;

    try {
      console.log('Starting logo upload:', {
        fileSize: file.size,
        fileType: file.type,
        variant,
        agencyId: agency.id
      });

      const formData = new FormData();
      formData.append('file', file);
      formData.append('bucket', 'agency-assets');
      formData.append('path', `${agency.id}/logos/${variant}-logo`);

      console.log('Sending upload request to /api/upload');
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const responseText = await response.text();
      console.log('Upload response:', {
        status: response.status,
        statusText: response.statusText,
        responseText
      });

      if (!response.ok) {
        throw new Error(`Failed to upload logo: ${response.statusText}. Response: ${responseText}`);
      }

      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch (error) {
        console.error('Failed to parse response JSON:', error);
        throw new Error(`Invalid JSON response: ${responseText}`);
      }

      if (!responseData.url) {
        throw new Error('No URL returned from upload');
      }

      console.log('Upload successful, updating agency state with URL:', responseData.url);
      
      // Get the public URL from Supabase
      const { data: urlData } = supabase.storage
        .from('agency-assets')
        .getPublicUrl(`${agency.id}/logos/${variant}-logo`);

      // Add timestamp for cache busting
      const timestamp = Date.now();
      const urlWithTimestamp = `${urlData.publicUrl}?t=${timestamp}`;

      // Update the agency state with the new logo URL
      setAgency(prev => {
        if (!prev) return null;
        const branding = prev.branding ?? defaultBranding;
        return {
          ...prev,
          branding: {
            ...branding,
            logo: {
              ...branding.logo,
              [variant]: urlWithTimestamp
            }
          }
        };
      });
    } catch (error) {
      console.error('Error uploading logo:', {
        error,
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  };

  const handleDarkLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleStoreLogo(file, 'dark')
  }

  const handleLightLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleStoreLogo(file, 'light')
  }

  const handleStoreFontFile = async (file: File, category: 'heading' | 'body') => {
    if (!agency?.id) return;

    try {
      const fileName = `${category}-font${getExtensionFromUrl(file.name)}`;
      
      // Upload to Supabase storage
      const { error: uploadError } = await supabase.storage
        .from('agency-assets')
        .upload(`${agency.id}/fonts/${fileName}`, file);

      if (uploadError) {
        throw uploadError;
      }

      // Get the public URL
      const { data: urlData } = supabase.storage
        .from('agency-assets')
        .getPublicUrl(`${agency.id}/fonts/${fileName}`);

      // Update agency typography in state
      setAgency(prev => {
        if (!prev) return null;
        return {
          ...prev,
          branding: {
            ...prev.branding,
            typography: {
              ...prev.branding?.typography,
              [`${category}Font`]: {
                url: urlData.publicUrl,
                format: getFontFormat(file.name)
              }
            }
          }
        };
      });

      toast.success(`${category === 'heading' ? 'Heading' : 'Body'} font uploaded successfully`);
    } catch (error) {
      console.error('Error storing font:', error);
      toast.error('Failed to store font');
      throw error;
    }
  };

  // Helper function to convert URL to File
  const convertUrlToFile = async (url: string, fileName: string): Promise<File> => {
    try {
      // Fetch the font file through our proxy
      const response = await fetch('/api/proxy-font', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch font');
      }

      const blob = await response.blob();
      return new File([blob], fileName, { type: blob.type });
    } catch (error) {
      console.error('Error converting URL to File:', error);
      throw error;
    }
  };

  // Bridge function to handle font URLs from BrandScraperModal
  const handleStoreFontUrl = async (url: string, category: 'heading' | 'body') => {
    try {
      const fileName = `${category}-font${getExtensionFromUrl(url)}`;
      const file = await convertUrlToFile(url, fileName);
      await handleStoreFontFile(file, category);
    } catch (error) {
      console.error('Error handling font URL:', error);
      throw error;
    }
  };

  // Helper functions for font handling
  function getExtensionFromUrl(url: string): string {
    if (url.endsWith('.woff2')) return '.woff2'
    if (url.endsWith('.woff')) return '.woff'
    if (url.endsWith('.ttf')) return '.ttf'
    if (url.endsWith('.otf')) return '.otf'
    if (url.endsWith('.eot')) return '.eot'
    return '.woff2' // Default to woff2
  }

  function getFontFormat(url: string): string {
    if (url.endsWith('.woff2')) return 'woff2'
    if (url.endsWith('.woff')) return 'woff'
    if (url.endsWith('.ttf')) return 'ttf'
    if (url.endsWith('.otf')) return 'otf'
    if (url.endsWith('.eot')) return 'eot'
    return 'woff2' // Default to woff2
  }

  const createPlaceholderAgent = async (agencyId: string) => {
    const placeholderAgent = {
      id: uuidv4(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      agency_id: agencyId,
      name: 'Your Name',
      position: 'Sales Agent',
      phone: '0400 123 456',
      email: 'email@menow.com',
      status: 'active',
      metadata: {}
    }

    const { error } = await supabase
      .from('agents')
      .insert([placeholderAgent])

    if (error) {
      console.error('Error creating placeholder agent:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!params?.id) {
      setError(new Error('No agency ID provided'));
      return;
    }
    
    if (!agency) {
      setError(new Error('No agency data available'));
      return;
    }
    
    const isNew = params.id === 'new';
    
    try {
      setSaving(true);
      setError(null);
      
      const updatedAgency = {
        ...agency,
        id: isNew ? uuidv4() : agency.id,
        updated_at: new Date().toISOString(),
        created_at: isNew ? new Date().toISOString() : agency.created_at
      };

      const { data, error } = isNew
        ? await supabase.from('agency_settings').insert([updatedAgency]).select()
        : await supabase
            .from('agency_settings')
            .update(updatedAgency)
            .eq('id', updatedAgency.id)
            .select()

      if (error) throw error

      // Create placeholder agent for new agencies
      if (isNew && data?.[0]) {
        await createPlaceholderAgent(data[0].id)
      }

      toast.success('Agency saved successfully')
      router.push('/admin/agencies')
    } catch (err) {
      console.error('Error saving agency:', err)
      setError(err instanceof Error ? err : new Error('Failed to save agency'))
      toast.error('Failed to save agency')
    } finally {
      setSaving(false)
    }
  }

  const handleBrandAssetsSelect = async (assets: {
    logos?: BrandAsset[],
    colors?: BrandAsset[],
    fonts?: BrandAsset[],
    agencyDetails?: {
      name?: string
      email?: string
      phone?: string
      website?: string
      copyrightText?: string
    }
  }) => {
    try {
      // Handle logos and fonts as before...

      // Handle agency details if provided
      if (assets.agencyDetails && agency) {
        const { name, email, phone, website, copyrightText } = assets.agencyDetails
        
        // Update the form state with the new values
        setAgency({
          ...agency,
          name: name || agency.name,
          email: email || agency.email,
          phone: phone || agency.phone,
          website: website || agency.website,
          copyright: copyrightText || agency.copyright
        })

        toast.success('Agency details updated')
      }
    } catch (error) {
      console.error('Error handling brand assets:', error)
      toast.error('Failed to update agency details')
    }
  }

  // Handle branding changes
  const handleBrandingChange = (field: 'dark' | 'light' | 'accent', value: string) => {
    setAgency(prev => {
      if (!prev) return prev;
      const branding = prev.branding ?? defaultBranding;
      return {
        ...prev,
        branding: {
          ...branding,
          colors: {
            ...branding.colors,
            [field]: value
          }
        }
      };
    });
  };

  // Handle menu items
  const handleMenuItemsChange = (items: MenuItems) => {
    setAgency(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        menu_items: items
      };
    });
  };

  // Handle footer links
  const handleFooterLinksChange = (links: FooterLink[]) => {
    setAgency(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        footer_links: links
      };
    });
  };

  const handleStoreFavicon = async (file: File) => {
    if (!agency) return;

    try {
      console.log('Starting favicon upload:', {
        fileSize: file.size,
        fileType: file.type,
        agencyId: agency.id
      });

      const formData = new FormData();
      formData.append('file', file);
      formData.append('bucket', 'agency-assets');
      formData.append('path', `${agency.id}/favicon`);

      console.log('Sending upload request to /api/upload');
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const responseText = await response.text();
      console.log('Upload response:', {
        status: response.status,
        statusText: response.statusText,
        responseText
      });

      if (!response.ok) {
        throw new Error(`Failed to upload favicon: ${response.statusText}. Response: ${responseText}`);
      }

      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch (error) {
        console.error('Failed to parse response JSON:', error);
        throw new Error(`Invalid JSON response: ${responseText}`);
      }

      if (!responseData.url) {
        throw new Error('No URL returned from upload');
      }

      console.log('Upload successful, updating agency state with URL:', responseData.url);
      
      // Get the public URL from Supabase
      const { data: urlData } = supabase.storage
        .from('agency-assets')
        .getPublicUrl(`${agency.id}/favicon`);

      // Add timestamp for cache busting
      const timestamp = Date.now();
      const urlWithTimestamp = `${urlData.publicUrl}?t=${timestamp}`;

      // Update the agency state with the new favicon URL
      setAgency(prev => {
        if (!prev) return null;
        const branding = prev.branding ?? defaultBranding;
        return {
          ...prev,
          branding: {
            ...branding,
            favicon: urlWithTimestamp
          }
        };
      });

      toast.success('Favicon uploaded successfully');
    } catch (error) {
      console.error('Error uploading favicon:', {
        error,
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      toast.error('Failed to upload favicon');
      throw error;
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-12 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-red-800 font-medium">Error</h3>
          <p className="text-red-600 mt-1">{error.message}</p>
        </div>
      </div>
    );
  }

  if (!agency) {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="text-yellow-800 font-medium">No Agency Found</h3>
          <p className="text-yellow-600 mt-1">Could not load agency data.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">
          {params?.id === 'new' ? 'New Agency' : 'Edit Agency'}
        </h1>
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => setIsBrandScraperOpen(true)}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
          >
            Import Brand
          </button>
          <button
            onClick={() => router.push('/admin/agencies')}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Agency'}
          </button>
        </div>
      </div>

      {agency && (
        <div className="space-y-6">
          {/* Basic Information */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-medium mb-4">Basic Information</h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input
                  type="text"
                  value={agency.name}
                  onChange={(e) => setAgency({ ...agency, name: e.target.value })}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  value={agency.email}
                  onChange={(e) => setAgency({ ...agency, email: e.target.value })}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Phone</label>
                <input
                  type="tel"
                  value={agency.phone}
                  onChange={(e) => setAgency({ ...agency, phone: e.target.value })}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Website</label>
                <input
                  type="url"
                  value={agency.website}
                  onChange={(e) => setAgency({ ...agency, website: e.target.value })}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <select
                  value={agency.status}
                  onChange={(e) => setAgency({ ...agency, status: e.target.value as 'active' | 'inactive' })}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
          </div>

          {/* Branding */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-medium mb-4">Branding</h2>
            <div className="space-y-6">
              {/* Logos */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Dark Logo</label>
                  <FileUpload
                    label="Dark Logo"
                    accept="image/*"
                    value={agency.branding?.logo?.dark ?? ''}
                    onChange={handleDarkLogoUpload}
                    disabled={params?.id === 'new'}
                    helperText={params?.id === 'new' ? 'Save agency first to upload logos' : 'Upload a dark version of your logo (for light backgrounds)'}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Light Logo</label>
                  <FileUpload
                    label="Light Logo"
                    accept="image/*"
                    value={agency.branding?.logo?.light ?? ''}
                    onChange={handleLightLogoUpload}
                    disabled={params?.id === 'new'}
                    helperText={params?.id === 'new' ? 'Save agency first to upload logos' : 'Upload a light version of your logo (for dark backgrounds)'}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Favicon</label>
                  <FileUpload
                    label="Favicon"
                    accept=".ico,.png"
                    value={agency.branding?.favicon ?? ''}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleStoreFavicon(file);
                    }}
                    disabled={params?.id === 'new'}
                    helperText={params?.id === 'new' ? 'Save agency first to upload favicon' : 'Upload your favicon (.ico or .png format)'}
                  />
                </div>
              </div>

              {/* Colors */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Brand Colors</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm text-gray-500">Dark Color</label>
                    <input
                      type="color"
                      value={agency?.branding?.colors?.dark || '#000000'}
                      onChange={(e) => handleBrandingChange('dark', e.target.value)}
                      className="mt-1 block w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-500">Light Color</label>
                    <input
                      type="color"
                      value={agency?.branding?.colors?.light || '#ffffff'}
                      onChange={(e) => handleBrandingChange('light', e.target.value)}
                      className="mt-1 block w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-500">Accent Color</label>
                    <input
                      type="color"
                      value={agency?.branding?.colors?.accent || '#cccccc'}
                      onChange={(e) => handleBrandingChange('accent', e.target.value)}
                      className="mt-1 block w-full"
                    />
                  </div>
                </div>
              </div>

              {/* Typography */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Typography</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Heading Font</label>
                    <FileUpload
                      label="Upload Heading Font"
                      accept=".woff2,.woff,.ttf,.otf"
                      value={agency.branding?.typography?.headingFont?.url ?? ''}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleStoreFontFile(file, 'heading');
                      }}
                      disabled={params?.id === 'new'}
                      helperText={params?.id === 'new' ? "Save agency first to upload fonts" : undefined}
                      isFont
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Body Font</label>
                    <FileUpload
                      label="Upload Body Font"
                      accept=".woff2,.woff,.ttf,.otf"
                      value={agency.branding?.typography?.bodyFont?.url ?? ''}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleStoreFontFile(file, 'body');
                      }}
                      disabled={params?.id === 'new'}
                      helperText={params?.id === 'new' ? "Save agency first to upload fonts" : undefined}
                      isFont
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-medium mb-4">Menu Items</h2>
            <p className="text-sm text-gray-500 mb-4">Customize the labels for your property showcase menu items.</p>
            <div className="space-y-4">
              {Object.entries(DEFAULT_MENU_ITEMS).map(([key, defaultValue]) => (
                <div key={key} className="grid grid-cols-2 gap-4 items-center">
                  <label className="block text-sm font-medium text-gray-700 capitalize">
                    {key} Section
                  </label>
                  <input
                    type="text"
                    value={agency.menu_items?.[key as keyof typeof DEFAULT_MENU_ITEMS] ?? defaultValue}
                    onChange={(e) => {
                      const newMenuItems = {
                        ...DEFAULT_MENU_ITEMS,
                        ...(agency.menu_items ?? {}),
                        [key]: e.target.value || defaultValue
                      };
                      handleMenuItemsChange(newMenuItems);
                    }}
                    className="block w-full rounded-md border border-gray-300 px-3 py-2"
                    placeholder={defaultValue}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Office Addresses */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium">Office Addresses</h2>
              <button
                type="button"
                onClick={() => {
                  setAgency(prev => {
                    if (!prev) return prev;
                    const newOffices = [...(prev.office_addresses || []), {
                      id: crypto.randomUUID(),
                      name: '',
                      street_address: '',
                      suburb: '',
                      state_postcode: '',
                      phone: ''
                    }];
                    return {
                      ...prev,
                      office_addresses: newOffices
                    };
                  });
                }}
                className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
              >
                Add Office
              </button>
            </div>
            
            <div className="space-y-6">
              {agency.office_addresses?.map((office, index) => (
                <div key={office.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-sm font-medium text-gray-900">Office {index + 1}</h3>
                    <button
                      type="button"
                      onClick={() => {
                        setAgency(prev => {
                          if (!prev) return prev;
                          return {
                            ...prev,
                            office_addresses: prev.office_addresses?.filter(o => o.id !== office.id) || []
                          };
                        });
                      }}
                      className="text-red-600 hover:text-red-800"
                    >
                      Remove
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Office Name</label>
                      <input
                        type="text"
                        value={office.name}
                        onChange={(e) => {
                          setAgency(prev => {
                            if (!prev) return prev;
                            const newOffices = prev.office_addresses?.map(o => 
                              o.id === office.id ? { ...o, name: e.target.value } : o
                            ) || [];
                            return {
                              ...prev,
                              office_addresses: newOffices
                            };
                          });
                        }}
                        placeholder="e.g., Head Office"
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Street Address</label>
                      <input
                        type="text"
                        value={office.street_address}
                        onChange={(e) => {
                          setAgency(prev => {
                            if (!prev) return prev;
                            const newOffices = prev.office_addresses?.map(o => 
                              o.id === office.id ? { ...o, street_address: e.target.value } : o
                            ) || [];
                            return {
                              ...prev,
                              office_addresses: newOffices
                            };
                          });
                        }}
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Suburb</label>
                      <input
                        type="text"
                        value={office.suburb}
                        onChange={(e) => {
                          setAgency(prev => {
                            if (!prev) return prev;
                            const newOffices = prev.office_addresses?.map(o => 
                              o.id === office.id ? { ...o, suburb: e.target.value } : o
                            ) || [];
                            return {
                              ...prev,
                              office_addresses: newOffices
                            };
                          });
                        }}
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">State & Post Code</label>
                      <input
                        type="text"
                        value={office.state_postcode}
                        onChange={(e) => {
                          setAgency(prev => {
                            if (!prev) return prev;
                            const newOffices = prev.office_addresses?.map(o => 
                              o.id === office.id ? { ...o, state_postcode: e.target.value } : o
                            ) || [];
                            return {
                              ...prev,
                              office_addresses: newOffices
                            };
                          });
                        }}
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                        placeholder="e.g., VIC 3000"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Phone</label>
                      <input
                        type="tel"
                        value={office.phone}
                        onChange={(e) => {
                          setAgency(prev => {
                            if (!prev) return prev;
                            const newOffices = prev.office_addresses?.map(o => 
                              o.id === office.id ? { ...o, phone: e.target.value } : o
                            ) || [];
                            return {
                              ...prev,
                              office_addresses: newOffices
                            };
                          });
                        }}
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                      />
                    </div>
                  </div>
                </div>
              ))}
              
              {(!agency.office_addresses || agency.office_addresses.length === 0) && (
                <p className="text-gray-500 text-sm text-center py-4">
                  No office addresses added yet. Click &quot;Add Office&quot; to add your first office location.
                </p>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-medium mb-4">Footer</h2>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">Copyright Text</label>
                <input
                  type="text"
                  value={agency.copyright}
                  onChange={(e) => setAgency({ ...agency, copyright: e.target.value })}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-4">Footer Links</label>
                <div className="space-y-4">
                  {PREDEFINED_FOOTER_LINKS.map((predefinedLink) => {
                    const link = (agency.footer_links ?? []).find(l => l.id === predefinedLink.id) ?? {
                      id: predefinedLink.id,
                      url: null,
                      title: predefinedLink.defaultTitle
                    };
                    
                    return (
                      <div key={predefinedLink.id} className="grid grid-cols-2 gap-4 p-4 border border-gray-200 rounded-md">
                        <div>
                          <label className="block text-sm text-gray-500 mb-1">{predefinedLink.label} Label</label>
                          <input
                            type="text"
                            value={link.title ?? predefinedLink.defaultTitle}
                            onChange={(e) => {
                              const newLinks = [...(agency.footer_links ?? [])];
                              const existingIndex = newLinks.findIndex(l => l.id === predefinedLink.id);
                              const updatedLink = { ...link, title: e.target.value || predefinedLink.defaultTitle };
                              
                              if (existingIndex >= 0) {
                                newLinks[existingIndex] = updatedLink;
                              } else {
                                newLinks.push(updatedLink);
                              }
                              
                              handleFooterLinksChange(newLinks);
                            }}
                            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                            placeholder={predefinedLink.defaultTitle}
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-gray-500 mb-1">{predefinedLink.label} URL</label>
                          <input
                            type="text"
                            value={link.url ?? ''}
                            onChange={(e) => {
                              const newLinks = [...(agency.footer_links ?? [])];
                              const existingIndex = newLinks.findIndex(l => l.id === predefinedLink.id);
                              const updatedLink = { ...link, url: e.target.value || null };
                              
                              if (existingIndex >= 0) {
                                newLinks[existingIndex] = updatedLink;
                              } else {
                                newLinks.push(updatedLink);
                              }
                              
                              handleFooterLinksChange(newLinks);
                            }}
                            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                            placeholder={predefinedLink.id === 'phone' ? 'tel:+1234567890' : 
                              predefinedLink.id === 'email' ? 'mailto:example@domain.com' : 
                              'https://example.com'}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <BrandScraperModal
        isOpen={isBrandScraperOpen}
        onClose={() => setIsBrandScraperOpen(false)}
        onSelect={handleBrandAssetsSelect}
        onStoreLogo={handleStoreLogo}
        onStoreFont={handleStoreFontUrl}
      />
    </div>
  )
} 