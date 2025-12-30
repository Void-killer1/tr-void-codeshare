const { MongoClient } = require("mongodb");
const axios = require("axios");

const client = new MongoClient(process.env.MONGODB_URI);

module.exports = async (req, res) => {
    res.setHeader("Access-Control-Allow-Origin","*");
    res.setHeader("Access-Control-Allow-Methods","GET,POST,PUT,DELETE,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers","Content-Type");
    if(req.method==="OPTIONS") return res.status(200).end();

    try{
        await client.connect();
        const db = client.db("codeshare_db");
        const codes = db.collection("codes");

        /* RANDOM GAMES */
        if(req.method==="GET" && req.query.randomGames){
            const r = await axios.get("https://games.roblox.com/v1/games?sortOrder=Asc&limit=10");
            const games = r.data.data || [];
            const thumbs = {};
            const ids = games.map(g=>g.rootPlaceId).join(",");
            if(ids){
                const t = await axios.get(`https://thumbnails.roblox.com/v1/places/gameicons?placeIds=${ids}&size=150x150&format=Png`);
                t.data.data.forEach(i=> thumbs[i.targetId]=i.imageUrl );
            }
            const formatted = games.map(g=>({
                name:g.name,
                universeId:g.id || g.universeId || 0,
                thumbnail: thumbs[g.rootPlaceId]||"",
                creatorName:g.creator?.name||"",
                playing:g.playing||0
            }));
            return res.json(formatted);
        }

        /* ROBLOX SEARCH */
        if(req.method==="GET" && req.query.searchGame){
            const q = req.query.searchGame;
            const search = await axios.get(`https://games.roblox.com/v1/games/search?keyword=${encodeURIComponent(q)}&limit=10`);
            const games = search.data.searchResults.map(g=>g.contents[0]);
            const thumbs = {};
            const ids = games.map(g=>g.rootPlaceId).join(",");
            if(ids){
                const t = await axios.get(`https://thumbnails.roblox.com/v1/places/gameicons?placeIds=${ids}&size=150x150&format=Png`);
                t.data.data.forEach(i=> thumbs[i.targetId]=i.imageUrl );
            }
            const formatted = games.map(g=>({
                name:g.name,
                universeId:g.universeId,
                image: thumbs[g.rootPlaceId]||"",
                creatorName:g.creatorName||"",
                playing:g.playerCount||0
            }));
            return res.json(formatted);
        }

        /* GET CODES */
        if(req.method==="GET") return res.json(await codes.find({}).sort({createdAt:-1}).toArray());

        /* POST */
        if(req.method==="POST"){
            const body = typeof req.body==="string"? JSON.parse(req.body) : req.body;
            await codes.insertOne({...body, createdAt:new Date()});
            return res.json({ok:true});
        }

    }catch(e){ console.error(e); return res.status(500).json({error:e.message}); }
};
