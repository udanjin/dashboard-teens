import { Sequelize } from "sequelize";
import dotenv from "dotenv";

dotenv.config();

const requiredEnvs = ["SUPABASE_HOST", "SUPABASE_DB", "SUPABASE_USER", "SUPABASE_PASSWORD"];
const missingEnvs = requiredEnvs.filter((env) => !process.env[env]);

if (missingEnvs.length > 0) {
  throw new Error(`Missing required environment variables: ${missingEnvs.join(", ")}`);
}

const sequelize = new Sequelize(
  process.env.SUPABASE_DB!,
  process.env.SUPABASE_USER!,
  process.env.SUPABASE_PASSWORD!,
  {
    host: process.env.SUPABASE_HOST,
    port: Number(process.env.SUPABASE_PORT) || 5432,
    dialect: "postgres",
    dialectOptions: {
      ssl: { require: true, rejectUnauthorized: false },
    },
    pool: { max: 5, min: 0, acquire: 30000, idle: 10000 },
    logging: false,
  },
);

export default sequelize;
