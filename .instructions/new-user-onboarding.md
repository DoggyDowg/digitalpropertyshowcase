# New User Onboarding Flow - Implementation Plan

## Overview
This document outlines the implementation plan for a progressive disclosure onboarding system that reduces user friction through simplified initial signup and saved progress functionality. The approach balances comprehensive data collection with user experience optimization.

## UX Strategy: Progressive Disclosure with Saved Progress

### Core Philosophy
Instead of requiring users to complete a comprehensive form upfront, we implement a **two-phase progressive disclosure approach**:

1. **Quick Start Phase**: Minimal essential information to get users started immediately
2. **Progressive Enhancement Phase**: Gradual completion of detailed information with saved progress

### Phase A: Quick Start (Essential Information Only)
**Goal**: Get users into the system with minimal friction (2-3 minutes)

#### A.1 Basic Personal Information
- [ ] **User Details** (required)
  - Full name → `agents.name`
  - Email address → `agents.email` (primary login)
  - Phone number → `agents.phone`

#### A.2 Agency Basics
- [ ] **Agency Information** (required)
  - Agency name → `agency_settings.name`
  - "Are you the selling agent?" (Yes/No toggle)

#### A.3 Showcase Type Selection
- [ ] **Tier Selection** (required)
  - Demo Showcase vs Listing Showcase
  - Brief explanation of differences

#### Quick Start Outcome
- User receives immediate access to basic dashboard
- Demo showcase can be generated with placeholder content
- Clear call-to-action to "Complete Your Profile" for full features

### Phase B: Progressive Enhancement (Detailed Information)
**Goal**: Complete comprehensive profile over time with saved progress

#### B.1 Save & Continue Functionality
- [ ] **Progress Persistence**
  - Auto-save form data every 30 seconds
  - Manual "Save & Continue Later" button
  - Email reminder system for incomplete profiles
  - Progress indicator showing completion percentage

#### B.2 Modular Completion
Users can complete sections in any order:

- [ ] **Agency Branding** (optional but recommended)
  - Logo uploads, color schemes, fonts
  - Can be completed later without blocking showcase creation

- [ ] **Agent Profile Enhancement** (optional)
  - Professional photo, bio, credentials
  - Social media links, certifications

- [ ] **Property Media Assets** (conditional)
  - Required only for Listing Showcase tier
  - Can upload media incrementally
  - Placeholder content used until real assets uploaded

- [ ] **Property Details** (conditional)
  - Required only for Listing Showcase tier
  - Address, pricing, auction details
  - Integration with existing listing URLs

#### B.3 Email-Driven Completion
- [ ] **Automated Email Sequences**
  - Welcome email with quick start confirmation
  - "Complete your profile" reminders (3, 7, 14 days)
  - Tips and best practices for each section
  - Direct links to specific incomplete sections

### Technical Implementation Strategy

#### Database Schema Enhancements
```sql
-- Add progress tracking to user profiles
ALTER TABLE agents ADD COLUMN onboarding_progress JSONB DEFAULT '{
  "quick_start_completed": false,
  "sections_completed": [],
  "last_updated": null,
  "completion_percentage": 0
}';

-- Add draft/incomplete status tracking
ALTER TABLE agency_settings ADD COLUMN profile_status VARCHAR(20) DEFAULT 'incomplete';
ALTER TABLE properties ADD COLUMN completion_status VARCHAR(20) DEFAULT 'draft';
```

#### Form State Management
- [ ] **Client-side State Persistence**
  - LocalStorage for temporary form data
  - Periodic sync with database
  - Conflict resolution for concurrent edits

- [ ] **Server-side Progress Tracking**
  - RESTful endpoints for partial updates
  - Validation that allows incomplete data
  - Status tracking for each onboarding section

#### Email Integration
- [ ] **Automated Email System**
  - Integration with email service (SendGrid, Mailgun)
  - Template system for progress reminders
  - Personalized completion links with authentication tokens
  - Unsubscribe management

### User Journey Example

#### Day 1: Quick Start (3 minutes)
1. User visits signup page
2. Enters name, email, phone, agency name
3. Selects showcase type
4. Immediately redirected to basic dashboard
5. Can preview demo showcase with placeholder content

#### Day 2: Email Reminder
1. Receives "Complete Your Agency Profile" email
2. Clicks link → directly to agency branding section
3. Uploads logo, selects colors (5 minutes)
4. Saves progress, returns later

#### Day 5: Incremental Progress
1. Receives "Add Your Property Details" email
2. Completes property information (10 minutes)
3. Uploads some photos, saves remaining for later

#### Day 7: Full Completion
1. Completes remaining media uploads
2. Reviews and publishes final showcase
3. Receives congratulations email with showcase link

### Benefits of This Approach

#### Psychological Benefits
- **Reduced cognitive load**: Users aren't overwhelmed by comprehensive forms
- **Immediate gratification**: Quick access to basic functionality
- **Sense of progress**: Clear completion indicators and achievements
- **Flexibility**: Complete at their own pace and schedule

#### Business Benefits
- **Higher conversion rates**: Lower barrier to initial signup
- **Reduced abandonment**: Users can return without losing progress
- **Better data quality**: Users more likely to provide accurate info when not rushed
- **Engagement opportunities**: Multiple touchpoints for user education

#### Technical Benefits
- **Scalable architecture**: Modular completion supports future feature additions
- **Better error handling**: Smaller forms = fewer validation issues
- **Performance optimization**: Lazy loading of complex form components
- **Analytics insights**: Clear tracking of where users drop off

### Implementation Priority
1. **Phase A (Quick Start)**: Immediate implementation - highest ROI
2. **Save/Continue functionality**: Critical for user retention
3. **Email automation**: Essential for driving completion
4. **Phase B (Progressive Enhancement)**: Iterative rollout by section

## Database Schema Reference
**Supabase Project ID:** `urguvlckmcehdiibsiwf`

### Key Tables
- **agency_settings**: Agency branding and contact information
- **agents**: Agent profiles and contact details
- **properties**: Property information and metadata
- **assets**: Media files with categorization system

## Phase 1: Basic Information & Branding

### 1.1 Tier Selection
- [ ] **Demo Showcase vs Listing Showcase selection**
  - Existing functionality in `onboarding.html` lines 450-550
  - No changes required to tier selection logic

### 1.2 Agency Information
- [ ] **Agency Details Collection**
  - Agency name (required) → `agency_settings.name`
  - Contact email (required) → `agency_settings.email`
  - Phone number (required) → `agency_settings.phone`
  - Website URL (optional) → `agency_settings.website`

- [ ] **Agency Branding Assets**
  - Logo upload (dark variant) → `agency_settings.branding.logos.dark`
  - Logo upload (light variant) → `agency_settings.branding.logos.light`
  - Color scheme selection:
    - Primary color → `agency_settings.branding.colors.primary`
    - Secondary color → `agency_settings.branding.colors.secondary`
    - Accent color → `agency_settings.branding.colors.accent`
  - Font uploads:
    - Heading font → `agency_settings.branding.typography.headingFont`
    - Body font → `agency_settings.branding.typography.bodyFont`
  - Favicon upload → `agency_settings.branding.favicon`

### 1.3 Agent Information
- [ ] **Primary Agent Details**
  - Full name (required) → `agents.name`
  - Email address (required) → `agents.email`
  - Phone number (required) → `agents.phone`
  - Position/Title (required) → `agents.position`
  - Avatar upload (optional) → `agents.avatar_url`
  - Link to agency → `agents.agency_id`

### Implementation Tasks - Phase 1
- [ ] Create agency branding upload components
- [ ] Implement color picker for brand colors
- [ ] Add font file upload with validation
- [ ] Create agent profile form with avatar upload
- [ ] Integrate with Supabase storage for asset uploads
- [ ] Add form validation for required fields
- [ ] Implement progress indicator updates

## Phase 2: Property Media Assets

### 2.1 Video Upload
- [ ] **Hero Video Upload**
  - Single video file upload (up to 100MB)
  - Supported formats: MP4, MOV, AVI
  - Storage: `assets` table with `category='hero_video'`
  - Automatic thumbnail generation
  - Progress indicator for large file uploads

### 2.2 Property Images
- [ ] **Gallery Images**
  - Multiple image upload (up to 30 images)
  - Minimum 12 images recommended
  - Supported formats: JPG, PNG, WebP
  - Drag-and-drop interface
  - Image preview with reordering capability
  - Storage: `assets` table with `category='gallery'`
  - **Client-side image optimization before upload**:
    - Compress large images (e.g., 7MB → 2MB)
    - Maintain quality while reducing file size
    - Progressive JPEG encoding for faster loading
    - WebP conversion for modern browsers

### 2.3 Floorplan Upload
- [ ] **Floorplan Document**
  - Single file upload (PDF, JPG, PNG)
  - Storage: `assets` table with `category='floorplan'`
  - Preview functionality for uploaded floorplan

### 2.4 Aerial Images
- [ ] **Aerial Photography**
  - Multiple image upload (up to 10 images)
  - Supported formats: JPG, PNG, WebP
  - Storage: `assets` table with `category='aerial'`
  - Preview with thumbnail generation
  - **Client-side image optimization** (same as gallery images)

### Implementation Tasks - Phase 2
- [ ] Create drag-and-drop upload zones
- [ ] Implement file size and type validation
- [ ] Add upload progress indicators
- [ ] Create image preview and reordering interface
- [ ] Integrate with Supabase storage buckets
- [ ] Add automatic thumbnail generation for videos
- [ ] **Implement client-side image optimization**:
  - [ ] Use Canvas API or libraries like `browser-image-compression`
  - [ ] Set compression quality (0.8-0.9 for good balance)
  - [ ] Resize images to maximum dimensions (e.g., 1920x1080)
  - [ ] Convert to WebP format when supported
  - [ ] Show compression progress to users
- [ ] Create asset categorization logic

## Phase 3: Property Information

### 3.1 Address & Location
- [ ] **Google Places Integration**
  - Address autocomplete → `properties.maps_address`
  - Street address parsing → `properties.street_address`
  - Suburb extraction → `properties.suburb`
  - State extraction → `properties.state`
  - Latitude/longitude capture → `properties.latitude`, `properties.longitude`
  - Timezone detection → `properties.local_timezone`

### 3.2 Property Details
- [ ] **Core Property Information**
  - Property name → `properties.name`
  - Price → `properties.price`
  - Status dropdown → `properties.status`
    - Options: 'active', 'draft', 'archived'
  - Sale type → `properties.sale_type`
    - Options: 'private_sale', 'auction', 'expressions_of_interest'

### 3.3 Auction Information (Conditional)
- [ ] **Auction Details** (shown only if sale_type = 'auction')
  - Auction date and time → `properties.auction_datetime`
  - Timezone-aware datetime picker
  - Validation for future dates only

### 3.4 Existing Listing Integration
- [ ] **Listing URL Import**
  - URL input field for existing property listings
  - Optional field for AI content generation enhancement
  - Store in `properties.metadata.listing_url`

### 3.5 Footer Links Management
- [ ] **Social & Contact Links**
  - 8 configurable footer links
  - Default social media platforms (Facebook, Instagram, LinkedIn, etc.)
  - Contact links (Email, Phone, Website)
  - Store in `agency_settings.footer_links`

### Implementation Tasks - Phase 3
- [ ] Integrate Google Places Autocomplete API
- [ ] Create address parsing and validation logic
- [ ] Implement timezone detection and storage
- [ ] Add conditional auction datetime fields
- [ ] Create footer links management interface
- [ ] Add form validation for property details
- [ ] Implement existing listing URL integration

## Technical Implementation Details

### File Upload Specifications
- **Video Files**: Max 100MB, formats: MP4, MOV, AVI
- **Image Files**: 
  - Original upload: Max 25MB each (before optimization)
  - After optimization: Target 2-5MB per image
  - Formats: JPG, PNG, WebP
  - Auto-resize to max 1920x1080 for web optimization
- **Document Files**: Max 25MB, formats: PDF
- **Font Files**: Max 5MB, formats: TTF, OTF, WOFF, WOFF2

### Supabase Storage Integration
- **Bucket Structure**:
  - `agency-assets/`: Agency logos, fonts, favicons
  - `property-assets/`: Property videos, images, documents
  - `agent-assets/`: Agent avatars and profiles

### Form Validation Rules
- **Required Fields**: Agency name, email, phone, agent details, property name, address
- **Email Validation**: RFC 5322 compliant
- **Phone Validation**: International format support
- **File Type Validation**: MIME type checking
- **File Size Validation**: Progressive upload with size limits

### Progress Tracking
- **Phase 1**: 33% completion
- **Phase 2**: 66% completion
- **Phase 3**: 100% completion
- Visual progress bar with step indicators

## API Endpoints Required

### Existing Endpoints to Utilize
- `POST /api/upload` - File upload handling
- `POST /api/agencies` - Agency creation
- `POST /api/agents` - Agent creation
- `POST /api/properties` - Property creation

### New Endpoints for Progressive Disclosure

#### Quick Start Phase
- `POST /api/onboarding/quick-start` - Initial minimal signup
- `GET /api/onboarding/progress/:userId` - Get user's completion progress
- `POST /api/onboarding/save-progress` - Save partial form data

#### Progressive Enhancement Phase
- `PATCH /api/agencies/:id/branding` - Update agency branding incrementally
- `PATCH /api/agents/:id/profile` - Update agent profile incrementally
- `PATCH /api/properties/:id/details` - Update property details incrementally
- `POST /api/onboarding/send-reminder` - Trigger completion reminder emails

#### Email & Authentication
- `POST /api/auth/magic-link` - Generate authenticated completion links
- `GET /api/auth/verify-token/:token` - Verify email completion tokens
- `POST /api/email/completion-reminder` - Send targeted completion emails

### Legacy Endpoints (Still Required)
- `POST /api/onboarding/complete` - Final onboarding completion
- `GET /api/google-places/autocomplete` - Address suggestions
- `POST /api/assets/bulk-upload` - Multiple asset upload

## Database Operations

### Quick Start Phase Database Writes
```sql
-- Create minimal agency record
INSERT INTO agency_settings (name, profile_status, created_at)
VALUES ($1, 'incomplete', NOW());

-- Create minimal agent record with progress tracking
INSERT INTO agents (
  agency_id, name, email, phone, 
  onboarding_progress, created_at
) VALUES (
  $1, $2, $3, $4, 
  '{"quick_start_completed": true, "sections_completed": ["basic_info"], "last_updated": "' || NOW() || '", "completion_percentage": 25}',
  NOW()
);
```

### Progressive Enhancement Database Updates
```sql
-- Update agency branding incrementally
UPDATE agency_settings 
SET 
  branding = COALESCE(branding, '{}') || $2,
  profile_status = CASE 
    WHEN $3 THEN 'complete' 
    ELSE 'incomplete' 
  END,
  updated_at = NOW()
WHERE id = $1;

-- Update agent progress tracking
UPDATE agents 
SET 
  onboarding_progress = jsonb_set(
    onboarding_progress,
    '{sections_completed}',
    (onboarding_progress->'sections_completed') || $2::jsonb
  ),
  onboarding_progress = jsonb_set(
    onboarding_progress,
    '{completion_percentage}',
    $3::jsonb
  ),
  onboarding_progress = jsonb_set(
    onboarding_progress,
    '{last_updated}',
    to_jsonb(NOW()::text)
  )
WHERE id = $1;

-- Save partial form data
INSERT INTO form_drafts (user_id, section, form_data, created_at)
VALUES ($1, $2, $3, NOW())
ON CONFLICT (user_id, section) 
DO UPDATE SET 
  form_data = $3,
  updated_at = NOW();
```

### Legacy Database Operations (Full Form Completion)

#### Phase 1 Database Writes
```sql
-- Create complete agency
INSERT INTO agency_settings (name, email, phone, website, branding, footer_links)
VALUES ($1, $2, $3, $4, $5, $6);

-- Create complete agent
INSERT INTO agents (agency_id, name, email, phone, position, avatar_url)
VALUES ($1, $2, $3, $4, $5, $6);
```

#### Phase 2 Database Writes
```sql
-- Create assets
INSERT INTO assets (property_id, category, type, filename, storage_path, display_order)
VALUES ($1, $2, $3, $4, $5, $6);
```

#### Phase 3 Database Writes
```sql
-- Create property
INSERT INTO properties (
  name, street_address, suburb, state, price, status, sale_type,
  auction_datetime, maps_address, latitude, longitude, local_timezone,
  agency_id, agent_id, metadata, completion_status
) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, 'complete');
```

### Progress Tracking Queries
```sql
-- Get user completion progress
SELECT 
  a.onboarding_progress,
  ag.profile_status as agency_status,
  CASE 
    WHEN p.completion_status = 'complete' THEN 100
    WHEN p.completion_status = 'draft' THEN 75
    ELSE 0
  END as property_completion
FROM agents a
LEFT JOIN agency_settings ag ON a.agency_id = ag.id
LEFT JOIN properties p ON p.agent_id = a.id
WHERE a.id = $1;

-- Get users needing completion reminders
SELECT 
  a.id, a.email, a.name,
  a.onboarding_progress->>'completion_percentage' as progress,
  a.onboarding_progress->>'last_updated' as last_activity
FROM agents a
WHERE 
  (a.onboarding_progress->>'completion_percentage')::int < 100
  AND (a.onboarding_progress->>'last_updated')::timestamp < NOW() - INTERVAL '3 days';
```

## UI/UX Considerations

### Design Patterns
- **Multi-step wizard** with clear navigation
- **Drag-and-drop uploads** with visual feedback
- **Progress indicators** for file uploads
- **Responsive design** for mobile compatibility
- **Error handling** with clear user feedback

### Accessibility
- **Keyboard navigation** support
- **Screen reader** compatibility
- **High contrast** mode support
- **Focus indicators** for form elements

## Testing Checklist

### Unit Tests
- [ ] Form validation functions
- [ ] File upload utilities
- [ ] Address parsing logic
- [ ] Database operation functions

### Integration Tests
- [ ] Supabase storage integration
- [ ] Google Places API integration
- [ ] Multi-step form navigation
- [ ] File upload and processing

### End-to-End Tests
- [ ] Complete onboarding flow
- [ ] Error handling scenarios
- [ ] Mobile responsiveness
- [ ] Cross-browser compatibility

## Deployment Considerations

### Environment Variables
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
GOOGLE_PLACES_API_KEY=your_google_places_key
```

### Performance Optimizations
- **Lazy loading** for upload components
- **Client-side image compression** before upload:
  - Use `browser-image-compression` library or Canvas API
  - Target compression: 70-80% quality for optimal size/quality balance
  - Automatic WebP conversion for supported browsers
  - Fallback to JPEG for older browsers
- **Progressive enhancement** for JavaScript features
- **CDN integration** for static assets

## Success Metrics

### Completion Rates
- [ ] Track completion rate for each phase
- [ ] Monitor drop-off points
- [ ] Measure time to complete onboarding

### User Experience
- [ ] Collect user feedback on flow complexity
- [ ] Monitor error rates and support requests
- [ ] Track successful property showcase deployments

## Current Status: Implementation Phase

**Next Steps:**
1. ✅ Review existing onboarding implementation
2. ✅ Design progressive disclosure system  
3. 🔄 Implement database schema enhancements
4. ⏳ Create modular form components
5. ⏳ Build save & continue functionality

---

## Implementation Roadmap

### Phase 1: Quick Start Implementation (Week 1-2)
**Priority**: Critical - Immediate ROI
- [ ] Create simplified signup form (Phase A)
- [ ] Implement basic dashboard with placeholder content
- [ ] Set up progress tracking database schema
- [ ] Create minimal API endpoints for quick start
- [ ] Basic email welcome sequence

### Phase 2: Save & Continue Functionality (Week 2-3)
**Priority**: High - User retention critical
- [ ] Implement auto-save functionality
- [ ] Create progress persistence system
- [ ] Build modular form sections
- [ ] Set up email reminder system
- [ ] Create magic link authentication

### Phase 3: Progressive Enhancement (Week 3-5)
**Priority**: Medium - Feature completion
- [ ] Complete all detailed form sections
- [ ] Implement file upload optimization
- [ ] Advanced email automation
- [ ] Analytics and progress tracking
- [ ] Mobile responsiveness optimization

### Phase 4: Polish & Optimization (Week 5-6)
**Priority**: Low - Nice to have
- [ ] A/B testing for conversion optimization
- [ ] Advanced progress indicators
- [ ] Social proof and onboarding tips
- [ ] Performance optimization
- [ ] Comprehensive testing

**Total Estimated Development Time**: 5-6 weeks
**Dependencies**: 
- Google Places API integration
- Supabase storage configuration
- Email service integration (SendGrid/Mailgun)
- Authentication system enhancements

**Review Required**: 
- UX/UI design approval for progressive disclosure flow
- Email template design and copywriting
- API endpoint specifications
- Database migration strategy
- Analytics and tracking requirements