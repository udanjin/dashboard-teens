import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const sequelize = new Sequelize(
  process.env.SUPABASE_DB!,
  process.env.SUPABASE_USER!,
  process.env.SUPABASE_PASSWORD!,
  {
    host: process.env.SUPABASE_HOST,
    port: Number(process.env.SUPABASE_PORT),
    dialect: 'postgres',
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
