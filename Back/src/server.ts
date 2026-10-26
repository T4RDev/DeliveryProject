import { app } from './app';
import { testConnection } from './dbconnect';

const PORT = process.env.PORT || 3000;

app.listen(PORT, async () => {
  console.log(`====================================================`);
  console.log(`  Lunchbox Delivery API Server Running               `);
  console.log(`  Local: http://localhost:${PORT}/api               `);
  console.log(`====================================================`);
  await testConnection();
});
