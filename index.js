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
    "https://artvend-client-sharifrayhan.netlify.app"
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
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded)=>{
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

app.get('/bookings', logger, tokenVerifier, async(req,res)=>{
  console.log("je email access korte chacche", req.query.email)
  console.log("token user", req.user)
  if (req.user.email !== req.query.email){
    return res.status(403).send({message: "forbidden access"})
  }
  let query = {};
  if (req.query?.email) {
    query = {
        $or: [
            { user_email: req.query.email },
            { service_provider_email: req.query.email }
        ]
    };
}
  console.log("query email", query)
    const cursor = bookingsCollection.find(query)
    const result = await cursor.toArray()
    console.log("array result", result)
    res.send(result)
})

app.get('/bookings/:id', logger, tokenVerifier, async (req, res) => {
  if (req.user.email !== req.query.email) {
      return res.status(403).send({ message: "forbidden access" });
  }

  const id = req.params.id; 
  const userEmail = req.query.email; 

  let query = {
      $or: [
          { user_email: userEmail, _id: new ObjectId(id) },
          { service_provider_email: userEmail, _id: new ObjectId(id) }
      ]
  };

  console.log('I need data for id:', id);
  const product = await bookingsCollection.findOne(query);
  res.send(product);
});


// Post Methods

// send jwt token with cookie
app.post('/jwt', async (req, res) => {
  const user = req.body;
  console.log('user token chay', user);
  const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1hr' });
  res.cookie('token',token,{httpOnly:true, secure: process.env.NODE_ENV === "production"? true: false, sameSite:process.env.NODE_ENV === "production"? 'none':'strict'})
  res.send({ success: true }); 
});

// Delete cookie from browser when user logs out

app.post('/logout', async(req,res)=>{
  const user = req.body
  console.log('cookie delete kora dorkar', user)
  res.clearCookie('token',{maxAge: 0,secure: process.env.NODE_ENV === "production"? true: false, sameSite:process.env.NODE_ENV === "production"? 'none':'strict'}).send({success: true})
})


app.post('/bookings', async(req,res)=>{
  const service = req.body;
  console.log('hello', service)
  const result = await bookingsCollection.insertOne(service);
  res.send(result)
} )

app.post('/services', async(req,res)=>{
  const service = req.body;
  console.log('hello', service)
  const result = await servicesCollection.insertOne(service);
  res.send(result)
} )

// Delete methods

app.delete('/services/:id',logger, tokenVerifier, async(req,res)=>{
  if (req.user.email !== req.query.email) {
    return res.status(403).send({ message: "forbidden access" });
}

const id = req.params.id;
const userEmail = req.query.email; 

let query = { service_provider_email: userEmail, _id: new ObjectId(id) }

  // const query = {_id: new ObjectId(id)}
  console.log("i want to delete", id, query)
  const result = await servicesCollection.deleteOne(query)
  res.send(result)
})

app.delete('/bookings/:id',logger, tokenVerifier, async(req,res)=>{

  if (req.user.email !== req.query.email) {
    return res.status(403).send({ message: "forbidden access" });
}

const id = req.params.id; 
const userEmail = req.query.email; 

let query = { user_email: userEmail, _id: new ObjectId(id) }
  // const id = req.params.id;
  // const query = {_id: new ObjectId(id)}
  console.log("i want to delete", id, query)
  const result = await bookingsCollection.deleteOne(query)
  res.send(result)
})

// Update Methods
app.put('/services/:id',logger, tokenVerifier, async (req, res) => {

  const id = req.params.id;
const userEmail = req.query.email; 

let query = { service_provider_email: userEmail, _id: new ObjectId(id) }
  // const id = req.params.id;
  // const query = { _id: new ObjectId(id) };
  const options = { upsert: true };
  const updatedInfo = req.body;
  console.log("lets update", updatedInfo)
  const updatedProduct = {
      $set: {
          service_name: updatedInfo.service_name,
          service_location_area: updatedInfo.service_location_area,
          service_price: updatedInfo.service_price,
          service_image: updatedInfo.service_image,
          service_description: updatedInfo.service_description,
          service_provider_name: updatedInfo.provider_provider_name,
          service_provider_image: updatedInfo.service_provider_image,
          service_provider_email: updatedInfo.service_provider_email,
      }
  };
  
  try {
      const result = await servicesCollection.updateOne(query, updatedProduct, options);
      res.send(result);
  } catch (error) {
      res.status(500).send("Error updating the service");
  }
});

app.put('/bookings/:id',logger, tokenVerifier, async (req, res) => {
  if (req.user.email !== req.query.email) {
    return res.status(403).send({ message: "forbidden access" });
}

const id = req.params.id; 
const userEmail = req.query.email; 

let query = { service_provider_email: userEmail, _id: new ObjectId(id) }
  // const id = req.params.id;
  // const query = { _id: new ObjectId(id) };
  const options = { upsert: true };
  const { booking_status } = req.body;

  console.log(booking_status)

  const updatedProduct = {
    $set: {
      booking_status: booking_status
    }
  };

  try {
    const result = await bookingsCollection.updateOne(query, updatedProduct, options);
    res.send(result);
  } catch (error) {
    res.status(500).send("Error updating");
  }
});




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