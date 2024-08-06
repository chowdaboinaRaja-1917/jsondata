const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const jsonServer = require('json-server');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 8080;

// Create a json-server instance
const router = jsonServer.router('db.json');
const middlewares = jsonServer.defaults();

// Use middlewares
app.use(bodyParser.json());
app.use(middlewares);

// Custom endpoint to handle POST requests
app.post('/requests', async (req, res) => {
  try {
    const newRequest = req.body;

    // Update local db.json
    const db = JSON.parse(fs.readFileSync('db.json', 'utf-8'));
    db.requests.push(newRequest);
    fs.writeFileSync('db.json', JSON.stringify(db, null, 2));

    // Update GitHub
    await updateDataOnGitHub(db);

    res.status(201).send(newRequest);
  } catch (error) {
    res.status(500).send({ error: 'Failed to create new request' });
  }
});

// Use json-server router
app.use('/api', router); // Prefix all routes with `/api`

app.listen(port, () => {
  console.log(`JSON Server is running on port ${port}`);
});
