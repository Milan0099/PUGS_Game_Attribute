/*
    * Initialization Script
    * ---------------------
    * Script for initializing all material components
*/
const BASE_URL = 'https://pubgstats.info/api';

const ajaxErrorHandler = (xhr, textStatus, error) => {
    console.log('[x] Error occured while sending AJAX request');
    console.error(error);
};
const toggleClass = (el) => {
    if (el.el !== undefined) {
        el = el.el;
    }
    if (el.classList.contains('sidenav-opened')) {
        // close
        el.classList.remove('sidenav-opened');
        el.classList.add('sidenave-closed');
    } else if (el.classList.contains('sidenav-closed')) {
        el.classList.remove('sidenav-closed');
        el.classList.add('sidenav-opened');
    } else {
        // just open it
        el.classList.add('sidenav-opened');
    }
};
const toggleMenu = () => {
    const ref = document.querySelector('#site-nav');
    const inst = M.Sidenav.getInstance(ref);
    if (inst.isOpen) {
        inst.close();
        toggleClass(ref);
    } else {
        inst.open();
        toggleClass(ref);
    }
};
const addRightBorder = (tds) => {
    for(const td of tds) {
        td.classList.add('cell');
        td.classList.add('cell-border');
    }
};
const hideTables = () => {
    const leadTable = document.querySelector('#leaderboard-table');

    if(leadTable.classList.contains('show-table')) {
        leadTable.classList.remove('show-table');
    }
    leadTable.classList.add('hide-table');
};
const showTable = (tbl) => {
    if(tbl.classList.contains('hide-table')) {
        tbl.classList.remove('hide-table');
    }
    tbl.classList.add('show-table');
};
const leaderboardPlatformSelected = () => {
    $('#platform-selector select')
        .on('change', () => {
            const sel = $('#platform-selector select');
            const idx = sel[0].selectedIndex;
            if(idx === 0) {
                return ; // skip; nothing selected
            }
            const opt = sel[0][idx];
            const platform = opt.value;
            $.ajax({
                url: `${BASE_URL}/getSeasons/${platform}`,
                dataType: 'json',
                error: ajaxErrorHandler,
                success: (data, txtStatus, xhr) => {
                    const selectDiv = document.querySelector('#season-selector');
                    const select = selectDiv.querySelector('select');
                    if(typeof data === 'object' && data.seasons && data.seasons.length) {
                        for(const seas of data.seasons) {
                            let option = document.createElement('option');
                            option.setAttribute('value', seas.season_id);
                            option.innerHTML = seas.season_id;
                            select.appendChild(option);
                        }
                        $('select').formSelect();
                    }
                }
            });
        });
};
const playerStatsPlatformSelected = () => {
    $('#player-stats-platform-selector select')
        .on('change', () => {
            const sel = $('#player-stats-platform-selector select');
            const idx = sel[0].selectedIndex;
            if(idx === 0) {
                return ;
            }
            const opt = sel[0][idx];
            const platform = opt.value;
            $.ajax({
                url: `${BASE_URL}/getSeasons/${platform}`,
                error: ajaxErrorHandler,
                dataType: 'json',
                success: (data, txtStatus, xhr) => {
                    const selectDiv = document.querySelector('#player-stats-season-selector');
                    const select = selectDiv.querySelector('select');
                    if(typeof data === 'object' && data.seasons && data.seasons.length) {
                        for(const seas of data.seasons) {
                            let option = document.createElement('option');
                            option.setAttribute('value', seas.season_id);
                            option.innerHTML = seas.season_id;
                            select.appendChild(option);
                        }
                        $('select').formSelect();
                    }
                }
            });
        });
};
const getLeaderboard = () => {
    const spinner = document.querySelector('#leaderboard-loading-spinner');
    spinner.classList.add('active');
    const pltSel = $('#platform-selector select');
    const seaSel = $('#season-selector select');
    const modeSel = $('#game-mode-selector select');

    const plt = pltSel[0][pltSel[0].selectedIndex].value;
    const sea = seaSel[0][seaSel[0].selectedIndex].value;
    const mod = modeSel[0][modeSel[0].selectedIndex].value;

    console.log(`${mod} ${plt} ${sea}`);
    if(!plt || !sea || !mod) {
        console.log('[x] Bad inputs in form');
        return ;
    }
    $.ajax({
        url: `${BASE_URL}/getTopLeadersBySeason`,
        dataType: 'json',
        contentType: 'application/json',
        method: 'POST',
        data: JSON.stringify({
            gameMode: mod,
            seasonId: sea,
            platform: plt
        }),
        crossDomain: true,
        error: ajaxErrorHandler,
        success: (data, txtStatus, xhr) => {
            console.log(data);
            const table = document.querySelector('#leaderboard-table');
            const tbody = table.querySelector('tbody');
            if(data.leaders && data.leaders.length) {
                for(const lead of data.leaders) {
                    let tr = document.createElement('tr');
                    let name = document.createElement('td');
                    let rank = document.createElement('td');
                    let avgrank = document.createElement('td');
                    let avgdamage = document.createElement('td');
                    let games = document.createElement('td');
                    let kills = document.createElement('td');
                    let wins = document.createElement('td');
                    let kdratio = document.createElement('td');
                    let winratio = document.createElement('td');
                    let rankPts = document.createElement('td');

                    const attr = lead.attributes;
                    const stats = attr.stats;
                    name.innerHTML = attr.name;
                    rank.innerHTML = attr.rank;
                    avgrank.innerHTML = stats.averageRank;
                    avgdamage.innerHTML = stats.averageDamage;
                    games.innerHTML = stats.games;
                    kills.innerHTML = stats.kills;
                    wins.innerHTML = stats.wins;
                    kdratio.innerHTML = parseFloat(stats.killDeathRatio).toFixed(2);
                    winratio.innerHTML = parseFloat(stats.winRatio).toFixed(2);
                    rankPts.innerHTML = stats.rankPoints;

                    // add borders on cell
                    addRightBorder([name, rank, avgrank, avgdamage, games, kills, wins, kdratio, winratio]);

                    // maintain order while appending
                    tr.appendChild(name);
                    tr.appendChild(rank);
                    tr.appendChild(avgrank);
                    tr.appendChild(avgdamage);
                    tr.appendChild(games);
                    tr.appendChild(kills);
                    tr.appendChild(wins);
                    tr.appendChild(kdratio);
                    tr.appendChild(winratio);
                    tr.appendChild(rankPts);

                    tbody.appendChild(tr);
                    spinner.classList.remove('active');
                    showTable(table);
                }
            }
        }
    });
};
const getPlayerStats = () => {
    const spinner = document.querySelector('#player-stats-loading-spinner');
    const statsDiv = document.querySelector('#player-stats-details');
    const nameInputDiv = document.querySelector('#players-stats-form-name');
    const statsDetails = document.querySelector('#player-stats-details');
    const nameInput = nameInputDiv.querySelector('input'); 
    const pltSel = $('#player-stats-platform-selector select');
    const seaSel = $('#player-stats-season-selector select');
    
    const name = nameInput.value;
    console.log(`Name: ${name}`);
    const plt = pltSel[0][pltSel[0].selectedIndex].value;
    const sea = seaSel[0][seaSel[0].selectedIndex].value;

    spinner.classList.add('active');
    $.ajax({
        url: `${BASE_URL}/getPlayerSeasonLifetimeStats`,
        dataType: 'json',
        method: 'POST',
        contentType: 'application/json',
        crossDomain: true,
        error: ajaxErrorHandler,
        data: JSON.stringify({
            playerName: name,
            seasonId: sea,
            platform: plt
        }),
        success: (data, txtStatus, xhr) => {
            const tbody = statsDetails.querySelector('tbody');
            const thead = statsDetails.querySelector('thead');
            const stats = data.stats; // object
            console.log(stats);
            const modes = Object.keys(stats);

            // setup headers
            const capitalized = modes.map(mode => {
                if(mode.search('-') !== -1) {
                    return mode.split('-')
                        .map(w => w[0].toUpperCase() + w.substr(1))
                        .join(' ');
                }
                else {
                    return mode[0].toUpperCase() + mode.substr(1);
                }
            });
            const headSpacer = document.createElement('th');
            headSpacer.innerHTML = 'Stat Name';
            headSpacer.classList.add('cell', 'cell-border');
            thead.appendChild(headSpacer); // left most empty
            
            for(let i=0; i<capitalized.length; i++) {
                let th = document.createElement('th');
                th.innerHTML = capitalized[i];
                if(i !== capitalized.length-1) {
                    th.classList.add('cell-border');
                }
                th.classList.add('cell');
                thead.appendChild(th);
            }
            // setup left most labels col
            const firstCol = Object.keys(stats[modes[0]]);
            const numAttrs = firstCol.length;

            for(let i=0; i<numAttrs; i++) {
                let attr = firstCol.shift();
                let tr = document.createElement('tr');
                let attrName = document.createElement('td');
                attrName.innerHTML = attr[0].toUpperCase() + attr.substr(1);
                attrName.classList.add('cell', 'cell-border');
                tr.appendChild(attrName);

                for(let j=0; j<modes.length; j++) {
                    let td = document.createElement('td');
                    let v = stats[modes[j]][attr];
                    td.innerHTML = v;
                    if(j !== modes.length-1) {
                        td.classList.add('cell-border');
                    }
                    td.classList.add('cell');
                    tr.appendChild(td);
                }
                tbody.appendChild(tr);                
            }
            spinner.classList.remove('active');
        }
    });
};
const getPlayerWeaponsStats = () => {
    const spinner = document.querySelector('#weapons-mastery-loading-spinner');
    const nameInputDiv = document.querySelector('#weapons-mastery-form-name');
    const detailsDiv = document.querySelector('#weapons-mastery-details');
    const platformSel = $('#weapons-mastery-platform-selector select');

    const name = nameInputDiv.querySelector('input').value;
    const platform = platformSel[0][platformSel[0].selectedIndex].value;

    if(!name || !platform) {
        console.log('[x] Weapons mastery form incomplete');
        return ;
    }
    spinner.classList.add('active');
    $.ajax({
        method: 'POST',
        url: `${BASE_URL}/getPlayerWeaponSummaries`,
        contentType: 'application/json',
        dataType: 'json',
        crossDomain: true,
        data: JSON.stringify({
            playerName: name,
            platform: platform
        }),
        error: ajaxErrorHandler,
        success: (data, txtStatus, xhr) => {
            console.log(data);
            const summaries = data.summaries;
            const weapons = Object.keys(summaries);

            for(const weap of weapons) {
                const det = summaries[weap];
                let name = weap.replace('Item_Weapon_', '');
                name = name.replace('_C', '');

                let coll = document.createElement('ul');
                coll.classList.add('collection-with-header');
                let head = document.createElement('li');
                head.classList.add('collection-header', 'header');
                head.innerHTML = name;
                coll.appendChild(head);

                let basic = document.createElement('li');
                basic.classList.add('collection-item');
                basic.innerHTML = `<div class="row">
                    Total XP: ${det.XPTotal}
                    <span class="coll-spacer"></span>
                    Current Tier: ${det.TierCurrent}
                    <span class="col-spacer"></span>
                    Current Level: ${det.LevelCurrent}
                </div>`;
                coll.appendChild(basic);

                let medals = document.createElement('li');
                //medals.classList.add('collection-item');
                let medTable = document.createElement('table');
                //medTable.classList.add('centered', 'responsive-table');
                let medTabHeads = document.createElement('thead');
                let medName = document.createElement('th');
                medName.innerHTML = 'Medal Name';
                let medCount = document.createElement('th');
                medCount.innerHTML = 'Count';
                medTabHeads.appendChild(medName);
                medTabHeads.appendChild(medCount);
                medTable.appendChild(medTabHeads);
                let medTabBody = document.createElement('tbody');

                for(const med of det.Medals) {
                    let medRow = document.createElement('tr');
                    let medRowName = document.createElement('td');
                    let medRowCount = document.createElement('td');

                    medRowName.innerHTML = med.MedalId;
                    medRowCount.innerHTML = med.Count;

                    medRow.appendChild(medRowName);
                    medRow.appendChild(medRowCount);
                    medTabBody.appendChild(medRow);
                }
                medTable.appendChild(medTabBody);
                medals.appendChild(medTable);
                coll.appendChild(medals);

                let weapStats = document.createElement('li');
                weapStats.classList.add('collection-item');
                let statDiv = document.createElement('div');
                statDiv.classList.add('row');

                for(const st of Object.keys(det.StatsTotal).sort()) {
                    let stCol = document.createElement('div');
                    stCol.classList.add('col');
                    stCol.innerHTML = `
                        ${st}: <span class="coll-spacer"></span>
                        ${det.StatsTotal[st]}
                    `;
                    statDiv.appendChild(stCol);
                }
                weapStats.appendChild(statDiv);

                coll.appendChild(weapStats);
                detailsDiv.appendChild(coll);
            }
            
            spinner.classList.remove('active');
        }
    });
};
const getActivePlayers = () => {
    console.log('getting active players');
    $.ajax({
        url: `${BASE_URL}/getActivePlayers`,
        dataType: 'json',
        error: (xhr, txtStatus, error) => {
            console.log('[x] Error while fetching steam active players');
            console.error(error);
        },
        success: (data, txtStatus, xhr) => {
            const table = document.querySelector('#steam-active');
            const tbody = table.querySelector('tbody');
            if(typeof data === 'object' && data.stats && data.stats.length) {
                for(const st of data.stats) {
                    let tr = document.createElement('tr');

                    let month = document.createElement('td');
                    let avgplayers = document.createElement('td');
                    let gain = document.createElement('td');
                    let gainPerc = document.createElement('td');
                    let peak = document.createElement('td');

                    month.innerHTML = st.month;
                    avgplayers.innerHTML = st.average_players;
                    gain.innerHTML = st.gain;
                    gainPerc.innerHTML = st.gain_percentage;
                    peak.innerHTML = st.peak;

                    tr.appendChild(month);
                    tr.appendChild(avgplayers);
                    tr.appendChild(gain);
                    tr.appendChild(gainPerc);
                    tr.appendChild(peak);

                    tbody.appendChild(tr);
                }
            }
        }
    });
};
const startSlideShow = () => {
    $("#home > div:gt(0)").hide();

    setInterval(function() { 
        $('#home > div:first')
            .fadeOut(5000)
            .next()
            .fadeIn(1000)
            .end()
            .appendTo('#home');
    },  7000);
};

( () => {
    const nav = document.querySelector('#site-nav');
    const M_nav = M.Sidenav.init(nav, {
        // options
        edge: 'left',
        draggable: true,
        preventScrolling: false,
        onOpenStart: function() {
            const nav = document.querySelector('#site-nav');
            const sidenavRef = M.Sidenav.getInstance(nav);
            toggleClass(sidenavRef);
        },
        onCloseStart: function() {
            const nav = document.querySelector('#site-nav');
            const sidenavRef = M.Sidenav.getInstance(nav);
            toggleClass(sidenavRef);
        }
    });
    document.addEventListener('DOMContentLoaded', () => {
        $('.scrollspy').scrollSpy();
        $(document).ready(function(){
            $('select').formSelect();
        });
        startSlideShow();
        leaderboardPlatformSelected();
        playerStatsPlatformSelected();
        hideTables();
    });
    getActivePlayers();
})();

