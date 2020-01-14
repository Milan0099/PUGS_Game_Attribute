const mysql = require('mysql');
const axios = require('axios');
const squel = require('squel').useFlavour('mysql');

const configs = require('./configs.json');
const dbFunctions = require('./dbfunctions');
const api = require('./api')(axios, configs.APIkey);
const steamApi = require('./steam-api')(axios, configs.SteamAPIKey, configs.PUBGAppID);
const queries = require('./queries')(squel);
const _queryFunctions = require('./queryFunctions');

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
            .then(res => {
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
            })
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
            .then(res => {
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
            })
            .catch(toursFetchErr => {
                console.log('[!] Error while fetching tournaments');
                console.error(toursFetchErr);
                DBConnection.end(dbFunctions.endConnectionHandler);
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
                .then(res => {
                    const schema = res.data.game.availableGameStats.achievements;
                    qfns.insertGameSchemaHandler(queries.insertGameSchema(schema), (inserr) => {
                        if(inserr) {
                            console.log('[!] Error while inserting game schema');
                            console.error(inserr);
                            return ;
                        }
                        console.log('[*] Schema inserted successfully');
                    });
                })
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
                .then(res => {
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
                    )
                })
                .catch(fetchPercErr => {
                    console.log('[!] Error while fetching percentages');
                    console.error(fetchPercErr);
                    DBConnection.end(dbFunctions.endConnectionHandler);
                });
        }
    });
});

