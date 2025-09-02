import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config();

// Validation
const requiredEnvs = ['SUPABASE_HOST', 'SUPABASE_DB', 'SUPABASE_USER', 'SUPABASE_PASSWORD'];
requiredEnvs.forEach(env => {
  if (!process.env[env]) {
    console.error(`❌ Missing environment variable: ${env}`);
  }
});

console.log("Connecting to:", process.env.SUPABASE_HOST);

const sequelize = new Sequelize(
  process.env.SUPABASE_DB!,
  process.env.SUPABASE_USER!,
  process.env.SUPABASE_PASSWORD!,
  {
    host: process.env.SUPABASE_HOST,
    port: Number(process.env.SUPABASE_PORT) || 6543, // Default to 6543 for pooler
    dialect: 'postgres',
    dialectModule: pg,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    },
    pool: {
      max: 1,        // Max 1 untuk serverless
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    logging: false,
  }
);

export default sequelize;