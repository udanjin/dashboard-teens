// config/db.ts - VERSI FINAL UNTUK LOKAL & PRODUKSI

import { Sequelize } from 'sequelize';
import pg from 'pg';

// 💡 Cek apakah kita TIDAK sedang dalam mode 'production'
if (process.env.NODE_ENV !== 'production') {
  // Jika ini BUKAN produksi (misalnya, di komputer lokal Anda),
  // maka kita panggil dotenv untuk memuat file .env
  console.log('Running in development mode, loading .env file...');
  require('dotenv').config();
}

// Validasi: Pastikan semua variabel yang dibutuhkan tersedia
const requiredEnvs = ['SUPABASE_HOST', 'SUPABASE_DB', 'SUPABASE_USER', 'SUPABASE_PASSWORD'];
requiredEnvs.forEach(env => {
  if (!process.env[env]) {
    // Aplikasi akan berhenti jika ada variabel yang hilang
    throw new Error(`❌ FATAL ERROR: Missing environment variable: ${env}`);
  }
});

console.log("Initializing Sequelize for host:", process.env.SUPABASE_HOST);

const sequelize = new Sequelize(
  process.env.SUPABASE_DB!,
  process.env.SUPABASE_USER!,
  process.env.SUPABASE_PASSWORD!,
  {
    host: process.env.SUPABASE_HOST,
    port: Number(process.env.SUPABASE_PORT) || 5432,
    dialect: 'postgres',
    dialectModule: pg,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    },
    pool: {
      // Atur pool berdasarkan lingkungan
      max: process.env.NODE_ENV === 'production' ? 5 : 1,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    logging: process.env.NODE_ENV !== 'production', // Tampilkan log SQL hanya di lokal
  }
);

export default sequelize;