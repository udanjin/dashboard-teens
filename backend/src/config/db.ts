import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config();

const sequelize = new Sequelize(
  process.env.SUPABASE_DB!,
  process.env.SUPABASE_USER!,
  process.env.SUPABASE_PASSWORD!,
  {
    host: process.env.SUPABASE_HOST,
    port: Number(process.env.SUPABASE_PORT),
    dialect: 'postgres',
    dialectModule: pg,
    dialectOptions: {
      ssl: process.env.NODE_ENV === 'production' ?{
        require: true,
        rejectUnauthorized: false
      } :false
    },
    logging:  process.env.NODE_ENV === 'development' ? console.log : false,
  }
);

export default sequelize;
