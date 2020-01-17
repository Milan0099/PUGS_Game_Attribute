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
const bodyParser = require('body-parser');
const session = require('express-session');
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

////// CONSTANTS      \\\\\\\\\\\\\\\\\\\\\\\\\\
const ACCESS_CTRL_MAX_AGE = 3600 * 2; // 2 hours
const MYSQL_POOL_MAX_CONNECTIONS = 5; 
const COOKIE_MAX_AGE = 30; //  30s; for prod, make it 7 days

////// SERVER SETUP    \\\\\\\\\\\\\\\\\\\\\\\\\\
const server = express();
server.use(bodyParser.json());
server.use(bodyParser.urlencoded({ extended: true }));
server.use(cors({
    "origin": "*",
    "methods": "GET,POST",
    "preflightContinue": false,
    "optionsSuccessStatus": 204,
    "maxAge": ACCESS_CTRL_MAX_AGE,
    "allowedHeaders": ["Content-Type", "Content-Length"]
}));
server.use(session({
    name: 'pubgstats.sid',
    secret: 'SOME-SECRETS-HERE',
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: COOKIE_MAX_AGE,
        secure: false, // change in production
        sameSite: true,
        httpOnly: true
    },
    store: new connectMemcached({
        hosts: ['127.0.0.1:11211'],
        secret: 'SOME-OTHER-SECRETS-HERE'
    })
}));

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

server.use('/api', pubgStatsApi);

// check for env vars
if(process.env.PUBGSTATS_HOST && process.env.PUBGSTATS_PORT) {
    // for production depoloyment
    configs.SERVER_HOST = process.env.PUBGSTATS_HOST;
    configs.SERVER_PORT = process.env.PUBGSTATS_PORT;
}
server.listen(configs.SERVER_PORT, configs.SERVER_HOST, () => {
    logger.info(`[${moment().format('YYYY MM DD h:mm')}] PUBGStats.info server started at ${configs.SERVER_HOST}:${configs.SERVER_PORT}`);
});
