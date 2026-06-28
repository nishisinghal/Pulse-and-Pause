const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  try {
    const logs = await prisma.movementLog.findMany();
    console.log('Movement Logs:', logs);
  } catch (err) {
    console.error('Error fetching logs:', err);
  } finally {
    await prisma.$disconnect();
  }
}
run();
