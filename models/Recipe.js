// models/Recipe.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Recipe = sequelize.define('Recipe', {
  cuisine: {
    type: DataTypes.STRING, // [cite: 64]
  },
  title: {
    type: DataTypes.STRING, // [cite: 65]
    allowNull: false
  },
  rating: {
    type: DataTypes.FLOAT // [cite: 66]
  },
  prep_time: {
    type: DataTypes.INTEGER // [cite: 67]
  },
  cook_time: {
    type: DataTypes.INTEGER // [cite: 68]
  },
  total_time: {
    type: DataTypes.INTEGER // [cite: 69]
  },
  description: {
    type: DataTypes.TEXT // [cite: 70]
  },
  nutrients: {
    type: DataTypes.JSONB // [cite: 71]
  },
  serves: {
    type: DataTypes.STRING // [cite: 72]
  }
}, {
  // Model options
  timestamps: true, // Automatically adds createdAt and updatedAt fields
});

module.exports = Recipe;