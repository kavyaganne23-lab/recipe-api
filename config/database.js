// config/database.js
require('dotenv').config();
const { Sequelize } = require('sequelize');

// Use DATABASE_URL from Render, fall back to local .env for development
const connectionString = process.env.DATABASE_URL || `postgres://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`;

const sequelize = new Sequelize(connectionString, {
  dialect: 'postgres',
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false // Required for Render connections
    }
  },
  logging: false,
});

module.exports = sequelize;