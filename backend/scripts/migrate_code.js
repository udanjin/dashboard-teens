const { Sequelize } = require('sequelize');

async function migrate() {
  const sequelize = new Sequelize('postgresql://postgres:postgres@localhost:5432/dashboard_teens', { logging: false });
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
