const express = require('express');
const cors = require('cors');
const sequelize = require('./config/database');
const Recipe = require('./models/Recipe');
const { Op } = require('sequelize');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// This line serves the frontend files (index.html, app.js)
app.use(express.static('public'));

// API Endpoint 1: Get All Recipes (Paginated and Sorted by Rating)
app.get('/api/recipes', async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  try {
    const { count, rows } = await Recipe.findAndCountAll({
      limit: limit,
      offset: offset,
      order: [['rating', 'DESC']]
    });

    res.json({
      page: page,
      limit: limit,
      total: count,
      data: rows
    });
  } catch (error) {
    res.status(500).json({ error: 'An error occurred while fetching recipes.' });
  }
});

// API Endpoint 2: Search Recipes
app.get('/api/recipes/search', async (req, res) => {
  const { calories, title, cuisine, total_time, rating } = req.query;
  const where = {};

  // Title search (partial match, case-insensitive)
  if (title) {
    where.title = { [Op.iLike]: `%${title}%` };
  }
  // Cuisine search (partial match, case-insensitive)
  if (cuisine) {
    where.cuisine = { [Op.iLike]: `%${cuisine}%` };
  }

  // Helper function for building range queries (e.g., gte:4.5)
  const buildRangeQuery = (value) => {
    if (!value) return null;
    const [operator, num] = value.split(':');
    const parsedNum = parseFloat(num);
    if (!['gte', 'lte', 'eq'].includes(operator) || isNaN(parsedNum)) {
      return null;
    }
    return { [Op[operator]]: parsedNum };
  };
  
  const ratingQuery = buildRangeQuery(rating);
  if (ratingQuery) where.rating = ratingQuery;

  const timeQuery = buildRangeQuery(total_time);
  if (timeQuery) where.total_time = timeQuery;

  // Corrected Calories Filter
  if (calories) {
     // This performs a text-based search on the calorie value within the JSONB field.
     // Example: searching for "389" would match "389 kcal"
    where[sequelize.literal(`"nutrients"->>'calories'`)] = { [Op.iLike]: `%${calories}%` };
  }

  try {
    const recipes = await Recipe.findAll({ where });
    res.json({ data: recipes });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred during the search.' });
  }
});


const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connection has been established successfully.');
    await sequelize.sync(); // Sync models with the database
    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
};

// API Endpoint 3: Create a New Recipe
app.post('/api/recipes', async (req, res) => {
  try {
    // We get the new recipe data from the request body
    const newRecipeData = req.body;

    // Basic validation to ensure a title is present
    if (!newRecipeData.title) {
      return res.status(400).json({ error: 'Recipe title is required.' });
    }

    const recipe = await Recipe.create(newRecipeData);
    
    // Send back a success message and the created recipe
    res.status(201).json({
      message: 'Recipe created successfully!',
      data: recipe
    });
  } catch (error) {
    console.error('Error creating recipe:', error);
    res.status(500).json({ error: 'An error occurred while creating the recipe.' });
  }
});

startServer();