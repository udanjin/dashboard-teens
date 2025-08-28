"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const sequelize = new sequelize_1.Sequelize({
    dialect: 'postgres',
    host: supabaseUrl,
    username: 'postgres',
    password: supabaseKey,
    database: 'postgres',
    dialectOptions: {
        ssl: {
            require: true,
            rejectUnauthorized: false
        }
    },
    logging: false
});
exports.default = sequelize;
