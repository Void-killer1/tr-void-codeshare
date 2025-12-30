import { MongoClient, ObjectId } from "mongodb";
import axios from "axios";

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(200).end();

    try {
        await client.connect();
        const db = client.db("hasanbrawl54_db_user");
        const codesColl = db.collection("codes");
        const usersColl = db.collection("users");

        if (req.method === "GET") {
            const { type, searchGame } = req.query;

            if (searchGame) {
                try {
                    const r = await axios.get(`https://roblox-game-search.onrender.com/search?query=${encodeURIComponent(searchGame)}&limit=5`, { timeout: 8000 });
                    return res.status(200).json(r.data.games || []);
                } catch(e) {
                    return res.status(200).json([]);
                }
            }

            if(type === "users") {
                const users = await usersColl.find({}).toArray();
                return res.status(200).json(users);
            } else {
                const codes = await codesColl.find({}).sort({ createdAt: -1 }).toArray();
                return res.status(200).json(codes);
            }
        }

        let body = req.body ? (typeof req.body === 'string' ? JSON.parse(req.body) : req.body) : {};

        if (req.method === "POST") {
            const newScript = { ...body, createdAt: new Date() };
            await codesColl.insertOne(newScript);
            return res.status(201).json({ msg: "Success", script: newScript });
        }

        if (req.method === "PUT") {
            const { _id, ...updateData } = body;
            if(!_id) return res.status(400).json({ error: "_id alanı zorunlu!" });
            await codesColl.updateOne({ _id: new ObjectId(_id) }, { $set: updateData });
            return res.status(200).json({ msg: "Updated" });
        }

        if (req.method === "DELETE") {
            const { id } = req.query;
            if(!id) return res.status(400).json({ error: "id alanı zorunlu!" });
            await codesColl.deleteOne({ _id: new ObjectId(id) });
            return res.status(200).json({ msg: "Deleted" });
        }

    } catch (e) {
        console.error(e);
        return res.status(500).json({ error: e.message });
    }
};
