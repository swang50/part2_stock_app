const express = require('express');
const app = express();
const { MongoClient } = require('mongodb');

const uri = 'mongodb+srv://shuyiwang648513:20040405Wsy%40@cluster0.7al7lkw.mongodb.net/Stock?retryWrites=true&w=majority&ssl=true';
const client = new MongoClient(uri);

let db, collection;

// Connect once, reuse later
async function initMongo() {
  try {
    await client.connect();
    db = client.db('Stock');
    collection = db.collection('PublicCompanies');
    console.log("✅ MongoDB connected");
  } catch (err) {
    console.log("❌ MongoDB connection error:", err);
  }
}

app.set('view engine', 'ejs');

// Route: Home Page
app.get('/', (req, res) => {
  res.render('home');
});

// Route: Process Search
app.get('/process', async (req, res) => {
  const search = req.query.search;
  const type = req.query.type;

  const query = type === 'ticker'
    ? { ticker: search }
    : { company: search };

  try {
    const results = await collection.find(query).toArray();
    console.log("🔎 Search results:", results);
    res.render('result', { results });
  } catch (err) {
    console.error("❌ Error during search:", err);
    res.send("Error occurred while searching.");
  }
});

// Start the server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log('App running on port ' + port);
  initMongo(); // connect to MongoDB once when the app starts
});
