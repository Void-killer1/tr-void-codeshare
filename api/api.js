const axios = require("axios");

module.exports = async (req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    if (req.method === "OPTIONS") return res.status(200).end();

    try {
        if (req.method === "GET" && req.query.searchGame) {
            const q = encodeURIComponent(req.query.searchGame);
            const url = `https://apis.roblox.com/search-api/omni-search?searchQuery=${q}&sessionId=demo`;

            const apiRes = await axios.get(url);
            const data = apiRes.data;

            const games = [];
            if (data.searchResults) {
                data.searchResults.forEach(group => {
                    if (group.contentGroupType === "Game") {
                        group.contents.forEach(g => {
                            games.push({
                                name: g.name,
                                universeId: g.universeId,
                                rootPlaceId: g.rootPlaceId,
                                description: g.description,
                                creatorName: g.creatorName,
                                playerCount: g.playerCount,
                                contentMaturity: g.contentMaturity
                            });
                        });
                    }
                });
            }
            return res.json(games);
        }

        return res.status(400).json({ error: "searchGame query param is required" });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
};
