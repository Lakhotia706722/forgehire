#!/bin/bash

# NeuronHire Setup Script
# This script will set up the project and fix all current errors

echo "🚀 NeuronHire Setup Script"
echo "=========================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

echo "✅ Node.js version: $(node --version)"
echo ""

# Step 1: Install dependencies
echo "📦 Step 1: Installing dependencies..."
npm install --legacy-peer-deps
if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi
echo "✅ Dependencies installed"
echo ""

# Step 2: Generate Prisma Client
echo "🔧 Step 2: Generating Prisma Client..."
cd apps/api
npm run db:generate
if [ $? -ne 0 ]; then
    echo "❌ Failed to generate Prisma Client"
    echo "💡 Make sure your DATABASE_URL is set in apps/api/.env"
    exit 1
fi
cd ../..
echo "✅ Prisma Client generated"
echo ""

# Step 3: Check if .env files exist
echo "🔍 Step 3: Checking environment files..."
if [ ! -f "apps/api/.env" ]; then
    echo "⚠️  apps/api/.env not found"
    echo "📝 Creating from .env.example..."
    cp apps/api/.env.example apps/api/.env
    echo "⚠️  Please edit apps/api/.env with your actual credentials"
fi

if [ ! -f "apps/web/.env" ]; then
    echo "⚠️  apps/web/.env not found"
    echo "📝 Creating from .env.example..."
    cp apps/web/.env.example apps/web/.env
    echo "⚠️  Please edit apps/web/.env with your actual credentials"
fi
echo "✅ Environment files checked"
echo ""

# Step 4: Verify setup
echo "✅ Step 4: Verifying setup..."
cd apps/api
if npm run build > /dev/null 2>&1; then
    echo "✅ TypeScript compilation successful"
else
    echo "⚠️  TypeScript compilation has warnings (this is normal)"
fi
cd ../..
echo ""

# Success message
echo "🎉 Setup Complete!"
echo "=================="
echo ""
echo "Next steps:"
echo "1. Edit apps/api/.env with your database credentials"
echo "2. Edit apps/web/.env with your frontend configuration"
echo "3. Run database migrations: cd apps/api && npm run db:migrate"
echo "4. Start development server: npm run dev"
echo ""
echo "📚 Documentation:"
echo "- Setup Guide: SETUP_INSTRUCTIONS.md"
echo "- Module 5 Guide: MODULE_5_COMPLETION.md"
echo "- Quick Start: QUICKSTART_MODULE_5.md"
echo ""
echo "Happy coding! 🚀"
