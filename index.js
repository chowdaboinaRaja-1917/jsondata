const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const jsonServer = require('json-server');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 8080;
const server = jsonServer.create();
const router = jsonServer.router('db.json');
const middlewares = jsonServer.defaults();

// GitHub repository details
const owner = 'your-github-username';
const repo = 'your-repository';
const path = 'db.json';
const branch = 'main';
const token = process.env.GITHUB_TOKEN;

app.use(bodyParser.json());
app.use(middlewares);

// Function to get data from GitHub
async function getDataFromGitHub() {
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${branch}`;
  const headers = {
    Authorization: `token ${token}`,
    Accept: 'application/vnd.github.v3.raw',
  };

  const response = await axios.get(url, { headers });
  return JSON.parse(response.data);
}

// Function to update data on GitHub
async function updateDataOnGitHub(data) {
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
  const headers = {
    Authorization: `token ${token}`,
    Accept: 'application/vnd.github.v3+json',
  };

  const currentContent = await axios.get(url, { headers });
  const sha = currentContent.data.sha;

  const content = Buffer.from(JSON.stringify(data, null, 2)).toString('base64');

  await axios.put(url, {
    message: 'Update db.json',
    content,
    sha,
    branch,
  }, { headers });
}

// Handle POST requests to create new data
app.post('/requests', async (req, res) => {
  try {
    const newRequest = req.body;

    // Update local db.json
    const db = JSON.parse(fs.readFileSync('db.json', 'utf-8'));
    db.requests.push(newRequest);
    fs.writeFileSync('db.json', JSON.stringify(db, null, 2));

    // Update GitHub
    await updateDataOnGitHub(db);

    // Update JSON server (Render link)
    const renderUrl = 'https://jsondata-1-jady.onrender.com/requests'; // Replace with your Render link
    await axios.post(renderUrl, newRequest);

    res.status(201).send(newRequest);
  } catch (error) {
    res.status(500).send({ error: 'Failed to create new request' });
  }
});

app.use(router);
server.listen(port, () => {
  console.log(`JSON Server is running on port ${port}`);
});
