# Builder Forecasting Software

A comprehensive cashflow forecasting and project management application designed specifically for construction builders, with seamless Xero integration.

## 🚀 Features

### Core Functionality
- **Xero Integration**: Direct connection to Xero for automatic project, invoice, and payment synchronization
- **Cashflow Forecasting**: Intelligent forecasting with monthly/weekly views and scenario planning
- **Project Management**: Track milestones, supplier claims, and material orders
- **Variance Analysis**: Compare actual vs forecasted cash movements with confidence scoring
- **Retention Management**: Model retention payments with configurable release schedules
- **Scenario Planning**: Create "what-if" scenarios with date shifts and amount adjustments

### Key Capabilities
- **Real-time Sync**: Automatic synchronization with Xero every 15 minutes
- **Smart Matching**: Auto-match actual transactions to forecasted events
- **Visual Timeline**: Interactive charts showing cash in/out and net position
- **Risk Alerts**: Email notifications for late payments and cashflow risks
- **Export Reports**: CSV and branded PDF exports for stakeholders
- **Role-based Access**: Different permissions for PMs, Finance, and Management

## 🛠 Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Server Actions
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js with email magic links
- **Charts**: ECharts for interactive visualizations
- **Background Jobs**: Inngest for sync operations and notifications
- **PDF Generation**: Puppeteer for server-side report generation

## 📋 Prerequisites

- Node.js 18+ 
- PostgreSQL database
- Xero Developer Account
- SMTP email service (for notifications)

## ✅ Production Ready

This application is **production ready** with enterprise-grade features:

### 🔒 Security & Compliance
- **WCAG 2.1 AA Accessibility**: Full screen reader support, keyboard navigation
- **Enterprise Security**: CSP headers, rate limiting, input sanitization, XSS protection
- **Data Protection**: Encrypted storage, audit logging, secure authentication

### 📊 Observability & Performance
- **Comprehensive Monitoring**: Real-time logging, metrics, error tracking
- **Performance Tracking**: Core Web Vitals, resource monitoring, memory tracking
- **Health Checks**: System health endpoints at `/api/admin/health`
- **Admin Dashboard**: Live observability at `/admin/observability`

### 🎯 Interactive Demo
Try the **live interactive demo** at `/demo` featuring:
- **Milestone-based Progress Payments**: Edit payment amounts and schedules
- **Real-time Cost Management**: Adjust costs and see instant forecast updates  
- **Dynamic Cashflow Charts**: Visual updates as you modify project parameters
- **Margin Analysis**: Live profit margin calculations per milestone

### 🔄 Advanced Xero Integration
- **Incremental Sync**: Background job processing with retry logic
- **Auto-reconciliation**: Smart matching of actuals to forecasts
- **Rate Limit Handling**: Intelligent backoff and retry strategies

## 🚀 Quick Start

1. **Clone and Install**
   ```bash
   git clone <repository-url>
   cd builder-forecasting-software
   npm install
   ```

2. **Environment Setup**
   ```bash
   cp env.example .env.local
   ```
   
   Fill in your environment variables:
   ```env
   # Database
   DATABASE_URL="postgresql://username:password@localhost:5432/builder_forecasting"
   
   # NextAuth
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="your-secret-key-here"
   
   # Xero OAuth
   XERO_CLIENT_ID="your-xero-client-id"
   XERO_CLIENT_SECRET="your-xero-client-secret"
   XERO_REDIRECT_URI="http://localhost:3000/api/xero/connect"
   
   # Email (for notifications)
   SMTP_HOST="smtp.gmail.com"
   SMTP_PORT="587"
   SMTP_USER="your-email@gmail.com"
   SMTP_PASS="your-app-password"
   ```

3. **Database Setup**
   ```bash
   npm run db:generate
   npm run db:push
   npm run db:seed
   ```

4. **Start Development Server**
   ```bash
   npm run dev
   ```

5. **Access the Application**
   Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📊 Data Model

### Core Entities
- **Organization**: Top-level entity for multi-tenant support
- **User**: Authentication and role management
- **Project**: Maps to Xero tracking categories or projects
- **ForecastLine**: Recurring income/expense items with inflation
- **Milestone**: Project progress payments with retention
- **SupplierClaim**: Subcontractor and supplier payments
- **MaterialOrder**: Material purchases and deliveries
- **Scenario**: What-if analysis with date/amount shifts
- **CashEvent**: Generated forecast events
- **VarianceMatch**: Links forecast to actual transactions

### Key Relationships
- Projects belong to Organizations and ProjectGroups
- Milestones, Claims, and Orders belong to Projects
- CashEvents are generated from all forecast sources
- Scenarios can shift any forecast item
- VarianceMatches reconcile forecast vs actual

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/signin` - Email magic link authentication
- `GET /api/auth/callback/xero` - Xero OAuth callback

### Xero Integration
- `GET /api/xero/connect` - Initiate Xero connection
- `POST /api/xero/sync` - Trigger data synchronization

### Forecast Engine
- `GET /api/forecast` - Get forecast data for organization
- `POST /api/forecast/generate` - Regenerate forecast events
- `GET /api/forecast/summary` - Get cashflow summary

### Scenarios
- `GET /api/scenarios` - List all scenarios
- `POST /api/scenarios` - Create new scenario
- `PUT /api/scenarios/[id]` - Update scenario
- `POST /api/scenarios/[id]/shifts` - Add scenario shifts

## 🎯 Usage Guide

### 1. Initial Setup
1. Sign up with email magic link
2. Connect your Xero account
3. Run initial sync to import projects and transactions
4. Configure organization settings and branding

### 2. Project Management
1. Review imported projects from Xero
2. Add missing milestones and supplier claims
3. Set up material orders and delivery schedules
4. Configure retention rules per project

### 3. Forecasting
1. Create forecast lines for recurring items (rent, payroll, etc.)
2. Set inflation and escalation rates
3. Generate base forecast
4. Create scenarios for different outcomes

### 4. Monitoring
1. Review variance reports weekly
2. Set up notification rules for alerts
3. Export reports for stakeholders
4. Adjust forecasts based on actual performance

## 🔒 Security

- **Authentication**: NextAuth.js with secure session management
- **Authorization**: Role-based access control (RBAC)
- **Data Protection**: Encrypted tokens, row-level security
- **API Security**: Rate limiting, input validation
- **Compliance**: Data residency options, audit logging

## 📈 Performance

- **Database**: Optimized queries with proper indexing
- **Caching**: Redis for session and API response caching
- **Background Jobs**: Async processing for heavy operations
- **CDN**: Static asset optimization
- **Monitoring**: Error tracking and performance metrics

## 🚀 Deployment

### Production Checklist
- [ ] Set up PostgreSQL database
- [ ] Configure Redis for caching
- [ ] Set up SMTP service
- [ ] Configure Xero OAuth credentials
- [ ] Set up monitoring and logging
- [ ] Configure backup strategy
- [ ] Set up SSL certificates
- [ ] Configure domain and DNS

### Environment Variables
Ensure all production environment variables are set:
- Database connection string
- NextAuth configuration
- Xero OAuth credentials
- SMTP settings
- Redis connection
- Monitoring keys

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Contact the development team

## 🔮 Roadmap

### Phase 1 (Current)
- [x] Core forecasting engine
- [x] Xero integration
- [x] Basic UI and authentication
- [x] Project management

### Phase 2 (Next)
- [ ] Advanced scenario planning
- [ ] Mobile app
- [ ] Advanced reporting
- [ ] Multi-currency support

### Phase 3 (Future)
- [ ] AI-powered insights
- [ ] Integration with other accounting systems
- [ ] Advanced analytics
- [ ] White-label solutions
