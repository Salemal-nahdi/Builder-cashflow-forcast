# Builder Cashflow Forecasting - Simplified Rebuild Specification

## Overview
A simple cashflow forecasting tool for builders with Xero integration. Focus on ONE main view: **Cashflow by Project**.

---

## Core Features (Keep It Simple)

### 1. Projects Management
- Create projects with basic info (name, contract value, start/end dates)
- Each project has milestones (payment stages)
- Each project has costs (supplier payments)
- CRUD operations for projects, milestones, and costs

### 2. Cashflow by Project View
- Table showing all projects as rows
- Columns show months (6 months forward)
- Each cell shows:
  - Income (green) from milestones
  - Costs (red) from supplier claims
  - Net (blue) for that project in that month
- Bottom row shows totals per month
- Running balance across the bottom

### 3. Xero Integration
- OAuth connection to Xero
- Pull invoices → create milestones
- Pull bills → create costs
- Link projects to Xero tracking categories
- Sync button to refresh data

---

## Tech Stack

```
Framework: Next.js 14 (App Router)
Database: PostgreSQL (via Prisma)
Styling: Tailwind CSS
Xero: xero-node library
Deployment: Netlify
```

---

## Database Schema

### Tables Needed (5 Core Tables)

```prisma
// 1. Organization
model Organization {
  id        String   @id @default(cuid())
  name      String
  createdAt DateTime @default(now())
  projects  Project[]
  xeroConnection XeroConnection?
}

// 2. Project
model Project {
  id             String   @id @default(cuid())
  organizationId String
  name           String
  contractValue  Decimal
  startDate      DateTime
  endDate        DateTime
  createdAt      DateTime @default(now())
  
  organization   Organization @relation(fields: [organizationId], references: [id])
  milestones     Milestone[]
  costs          Cost[]
  xeroMaps       XeroProjectMap[]
}

// 3. Milestone (Income)
model Milestone {
  id           String   @id @default(cuid())
  projectId    String
  name         String
  amount       Decimal
  expectedDate DateTime
  status       String   // 'pending', 'invoiced', 'paid'
  xeroInvoiceId String?
  
  project      Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
}

// 4. Cost (Expenses)
model Cost {
  id           String   @id @default(cuid())
  projectId    String
  description  String
  amount       Decimal
  expectedDate DateTime
  vendor       String?
  status       String   // 'pending', 'billed', 'paid'
  xeroBillId   String?
  
  project      Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
}

// 5. Xero Connection
model XeroConnection {
  id             String   @id @default(cuid())
  organizationId String   @unique
  tenantId       String
  accessToken    String
  refreshToken   String
  expiresAt      DateTime
  isActive       Boolean  @default(true)
  
  organization   Organization @relation(fields: [organizationId], references: [id])
}

// 6. Xero Project Mapping (optional)
model XeroProjectMap {
  id              String @id @default(cuid())
  projectId       String
  trackingOptionId String
  
  project         Project @relation(fields: [projectId], references: [id], onDelete: Cascade)
}
```

---

## File Structure (Minimal)

```
src/
├── app/
│   ├── layout.tsx              # Root layout
│   ├── page.tsx                # Redirect to /forecast
│   ├── forecast/
│   │   └── page.tsx            # Main cashflow by project view
│   ├── projects/
│   │   ├── page.tsx            # Project list
│   │   └── [id]/
│   │       └── page.tsx        # Edit project
│   ├── settings/
│   │   └── xero/
│   │       └── page.tsx        # Xero connection
│   └── api/
│       ├── projects/
│       │   ├── route.ts        # GET all, POST new
│       │   └── [id]/
│       │       └── route.ts    # GET, PATCH, DELETE
│       ├── xero/
│       │   ├── connect/
│       │   │   └── route.ts    # Initiate OAuth
│       │   ├── callback/
│       │   │   └── route.ts    # Handle OAuth callback
│       │   └── sync/
│       │       └── route.ts    # Sync Xero data
│       └── forecast/
│           └── route.ts        # Get forecast data
│
├── components/
│   ├── forecast-by-project.tsx # Main cashflow table
│   ├── project-form.tsx        # Create/edit project
│   ├── milestone-form.tsx      # Add/edit milestones
│   ├── cost-form.tsx           # Add/edit costs
│   └── xero-connect-button.tsx # Xero connection UI
│
├── lib/
│   ├── prisma.ts               # Prisma client
│   ├── forecast-engine.ts      # Calculate cashflow
│   └── xero/
│       ├── client.ts           # Xero API client
│       └── sync.ts             # Sync logic
│
└── types/
    └── index.ts                # TypeScript types
```

---

## Key Components Explained

### 1. Forecast by Project Component (`forecast-by-project.tsx`)

**What it does:**
- Displays a table with projects as rows, months as columns
- Shows income (green), costs (red), net (blue) for each cell
- Calculates running balance

**Data Structure:**
```typescript
interface ForecastData {
  projects: Array<{
    id: string
    name: string
    months: Array<{
      month: string        // "2025-01"
      income: number       // Sum of milestones in this month
      costs: number        // Sum of costs in this month
      net: number          // income - costs
    }>
  }>
  totals: Array<{
    month: string
    income: number
    costs: number
    net: number
    balance: number        // Running balance
  }>
}
```

**UI:**
```
┌─────────────────┬─────────┬─────────┬─────────┐
│ Project         │ Jan 25  │ Feb 25  │ Mar 25  │
├─────────────────┼─────────┼─────────┼─────────┤
│ House Build     │ +50k    │ +30k    │ -20k    │
│                 │ -10k    │ -15k    │ -5k     │
│                 │ = 40k   │ = 15k   │ = -25k  │
├─────────────────┼─────────┼─────────┼─────────┤
│ Renovation      │ +20k    │ -10k    │ +10k    │
│                 │ -5k     │ -8k     │ -3k     │
│                 │ = 15k   │ = -18k  │ = 7k    │
├─────────────────┼─────────┼─────────┼─────────┤
│ TOTAL           │ 55k     │ -3k     │ -18k    │
│ BALANCE         │ 155k    │ 152k    │ 134k    │
└─────────────────┴─────────┴─────────┴─────────┘
```

### 2. Forecast Engine (`forecast-engine.ts`)

**Purpose:** Calculate cashflow data from raw project/milestone/cost data

```typescript
class ForecastEngine {
  constructor(
    private startDate: Date,
    private endDate: Date,
    private startingBalance: number
  ) {}

  async calculateForecast(organizationId: string) {
    // 1. Get all projects with milestones and costs
    const projects = await prisma.project.findMany({
      where: { organizationId },
      include: {
        milestones: true,
        costs: true
      }
    })

    // 2. Group by month
    const months = this.getMonthsBetween(this.startDate, this.endDate)
    
    // 3. For each project, for each month:
    //    - Sum milestones in that month
    //    - Sum costs in that month
    //    - Calculate net
    
    // 4. Calculate totals and running balance
    
    // 5. Return formatted data
  }
}
```

### 3. Xero Integration

**OAuth Flow:**
1. User clicks "Connect Xero" → redirects to `/api/xero/connect`
2. API generates OAuth URL and redirects to Xero
3. User authorizes, Xero redirects to `/api/xero/callback`
4. API exchanges code for tokens, saves to database
5. Redirect back to settings with success message

**Sync Flow:**
1. User clicks "Sync with Xero"
2. API calls `/api/xero/sync`
3. Fetch invoices from Xero → create/update milestones
4. Fetch bills from Xero → create/update costs
5. Return count of synced items

**Mapping:**
- Let user link projects to Xero tracking categories
- When syncing, only pull transactions with matching tracking category
- Store `xeroInvoiceId` and `xeroBillId` to avoid duplicates

---

## API Endpoints

### Projects
```
GET    /api/projects              # List all projects
POST   /api/projects              # Create project
GET    /api/projects/[id]         # Get project details
PATCH  /api/projects/[id]         # Update project
DELETE /api/projects/[id]         # Delete project
POST   /api/projects/[id]/milestones  # Add milestone
POST   /api/projects/[id]/costs   # Add cost
```

### Xero
```
GET    /api/xero/connect          # Initiate OAuth
GET    /api/xero/callback         # Handle OAuth
POST   /api/xero/sync             # Sync data from Xero
GET    /api/xero/tracking         # Get tracking categories
```

### Forecast
```
GET    /api/forecast              # Get forecast data
  Query params:
    - startDate: ISO date
    - endDate: ISO date
    - startingBalance: number
```

---

## Pages to Build

### 1. Main Forecast View (`/forecast`)
- No auth required (keep it simple!)
- Auto-create organization if doesn't exist
- Show forecast by project table
- Button to "Add Project"
- Button to "Connect Xero"
- Button to "Sync Xero"

### 2. Projects Page (`/projects`)
- List of projects in cards
- Each card shows: name, contract value, dates, milestone count, cost count
- Click to edit
- Button to delete (with confirmation)

### 3. Project Detail (`/projects/[id]`)
- Edit project basic info
- List of milestones (add/edit/delete)
- List of costs (add/edit/delete)
- Link to Xero tracking category

### 4. Xero Settings (`/settings/xero`)
- Connection status
- "Connect" button if not connected
- "Disconnect" button if connected
- "Sync Now" button
- Last sync timestamp
- Sync summary (X invoices, Y bills)

---

## Implementation Steps (In Order)

### Phase 1: Database & Basic Setup
1. Set up Next.js project
2. Install dependencies: `prisma`, `@prisma/client`, `tailwindcss`
3. Create Prisma schema
4. Run `npx prisma db push`
5. Set up environment variables

### Phase 2: Core CRUD (No UI Polish Yet)
1. Build projects API endpoints
2. Build simple project list page
3. Build project create/edit forms
4. Test CRUD operations work

### Phase 3: Forecast Calculation
1. Build `ForecastEngine` class
2. Create `/api/forecast` endpoint
3. Test calculation logic with mock data
4. Build `ForecastByProject` component
5. Wire up to API

### Phase 4: Xero Integration
1. Set up Xero app credentials
2. Build OAuth flow (connect, callback)
3. Build sync endpoint
4. Test with real Xero account
5. Add mapping for tracking categories

### Phase 5: Polish
1. Add loading states
2. Add error handling
3. Improve mobile responsiveness
4. Add tooltips/help text

---

## Environment Variables Needed

```env
# Database
DATABASE_URL="postgresql://..."

# Xero OAuth
XERO_CLIENT_ID="..."
XERO_CLIENT_SECRET="..."
XERO_REDIRECT_URI="https://your-domain.com/api/xero/callback"

# Next.js
NEXTAUTH_URL="https://your-domain.com"
NEXTAUTH_SECRET="random-secret-here"
```

---

## Key Decisions Made (Keep It Simple)

1. **No Authentication** - Single organization per deployment
2. **No User Management** - Just focus on the core feature
3. **No Complex Scenarios** - Just one forecast view
4. **No Reports** - Just the main table
5. **No Notifications** - Can add later if needed
6. **Cash Basis Only** - Simpler than cash + accrual
7. **6 Month View** - Fixed period, simple to understand

---

## What Makes This Simple

- **Single Main View**: Everything revolves around the forecast-by-project table
- **No Auth Complexity**: Auto-create organization on first visit
- **Minimal Database**: Only 5-6 tables
- **Straightforward Xero**: Just pull invoices and bills, that's it
- **No Over-Engineering**: Each file has one clear purpose
- **Easy to Understand**: A new developer can read the code and get it

---

## Success Criteria

A user should be able to:
1. Visit the app
2. Add a project with milestones and costs
3. See the cashflow forecast table
4. Connect their Xero account
5. Sync data from Xero
6. See updated forecast with Xero data

That's it. Nothing more.

---

## Estimated Effort

- **Phase 1**: 2 hours
- **Phase 2**: 4 hours
- **Phase 3**: 4 hours
- **Phase 4**: 6 hours
- **Phase 5**: 4 hours

**Total**: ~20 hours for a competent Next.js developer

---

## Next Steps

1. Create a new Next.js project: `npx create-next-app@latest builder-forecast --typescript --tailwind --app`
2. Follow the phases above in order
3. Test each phase before moving to the next
4. Don't add features not in this spec

Keep it simple. Focus on doing ONE thing really well: showing cashflow by project.

