const { MongoClient, ObjectId } = require("mongodb");
const axios = require("axios");

const client = new MongoClient(process.env.MONGODB_URI);

module.exports = async (req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    if (req.method === "OPTIONS") return res.status(200).end();

    try {
        await client.connect();
        const db = client.db("hasanbrawl54_db_user");
        const codes = db.collection("codes");
        const users = db.collection("users");

        /* ROBLOX GAME SEARCH */
        if (req.method === "GET" && req.query.searchGame) {
            const q = req.query.searchGame;
            const search = await axios.get(`https://games.roblox.com/v1/games/search?keyword=${encodeURIComponent(q)}&limit=10`);
            return res.json(search.data);
        }

        /* GET */
        if (req.method === "GET") {
            if (req.query.type === "users")
                return res.json(await users.find({}).toArray());
            return res.json(await codes.find({}).sort({ createdAt: -1 }).toArray());
        }

        const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;

        /* POST */
        if (req.method === "POST") {
            await codes.insertOne({ ...body, createdAt: new Date() });
            return res.json({ ok: true });
        }

        /* PUT */
        if (req.method === "PUT") {
            const { _id, ...rest } = body;
            await codes.updateOne({ _id: new ObjectId(_id) }, { $set: rest });
            return res.json({ ok: true });
        }

        /* DELETE */
        if (req.method === "DELETE") {
            await codes.deleteOne({ _id: new ObjectId(req.query.id) });
            return res.json({ ok: true });
        }

    } catch (e) {
        return res.status(500).json({ error: e.message });
    }
};
