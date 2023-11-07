const express = require('express')
const app = express()
const jwt =require('jsonwebtoken')
const port = process.env.PORT || 3000
require('dotenv').config()
var cors = require('cors')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

app.use(cors({
  origin: [
    'http://localhost:5173'
  ],
  credentials: true
}))

app.use(express.json())




const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ujemn7v.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {

    const database = client.db("artvendDB");
    const servicesCollection = database.collection("services");
    const featuredCollection = database.collection("featured");
    const bookingsCollection = database.collection("bookings");


//   Get methods 

app.get('/services', async(req,res)=>{
    const cursor = servicesCollection.find()
    const result = await cursor.toArray()
    res.send(result)
})

app.get('/services/:id', async(req,res)=>{
    const id = req.params.id;
    const query = {_id: new ObjectId(id)}
    console.log('i need data for id :', id);
    const product =  await servicesCollection.findOne( query );
    res.send(product);
})

app.get('/featured', async(req,res)=>{
    const cursor = featuredCollection.find()
    const result = await cursor.toArray()
    res.send(result)
})

app.get('/featured/:id', async(req,res)=>{
    const id = req.params.id;
    const query = {_id: new ObjectId(id)}
    console.log('i need data for id :', id);
    const product =  await featuredCollection.findOne( query );
    res.send(product);
})

app.get('/bookings', async(req,res)=>{
    const cursor = bookingsCollection.find()
    const result = await cursor.toArray()
    res.send(result)
})

app.get('/bookings/:id', async(req,res)=>{
    const id = req.params.id;
    const query = {_id: new ObjectId(id)}
    console.log('i need data for id :', id);
    const product =  await bookingsCollection.findOne( query );
    res.send(product);
})

// Post Methods

app.post('/jwt', async(req,res)=>{
  const user = res.body
  console.log('user token chay', user)
})

    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})