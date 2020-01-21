module.exports = function(squel) {
    return {
        seasons: (platform = '') => {
            const t = platform ? `seasons_${platform}` : `seasons`;
            return squel
                .select().from(t)
                .order('_id', false)
                .limit(5).toString();
        },
        insertSeasons: (seasons, platform) => {
            const s = seasons.map(season => { 
                return {
                    _id: null,
                    season_id: season.id,
                    is_current: season.attributes.isCurrentSeason
                };
            });
            return squel
                .insert().into(`seasons_${platform}`)
                .setFieldsRows(s)
                .toString();
        },
        matches: () => {
            return squel
                .select().from('matches').toString();
        },
        insertMatches: (matches) => {
            const m = matches.map(match => {
                return {
                    _id: null,
                    match_id: match.id
                };
            });
            return squel
                .insert().into('matches')
                .setFieldsRows(m)
                .toString();
        },
        tournaments: () => {
            return squel
                .select().from('tournaments').toString();
        },
        insertTournaments: (tournaments) => {
            const t = tournaments.map(tour => {
                return {
                    _id: null,
                    tournament_id: tour.id,
                    created_at: tour.attributes.createdAt
                };
            });
            return squel
                .insert().into('tournaments')
                .setFieldsRows(t)
                .toString();
        },
        gameSchema: () => {
            return squel
                .select().from('achievements_descriptions').toString();
        },
        insertGameSchema: (gameSchema) => {
            //console.log(gameSchema);
            const gs = gameSchema.map(ach => {
                return {
                    _id: null,
                    name: ach.name,
                    default_value: ach.defaultvalue,
                    display_name: ach.displayName.replace(/\'/g, '|'),
                    description: ach.description.replace(/\'/g, '|'),
                    icon: ach.icon
                };
            });
            return squel
                .insert().into('achievements_descriptions')
                .setFieldsRows(gs)
                .toString();
        },
        percentages: () => {
            return squel
                .select().from('achievements_percentages').toString();
        },
        insertGamePercentages: (percentages) => {
            const p = percentages.map(per => {
                return {
                    _id: null,
                    name: per.name,
                    percentage: per.percent
                };
            });
            return squel
                .insert().into('achievements_percentages')
                .setFieldsRows(p)
                .toString();
        },
        insertSeasonsLeaderboard: (seasonId, gameMode, leaders) => {
            const l = leaders.map(lead => {
                return {
                    season_id: seasonId,
                    game_mode: gameMode,
                    player_name: lead.attributes.name,
                    rank: lead.attributes.rank,
                    rank_points: lead.attributes.stats.rankPoints,
                    wins: lead.attributes.stats.wins,
                    games_played: lead.attributes.stats.games,
                    win_ratio: lead.attributes.stats.winRatio,
                    average_damage: lead.attributes.stats.averageDamage,
                    kills: lead.attributes.stats.kills,
                    kill_death_ratio: lead.attributes.stats.killDeathRatio,
                    average_rank: lead.attributes.stats.averageRank
                };
            });
            return squel.insert()
                .into('leaderboards')
                .setFieldsRows(l).toString();
        },
        insertSteamPlayerStats: (stats) => {
            const s = stats.map(st => {
                return {
                    _id: null,
                    month: st.month,
                    average_players: st.avgPlayers,
                    gain: st.gainOrLoss,
                    gain_percentage: st.gainLossPercentage,
                    peak: st.peak
                };
            });
            return squel.insert()
                .into('player_stats_steam')
                .setFieldsRows(s).toString();
        },
        getTopLeadersBySeason: (gameMode, seasoon_id = 20, count = 15, platform = 'steam') => {
            if(typeof season_id === 'string' && seasoon_id.search(/division/) !== -1) {
                let s = squel.select()
                    .from('seasons')
                    .field('_id')
                    .where('season_id = ?', seasoon_id)
                    .limit(1).toString();
                season_id = s._id;
            }
            return squel.select()
                .from(`leaderboards`)
                .where('game_mode = ?', gameMode)
                .where('season_id = ?', seasoon_id)
                .order('rank')
                .limit(count).toString();
        },
        getSteamPlayerStats: () => {
            return squel.select()
                .from('player_stats_steam')
                .fields(['month, average_players, gain, gain_percentage, peak'])
                .order('_id', false)
                .toString();
        }
    };
};