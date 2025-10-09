#!/usr/bin/env node

// Simple script to run Prisma migrations
const { execSync } = require('child_process');

console.log('🚀 Running Prisma migrations...');

try {
  console.log('📊 Pushing database schema...');
  execSync('npx prisma db push --accept-data-loss', { stdio: 'inherit' });
  
  console.log('🔧 Generating Prisma client...');
  execSync('npx prisma generate', { stdio: 'inherit' });
  
  console.log('✅ Migrations completed successfully!');
  console.log('🎉 Database tables should now be created.');
  
} catch (error) {
  console.error('❌ Migration failed:', error.message);
  process.exit(1);
}
