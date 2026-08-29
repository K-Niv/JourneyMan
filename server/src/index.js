import app from './app.js';
import { config } from './config/env.js';
import prisma from './lib/prisma.js';

const server = app.listen(config.port, () => {
  console.log(`🚀 JourneyMan Express Server running on port ${config.port} [${config.nodeEnv}]`);
});

/**
 * Graceful shutdown handler
 */
const gracefulShutdown = async (signal) => {
  console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`);
  server.close(async () => {
    console.log('🔒 Closed HTTP server.');
    try {
      await prisma.$disconnect();
      console.log('🔌 Disconnected Prisma database client.');
      process.exit(0);
    } catch (err) {
      console.error('❌ Error during Prisma disconnect:', err);
      process.exit(1);
    }
  });

  // Force close if graceful shutdown takes longer than 10 seconds
  setTimeout(() => {
    console.error('⚠️ Forcefully terminating server after timeout.');
    process.exit(1);
  }, 10000).unref();
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
