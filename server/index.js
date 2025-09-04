const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5001; // Use port 5001 for the server

// Middleware
app.use(cors()); // Allows requests from frontend
app.use(express.json()); // Allows the server to accept JSON data

// Basic route to test the server
app.get('/', (req, res) => {
  res.send('GSU Panther Marketplace API is running! 🚀');
});

app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});