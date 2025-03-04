import type { Property } from '@/types/property'
import type { MoreInfoData } from './PropertyMoreInfo'

declare module '@/components/admin' {
  export function ViewingsManager(props: { 
    propertyId: string;
    propertyTimezone: string;
  }): JSX.Element
  
  export function PropertyLocations(props: { 
    propertyId: string
    onSave?: () => void 
  }): JSX.Element
  
  export function PropertyAssets(props: { 
    propertyId: string
    onSave?: () => void
    isDemoProperty?: boolean 
  }): JSX.Element
  
  export function PropertyMoreInfo(props: { 
    propertyId: string
    onSave?: (updatedMetadata: { more_info: MoreInfoData }) => Promise<void> 
  }): JSX.Element
  
  export function PropertyDeployment(props: { 
    property: Property
    onSave?: () => void 
  }): JSX.Element
} 