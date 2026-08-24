import app from './app.js';
import { env } from './config/env.js';
import { checkDbConnection } from './config/db.js';

const PORT = env.PORT;

async function bootstrap() {
  const dbConnected = await checkDbConnection();
  if (dbConnected) {
    console.log('✅ Connected to PostgreSQL database via Prisma.');
  } else {
    console.log('⚠️ Running without active PostgreSQL connection (resilient mode).');
  }

  app.listen(PORT, () => {
    console.log(`🚀 Social Media Content Analyzer Backend running on http://localhost:${PORT}`);
    console.log(`📡 Health Check: http://localhost:${PORT}/health`);
    console.log(`📄 API Base URL: http://localhost:${PORT}/api/v1/documents`);
  });
}

bootstrap().catch((err) => {
  console.error('Fatal Server Error:', err);
  process.exit(1);
});
