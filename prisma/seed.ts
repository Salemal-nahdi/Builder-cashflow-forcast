import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Create demo organization
  const organization = await prisma.organization.upsert({
    where: { id: 'demo-org-1' },
    update: {},
    create: {
      id: 'demo-org-1',
      name: 'Demo Construction Company',
    },
  })

  // Create demo users with passwords
  const hashedPassword = await bcrypt.hash('demo123', 12)
  
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@demo.com' },
    update: { password: hashedPassword },
    create: {
      email: 'admin@demo.com',
      name: 'Admin User',
      password: hashedPassword,
      organizationId: organization.id,
    },
  })

  const pmUser = await prisma.user.upsert({
    where: { email: 'pm@demo.com' },
    update: { password: hashedPassword },
    create: {
      email: 'pm@demo.com',
      name: 'Project Manager',
      password: hashedPassword,
      organizationId: organization.id,
    },
  })

  const financeUser = await prisma.user.upsert({
    where: { email: 'finance@demo.com' },
    update: { password: hashedPassword },
    create: {
      email: 'finance@demo.com',
      name: 'Finance Manager',
      password: hashedPassword,
      organizationId: organization.id,
    },
  })

  // Create role assignments
  await prisma.roleAssignment.upsert({
    where: { id: 'role-1' },
    update: {},
    create: {
      id: 'role-1',
      userId: adminUser.id,
      role: 'management',
    },
  })

  await prisma.roleAssignment.upsert({
    where: { id: 'role-2' },
    update: {},
    create: {
      id: 'role-2',
      userId: pmUser.id,
      role: 'pm',
    },
  })

  await prisma.roleAssignment.upsert({
    where: { id: 'role-3' },
    update: {},
    create: {
      id: 'role-3',
      userId: financeUser.id,
      role: 'finance',
    },
  })

  // Create organization settings
  await prisma.organizationSettings.upsert({
    where: { organizationId: organization.id },
    update: {},
    create: {
      organizationId: organization.id,
      primaryColor: '#3B82F6',
      secondaryColor: '#1E40AF',
      defaultRetentionPercentage: 5.0,
      defaultRetentionReleaseDays: 84,
      defaultForecastMonths: 24,
      digestFrequency: 'weekly',
      digestDay: 1,
    },
  })

  // Create project groups
  const residentialGroup = await prisma.projectGroup.upsert({
    where: { id: 'group-1' },
    update: {},
    create: {
      id: 'group-1',
      organizationId: organization.id,
      name: 'Residential',
      description: 'Residential construction projects',
      color: '#10B981',
    },
  })

  const commercialGroup = await prisma.projectGroup.upsert({
    where: { id: 'group-2' },
    update: {},
    create: {
      id: 'group-2',
      organizationId: organization.id,
      name: 'Commercial',
      description: 'Commercial construction projects',
      color: '#F59E0B',
    },
  })

  // Create demo projects
  const project1 = await prisma.project.upsert({
    where: { id: 'project-1' },
    update: {},
    create: {
      id: 'project-1',
      organizationId: organization.id,
      name: 'Smith Family Home',
      description: 'Custom residential home construction',
      contractValue: 450000,
      startDate: new Date('2024-01-15'),
      endDate: new Date('2024-08-15'),
      status: 'active',
      retentionPercentage: 5.0,
      retentionReleaseDays: 84,
      projectGroupId: residentialGroup.id,
    },
  })

  const project2 = await prisma.project.upsert({
    where: { id: 'project-2' },
    update: {},
    create: {
      id: 'project-2',
      organizationId: organization.id,
      name: 'Office Complex Renovation',
      description: 'Commercial office building renovation',
      contractValue: 750000,
      startDate: new Date('2024-02-01'),
      endDate: new Date('2024-12-01'),
      status: 'active',
      retentionPercentage: 5.0,
      retentionReleaseDays: 84,
      projectGroupId: commercialGroup.id,
    },
  })

  // Create base scenario
  const baseScenario = await prisma.scenario.upsert({
    where: { id: 'scenario-base' },
    update: {},
    create: {
      id: 'scenario-base',
      organizationId: organization.id,
      name: 'Base Forecast',
      description: 'Base scenario with current project timelines',
      isBase: true,
    },
  })

  // Create demo milestones
  const milestones = [
    {
      id: 'milestone-1',
      projectId: project1.id,
      name: 'Foundation Complete',
      description: 'Concrete foundation and footings',
      contractValue: 450000,
      percentage: 15.0,
      expectedDate: new Date('2024-02-15'),
      status: 'paid',
    },
    {
      id: 'milestone-2',
      projectId: project1.id,
      name: 'Frame Complete',
      description: 'Structural framing and roof',
      contractValue: 450000,
      percentage: 25.0,
      expectedDate: new Date('2024-04-01'),
      status: 'invoiced',
    },
    {
      id: 'milestone-3',
      projectId: project1.id,
      name: 'Lock-up',
      description: 'Windows, doors, and external cladding',
      contractValue: 450000,
      percentage: 20.0,
      expectedDate: new Date('2024-05-15'),
      status: 'pending',
    },
    {
      id: 'milestone-4',
      projectId: project1.id,
      name: 'Practical Completion',
      description: 'Final completion and handover',
      contractValue: 450000,
      percentage: 35.0,
      expectedDate: new Date('2024-08-15'),
      status: 'pending',
    },
  ]

  for (const milestone of milestones) {
    await prisma.milestone.upsert({
      where: { id: milestone.id },
      update: {},
      create: milestone,
    })
  }

  // Create demo forecast lines (overhead)
  const overheadLines = [
    {
      id: 'forecast-1',
      organizationId: organization.id,
      name: 'Office Rent',
      description: 'Monthly office rent',
      type: 'outgo',
      frequency: 'monthly',
      baseAmount: 3500,
      inflationRate: 0.03,
      startDate: new Date('2024-01-01'),
      isOverhead: true,
      vendorName: 'Property Management Co',
    },
    {
      id: 'forecast-2',
      organizationId: organization.id,
      name: 'Insurance',
      description: 'Annual business insurance',
      type: 'outgo',
      frequency: 'once',
      baseAmount: 12000,
      inflationRate: 0.05,
      startDate: new Date('2024-03-01'),
      isOverhead: true,
      vendorName: 'Insurance Co',
    },
    {
      id: 'forecast-3',
      organizationId: organization.id,
      name: 'Payroll',
      description: 'Weekly payroll',
      type: 'outgo',
      frequency: 'weekly',
      baseAmount: 8500,
      escalationRate: 0.04,
      startDate: new Date('2024-01-01'),
      isOverhead: true,
      vendorName: 'Payroll',
    },
  ]

  for (const line of overheadLines) {
    await prisma.forecastLine.upsert({
      where: { id: line.id },
      update: {},
      create: line,
    })
  }

  // Create notification rules
  const notificationRules = [
    {
      id: 'rule-1',
      organizationId: organization.id,
      name: 'Late Receipt Alert',
      description: 'Alert when payments are overdue',
      triggerType: 'late_receipt',
      conditions: { daysOverdue: 7 },
      emailEnabled: true,
    },
    {
      id: 'rule-2',
      organizationId: organization.id,
      name: 'Upcoming Large Outflow',
      description: 'Alert before large payments',
      triggerType: 'upcoming_outflow',
      conditions: { amountThreshold: 10000, daysAhead: 3 },
      emailEnabled: true,
    },
    {
      id: 'rule-3',
      organizationId: organization.id,
      name: 'Negative Balance Warning',
      description: 'Alert when balance goes negative',
      triggerType: 'negative_balance',
      conditions: {},
      emailEnabled: true,
    },
  ]

  for (const rule of notificationRules) {
    await prisma.notificationRule.upsert({
      where: { id: rule.id },
      update: {},
      create: rule,
    })
  }

  console.log('✅ Database seeded successfully!')
  console.log('👤 Demo users created (Password: demo123):')
  console.log('  - admin@demo.com (Management)')
  console.log('  - pm@demo.com (Project Manager)')
  console.log('  - finance@demo.com (Finance)')
  console.log('🏗️ Demo projects created:')
  console.log('  - Smith Family Home ($450k)')
  console.log('  - Office Complex Renovation ($750k)')
  console.log('')
  console.log('🔑 Login Credentials:')
  console.log('  Email: admin@demo.com')
  console.log('  Password: demo123')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
