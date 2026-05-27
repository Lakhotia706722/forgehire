const { PrismaClient } = require('@prisma/client');

async function test() {
  const prisma = new PrismaClient();
  try {
    // Just try to connect
    await prisma.$connect();
    console.log('✅ Database connected successfully!');
    
    // Try to count users (even if table doesn't exist, it will tell us)
    try {
      const count = await prisma.user.count();
      console.log('✅ Users table exists, count:', count);
    } catch (e) {
      console.log('⚠️ Users table does not exist (expected - migrations needed)');
    }
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Database connection failed:', err.message);
    process.exit(1);
  }
}

test();
