const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DATABASE_USERNAME}:${process.env.DATABASE_PASSWORD}@cluster1.rvqsrsr.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

function verifyJWT(req, res, next) {
  const userAuth = req.headers.authorization;
  if (!userAuth) {
    return res.status(401).send({ message: "unauthorized access." });
  }
  const token = userAuth.split(" ")[1];
  jwt.verify(token, process.env.JSON_SECRET, function (err, decoded) {
    if (err) {
      return res.status(401).send({ message: "unauthorized access." });
    }
    req.decoded = decoded;
    next();
  });
}

async function run() {
  try {
    const services = client.db("carDoctor").collection("services");
    const orderCollection = client
      .db("carDoctor")
      .collection("serviceConfirmationOrder");

    app.get("/services", async (req, res) => {
      const query = {};
      const cursor = services.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get("/serviceDetails/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await services.findOne(query);
      res.send(result);
    });

    app.post("/confirmOrder", async (req, res) => {
      const data = req.body;
      const result = await orderCollection.insertOne(data);
      res.send(result);
    });

    app.get("/confirmOrder", verifyJWT, async (req, res) => {
      const userEmail = req.query;

      if (req.decoded.email !== userEmail.email) {
        return res.status(401).send({ message: "unauthorized access." });
      }
      let query = {};
      if (userEmail.email) {
        query = {
          email: userEmail.email,
        };
      }
      const cursor = orderCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });

    app.post("/jwt", (req, res) => {
      const user = req.body;

      const token = jwt.sign(user, process.env.JSON_SECRET, {
        expiresIn: "1d",
      });
      res.send({ token });
    });

    app.get("/checkout/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await services.findOne(query);
      res.send(result);
    });

    app.delete('/deleteOrder/:id',async(req,res)=>{
        const id=req.params.id
        const query={_id:ObjectId(id)};
        const result=await orderCollection.deleteOne(query);
        res.send(result)
    });

  } catch (error) {
    console.log(error);
  }
}
run().catch((error) => console.log(error));

app.get("/", (req, res) => {
  res.send("server is live now");
});

app.listen(port, () => {
  console.log("Server is running in port:", port);
});
