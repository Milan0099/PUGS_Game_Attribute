module.exports = function(squel) {
    return {
        seasons: () => {
            return squel
                .select().from('seasons').toString();
        },
        insertSeasons: (seasons) => {
            const s = seasons.map(season => { 
                return {
                    _id: null,
                    season_id: season.id,
                    is_current: season.attributes.isCurrentSeason
                };
            });
            return squel
                .insert().into('seasons')
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
        }
    };
};