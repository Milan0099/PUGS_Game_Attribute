/*
    * REST API for pubgstats.info
    * ---------------------------
    * Author: Abrar H Galib
    * Description: This is the entry file for the backend server.
    *   It deals with all external APIs and provides CRUD for MySQL database
*/

/////// ESSENTIAL PKGS   \\\\\\\\\\\\\\\\
const fs = require('fs');
const path = require('path');
const https = require('https');
const express = require('express');
const ejs = require('ejs');
const bodyParser = require('body-parser');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const connectMemcached = require('connect-memcached')(session);
const cors = require('cors');
const axios = require('axios');
const mysql = require('mysql');
const memcached = require('memcached');
const squel = require('squel').useFlavour('mysql');
const moment = require('moment');
const winston = require('winston');
// monkey patch winston
require('winston-daily-rotate-file');

/////// CONFIG FILES    \\\\\\\\\\\\\\\\\\\\\
const configs = require('./configs.json');
const pubgStatsJson = require('./pubg-stats.json');
const mapNames = require('./mapName.json');

/////// LOGGER  \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
const transport = new winston.transports.DailyRotateFile({
    filename: 'log-%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxSize: '10m',
    maxFiles: '30'
});
const logger = winston.createLogger({
    transports: [ transport ]
});

////// API and Handlers  \\\\\\\\\\\\\\\\\\\\\\
const { endConnectionHandler, DBHandlers } = require('./db-functions/dbfunctions');
const pubgApi = require('./apis/pubg-api')(axios, configs.APIkey);
const steamApi = require('./apis/steam-api')(axios, configs.SteamAPIKey, configs.PUBGAppID);
const _pubgstatsApi = require('./apis/pubgstats-api');
const queries = require('./db-functions/queries')(squel);
const _queryFunctions = require('./db-functions/queryFunctions');
const _pubgApiHandlers = require('./pubg-api-handlers');
const { 
    generateMatchID, getAllPlayerMatches, sleep,
} = require('./utils');
const InMemCache = require('./db-functions/cache')(configs, memcached);
const IpLookup = require('./ip-lookup')(axios, configs);

////// CONSTANTS      \\\\\\\\\\\\\\\\\\\\\\\\\\
const ACCESS_CTRL_MAX_AGE = 3600 * 2; // 2 hours
const MYSQL_POOL_MAX_CONNECTIONS = 5; 
const COOKIE_MAX_AGE = 3600; //  1hr; for prod, make it 7 days
const VIEWSDIR = '/home/zerocool/freelancer/pubginfo/views';
const ASSETSDIR = '/home/zerocool/freelancer/pubginfo/assets';
const FAVSDIR = '/home/zerocool/freelancer/pubginfo/favs';
const SCRIPTSDIR = '/home/zerocool/freelancer/pubginfo/scripts';

////// SERVER SETUP    \\\\\\\\\\\\\\\\\\\\\\\\\\
const server = express();
server.use(bodyParser.json());
server.use(bodyParser.urlencoded({ extended: true }));
server.use(cors({
    "origin": true,
    "methods": "GET,POST,OPTIONS",
    "preflightContinue": true,
    "optionsSuccessStatus": 200,
    "maxAge": ACCESS_CTRL_MAX_AGE,
    "allowedHeaders": ["Content-Type", "Content-Length", "Access-Control-Allow-Origin"]
}));
/*server.use(session({
    name: 'pubgstats.sid',
    secret: 'SOME-SECRETS-HERE',
    resave: true,
    saveUninitialized: true,
    cookie: {
        maxAge: COOKIE_MAX_AGE,
        secure: false, // change in production
        sameSite: true,
        httpOnly: true,
        domain: '127.0.0.1'
    },
    store: new connectMemcached({
        hosts: ['127.0.0.1:11211'],
        secret: 'SOME-OTHER-SECRETS-HERE',
        ttl: 24 * 3600
    })
}));*/
server.use(cookieParser('SOME-SECRETS-HERE', {
    domain: '/',
    httpOnly: true,
    sameSite: true,
    maxAge: 3600 * 2
}));
// EJS setup for SSR
server.set('view engine', 'ejs');
server.set('views', VIEWSDIR);
server.use(express.static(ASSETSDIR));
server.use(express.static(FAVSDIR));
server.use(express.static(SCRIPTSDIR));

//// DATABASE CONNECTIONS  \\\\\\\\\\\\\\\\\\\\\\\\\\\
const DBPool = mysql.createPool({
    connectionLimit: MYSQL_POOL_MAX_CONNECTIONS,
    host: configs.DBHOST,
    user: configs.DBUSER,
    password: configs.DBPASS,
    database: configs.DBNAME
});
const CachePool = new InMemCache();

////////// API SETUPS       \\\\\\\\\\\\\\\\\\\\\\
const queryFns = _queryFunctions(DBPool);
const pubgApiHandlers = _pubgApiHandlers(queryFns, queries);
const pubgStatsApi = _pubgstatsApi(express, DBPool, queries, 
    queryFns, pubgApi, pubgApiHandlers, CachePool, logger);

// setup HTTPS


// for SSL verfication
server.get('/*', async (req, res, nxt) => {
    const url = req.originalUrl;
    if(url.indexOf('.well-known') !== -1) {
        const fname = url.split('/').pop();
        return res.send(
            fs.readFileSync(path.resolve('./.well-known/acme-challenge/'.concat(fname))));
    }
    nxt();
});

// insert SSR View Engine here
server.get('/', async (req, res, nxt) => {
    const ip = req.ip;
    console.log(`IP: ${ip}`);
    //console.log(req.session);
    if(req.cookies && req.cookies.loc) {
        console.log('cookie already set');
        return res.render('index');
    }
    const data = await new Promise((resolve, reject) => {
        CachePool._get(ip, async (err, pl) => {
            let resIp;
            let data;
            if(err) {
                // lookup and insert
                console.log('[-] Looking up IP');
                if(ip.startsWith('::1') === true || ip.startsWith('127.0.0.1') === true) {
                    resIp = '127.0.0.1';
                }
                else {
                    resIp = await IpLookup(ip);
                }
                data = (typeof resIp === 'string' ? 
                    { country: 'Bangladesh', country_code: 'BD', 
                    continent: 'Asia', continent_code: 'AS'} : resIp.data);
                console.log('cookie');
                console.log(req.cookies);
                await new Promise((resolve2, reject2) => { 
                    console.log('[-] Saving IP: ' + ip);
                    CachePool._set(ip, JSON.stringify(data), (serr) => {
                        if(serr) {
                            console.error(serr);
                            reject2(serr);
                        }
                        else {
                            console.log('[-] IP Saved');
                            resolve2();
                        }
                    });
                });     
            }
            // found in cache
            else {
                console.log(req.cookies);
                console.log(pl);
            }
            resolve(data);
        });
    });
    if(req.cookies && !req.cookies.loc) {
        console.log('setting cookie');
        res.cookie('loc', JSON.stringify(data), {
            httpOnly: true,
            sameSite: false,
            maxAge: 1000 * 3600,
            domain: '/'
        });
    }
    res.render('index');
});
server.get('/leaderboard', async(req, res, nxt) => {
    // lookup current leaderboard
    const resLeaders = await pubgApi.getSeasonLeaderboard(
        'division.bro.official.pc-2018-05', 'solo', 0, 'steam');
    const leaders = pubgApiHandlers.getSeasonLeaderboardHandler(resLeaders);
    //console.log(leaders);
    res.render('leaderboard', { leaderboard: leaders, modeActive: 'solo', platform: 'steam' });
});

// setup the static directory root 
server.use('/leaderboard/:platform/:gameMode', express.static(ASSETSDIR));
server.use('/leaderboard/:platform/:gameMode', express.static(FAVSDIR));
server.use('/leaderboard/:platform/:gameMode', express.static(SCRIPTSDIR));
server.get('/leaderboard/:platform/:gameMode', async(req, res, nxt) => {
    let { platform, gameMode } = req.params;
    if(!platform || platform === 'steam') {
        platform = ''; // steam by default 
    }
    if(!gameMode) {
        gameMode = 'solo'
    }
    
});

server.use('/player', express.static(ASSETSDIR));
server.use('/player', express.static(FAVSDIR));
server.use('/player', express.static(SCRIPTSDIR));
server.get('/player', async (req, res, nxt) => {
    if(req.cookies && req.cookies.p) {
        return res.render('playerStats', { playerName: req.cookies.p.playerName });
    }
    res.render('playerStats', { playerName: '' });
});

server.use('/player/:playerName', express.static(ASSETSDIR));
server.use('/player/:playerName', express.static(FAVSDIR));
server.use('/player/:playerName', express.static(SCRIPTSDIR));
server.get('/player/:playerName', async (req, res, nxt) => {
    const { playerName } = req.params;
    if(!playerName) {
        return res.render('404');
    }
    console.log(req.cookies.loc);
    if(req.cookies && req.cookies.p) {
        console.log('[-] Cookie set already');
    }
    else if(req.cookies && !req.cookies.p) {
        console.log('[-] Setting player cookie');
        console.log(playerName);
        const p = { playerName: playerName };
        res.cookie('p', JSON.stringify(p), {
            httpOnly: true,
            sameSite: false,
            maxAge: 3600 * 1,
            domain: '/'
        });
    }
    else {
        console.error(new Error('[!] Unknown Error: No Cookie with request'));
    }
    res.render('playerStats', { playerName: playerName });
});


server.use('/player/:platform/:playerName', express.static(ASSETSDIR));
server.use('/player/:platform/:playerName', express.static(FAVSDIR));
server.use('/player/:platform/:playerName', express.static(SCRIPTSDIR));
server.get('/player/:platform/:playerName', async(req, res, nxt) => {
    // update the cache with player name; if not exists, throw 500
    const { platform, playerName } = req.params;
    if(!playerName) {
        return res.render('404');
    }
    if(!platform) {
        // try with steam
        platform = 'steam';
    }
    // check if ip is cached
    const ip = req.ip;
    const found = await new Promise((resolve, reject) => {
        CachePool._get(ip, (gerr, found) => {
            if(gerr) {
                console.error(gerr);
            }
            resolve(found);
        });
    });
    if(!found) {
        res.render('500');
    }
    else {
        const o = JSON.parse(found);
        o.playerName = playerName;
        o.platform = platform;
        await new Promise((resolve, reject) => {
            CachePool._set(ip, JSON.stringify(o), (serr) => {
                if(serr) {
                    console.error(serr);
                }
                resolve();
            });
        });
    }
    nxt();
});
server.get('/player/:platform/:playerName', async (req, res, nxt) => {
    // lookup player from api; if found, show stats; else 404
    console.log('cookie.p');
    req.cookies && console.log(req.cookies.p);
    try {
        const { platform, playerName } = req.params;
        if(!platform) {
            platform = 'steam'; // default
        }
        if(!playerName) {
            return res.render('404');
        }
        // add code to lookup db first
        let resPlayer, playerId;
        if(!req.cookies || (req.cookies && !req.cookies.p)) {
            resPlayer = await pubgApi.getPlayer(playerName, platform);
            playerId = pubgApiHandlers.getPlayerHandler(resPlayer);
        }
        else {
            console.log('[-] Using cookie value');
            playerId = req.cookies.p.playerId;
        }
        const recentSeasons = await new Promise((resolve, reject) => {
            DBPool.query(queries.seasons(platform), (gerr, seas) => {
                if(gerr) {
                    console.error(gerr);
                }
                resolve(seas);
            });
        });
        console.log(`PlayerId: ${playerId}`);
        if(!recentSeasons) {
            return res.render('500');
        }
        let sts = [];
        for(const s of recentSeasons) {
            try {
                let resstats = await pubgApi.getPlayerSeasonStats(playerId, s.season_id, platform);
                let stats = pubgApiHandlers.getPlayerSeasonLifetimeStatsHandler(resstats);
                sts.push(stats);
            } catch(plLookUpError) {
                console.error(plLookUpError);                
            }
        }
        console.log(sts);
        if(req.cookies && (!req.cookies.p || !req.cookies.p.playerId)) {
            res.cookie('p', JSON.stringify({
                playerName: playerName,
                playerId: playerId
            }), {
                httpOnly: true,
                sameSite: false,
                maxAge: 3600 * 2,
                domain: '/'
            });    
        }
        res.render('playerStatsDetails', { stats: sts, activePlatform: platform, playerName: playerName });
        // save in db!
        
    } catch(lookupErr) {
        console.error(lookupErr);
    }
});

server.use('/weaponsMastery', express.static(ASSETSDIR));
server.use('/weaponsMastery', express.static(FAVSDIR));
server.use('/weaponsMastery', express.static(SCRIPTSDIR));
server.get('/weaponsMastery', async (req, res, nxt) => {
    let pname = "";
    if(req.cookies && req.cookies.p) {
        pname = req.cookies.p.playerName;
    }
    res.render('weapons-stats', { activePlatform: 'steam', playerName: pname, stats: null });
});

server.use('/weaponsMastery/:platform/:playerName', express.static(ASSETSDIR));
server.use('/weaponsMastery/:platform/:playerName', express.static(FAVSDIR));
server.use('/weaponsMastery/:platform/:playerName', express.static(SCRIPTSDIR));
server.get('/weaponsMastery/:platform/:playerName', async (req, res, nxt) => {
    const { platform, playerName } = req.params;
    let pname;
    if(!platform) {
        return res.render('404');
    }
    if(req.cookies && req.cookies.p) {
        console.log(`[-] Cookie Player Name: ${req.cookies.p.playerName}`);
        pname = req.cookies.p.playerName;
    }
    if(!playerName && !pname) {
        return res.render('500');
    }
    // lookup weapons stats
    try {
        let pid;
        if(!req.cookies && !req.cookies.p && req.cookies.p.playerId) {
            // lookup
            try {
                const resPlayer = await pubgApi.getPlayer(playerName, platform);
                pid = pubgApiHandlers.getPlayerHandler(resPlayer);
            } catch(idLkUpErr) {
                console.error(idLkUpErr);
                return res.render('404');
            }
        }
        else {
            pid = req.cookies.p.playerId;
        }
        const resStats = await pubgApi.getWeaponsMastery(pid, platform);
        const stats = pubgApiHandlers.getWeaponsMasteryHandler(resStats);
        res.render('weapons-stats', { activePlatform: 'steam', playerName: pname, stats: stats });
    } catch(lkupErr) {
        console.error(lkupErr);
        res.render('500');
    }
});

server.use('/telemetry', express.static(ASSETSDIR));
server.use('/telemetry', express.static(FAVSDIR));
server.use('/telemetry', express.static(SCRIPTSDIR));
server.get('/telemetry', async (req, res, nxt) => {
    
    res.render('telemetry');
});

server.get('/getTelemetries', async (req, res, nxt) => {
    try {
        const telem = await new Promise((resolve, reject) => {
            const q = `
                SELECT * FROM regional_modes_stats;
            `;
            DBPool.query(q, (err, stats) => {
                if(err) {
                    reject(err);
                }
                else {
                    resolve(stats);
                }
            });
        });
        const resActivePlayersSteam = await steamApi.getPlayersCount();
        const activePlayersSteam = resActivePlayersSteam.data.response.player_count;
        console.log(activePlayersSteam);
        res.json({
            status: 200,
            stats: telem,
            activePlayersSteam: activePlayersSteam
        });
    } catch(err) {
        console.error(err);  
        res.render('500');
    }
});

//server.use('/api', pubgStatsApi);

// check for env vars
if(process.env.PUBGSTATS_HOST && process.env.PUBGSTATS_PORT) {
    // for production depoloyment
    if(process.env.PUBGSTATS_HOST !== 'localhost') {
        process.env.PUBGSTATS_HOST = 'localhost';
    }
    if(process.env.PUBGSTATS_PORT !== '4200') {
        process.env.PUBGSTATS_PORT = 4200;
    }
    configs.SERVER_HOST = process.env.PUBGSTATS_HOST;
    configs.SERVER_PORT = process.env.PUBGSTATS_PORT;
}
server.listen(configs.SERVER_PORT, configs.SERVER_HOST, () => {
    logger.info(`[${moment().format('YYYY MM DD h:mm')}] PUBGStats.info server started at ${configs.SERVER_HOST}:${configs.SERVER_PORT}`);
    console.log(`[${moment().format('YYYY MM DD h:mm')}] PUBGStats.info server started at ${configs.SERVER_HOST}:${configs.SERVER_PORT}`)
});
