// config/db.ts - DEBUG VERSION
import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

console.log("🔧 Loading database configuration...");

// Load environment variables
dotenv.config();

console.log("📋 Database environment check:");
console.log("- SUPABASE_HOST:", process.env.SUPABASE_HOST || 'MISSING');
console.log("- SUPABASE_DB:", process.env.SUPABASE_DB || 'MISSING'); 
console.log("- SUPABASE_USER:", process.env.SUPABASE_USER || 'MISSING');
console.log("- SUPABASE_PASSWORD:", process.env.SUPABASE_PASSWORD ? 'SET' : 'MISSING');
console.log("- SUPABASE_PORT:", process.env.SUPABASE_PORT || '5432 (default)');

// Check for required environment variables
const requiredEnvs = ['SUPABASE_HOST', 'SUPABASE_DB', 'SUPABASE_USER', 'SUPABASE_PASSWORD'];
const missingEnvs = requiredEnvs.filter(env => !process.env[env]);

if (missingEnvs.length > 0) {
  console.error(`❌ Missing environment variables: ${missingEnvs.join(', ')}`);
  throw new Error(`Missing required environment variables: ${missingEnvs.join(', ')}`);
}

console.log("🔧 Creating Sequelize instance...");

const sequelize = new Sequelize(
  process.env.SUPABASE_DB!,
  process.env.SUPABASE_USER!,
  process.env.SUPABASE_PASSWORD!,
  {
    host: process.env.SUPABASE_HOST,
    port: Number(process.env.SUPABASE_PORT) || 5432,
    dialect: 'postgres',
    
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    },
    
    pool: {
      max: 2,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    
    // Disable all logging for now
    logging: false,
  }
);

console.log("✅ Sequelize instance created");

export default sequelize;