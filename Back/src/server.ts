import { app } from './app';

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`  Lunchbox Delivery API Server Running               `);
  console.log(`  Local: http://localhost:${PORT}/api               `);
  console.log(`====================================================`);
});
