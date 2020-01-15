module.exports = function(qfns, queries) {
    // qfns: query functions

    return {
        getSamplesHandler: (res) => {
            const matches = res.data.data.relationships.matches.data;
                qfns.insertMatchesHandler(queries.insertMatches(matches), (err) => {
                    if(err) {
                        console.log('[!] Error while inserting matches');
                        console.error(err);
                    }
                    else {
                        console.log('[*] Matches added successfully');   
                    }                    
                });
        },
        getTournamentsHanlder: (res) => {
            const tours = res.data.data;
                qfns.insertTournamentsHandler(queries.insertTournaments(tours), (inserr) => {
                    if(inserr) {
                        console.log('[!] Error while inserting tournaments');
                        console.error(inserr);
                    }
                    else {
                        console.log('[*] Tournaments inserted successfully');
                    }
                });
        },
        getGameSchemaHandler: (res) => {
            const schema = res.data.game.availableGameStats.achievements;
                qfns.insertGameSchemaHandler(queries.insertGameSchema(schema), (inserr) => {
                    if(inserr) {
                        console.log('[!] Error while inserting game schema');
                        console.error(inserr);
                        return ;
                    }
                    console.log('[*] Schema inserted successfully');
                });
        },
        getGlobalAchievementsPercentages: (res) => {
            const percentages = res.data.achievementpercentages.achievements;
                qfns.insertGlobalAchivementsPercentages(
                    queries.insertGamePercentages(percentages),
                    (err) => {
                        if(err) {
                            console.log('[!] Error while inserting percentages');
                            console.error(err);
                            return ;
                        }
                        console.log('[*] Global Achievements Percentages inserted successfully');
                    }
                );
        },
        getPlayerHandler: (res) => {
            const data = res.data.data;
            const matches = data[0].relationships.matches.data;
            const matchIDGen = generateMatchID(matches);

            console.log('[*] Fetched all match ids for WackyJacky101');
            console.log('[*] Fetching match details');
            const interval = setInterval(getAllPlayerMatches, 10000, matchIDGen, api, mapNames);
        },
        getMatchHandler: (res) => {
            const data = res.data.data;
            console.log(data.included);
            //console.log(res.data.included);
            //console.log(res.data.included[0].attributes.stats);
            
            // find players stat
            const playerStat = res.data.included.find(o => o.attributes.stats.playerId === pid);
            console.log(playerStat);
        },
        getPlayerSeasonStatsHandler: (res) => {
            console.log('[*] Stats for player WackyJacky101 for season division.bro.official.pc-2018-05');
            const data = res.data.data;
            const gameModeStats = data.attributes.gameModeStats;
            Object.keys(gameModeStats)
                .forEach(mode => {
                    console.log(`[*] Stats for ${mode}`);
                    console.dir(gameModeStats[mode]);
                });
        }
    };
}