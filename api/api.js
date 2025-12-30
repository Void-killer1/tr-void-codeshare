const { MongoClient, ObjectId } = require("mongodb");
const axios = require("axios");

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

module.exports = async (req, res) => {
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
            
            // SENİN RENDER API'Nİ KULLANAN KISIM
            if (searchGame) {
                try {
                    const renderUrl = `https://roblox-game-search.onrender.com/search?query=${encodeURIComponent(searchGame)}&limit=5`;
                    const response = await axios.get(renderUrl, { timeout: 7000 });
                    return res.status(200).json(response.data.games || []);
                } catch (err) {
                    return res.status(200).json([]);
                }
            }
            const data = (type === "users") ? await usersColl.find({}).toArray() : await codesColl.find({}).sort({createdAt: -1}).toArray();
            return res.status(200).json(data);
        }

        let body = req.body ? (typeof req.body === 'string' ? JSON.parse(req.body) : req.body) : {};

        if (req.method === "POST") {
            await codesColl.insertOne({ ...body, createdAt: new Date() });
            return res.status(201).json({ msg: "Success" });
        }
        if (req.method === "PUT") {
            const { _id, ...updateData } = body;
            await codesColl.updateOne({ _id: new ObjectId(_id) }, { $set: updateData });
            return res.status(200).json({ msg: "Updated" });
        }
        if (req.method === "DELETE") {
            await codesColl.deleteOne({ _id: new ObjectId(req.query.id) });
            return res.status(200).json({ msg: "Deleted" });
        }
    } catch (e) {
        return res.status(500).json({ error: e.message });
    }
};
