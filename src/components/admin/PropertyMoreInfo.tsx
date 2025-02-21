import { useState, useEffect, forwardRef, useImperativeHandle, useRef } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { toast } from 'sonner'
import { debounce } from 'lodash'

interface PropertyMoreInfoProps {
  propertyId: string
  onSave?: (updatedMetadata: { more_info: MoreInfoData }) => Promise<void>
}

interface CTAButton {
  label: string
  type: 'download' | 'link' | 'anchor'
  url: string
}

interface InfoItem {
  info: string
  detail: string
}

interface DocumentItem {
  label: string
  url: string
}

export interface MoreInfoData {
  ctaButtons: {
    primary: CTAButton
    secondary: CTAButton
  }
  additionalInfo: InfoItem[]
  documents: DocumentItem[]
}

const PropertyMoreInfo = forwardRef<{ handleSave: () => Promise<void> }, PropertyMoreInfoProps>(
  function PropertyMoreInfo({ propertyId, onSave }, ref) {
    const supabase = createClientComponentClient()
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<Error | null>(null)
    const handleSaveRef = useRef<(() => Promise<void>) | null>(null)
    const [moreInfo, setMoreInfo] = useState<MoreInfoData>({
      ctaButtons: {
        primary: { label: '', type: 'link', url: '' },
        secondary: { label: '', type: 'link', url: '' }
      },
      additionalInfo: Array.from({ length: 5 }, () => ({ info: '', detail: '' })),
      documents: []
    })

    // Expose handleSave to parent
    useImperativeHandle(ref, () => ({
      handleSave: async () => {
        try {
          console.groupCollapsed('💾 More Info Component Save');
          console.log('Current state:', moreInfo);

          // Store the handleSave function in the ref
          handleSaveRef.current = async () => {
            // Create a deep copy of the state to clean
            const cleanedMoreInfo = JSON.parse(JSON.stringify(moreInfo));

            // Clean up the data before saving
            cleanedMoreInfo.ctaButtons.primary = {
              ...cleanedMoreInfo.ctaButtons.primary,
              label: cleanedMoreInfo.ctaButtons.primary.label?.trim() || '',
              url: cleanedMoreInfo.ctaButtons.primary.url?.trim() || ''
            };
            
            cleanedMoreInfo.ctaButtons.secondary = {
              ...cleanedMoreInfo.ctaButtons.secondary,
              label: cleanedMoreInfo.ctaButtons.secondary.label?.trim() || '',
              url: cleanedMoreInfo.ctaButtons.secondary.url?.trim() || ''
            };
            
            // Clean documents array - keep all documents but trim their values
            cleanedMoreInfo.documents = cleanedMoreInfo.documents.map((doc: DocumentItem) => ({
              label: doc.label?.trim() || '',
              url: doc.url?.trim() || ''
            }));

            console.log('Cleaned state before save:', {
              ...cleanedMoreInfo,
              documents: cleanedMoreInfo.documents
            });

            // Create the metadata structure and save
            if (onSave) {
              const metadata = { more_info: cleanedMoreInfo };
              console.log('Saving metadata:', metadata);
              await onSave(metadata);
              console.log('Save completed successfully');
            }
          };

          // Call the stored function
          if (handleSaveRef.current) {
            await handleSaveRef.current();
          }
        } catch (err) {
          console.error('Save error:', err);
          throw err; // Let the parent handle the error
        } finally {
          console.groupEnd();
        }
      }
    }));

    useEffect(() => {
      async function loadMoreInfo() {
        try {
          setLoading(true)
          const { data, error } = await supabase
            .from('properties')
            .select('metadata')
            .eq('id', propertyId)
            .single()

          if (error) throw error

          if (data?.metadata?.more_info) {
            setMoreInfo(data.metadata.more_info)
          }
        } catch (err) {
          console.error('Error loading more info:', err)
          setError(err instanceof Error ? err : new Error('Failed to load more info'))
        } finally {
          setLoading(false)
        }
      }

      loadMoreInfo()
    }, [propertyId, supabase])

    // Create a debounced save function
    const debouncedSave = useRef(
      debounce(async () => {
        try {
          if (handleSaveRef.current) {
            await handleSaveRef.current();
            console.log('Changes saved successfully');
          }
        } catch (err) {
          console.error('Error saving changes:', err);
          toast.error('Failed to save changes');
        }
      }, 1000)
    ).current;

    // Cleanup debounced function on unmount
    useEffect(() => {
      return () => {
        debouncedSave.cancel();
      };
    }, [debouncedSave]);

    // Update state and trigger save
    const updateMoreInfo = (newState: MoreInfoData | ((prevState: MoreInfoData) => MoreInfoData)) => {
      if (typeof newState === 'function') {
        setMoreInfo(prevState => {
          const updatedState = newState(prevState);
          debouncedSave();
          return updatedState;
        });
      } else {
        setMoreInfo(newState);
        debouncedSave();
      }
    };

    // Handle file upload with immediate save
    const handleFileUpload = async (file: File, type: number | 'primary' | 'secondary') => {
      try {
        if (!file) {
          throw new Error('No file selected')
        }

        const fileName = `${propertyId}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
        console.log('Generated file path:', fileName)

        const supabase = createClientComponentClient()

        const { data, error: uploadError } = await supabase.storage
          .from('property-documents')
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false
          })

        if (uploadError) {
          console.error('Upload error:', uploadError)
          toast.error(`Upload failed: ${uploadError.message || 'Unknown error'}`)
          throw uploadError
        }

        if (!data?.path) {
          throw new Error('Upload succeeded but no path returned')
        }

        const { data: urlData } = supabase.storage
          .from('property-documents')
          .getPublicUrl(data.path)

        if (!urlData?.publicUrl) {
          throw new Error('Failed to generate public URL')
        }

        console.log('File uploaded successfully. URL:', urlData.publicUrl)

        if (typeof type === 'number') {
          updateMoreInfo(prevState => {
            const newDocuments = [...prevState.documents]
            newDocuments[type] = {
              ...newDocuments[type],
              url: urlData.publicUrl
            }
            return {
              ...prevState,
              documents: newDocuments.filter(doc => doc.label || doc.url)
            }
          })
        } else {
          updateMoreInfo(prevState => ({
            ...prevState,
            ctaButtons: {
              ...prevState.ctaButtons,
              [type]: {
                ...prevState.ctaButtons[type],
                url: urlData.publicUrl
              }
            }
          }))
        }

        toast.success('File uploaded successfully')
      } catch (err) {
        console.error('Upload error:', err)
        setError(err instanceof Error ? err : new Error('Failed to upload file'))
        toast.error('Failed to upload file')
      }
    }

    if (loading) {
      return (
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      )
    }

    if (error) {
      return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-red-800 font-medium">Error</h3>
          <p className="text-red-600 mt-1">{error.message}</p>
        </div>
      )
    }

    return (
      <div className="space-y-8">
        {/* CTA Buttons */}
        <section>
          <h3 className="text-lg font-medium mb-4">CTA Buttons</h3>
          <div className="space-y-6">
            {/* Primary Button */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium mb-3">Primary Button</h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Button Label</label>
                  <input
                    type="text"
                    value={moreInfo.ctaButtons.primary.label}
                    onChange={(e) => {
                      updateMoreInfo(prevState => ({
                        ...prevState,
                        ctaButtons: {
                          ...prevState.ctaButtons,
                          primary: { ...prevState.ctaButtons.primary, label: e.target.value }
                        }
                      }));
                    }}
                    className="w-full p-2 border rounded"
                    placeholder="e.g., Download Brochure"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Type</label>
                  <select
                    value={moreInfo.ctaButtons.primary.type}
                    onChange={(e) => {
                      updateMoreInfo(prevState => ({
                        ...prevState,
                        ctaButtons: {
                          ...prevState.ctaButtons,
                          primary: { ...prevState.ctaButtons.primary, type: e.target.value as 'download' | 'link' | 'anchor' }
                        }
                      }));
                    }}
                    className="w-full p-2 border rounded"
                  >
                    <option value="link">External Link</option>
                    <option value="anchor">Page Section</option>
                    <option value="download">Download</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    {moreInfo.ctaButtons.primary.type === 'download' ? 'File Upload' : 
                     moreInfo.ctaButtons.primary.type === 'anchor' ? 'Section ID' : 'URL'}
                  </label>
                  {moreInfo.ctaButtons.primary.type === 'download' ? (
                    <div className="flex items-center gap-3">
                      <input
                        type="file"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) handleFileUpload(file, 'primary')
                        }}
                        className="flex-1 p-2 border rounded"
                      />
                      {moreInfo.ctaButtons.primary.url && (
                        <a
                          href={moreInfo.ctaButtons.primary.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800"
                        >
                          View File
                        </a>
                      )}
                    </div>
                  ) :
                    <div>
                      {moreInfo.ctaButtons.primary.type === 'anchor' ? (
                        <select
                          value={moreInfo.ctaButtons.primary.url}
                          onChange={(e) => {
                            updateMoreInfo(prevState => ({
                              ...prevState,
                              ctaButtons: {
                                ...prevState.ctaButtons,
                                primary: { ...prevState.ctaButtons.primary, url: e.target.value }
                              }
                            }));
                          }}
                          className="w-full p-2 border rounded"
                        >
                          <option value="">Select a section</option>
                          <option value="hero">Hero</option>
                          <option value="features">Features</option>
                          <option value="lifestyle">Lifestyle</option>
                          <option value="neighbourhood">Neighbourhood</option>
                          <option value="viewings">Viewings</option>
                          <option value="contact">Make an Enquiry</option>
                        </select>
                      ) : (
                        <input
                          type="url"
                          value={moreInfo.ctaButtons.primary.url}
                          onChange={(e) => {
                            updateMoreInfo(prevState => ({
                              ...prevState,
                              ctaButtons: {
                                ...prevState.ctaButtons,
                                primary: { ...prevState.ctaButtons.primary, url: e.target.value }
                              }
                            }));
                          }}
                          className="w-full p-2 border rounded"
                          placeholder="e.g., https://example.com"
                        />
                      )}
                    </div>
                  }
                </div>
              </div>
            </div>

            {/* Secondary Button */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium mb-3">Secondary Button</h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Button Label</label>
                  <input
                    type="text"
                    value={moreInfo.ctaButtons.secondary.label}
                    onChange={(e) => updateMoreInfo({
                      ...moreInfo,
                      ctaButtons: {
                        ...moreInfo.ctaButtons,
                        secondary: { ...moreInfo.ctaButtons.secondary, label: e.target.value }
                      }
                    })}
                    className="w-full p-2 border rounded"
                    placeholder="e.g., Book Viewing"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Type</label>
                  <select
                    value={moreInfo.ctaButtons.secondary.type}
                    onChange={(e) => updateMoreInfo({
                      ...moreInfo,
                      ctaButtons: {
                        ...moreInfo.ctaButtons,
                        secondary: { ...moreInfo.ctaButtons.secondary, type: e.target.value as 'download' | 'link' | 'anchor' }
                      }
                    })}
                    className="w-full p-2 border rounded"
                  >
                    <option value="link">External Link</option>
                    <option value="anchor">Page Section</option>
                    <option value="download">Download</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    {moreInfo.ctaButtons.secondary.type === 'download' ? 'File Upload' : 
                     moreInfo.ctaButtons.secondary.type === 'anchor' ? 'Section ID' : 'URL'}
                  </label>
                  {moreInfo.ctaButtons.secondary.type === 'download' ? (
                    <div className="flex items-center gap-3">
                      <input
                        type="file"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) handleFileUpload(file, 'secondary')
                        }}
                        className="flex-1 p-2 border rounded"
                      />
                      {moreInfo.ctaButtons.secondary.url && (
                        <a
                          href={moreInfo.ctaButtons.secondary.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800"
                        >
                          View File
                        </a>
                      )}
                    </div>
                  ) :
                    <div>
                      {moreInfo.ctaButtons.secondary.type === 'anchor' ? (
                        <select
                          value={moreInfo.ctaButtons.secondary.url}
                          onChange={(e) => updateMoreInfo({
                            ...moreInfo,
                            ctaButtons: {
                              ...moreInfo.ctaButtons,
                              secondary: { ...moreInfo.ctaButtons.secondary, url: e.target.value }
                            }
                          })}
                          className="w-full p-2 border rounded"
                        >
                          <option value="">Select a section</option>
                          <option value="hero">Hero</option>
                          <option value="features">Features</option>
                          <option value="lifestyle">Lifestyle</option>
                          <option value="neighbourhood">Neighbourhood</option>
                          <option value="viewings">Viewings</option>
                          <option value="contact">Make an Enquiry</option>
                        </select>
                      ) : (
                        <input
                          type="url"
                          value={moreInfo.ctaButtons.secondary.url}
                          onChange={(e) => updateMoreInfo({
                            ...moreInfo,
                            ctaButtons: {
                              ...moreInfo.ctaButtons,
                              secondary: { ...moreInfo.ctaButtons.secondary, url: e.target.value }
                            }
                          })}
                          className="w-full p-2 border rounded"
                          placeholder="e.g., https://example.com"
                        />
                      )}
                      {moreInfo.ctaButtons.secondary.type === 'anchor' && (
                        <p className="mt-1 text-sm text-gray-500">
                          Click on a section to automatically scroll to it on the property page
                        </p>
                      )}
                    </div>
                  }
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Document Downloads */}
        <section>
          <h3 className="text-lg font-medium mb-4">Document Downloads</h3>
          <div className="space-y-4">
            {moreInfo.documents.map((doc, index) => (
              <div key={index} className="bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between items-start">
                  <div className="flex-grow space-y-3">
                    <div>
                      <label className="block text-sm font-medium mb-1">Document Label</label>
                      <input
                        type="text"
                        value={doc.label}
                        onChange={(e) => {
                          const newDocs = [...moreInfo.documents]
                          newDocs[index] = { ...doc, label: e.target.value }
                          updateMoreInfo({ ...moreInfo, documents: newDocs })
                        }}
                        className="w-full p-2 border rounded"
                        placeholder="e.g., Contract of Sale"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">File Upload</label>
                      <div className="flex items-center gap-3">
                        <input
                          type="file"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) handleFileUpload(file, index)
                          }}
                          className="flex-1 p-2 border rounded"
                        />
                        {doc.url && (
                          <a
                            href={doc.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800"
                          >
                            View File
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      const newDocs = [...moreInfo.documents]
                      newDocs.splice(index, 1)
                      updateMoreInfo({ ...moreInfo, documents: newDocs })
                    }}
                    className="ml-4 p-1 text-gray-400 hover:text-red-500"
                    title="Remove Document"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
            
            <button
              onClick={() => {
                updateMoreInfo({
                  ...moreInfo,
                  documents: [...moreInfo.documents, { label: '', url: '' }]
                })
              }}
              className="w-full p-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:text-gray-700 hover:border-gray-400 flex items-center justify-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Add Document
            </button>
          </div>
        </section>
      </div>
    )
  }
)

export default PropertyMoreInfo 