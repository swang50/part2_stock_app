const express = require('express');
const { MongoClient } = require('mongodb');
const axios = require('axios');

const app = express();
app.set('view engine', 'ejs');

// MongoDB URI and Alpha Vantage API Key from environment variables
const uri = process.env.MONGO_URI;
const apiKey = process.env.ALPHA_VANTAGE_KEY;

const client = new MongoClient(uri);
let collection;

// Connect to MongoDB ONCE when the app starts
async function initMongo() {
  try {
    await client.connect();
    const db = client.db('Stock');
    collection = db.collection('PublicCompanies');
    console.log("✅ Connected to MongoDB");
  } catch (err) {
    console.error("❌ MongoDB connection error:", err);
  }
}

// Home page
app.get('/', (req, res) => {
  res.render('home');
});

// Search and fetch real-time stock data
app.get('/process', async (req, res) => {
  const search = req.query.search;
  const type = req.query.type;

  const query = type === 'ticker' ? { ticker: search } : { company: search };

  try {
    if (!collection) throw new Error("MongoDB not connected!");
    
    const results = await collection.find(query).toArray();

    // Real-time stock price from Alpha Vantage
    let realTimePrice = null;
    try {
      const alphaURL = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${search}&apikey=${apiKey}`;
      const alphaResponse = await axios.get(alphaURL);
      realTimePrice = alphaResponse.data['Global Quote']['05. price'];
    } catch (err) {
      console.warn("⚠️ Could not fetch real-time price:", err.message);
    }

    // Attach real-time price to each result
    results.forEach(r => {
      r.realTimePrice = realTimePrice;
    });

    console.log("🔎 Results:", results);
    res.render('results', { results });

  } catch (err) {
    console.error("❌ Error during search:", err);
    res.send("Error searching database or fetching stock price.");
  }
});

// Start server and connect to MongoDB
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log('🚀 App running on port ' + port);
  initMongo();
});

