const express = require('express')
const app = express()
const jwt =require('jsonwebtoken')
const port = process.env.PORT || 3000
require('dotenv').config()
var cors = require('cors')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const cookieParser = require('cookie-parser')
app.use(cookieParser())
app.use(cors({
  origin: [
    'http://localhost:5173'
  ],
  credentials: true
}))

app.use(express.json())

// created middlewares

const logger = (req, res, next ) =>{
  console.log('req pathaise je', req.method, req.url);
  next();
}

const tokenVerifier = (req,res,next)=>{
  const token = req?.cookies?.token;
  if(!token){
    return res.status(401).send({message: "unauthorized"})
  }
  jwt.verify(token, ACCESS_TOKEN_SECRET, (err, decoded)=>{
    if(err){
      return res.status(401).send({message: "unauthorized"})
    }
    req.user = decoded;
    next()
  })
}

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

// send jwt token with cookie
app.post('/jwt', async (req, res) => {
  const user = req.body;
  console.log('user token chay', user);
  const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1hr' });
  res.cookie('token',token,{httpOnly:false, secure:true, sameSite:'none'})
  res.send({ success: true }); 
});

// Delete cookie from browser when user logs out

app.post('/logout', async(req,res)=>{
  const user = req.body
  console.log('cookie delete kora dorkar', user)
  res.clearCookie('token',{maxAge: 0}).send({success: true})
})

app.post('/bookings', async(req,res)=>{
  const service = req.body;
  console.log('hello', service)
  const result = await bookingsCollection.insertOne(service);
  res.send(result)
} )



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