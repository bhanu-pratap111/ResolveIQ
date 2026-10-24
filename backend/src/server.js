require('dotenv').config();
const app = require('./app');
const { testConnection } = require('./config/database');
const { startDeadlineJob } = require('./jobs/deadline.job');

const PORT = process.env.PORT || 5000;

async function start() {
  await testConnection();
  startDeadlineJob();

  app.listen(PORT, () => {
    console.log(`\n🚀 ResolveIQ API Server running on port ${PORT}`);
    console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`   Health: http://localhost:${PORT}/api/health\n`);
  });
}

start().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

