import dotenv from 'dotenv';
dotenv.config();

import sequelize from '../src/config/db';

async function migrate() {
  try {
    await sequelize.authenticate();
    console.log('Connection has been established successfully.');
    
    await sequelize.query(`UPDATE sport_report SET code = 'Pelayan' WHERE code = 'P'`);
    await sequelize.query(`UPDATE sport_report SET code = 'Anak' WHERE code = 'A'`);
    console.log('Migration complete.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  } finally {
    await sequelize.close();
  }
}

migrate();
