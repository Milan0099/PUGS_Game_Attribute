const BASEURL = 'https://pubgstats.info/';
const MAPPINGS = {
    'Asia': 'as',
    'Europe': 'eu',
    'North America': 'na',
    'Japan': 'jp',
    'Oceania': 'oc',
    'Russia': 'ru',
    'South and Central America': 'sa',
    'South East Asia': 'sea',
    'Korea': 'krjp',
    'Kakao': 'kakao'
};
let TELEMETRY_STATS = null;

// Disable automatic style injection for CSP 
Chart.platform.disableCSSInjection = true;


const showPreloader = () => {
    const l = document.querySelector('#preloader');
    const c = document.querySelector('#tele-container');
    c.classList.add('dont-show');
    l.classList.add('active');
};
const showTelemetryContainer = (show = true) => {
    const c = document.querySelector('#tele-container');
    if(show) {
        c.classList.contains('dont-show') && c.classList.remove('dont-show');
    }
    else {
        !c.classList.contains('dont-show') && c.classList.add('dont-show');
    }
};
const changeMenu = (li) => {
    const ul = document.querySelector('#mobile-nav');
    const lis = ul.querySelectorAll('li');
    if(lis && lis.length) {
        for(const l of lis) {
            if(l.classList.contains('active')) {
                l.classList.remove('active');
            }
        }
    }
    li.classList.add('active');
};
const getLeaderboard = (evt) => {
    console.log(evt);
    let modeOrPlatform = evt.getAttribute('value');
    console.log(`MOde:${modeOrPlatform}`);
    let alreadySelected = evt.classList.contains('selected');
    if(alreadySelected) {
        return ;
    }
    switch(modeOrPlatform) {
        case 'steam': case 'psn': case 'xbox': case 'kakao':
            let modes = document.querySelector('#leaderboard-mode-sel');
            modes = modes.querySelectorAll('li').values();
            let mode;
            for(const m of modes) {
                if(m.classList.contains('selected')) {
                    mode = m.getAttribute('value');
                }
            }
                
            window.location.href = BASEURL.concat(['leaderboard' + `/${modeOrPlatform}` + `/${mode}`]);
            break;
        default:
            let plts = document.querySelector('#leaderboard-platform-sel');
            plts = plts.querySelectorAll('li').values();
            let plat;
            for(const p of plts) {
                if(p.classList.contains('selected')) {
                    plat = p.getAttribute('value');
                }
            }
            let amodes = document.querySelector('#leaderboard-mode-sel');
            amodes = amodes.querySelectorAll('li').values();
            let themode;
            for(const m of amodes) {
                if(m.classList.contains('selected')) {
                    themode = m.getAttribute('value');
                }
            }
            if(!plat) {
                console.log(plts);
                return ;
            }
            window.location.href = BASEURL.concat(['leaderboard' + `/${plat}` + `/${modeOrPlatform}`]);
            break;
    }
};
const searchPlayer = (event) => {
    event.preventDefault();
    const searchField = $('#search-field');
    const name = $(searchField).val();
    const URL = BASEURL.concat(['player/' + `${name}`]);
    console.log(`Searching for ${name}`);
    console.log(`URL: ${URL}`);
    //window.location.href = URL;
    window.location.href = URL;
    return false;
};
const selectPlatformPlayerStats = (li) => {
    const ul = document.querySelector('#player-info-platform-sel');
    const lis = ul.querySelectorAll('li');
    for(const l of lis) {
        if(l && l.classList && l.classList.contains('selected')) {
            l.classList.remove('selected');
        }
    }
    li && li.classList && li.classList.add('selected');
};
const getPlayerStats = () => {
    const formInput = document.querySelector('#player-info-name-input');
    let name = formInput.value; // problem; since ejs sets it to '', must submit and try 
    console.log(`Submitted first: ${name}`);
    if(!name) {
        // submit form 
        const form = document.querySelector('#player-stats-name-form');
        form.onsubmit = () => { return false; }
        form.submit();
        const fi = form.querySelector('#player-info-name-input');
        console.log(`PlayerName: ${fi.value}`);
        return ;
    }
    const ul = document.querySelector('#player-info-platform-sel');
    const lis = ul.querySelectorAll('li');
    let li;
    for(li of lis) {
        if(li.classList.contains('selected')) break;
    }
    const platform = li.getAttribute('value');
    window.location.href = BASEURL.concat(['player/' + `${platform}` + `/${name}`]);
};
const parseModeData = (mode, arr) => {
    let a = [];
    arr.forEach(e => a.push(e[mode]));
    console.log(`MOde: ${mode}  ==> ${a.toString()}`);
    return a;
}
const showRegionalModeStats = () => {
    if(!TELEMETRY_STATS) {
        return console.log('[x] No telemetry data cached');
    }
    const mdist = document.querySelector('#mdist-region').getContext('2d');
    const pc = TELEMETRY_STATS.filter(s => s.platform === 'pc');
    const sorted = pc.sort((a, b) => {
        if(a.name > b.name) return 1;
        else if(a.name < b.name) return -1;
        else return 0;
    });
    
    new Chart(mdist, {
        type: 'bar',
        data: {
            labels: Object.keys(MAPPINGS).sort(),
            datasets: [{
                label: 'Solo',
                backgroundColor: "rgb(232, 211, 63)",
                data: parseModeData('solo', sorted),
            }, {
                label: 'Duo',
                backgroundColor: "rgb(209, 123, 15)",
                data: parseModeData('duo', sorted),
            }, {
                label: 'Squad',
                backgroundColor: "rgb(183, 173, 207)",
                data: parseModeData('squad', sorted),
            }, {
                label: 'Solo FPP',
                backgroundColor: 'rgb(241, 81, 82)',
                data: parseModeData('solo_fpp', sorted)
            }, {
                label: 'Duo FPP',
                backgroundColor: 'rgb(53, 59, 60)',
                data: parseModeData('duo_fpp', sorted)
            }, {
                label: 'Squad FPP',
                backgroundColor: 'rgb(64, 112, 118)',
                data: parseModeData('squad_fpp', sorted)
            }],
        },
        options: {
            tooltips: {
            displayColors: true,
            },
            scales: {
            xAxes: [{
                stacked: true,
                gridLines: {
                display: false,
                }
            }],
            yAxes: [{
                stacked: true,
                ticks: {
                beginAtZero: true,
                },
                type: 'linear',
            }]
            },
            responsive: true,
        }
    });
};
const parseMapData = (mode, mnames, stats) => {
    const d = [];
    for(const r of Object.keys(stats)) {
        for(const m of mnames) {
            if(stats[r][m] && stats[r][m][mode] >= 0) {
                d.push(stats[r][m][mode]);
            }
        }
    }
    return d;
};
const showRegionMapCharts = (mapNames, mapStats) => {
    const ctx = document.querySelector('#mdist-maps');
    const ctx2 = document.querySelector('#reg-maps');
    const snames = Object.keys(mapNames).sort();
    const colors = {
        'Baltic_Main': "rgb(232, 211, 63)",
        'Desert_Main': "rgb(209, 123, 15)",
        'DihorOtok_Main': "rgb(183, 173, 207)",
        'Erangel_Main': "rgb(241, 81, 82)",
        'Range_Main': "rgb(53, 59, 60)",
        'Savage_Main': "rgb(64, 112, 118)",
        'Summerland_Main': "rgb(116,179,206)"
    };
    const anames = snames.map(n => mapNames[n]);
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: anames,
            datasets: [
                {
                    label: 'Solo',
                    backgroundColor: "rgb(232, 211, 63)",
                    data: parseMapData('solo', snames, mapStats)
                },
                {
                    label: 'Duo',
                    backgroundColor: 'rgb(209, 123, 15)',
                    data: parseMapData('duo', snames, mapStats) 
                },
                {
                    label: 'Squad',
                    backgroundColor: 'rgb(183, 173, 207)',
                    data: parseMapData('squad', snames, mapStats)
                },
                {
                    label: 'Solo FPP',
                    backgroundColor: 'rgb(241, 81, 82)',
                    data: parseMapData('solo-fpp', snames, mapStats)
                },
                {
                    label: 'Duo FPP',
                    backgroundColor: 'rgb(53, 59, 60)',
                    data: parseMapData('duo-fpp', snames, mapStats)
                },
                {
                    label: 'Squad FPP',
                    backgroundColor: 'rgb(64, 112, 118)',
                    data: parseMapData('squad-fpp', snames, mapStats)
                }
            ],
        },
        options: {
            tooltips: {
            displayColors: true,
            },
            scales: {
            xAxes: [{
                stacked: true,
                gridLines: {
                display: false,
                }
            }],
            yAxes: [{
                stacked: true,
                ticks: {
                beginAtZero: true,
                },
                type: 'linear',
            }]
            },
            responsive: true,
        }
    });
    const rm = [];
    const b = Object.keys(MAPPINGS).sort();
    for(const mp of snames) {
        let d = [];
        for(const reg of b) {
            let t = 0;
            if(!mapStats[reg][mp]) {
                continue;
            }
            for(const mattype of Object.keys(mapStats[reg][mp])) {
                t += mapStats[reg][mp][mattype];
            }
            d.push(t);
        }
        rm.push({
            label: mapNames[mp],
            backgroundColor: colors[mp],
            data: d
        })
    }
    console.log(rm);
    new Chart(ctx2, {
        type: 'bar',
        data: {
            labels: b,
            datasets: rm
        },
        options: {
            tooltips: {
            displayColors: true,
            },
            scales: {
            xAxes: [{
                stacked: true,
                gridLines: {
                display: false,
                }
            }],
            yAxes: [{
                stacked: true,
                ticks: {
                beginAtZero: true,
                },
                type: 'linear',
            }]
            },
            responsive: true,
        }
    });

};
const getTelemetries = () => {
    $.ajax({
        url: `${BASEURL}getTelemetries`,
        dataType: 'json',
        method: 'GET',
        error: (e, txt, xhr) => console.error(e),
        success: (data, txt, xhr) => {
            console.log(data);
            TELEMETRY_STATS = data.stats;
            const pc = data.stats.filter(p => p.platform === 'pc');
            const cont = document.querySelector('#tele-container');
            const act = document.querySelector('#steam-player-count');
            const keys = Object.keys(MAPPINGS).sort();

            // add active player count
            act.innerHTML = data.activePlayersSteam;

            let tpp = 0; 
            let fpp = 0;
            pc.forEach(d => {
                for(const m of Object.keys(d)) {
                    if(m.endsWith('fpp')) {
                        fpp++;
                    }
                    else {
                        tpp++;
                    }
                }
            });
            new Chart(document.querySelector('#tpp-fpp'), {
                type: 'pie',
                data: {
                    datasets: [
                        { 
                            data: [tpp, fpp],
                            fill: true,
                            backgroundColor: [
                                'rgb(92, 128, 188)',
                                'rgb(206, 83, 116)'
                            ] 
                        }
                    ],
                    labels: [
                        'TPP', 'FPP'
                    ]
                }   
            });
            let solo = 0;
            let soloFpp = 0;
            let duo = 0;
            let duoFpp = 0;
            let squad = 0;
            let squadFpp = 0;
            const labs = [ 'Solo', 'Duo', 'Squad', 'solo-Fpp', 'Duo-Fpp', 'Squad-Fpp'];

            pc.forEach(d => {
                solo += d.solo;
                duo += d.duo;
                squad += d.squad;
                soloFpp += d.solo_fpp;
                duoFpp += d.duo_fpp;
                squadFpp += d.squad_fpp;
            });
            const md = [solo, duo, squad, soloFpp, duoFpp, squadFpp];
            const tot = md.reduce((p, c) => {
                return p + c;
            }, 0);
            const amd = md.map(v => parseFloat((v/tot * 100).toFixed(2)));
            
            new Chart(document.querySelector('#match-distribution'), {
                type: 'pie',
                data: {
                    datasets: [
                        {
                            data: amd,
                            fill: true,
                            backgroundColor: [
                                'rgb(232, 211, 63)',
                                'rgb(209, 123, 15)',
                                'rgb(183, 173, 207)',
                                'rgb(241, 81, 82)',
                                'rgb(53, 59, 60)',
                                'rgb(64, 112, 118)'
                            ]
                        }
                    ],
                    labels: labs
                }
            });

            // show regional stat
            showRegionalModeStats();
            showRegionMapCharts(data.mapNames, data.mapStats);
            document.querySelector('#preloader').classList.remove('active');
            cont.classList.remove('dont-show');
        }
    });
};
