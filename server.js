const axios = require('axios');
const apiKey = process.env.ALPHA_VANTAGE_KEY;

const express = require('express');
const { MongoClient } = require('mongodb');

const app = express();
app.set('view engine', 'ejs');

const uri = process.env.MONGO_URI;

const client = new MongoClient(uri);
let collection; // <== global variable to reuse after connection

// Connect to MongoDB ONCE when app starts
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

app.get('/', (req, res) => {
  res.render('home');
});

app.get('/process', async (req, res) => {
  const search = req.query.search;
  const type = req.query.type;

  const query = type === 'ticker' ? { ticker: search } : { company: search };

  try {
    if (!collection) throw new Error("MongoDB not connected!");
    const results = await collection.find(query).toArray();

    // Real-time stock price from Alpha Vantage
    const alphaURL = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${search}&apikey=${apiKey}`;
    const alphaResponse = await axios.get(alphaURL);
    const realTimePrice = alphaResponse.data['Global Quote']['05. price'];

    console.log("🔎 Results:", results);
    res.render('results', { results, realTimePrice }); // Pass realTimePrice to EJS
  } catch (err) {
    console.error("❌ Error during search:", err);
    res.send("Error searching database or fetching stock price.");
  }
});


const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log('App running on port ' + port);
  initMongo(); // connect when server starts
});
