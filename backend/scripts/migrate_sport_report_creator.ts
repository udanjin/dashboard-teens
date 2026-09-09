import sequelize from "../src/config/db";
import { DataTypes } from "sequelize";

async function run() {
  try {
    console.log("Connecting to database...");
    await sequelize.authenticate();
    console.log("Connected successfully.");

    const queryInterface = sequelize.getQueryInterface();
    
    // Check if column exists first
    const tableInfo = await queryInterface.describeTable("sport_report");
    if (tableInfo.createdById) {
      console.log("Column 'createdById' already exists. Skipping.");
    } else {
      console.log("Adding column 'createdById' to 'sport_report' table...");
      await queryInterface.addColumn("sport_report", "createdById", {
        type: DataTypes.INTEGER,
        allowNull: true,
      });
      console.log("Column added successfully!");
    }
  } catch (error) {
    console.error("Failed to migrate database:", error);
    process.exit(1);
  }
  process.exit(0);
}

run();
