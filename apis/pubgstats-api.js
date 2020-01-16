/*
    * The core REST API definition 
    * for pubgstats.info
    * ----------------------------
    * Author: Abrar H Galib
*/
module.exports = function(express, pool, queries, queryFns, pubgApi, pubgApiHandlers, cache, logger) {
    const api = express.Router();

    api.post('/getTopLeadersBySeason', async (req, res, nxt) => {
        /*
            * Returns a set of user from past and current leaderboard 
            * from the database.
        */
        let { gameMode, seasonId, platform, count } = req.body;
        console.dir(req.body);
        if(!gameMode) gameMode = 'solo';
        if(!seasonId) seasonId = 20;
        if(!count) count = 15;
        if(!platform) platform = 'steam';

        const leaders = await new Promise((resolve, reject) => {
            pool.query(queries.getTopLeadersBySeason(gameMode, seasonId, count, platform), (err, leaders) => {
                if(err) {
                    logger.error(`[x] Error while fetching leaders`);
                    logger.error(err);
                    reject(err);
                }
                else {
                    resolve(leaders);
                }
            });
        })
        .catch(e => console.error(e));
        res.json({
            status: 200,
            leaders
        });
    });
    api.get('/getSeasons', async (req, res, nxt) => {
        /*
            * Returns the database ID and the season_id
            * for all available seasons. 
            * Note: no data before 2018-01
        */
       const seasons = await new Promise((resolve, reject) => {
            pool.query(queries.seasons(), (err, seas) => {
                if(err) {
                    logger.error('[x] Error while fetching seasons');
                    logger.error(err);
                    reject(err);
                }
                else {
                    seas = seas.map(s => {
                        return {
                            ...s, is_current: s.is_current ? true : false 
                        }; 
                    });
                    resolve(seas);
                }    
            });
       })
       .catch(e => console.error(e)); // do nothing
       res.json({
           status: 200, seasons: seasons
       });
    });
    api.post('/getPlayerSeasonLifetimeStats', async (req, res, nxt) => {
        /*
            * Returns the lifetime stats for a player.
            * Required params are playerName, seasonId
            * Note: seasonId is already cached in front end
        */
        const { playerName, seasonId } = req.body;
        if(!playerName || !seasonId) {
            return res.json({
                status: 400,
                message: 'PlayerName and/or seasonId cannot be undefined'
            });
        }
        const resPlayer = await pubgApi.getPlayer(playerName);
        const playerId = pubgApiHandlers.getPlayerHandler(resPlayer);
        const resPlayerStats = await pubgApi.getPlayerSeasonStats(playerId, seasonId);
        const { gameModeStats, matches, name } = 
            pubgApiHandlers.getPlayerSeasonLifetimeStatsHandler(resPlayerStats);
        // name is undefined
        cache.setPlayerMatches(playerName, matches);
        
        res.json({
            status: 200,
            stats: gameModeStats
        });
    });
    api.post('/getPlayerSeasonMatches', async (req, res, nxt) => {
        let { seasonId, playerName, gameMode, page } = req.body;
        if(!gameMode) {
            return res.json({
                status: 400,
                message: 'gameMode is undefined'
            });
        }
        if(!page) page = 0; // used for pagination
        if(!seasonId) {
            // check cache
            const matches = cache.getPlayerMatches(playerName);
            if(!matches) {
                return res.json({
                    status: 400,
                    message: 'No matches cached and no seasonId provided.'
                });
            }
            else {
                const m = [];
                for(let mat of matches) {
                    let resMatch = await pubgApi.getMatch(mat.id);
                    let matchDetails = pubgApiHandlers.getMatchHandler(resMatch);
                    m.push(matchDetails);
                }
                return res.json({
                    status: 200,
                    matches: m
                });
            }
        }
        else {
            // get the matches
            const resPlayer = await pubgApi.getPlayer(playerName);
            const playerId = pubgApiHandlers.getPlayerHandler(resPlayer);
            console.log(playerId);
            const resPlayerStats = await pubgApi.getPlayerSeasonStats(playerId, seasonId);
            let { matches } = 
                pubgApiHandlers.getPlayerSeasonLifetimeStatsHandler(resPlayerStats);
            // name is undefined
            cache.setPlayerMatches(playerName, matches);
            if(!matches[gameMode]) {
                return res.json({
                    status: 200,
                    message: 'No data found for gameMode ' + gameMode
                });
            }
            let pages = matches[gameMode].data;
            pages = pages.slice(page, (page+5 > page.length ? page.length : page+5));

            const m = [];
            for(const pg of pages) {
                // fetch each match
                console.log(`matchid: ${pg.id}`);
                let resMatch = await pubgApi.getMatch(pg.id);
                let matchDetails = pubgApiHandlers.getMatchHandler(resMatch, playerId);
                m.push(matchDetails);
            }
            return res.json({
                status: 200,
                matches: m
            });
        }
    });

    return api;
};