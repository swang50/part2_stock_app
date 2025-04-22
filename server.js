const express = require('express');
const app = express();
const { MongoClient } = require('mongodb');

const uri = 'YOUR_MONGODB_ATLAS_URL';
const client = new MongoClient(uri);

app.set('view engine', 'ejs');

app.get('/', (req, res) => {
  res.render('home');
});

app.get('/process', async (req, res) => {
  const search = req.query.search;
  const type = req.query.type;
  let results = [];

  try {
    await client.connect();
    const db = client.db('Stock');
    const collection = db.collection('PublicCompanies');

    const query = type === 'ticker'
      ? { ticker: search }
      : { company: search };

    results = await collection.find(query).toArray();
    console.log(results);
    res.render('result', { results });
  } catch (err) {
    res.send('Error: ' + err);
  } finally {
    await client.close();
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log('App running on port ' + port);
});
