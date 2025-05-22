# User-Facing Application Plan (app.digitalpropertyshowcase.com)

This document outlines the plan for creating a user-facing web application for real estate agents to manage their property listings, hosted on the `app.digitalpropertyshowcase.com` subdomain.

## Proposed Structure and Routing

The application will reside in a new top-level directory within `src/app`: `src/app/app`. This directory will contain the pages and components specific to the user dashboard.

*   **Dashboard:** A main dashboard page at [`src/app/app/page.tsx`](src/app/app/page.tsx) will serve as the entry entry point, providing an overview for the agent.
*   **Properties:** A dedicated section for managing properties.
    *   [`src/app/app/properties/page.tsx`](src/app/app/properties/page.tsx): Lists all properties for the logged-in agent.
    *   [`src/app/app/properties/[id]/page.tsx`](src/app/app/properties/[id]/page.tsx): Handles the creation and editing of a specific property. This page will likely contain sub-sections or components for managing different aspects of the property (details, assets, viewings).
*   **Asset Management:** While asset management is closely tied to a specific property, we could potentially have dedicated routes or modals within the property editing page.
    *   `src/app/app/properties/[id]/assets`: A potential route or component structure for managing assets related to a property.
*   **Viewings Management:** Similar to assets, viewings are property-specific.
    *   `src/app/app/properties/[id]/viewings`: A potential route or component structure for managing viewings for a property.

Other directories/files within `src/app/app` will be created as needed for routing and components (e.g., [`src/app/app/viewings/page.tsx`](src/app/app/viewings/page.tsx) if a dedicated viewings list page is desired, or components within `src/app/app/properties/[id]` for asset/viewing management).

## Technical Component Reusability

We will identify and reuse existing technical logic from [`src/components/admin`](src/components/admin) and [`src/components/shared`](src/components/shared) where appropriate. This includes:

*   Data fetching and manipulation logic interacting with Supabase (e.g., fetching property details, assets, viewings, agents, agencies).
*   Form handling patterns and validation logic.
*   File upload mechanisms and integration with the upload API ([`src/app/api/upload/route.ts`](src/app/api/upload/route.ts)).
*   Select components for associating agents and agencies ([`src/components/shared/AgentSelect.tsx`](src/components/shared/AgentSelect.tsx), [`src/components/shared/AgencySelect.tsx`](src/components/shared/AgencySelect.tsx)).
*   Utility functions from [`src/lib`](src/lib) and [`src/utils`](src/utils).

## Styling and UI Implementation

The provided HTML files in `.instructions/app_ui_guide_pages` will be the definitive guide for the visual design, layout, and specific UI elements.

*   We will implement the UI for each page (`dashboard`, `mylistings`, `createshowcase`, `manageassets`, `viewings`) in React/Next.js components within the [`src/app/app`](src/app/app) directory.
*   Tailwind CSS will be used for styling, replicating the classes and structure shown in the HTML examples. We will *not* reuse the CSS or styling logic from the existing admin components.
*   New components will be created within [`src/app/app`](src/app/app) or potentially in a new shared component directory specifically for this application's UI elements, ensuring a clean separation of styling from existing parts of the project.

## Core Functionality Mapping

The UI elements and workflows described in the HTML files will be connected to the Supabase schema and the reused technical logic to implement the core functionalities:

*   Property creation/editing forms will map to the `properties` table fields and the `content` JSONB structure.
*   Asset management interfaces will integrate with asset uploading, categorization (`asset_category` enum), and metadata fields.
*   Viewings management will utilize date/time selection and update viewing status.
*   Agent and agency selection will use the existing data and potentially reused select components.

## Preview Feature

A preview button will be implemented on the property editing page ([`src/app/app/properties/[id]/page.tsx`](src/app/app/properties/[id]/page.tsx)) to link to the public property showcase page (`/properties/[id]`).

## Proposed Structure Diagram

```mermaid
graph TD
    A[User-Facing App (app.digitalpropertyshowcase.com)] --> B[src/app/app]
    B --> C[Pages (Dashboard, Listings, Property Edit)]
    B --> D[New UI Components (Tailwind CSS)]
    B --> E[Reused Technical Logic]
    E --> F[src/components/admin]
    E --> G[src/components/shared]
    E --> H[src/lib/supabase.ts]
    D --> C
    E --> C
    H --> E
    F --> E
    G --> E
    I[.instructions/app_ui_guide_pages/*.html] --> D[UI Guide]
```

## Step-by-Step Implementation

Here are the steps to implement the user-facing application:

1.  Create the main application directory `src/app/app`. (Completed)
2.  Create the dashboard page component at [`src/app/app/page.tsx`](src/app/app/page.tsx) based on `dashboard.html`. (Completed)
3.  Create the my listings page component at [`src/app/app/properties/page.tsx`](src/app/app/properties/page.tsx) based on `mylistings.html`. (Completed)
4.  Create the property create/edit page component at [`src/app/app/properties/[id]/page.tsx`](src/app/app/properties/[id]/page.tsx) based on `createshowcase.html`. (Completed)
5.  Create the manage assets page component at [`src/app/app/properties/[id]/assets/page.tsx`](src/app/app/properties/[id]/assets/page.tsx) based on `manageassets.html`. (Completed)
6.  Create the viewings page component at [`src/app/app/properties/[id]/viewings/page.tsx`](src/app/app/properties/[id]/viewings/page.tsx) based on `viewings.html`. (Completed)
7.  Integrate DPS branding elements (logos, colors, fonts) into the new application pages, potentially by updating Tailwind configuration or creating a branding context/component.
8.  Implement data fetching and display for the dashboard, fetching relevant data (e.g., active listings count, scheduled viewings count, recent activity) from Supabase.
9.  Implement data fetching and display for the my listings page, fetching the agent's properties from Supabase and displaying them in a table format.
10. Implement search and filtering functionality on the my listings page.
11. Implement the property creation form on [`src/app/app/properties/[id]/page.tsx`](src/app/app/properties/[id]/page.tsx), including form handling, validation, and submission to Supabase.
12. Implement the property editing functionality on [`src/app/app/properties/[id]/page.tsx`](src/app/app/properties/[id]/page.tsx), pre-populating the form with existing property data fetched from Supabase.
13. Implement the rich text editor or custom form builder for the `content` JSONB field on the property editing page.
14. Implement the asset management interface on [`src/app/app/properties/[id]/assets/page.tsx`](src/app/app/properties/[id]/assets/page.tsx), including drag-and-drop upload, asset categorization, metadata input, and reordering. Integrate with the upload API.
15. Implement the viewings calendar and scheduled viewings list on [`src/app/app/properties/[id]/viewings/page.tsx`](src/app/app/properties/[id]/viewings/page.tsx), including date and time selection and updating viewing status in Supabase.
16. Implement agent and agency selection using existing components and Supabase data.
17. Implement the preview feature on the property editing page, linking to the public property showcase URL.
18. Implement user authentication and authorization to ensure only logged-in agents can access the application and manage their own listings.
19. Refine UI and styling based on the HTML guides and ensure responsiveness.
20. Add navigation between the different pages of the application.
21. Conduct testing and debugging.