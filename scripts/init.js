const BASEURL = 'http://127.0.0.1:4200/';
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
    const formInput = document.querySelector('#player-info-card')
        .querySelector('form').querySelector('input');
    const name = formInput.getAttribute('value');
    const ul = document.querySelector('#player-info-platform-sel');
    const lis = ul.querySelectorAll('li');
    let li;
    for(li of lis) {
        if(li.classList.contains('selected')) break;
    }
    const platform = li.getAttribute('value');
    window.location.href = BASEURL.concat(['player/' + `${platform}` + `/${name}`]);
};
const showRegionalModeStats = () => {
    if(!TELEMETRY_STATS) {
        return console.log('[x] No telemetry data cached');
    }
    const mdist = document.querySelector('#mdist-region');
    const labs = [ 'Solo', 'Duo', 'Squad', 'solo-Fpp', 'Duo-Fpp', 'Squad-Fpp'];
    const pc = TELEMETRY_STATS.filter(s => s.platform === 'pc');
    const ul = document.querySelector('ul');
    const lis = ul.querySelectorAll('li');
    let sel;
    for(const li of lis) {
        if(li.classList.contains('selected')) {
            sel = li;
            break;
        }
    }
    const reg = sel.querySelector('span').innerHTML;
    const st = pc.filter(p => p.name === reg)[0];
    const data = [
        st.solo, st.duo, st.squad, st.solo_fpp, st.duo_fpp, st.squad_fpp
    ];
    new Chart(document.querySelector('#match-distribution'), {
        type: 'pie',
        data: {
            datasets: [
                {
                    data: data,
                    fill: true,
                    backgroundColor: [
                        'rgb(210, 191, 85)',
                        'rgb(164, 249, 200)',
                        'rgb(170, 80, 66)',
                        'rgb(63, 48, 71)',
                        'rgb(14, 173, 105)',
                        'rgb(238, 66, 102)'
                    ]
                }
            ],
            labels: labs
        }
    });
}
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
            act.innerHTML = data.activePlayerSteam;

            // create 2 rows
            const regSel = document.querySelector('#region-sel');
            let first = true;
            for(const opt of keys) {
                const o = document.createElement('option');
                if(first) {
                    o.classList.add('selected');
                    first = false;
                }
                o.value = opt;
                o.innerHTML = opt;
                regSel.appendChild(o);
            }
            // init Selector
            M.FormSelect.init(regSel);
            const selectWrapper = document.querySelector('.select-wrapper');
            const regSelInput = selectWrapper.querySelector('input');
            regSelInput.addEventListener('onchange', showRegionalModeStats);
            

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
            
            //showRegionalModeStats();
            document.querySelector('#preloader').classList.remove('active');
            cont.classList.remove('dont-show');
            //document.querySelector('select').formSelect();
        }
    });
};
