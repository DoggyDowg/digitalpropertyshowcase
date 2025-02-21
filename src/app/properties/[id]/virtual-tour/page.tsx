'use client';

import { useEffect } from 'react';
import { use } from 'react';
import dynamic from 'next/dynamic';
import { use3DTour } from '@/hooks/use3DTour';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useState } from 'react';

// Dynamic import of the VirtualTourViewer component
const VirtualTourViewer = dynamic(
  () => import('@/components/virtual-tour/VirtualTourViewer'),
  {
    ssr: false,
    loading: () => (
      <div className="fixed inset-0 flex items-center justify-center bg-black">
        <div className="text-center text-white">
          <div className="text-lg font-semibold">Preparing Virtual Tour...</div>
          <p className="text-sm text-white/70 mt-2">This may take a moment to load</p>
        </div>
      </div>
    ),
  }
);

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function VirtualTourPage({ params }: PageProps) {
  const [isDemo, setIsDemo] = useState(false);
  const supabase = createClientComponentClient();
  
  // Unwrap the params Promise
  const { id } = use(params);

  // Fetch property demo status
  useEffect(() => {
    async function fetchDemoStatus() {
      const { data } = await supabase
        .from('properties')
        .select('is_demo')
        .eq('id', id)
        .single();
      
      setIsDemo(data?.is_demo || false);
    }
    
    fetchDemoStatus();
  }, [id, supabase]);

  // Ensure the page takes up the full window and prevent scrolling
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    document.body.style.margin = '0';
    return () => {
      document.body.style.overflow = 'unset';
      document.body.style.margin = 'unset';
    };
  }, []);

  const { modelUrl, loading, error } = use3DTour(id, isDemo);

  if (loading) return null; // Dynamic import loading UI will show

  if (error || !modelUrl) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black text-white">
        <div className="text-center">
          <div className="text-lg font-semibold">Unable to load Virtual Tour</div>
          <p className="text-sm opacity-70 mt-2">Please try again later</p>
          {process.env.NODE_ENV === 'development' && error && (
            <pre className="mt-4 p-4 bg-white/10 rounded text-xs overflow-auto max-w-lg">
              {error.message}
            </pre>
          )}
        </div>
      </div>
    );
  }

  return <VirtualTourViewer modelPath={modelUrl} />;
} 