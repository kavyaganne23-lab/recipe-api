// scripts/populateDb.js
const fs = require('fs');
const path = require('path'); // Corrected line
const sequelize = require('../config/database');
const Recipe = require('../models/Recipe');

const filePath = path.join(__dirname, '..', 'data', 'recipes.json');

const cleanAndParse = (value) => {
  if (value === 'NaN' || value === null || typeof value === 'undefined') {
    return null;
  }
  const parsed = parseFloat(value);
  return isNaN(parsed) ? null : parsed;
};

const populateDatabase = async () => {
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    if (!data) {
      console.error('Error: recipes.json is empty. Please add the recipe data to the file.');
      return;
    }
    const recipes = JSON.parse(data);

    await sequelize.sync({ force: true }); // This will drop the table if it already exists

    for (const recipeData of recipes) {
      await Recipe.create({
        cuisine: recipeData.cuisine,
        title: recipeData.title,
        rating: cleanAndParse(recipeData.rating),
        prep_time: cleanAndParse(recipeData.prep_time),
        cook_time: cleanAndParse(recipeData.cook_time),
        total_time: cleanAndParse(recipeData.total_time),
        description: recipeData.description,
        nutrients: recipeData.nutrients,
        serves: recipeData.serves
      });
    }

    console.log('Database populated successfully with recipes!');
  } catch (error) {
    console.error('Error populating database:', error);
  } finally {
    await sequelize.close();
  }
};

populateDatabase();