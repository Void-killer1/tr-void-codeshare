import { MongoClient } from "mongodb";

const client = new MongoClient(process.env.MONGO_URI);
const dbName = "trvoid";

let cachedDb = null;

async function connectDB() {
  if (cachedDb) return cachedDb;
  await client.connect();
  cachedDb = client.db(dbName);
  return cachedDb;
}

export default async function handler(req, res) {
  try {
    const db = await connectDB();
    const col = db.collection("scripts");

    if (req.method === "GET") {
      const data = await col.find({}).toArray();
      return res.status(200).json(data);
    }

    if (req.method === "POST") {
      const { name, image, code } = req.body;

      if (!name || !code) {
        throw new Error("Eksik alan");
      }

      await col.insertOne({
        name,
        image,
        code,
        createdAt: Date.now()
      });

      return res.status(200).json({ ok: true });
    }

    res.status(405).end();
  } catch (err) {
    console.error("API ERROR:", err.message);

    return res.status(500).json({
      error: true,
      message: err.message,
      stack: err.stack
    });
  }
}
