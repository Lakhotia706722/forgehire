#!/usr/bin/env node

/**
 * NeuronHire Setup Verification Script
 * Run this after installation to verify everything is set up correctly
 */

const fs = require('fs');
const path = require('path');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkFile(filePath, description) {
  const exists = fs.existsSync(filePath);
  if (exists) {
    log(`✓ ${description}`, 'green');
    return true;
  } else {
    log(`✗ ${description}`, 'red');
    return false;
  }
}

function checkDirectory(dirPath, description) {
  const exists = fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory();
  if (exists) {
    log(`✓ ${description}`, 'green');
    return true;
  } else {
    log(`✗ ${description}`, 'red');
    return false;
  }
}

async function main() {
  log('\n🔍 NeuronHire Setup Verification\n', 'blue');

  let allChecks = true;

  // Check monorepo structure
  log('📁 Checking Monorepo Structure...', 'yellow');
  allChecks &= checkDirectory('apps', 'apps/ directory');
  allChecks &= checkDirectory('apps/web', 'apps/web/ directory');
  allChecks &= checkDirectory('apps/api', 'apps/api/ directory');
  allChecks &= checkDirectory('packages', 'packages/ directory');
  allChecks &= checkDirectory('packages/shared', 'packages/shared/ directory');

  // Check configuration files
  log('\n⚙️  Checking Configuration Files...', 'yellow');
  allChecks &= checkFile('package.json', 'Root package.json');
  allChecks &= checkFile('turbo.json', 'Turbo configuration');
  allChecks &= checkFile('apps/api/package.json', 'API package.json');
  allChecks &= checkFile('apps/web/package.json', 'Web package.json');
  allChecks &= checkFile('packages/shared/package.json', 'Shared package.json');

  // Check Prisma schema
  log('\n🗄️  Checking Database Configuration...', 'yellow');
  allChecks &= checkFile('apps/api/prisma/schema.prisma', 'Prisma schema');

  // Check backend files
  log('\n🔧 Checking Backend Files...', 'yellow');
  allChecks &= checkFile('apps/api/src/index.ts', 'API entry point');
  allChecks &= checkFile('apps/api/src/config/env.ts', 'Environment validation');
  allChecks &= checkFile('apps/api/src/config/database.ts', 'Database config');
  allChecks &= checkFile('apps/api/src/config/redis.ts', 'Redis config');
  allChecks &= checkFile('apps/api/src/middleware/auth.ts', 'Auth middleware');
  allChecks &= checkFile('apps/api/src/middleware/rateLimiter.ts', 'Rate limiter');
  allChecks &= checkFile('apps/api/src/routes/auth.routes.ts', 'Auth routes');
  allChecks &= checkFile('apps/api/src/routes/health.routes.ts', 'Health routes');
  allChecks &= checkFile('apps/api/src/services/auth.service.ts', 'Auth service');

  // Check frontend files
  log('\n🎨 Checking Frontend Files...', 'yellow');
  allChecks &= checkFile('apps/web/src/app/layout.tsx', 'Root layout');
  allChecks &= checkFile('apps/web/src/app/page.tsx', 'Home page');
  allChecks &= checkFile('apps/web/src/middleware.ts', 'Clerk middleware');
  allChecks &= checkFile('apps/web/src/lib/api.ts', 'API client');
  allChecks &= checkFile('apps/web/next.config.js', 'Next.js config');
  allChecks &= checkFile('apps/web/tailwind.config.ts', 'Tailwind config');

  // Check shared package
  log('\n📦 Checking Shared Package...', 'yellow');
  allChecks &= checkFile('packages/shared/src/index.ts', 'Shared exports');
  allChecks &= checkFile('packages/shared/src/types/index.ts', 'Type definitions');
  allChecks &= checkFile('packages/shared/src/validators/index.ts', 'Validators');
  allChecks &= checkFile('packages/shared/src/utils/index.ts', 'Utilities');

  // Check tests
  log('\n🧪 Checking Test Files...', 'yellow');
  allChecks &= checkFile('apps/api/jest.config.js', 'Jest configuration');
  allChecks &= checkFile('apps/api/src/__tests__/setup.ts', 'Test setup');
  allChecks &= checkFile('apps/api/src/__tests__/middleware/auth.test.ts', 'Auth tests');
  allChecks &= checkFile('apps/api/src/__tests__/middleware/rateLimiter.test.ts', 'Rate limiter tests');

  // Check documentation
  log('\n📚 Checking Documentation...', 'yellow');
  allChecks &= checkFile('README.md', 'README');
  allChecks &= checkFile('QUICKSTART.md', 'Quick start guide');
  allChecks &= checkFile('SETUP.md', 'Setup guide');
  allChecks &= checkFile('ARCHITECTURE.md', 'Architecture docs');
  allChecks &= checkFile('SECURITY.md', 'Security docs');
  allChecks &= checkFile('MODULE_1_COMPLETION.md', 'Completion report');

  // Check environment examples
  log('\n🔐 Checking Environment Examples...', 'yellow');
  allChecks &= checkFile('.env.example', 'Root .env.example');
  allChecks &= checkFile('apps/api/.env.example', 'API .env.example');
  allChecks &= checkFile('apps/web/.env.example', 'Web .env.example');

  // Final summary
  log('\n' + '='.repeat(50), 'blue');
  if (allChecks) {
    log('✅ All checks passed! Setup is complete.', 'green');
    log('\nNext steps:', 'yellow');
    log('1. npm install', 'reset');
    log('2. Copy .env.example files and configure', 'reset');
    log('3. npm run db:generate', 'reset');
    log('4. npm run db:push', 'reset');
    log('5. npm run dev', 'reset');
  } else {
    log('❌ Some checks failed. Please review the output above.', 'red');
    process.exit(1);
  }
  log('='.repeat(50) + '\n', 'blue');
}

main().catch(console.error);
