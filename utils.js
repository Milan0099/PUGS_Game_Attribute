module.exports = {
    generateMatchID: function*(matches) {
        let count = 0;
        for(let match of matches) {
            if(count >= 5) {
                yield { pause: true };
                count = 0;
            }
            else {
                yield match.id;
            }
            count++;
        }
    },
    getAllPlayerMatches: async (gen, api, mapNames) => {
        try {
            let matchid = gen.next();
            while(!matchid.value.pause && !matchid.done) {
                let match = await api.getMatches(matchid.value);
                let data = match.data.data;
                // print 
                console.log(`MatchID: ${data.id} 
                    GameMode: ${data.attributes.gameMode}  
                    MapName: ${mapNames[data.attributes.mapName]}
                    IsCustomMatch: ${data.attributes.isCustomMatch}
                    SeasonState: ${data.attributes.seasonState}
                    
                `);
                //console.log(data.relationships.rosters.data);
                matchid = gen.next();
            }
            if(matchid.done) {
                console.log('[*] Fetched all matches');
            }
            else {
                console.log('[*] Pausing for 10 seconds');
            }
        } catch(fetchMatchErr) {
            console.log('[!] Error while fetching match');
            console.error(fetchMatchErr);
        }
    }
};