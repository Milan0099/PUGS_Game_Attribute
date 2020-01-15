const mysql = require('mysql');
const axios = require('axios');
const squel = require('squel').useFlavour('mysql');

const configs = require('./configs.json');
const mapNames = require('./mapName.json');
const dbFunctions = require('./dbfunctions');
const api = require('./pubg-api')(axios, configs.APIkey);
const steamApi = require('./steam-api')(axios, configs.SteamAPIKey, configs.PUBGAppID);
const queries = require('./queries')(squel);
const _queryFunctions = require('./queryFunctions');
const _pubgApiHandlers = require('./pubg-api-handlers.js');
const { generateMatchID, getAllPlayerMatches } = require('./utils');

// MYSQL 
const DBConnection = mysql.createConnection({
    host: configs.DBHOST,
    user: configs.DBUSER,
    password: configs.DBPASS,
    database: configs.DBNAME
});

DBConnection.connect((connectionError) => {
    if(connectionError) {
        console.log('[!] Fatal Error: Could not connect to database');
        console.error(connectionError);
        DBConnection.end(dbFunctions.endConnectionHandler);
        process.exit(1);
    }
    const qfns = _queryFunctions(DBConnection);
    const pubgApiHandlers = _pubgApiHandlers(qfns, queries);
    // fetching sample matches
    qfns.haveMatchesCached(queries.matches(), (err, cache) => {
        if(err) {
            console.log('[!] Error while accessing cached matches');
            return DBConnection.end(dbFunctions.endConnectionHandler);
        }
        if(cache && cache.length) {
            // cached results exists
            console.log('[*] Matches are cached');
            //console.log(cache);
            return ;
        }
        // fetch the samples
        api.getSamples()
            .then(res => pubgApiHandlers.getSamplesHandler(res))
            .catch(matchesFetchError => {
                console.log('[!] Error occured while fetching matches');
                console.error(matchesFetchError);
                DBConnection.end(dbFunctions.endConnectionHandler);
            });
    });
    //fetching tournaments
    qfns.haveTournamentsCached(queries.tournaments(), (err, cache) => {
        if(err) {
            console.log('[!] Error while accessing cached tournaments');
            return DBConnection.end(dbFunctions.endConnectionHandler);
        }
        if(cache && cache.length) {
            console.log('[*] Tournaments are already cached');
            return ;
        }
        // fetch tournaments
        api.getTournaments()
            .then(res => pubgApiHandlers.getTournaments(res))
            .catch(toursFetchErr => {
                console.log('[!] Error while fetching tournaments');
                console.error(toursFetchErr);
            });
    });
    // fetch game schema
    qfns.haveGameSchema(queries.gameSchema(), (cacheErr, cache) => {
        if(cacheErr) {
            console.log('[!] Error while fetching game schema cache.');
            console.error(cacheErr);
            DBConnection.end(dbFunctions.endConnectionHandler);
        }
        if(cache && cache.length && cache.length > 0) {
            // exists!
            console.log('[*] Game Schema already cached.');
        }
        else {
            steamApi.getGameSchema()
                .then(res => pubgApiHandlers.getGameSchemaHanlder(res))
                .catch(fetchSchemaErr => {
                    console.log('[!] Error while fetching schema');
                    console.error(fetchSchemaErr);
                    DBConnection.end(dbFunctions.endConnectionHandler);
                })
        }
    });
    // fetch achievements %
    qfns.haveGlobalAchievementsPercentages(queries.percentages(), (cacheErr, cache) => {
        if(cacheErr) {
            console.log('[!] Error while fetching cached percentages');
            console.error(cacheErr);
            DBConnection.end(dbFunctions.endConnectionHandler);
        }
        if(cache && cache.length && cache.length > 0) {
            console.log('[*] Global Achievements Percentages cached');
        }
        else {
            steamApi.getGlobalAchievementsPercentages()
                .then(res => pubgApiHandlers.getGlobalAchievementsPercentagesHandler(res))
                .catch(fetchPercErr => {
                    console.log('[!] Error while fetching percentages');
                    console.error(fetchPercErr);
                    DBConnection.end(dbFunctions.endConnectionHandler);
                });
        }
    });
    // test get players
    /*api.getPlayer('WackyJacky101')
        .then(res => pubgApiHandlers.getPlayerHandler(res))
        .catch(getPlayerErr => {
            console.log('[!] Error while fetching player');
            console.error(getPlayerErr);
            DBConnection.end(dbFunctions.endConnectionHandler);
        });*/
    // check if player stats are there in match object

    const pid = 'account.c0e530e9b7244b358def282782f893af';
    /* api.getMatch('fbe2f131-ff96-4e19-83b8-ac2ad28335f3')
        .then(res => pubgApiHandler.getMatchHandler(res))
        .catch(getMatchErr => {
            console.error(getMatchErr);
        });
    */
    
    // test getPlayerSeasonStats
    api.getPlayerSeasonStats(pid, 'division.bro.official.pc-2018-05')
        .then(res => pubgApiHandlers.getPlayerSeasonStatsHandler(res))
        .catch(fetchPlayerSeasonStatErr => {
            /*if(fetchPlayerSeasonStatErr.response.status === 404) {
                // not found
                return console.log(`[-] No season stats for ${fetchPlayerSeasonStatErr.request.path.split('/').pop()}`);
            }*/
            console.log('[x] Error while fetchig player season stats');
            //console.log(`[-] Request URL: ${fetchPlayerSeasonStatErr.request.path}`);
            //console.log(`[-] Response Status: ${fetchPlayerSeasonStatErr.response.status}`);
            console.error(fetchPlayerSeasonStatErr);
        })
        .finally(() => DBConnection.end(dbFunctions.endConnectionHandler));
});

