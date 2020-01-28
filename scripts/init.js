const BASEURL = 'http://127.0.0.1:4200/';
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
    const URL = BASEURL.concat([`${name}`]);
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
    window.location.href = BASEURL.concat([`${platform}` + `/${name}`]);
};