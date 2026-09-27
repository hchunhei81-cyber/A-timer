(function () {
    'use strict';

    /* ============================================================
       FLIGHT DECK MODULE
       Exports everything the main app needs via window.FlightDeck
       ============================================================ */

    var $ = function (s, r) { return (r || document).querySelector(s) };
    var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)) };
    function clamp(n, a, b) { return Math.min(b, Math.max(a, n)) }
    function hexA(h, a) { h = String(h).replace('#', ''); if (h.length === 3) h = h.split('').map(function (c) { return c + c }).join(''); var n = parseInt(h, 16); return 'rgba(' + ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')' }

    /* ============================================================
       CONSTANTS
       ============================================================ */
    var AIRCRAFT = {
        b738: { name: 'Boeing 737-800', code: 'B738', cruiseAlt: 37000, cruiseSpd: 460, engineCount: 2, n1Idle: 22, n1Takeoff: 94, cruiseN1: 80, vsClimb: 2400, vsDescent: -1800, desc: 'Classic narrow-body. Reliable, familiar panel.' },
        b788: { name: 'Boeing 787-8', code: 'B788', cruiseAlt: 41000, cruiseSpd: 490, engineCount: 2, n1Idle: 24, n1Takeoff: 92, cruiseN1: 76, vsClimb: 2800, vsDescent: -2000, desc: 'Composite wide-body. Quieter, higher cruise, smoother ride.' },
        a320: { name: 'Airbus A320neo', code: 'A20N', cruiseAlt: 36000, cruiseSpd: 455, engineCount: 2, n1Idle: 23, n1Takeoff: 93, cruiseN1: 78, vsClimb: 2300, vsDescent: -1700, desc: 'Fly-by-wire narrow-body. Modern panel, side-stick.' },
        a359: { name: 'Airbus A350-900', code: 'A359', cruiseAlt: 43000, cruiseSpd: 488, engineCount: 2, n1Idle: 24, n1Takeoff: 91, cruiseN1: 75, vsClimb: 2600, vsDescent: -1900, desc: 'Long-haul wide-body. Very quiet, high ceiling.' },
        b744: { name: 'Boeing 747-400', code: 'B744', cruiseAlt: 35000, cruiseSpd: 490, engineCount: 4, n1Idle: 20, n1Takeoff: 96, cruiseN1: 74, vsClimb: 2000, vsDescent: -1600, desc: 'Queen of the skies. Four engines, distinctive feel.' }
    };

    var AIRPORTS = [['JFK', 'New York'], ['LHR', 'London'], ['CDG', 'Paris'], ['HND', 'Tokyo'], ['SIN', 'Singapore'], ['DXB', 'Dubai'], ['SYD', 'Sydney'], ['FRA', 'Frankfurt'], ['AMS', 'Amsterdam'], ['LAX', 'Los Angeles'], ['HKG', 'Hong Kong'], ['ICN', 'Seoul'], ['YYZ', 'Toronto'], ['GRU', 'Sao Paulo'], ['JNB', 'Johannesburg'], ['BOM', 'Mumbai'], ['PEK', 'Beijing'], ['MAD', 'Madrid'], ['IST', 'Istanbul'], ['ZRH', 'Zurich'], ['OSL', 'Oslo'], ['DUB', 'Dublin'], ['CPT', 'Cape Town'], ['MEX', 'Mexico City'], ['VIE', 'Vienna'], ['HEL', 'Helsinki'], ['LIS', 'Lisbon'], ['ATH', 'Athens'], ['BOS', 'Boston'], ['SEA', 'Seattle'], ['DEN', 'Denver'], ['MIA', 'Miami']];
    var FIX_NAMES = ['BOSOX', 'SNOWY', 'MERIT', 'PLUME', 'ROBUC', 'HAARP', 'BRISS', 'GEDIC', 'SEALL', 'CRONO', 'NANTK', 'SCUPP', 'KAYYS', 'HTO', 'JUPPP', 'ORWNN', 'CAMRN', 'ROBER', 'DIXIE', 'WHALE'];

    var PHASES = [
        { id: 'preflight', label: 'Pre-flight', short: 'PRE', from: 0.00, to: 0.08, altA: 0, altB: 0, spdA: 0, spdB: 0, pitchA: 0, pitchB: 0, radio: ['Cockpit preparation checklist', 'Requesting IFR clearance', 'Cleared as filed, climb via SID', 'Pushback and start approved', 'Before start checklist complete', 'Cabin crew, arm doors and cross-check'], cabin: ['Welcome aboard. Please ensure your seat backs and tray tables are in the upright position.', 'Cabin crew, prepare for departure.'] },
        { id: 'taxi', label: 'Taxi', short: 'TAX', from: 0.08, to: 0.18, altA: 0, altB: 0, spdA: 0, spdB: 18, pitchA: 0, pitchB: 0, radio: ['Ground, request taxi to runway', 'Taxi via Alpha, hold short', 'Cleared to line up and wait', 'Before takeoff checklist complete', 'Takeoff clearance confirmed'], cabin: [] },
        { id: 'takeoff', label: 'Takeoff', short: 'T/O', from: 0.18, to: 0.28, altA: 0, altB: 3000, spdA: 18, spdB: 180, pitchA: 0, pitchB: 15, radio: ['Cleared for takeoff'], cabin: [] },
        { id: 'climb', label: 'Climb', short: 'CLB', from: 0.28, to: 0.48, altA: 3000, altB: 36000, spdA: 180, spdB: 480, pitchA: 8, pitchB: 3, radio: ['Climbing flight level two four zero', 'Passing flight level one eight zero', 'Contact center on 132.4', 'Direct to waypoint, cleared as filed', 'Cruise checklist complete'], cabin: ['We have now reached a safe altitude. You may use approved electronic devices.'] },
        { id: 'cruise', label: 'Cruise', short: 'CRZ', from: 0.48, to: 0.75, altA: 36000, altB: 36000, spdA: 480, spdB: 480, pitchA: 2, pitchB: 2, radio: ['Level flight level three six zero', 'Smooth ride at altitude', 'Position report, estimating next waypoint', 'Oceanic entry point reached', 'Fuel burn nominal, all systems normal'], cabin: ['Ladies and gentlemen, we have reached our cruising altitude.'] },
        { id: 'descent', label: 'Descent', short: 'DES', from: 0.75, to: 0.88, altA: 36000, altB: 10000, spdA: 480, spdB: 280, pitchA: -2, pitchB: -3, radio: ['Request descent via arrival', 'Cleared to flight level two four zero', 'Contacting approach control', 'Descend via STAR', 'Approach checklist complete'], cabin: ['Ladies and gentlemen, we have begun our descent into our destination.'] },
        { id: 'approach', label: 'Approach', short: 'APP', from: 0.88, to: 0.96, altA: 10000, altB: 200, spdA: 280, spdB: 145, pitchA: -2, pitchB: 0, radio: ['Cleared ILS approach', 'Localizer captured', 'Glideslope captured', 'Gear down, flaps thirty', 'One thousand feet, stabilized'], cabin: ['Cabin crew, prepare for landing.'] },
        { id: 'landing', label: 'Landing', short: 'LDG', from: 0.96, to: 1.00, altA: 200, altB: 0, spdA: 145, spdB: 0, pitchA: 0, pitchB: 0, radio: ['Minimums', 'Runway in sight', 'Touchdown, spoilers up', 'Taxi to gate via Bravo', 'Shutdown checklist complete'], cabin: ['Welcome to our destination. Please remain seated until the seat belt sign is switched off.'] }
    ];
    var TAKEOFF_CALLOUTS = [{ at: 0.180, msg: 'Brake release, thrust set' }, { at: 0.192, msg: 'Eighty knots, cross-checked' }, { at: 0.208, msg: 'V one' }, { at: 0.220, msg: 'Rotate' }, { at: 0.238, msg: 'Positive rate, gear up' }, { at: 0.258, msg: 'Thrust reduction, climb thrust' }];
    var BREAK_FLIGHT = {
        short: { label: 'Turnaround', radio: ['Ground crew on station', 'Refueling in progress', 'Cabin reset underway', 'Catering service complete', 'Pre-flight checks restarting'] },
        long: { label: 'Layover', radio: ['Aircraft at gate', 'Maintenance walkaround complete', 'Crew rest period', 'Cabin deep clean in progress', 'Flight plan filed for next leg'] }
    };

    /* ============================================================
       SHARED STATE (injected from app.js)
       ============================================================ */
    var shared = { settings: null, runtime: null, el: null, flight: null, pSession: null, toast: null, notify: null, announce: null, totalFor: null, FLIGHT_MODE_LABELS: null };

    /* ============================================================
       FLIGHT SIM STATE
       ============================================================ */
    var flightSim = { n1Current: 22, egtCurrent: 380, progress: 0, totalNM: 3000, routePoints: [], traffic: [], calloutsDone: {}, windDir: 280, windSpd: 45, ndRange: 40, displayMode: 'pfd', heading: 90, bank: 0, localP: 0, phaseId: 'preflight', weather: { type: 'clear' }, announcedPhases: {}, cabinAnnounced: {} };

    var pfdBuilt = false, ndInit = false, lastRadioMsg = '', flightRafId = null, lastFrameTs = 0, cabinTimer = null;
    var engineAudio = { ctx: null, src: null, filter: null, gain: null, started: false };

    /* ============================================================
       ROUTE
       ============================================================ */
    function newRoute() {
        var a = AIRPORTS[Math.floor(Math.random() * AIRPORTS.length)];
        var b = a, g = 0;
        while (b[0] === a[0] && g < 30) { b = AIRPORTS[Math.floor(Math.random() * AIRPORTS.length)]; g++ }
        shared.flight.dep = a[0]; shared.flight.depCity = a[1];
        shared.flight.arr = b[0]; shared.flight.arrCity = b[1];
        shared.flight.number = 'PF-' + String(Math.floor(Math.random() * 900) + 100);
        shared.flight.squawk = String(Math.floor(Math.random() * 7000) + 1000);
        shared.flight.live = false;
        renderRoute();
        resetFlightSim();
    }

    function renderRoute() {
        var el = shared.el;
        if (!el.fdDep) return;
        el.fdDep.textContent = shared.flight.dep;
        el.fdDepCity.textContent = shared.flight.depCity || '';
        el.fdArr.textContent = shared.flight.arr;
        el.fdArrCity.textContent = shared.flight.arrCity || '';
        el.fdFlightNo.textContent = shared.flight.number || '--';
        el.fdSquawk.textContent = shared.flight.squawk || '----';
    }

    function buildRoutePoints() {
        var D = flightSim.totalNM;
        var pts = [{ x: 0, y: 0, name: shared.flight.dep, type: 'apt' }];
        var n = 15;
        for (var i = 1; i < n; i++) {
            var t = i / n;
            var seed = (shared.flight.dep.charCodeAt(0) * 7 + shared.flight.arr.charCodeAt(0) * 13 + i * 31) % 100;
            var y = (seed / 100 - 0.5) * 70 + Math.sin(i * 1.9) * 25;
            pts.push({ x: D * t, y: y, name: FIX_NAMES[(i + shared.flight.dep.charCodeAt(1)) % FIX_NAMES.length], type: 'wp' });
        }
        pts.push({ x: D, y: 0, name: shared.flight.arr, type: 'apt' });
        return pts;
    }

    function getACPos(progress) {
        var pts = flightSim.routePoints;
        if (!pts || pts.length < 2) return { x: 0, y: 0, hdg: 90 };
        var cum = [0];
        for (var i = 1; i < pts.length; i++) {
            var dx = pts[i].x - pts[i - 1].x, dy = pts[i].y - pts[i - 1].y;
            cum.push(cum[i - 1] + Math.sqrt(dx * dx + dy * dy));
        }
        var tot = cum[cum.length - 1], tgt = progress * tot;
        for (var j = 1; j < pts.length; j++) {
            if (tgt <= cum[j]) {
                var t = (tgt - cum[j - 1]) / Math.max(0.0001, cum[j] - cum[j - 1]);
                var x = pts[j - 1].x + (pts[j].x - pts[j - 1].x) * t;
                var y = pts[j - 1].y + (pts[j].y - pts[j - 1].y) * t;
                var h = Math.atan2(pts[j].x - pts[j - 1].x, pts[j].y - pts[j - 1].y) * 180 / Math.PI;
                if (h < 0) h += 360;
                return { x: x, y: y, hdg: h };
            }
        }
        return { x: pts[pts.length - 1].x, y: pts[pts.length - 1].y, hdg: 90 };
    }

    function spawnTraffic() {
        flightSim.traffic = [];
        var n = 3 + Math.floor(Math.random() * 3);
        for (var i = 0; i < n; i++) {
            flightSim.traffic.push({
                x: (Math.random() - 0.5) * flightSim.ndRange * 1.6,
                y: (Math.random() - 0.5) * flightSim.ndRange * 1.6,
                vx: (Math.random() - 0.5) * 0.15,
                vy: (Math.random() - 0.5) * 0.15,
                alt: Math.round((Math.random() - 0.5) * 4000)
            });
        }
    }

    function updateTraffic(dt) {
        var r = flightSim.ndRange;
        for (var i = 0; i < flightSim.traffic.length; i++) {
            var t = flightSim.traffic[i];
            t.x += t.vx * dt * 40;
            t.y += t.vy * dt * 40;
            if (Math.abs(t.x) > r * 2 || Math.abs(t.y) > r * 2) {
                t.x = (Math.random() - 0.5) * r * 1.4;
                t.y = (Math.random() - 0.5) * r * 1.4;
                t.vx = (Math.random() - 0.5) * 0.15;
                t.vy = (Math.random() - 0.5) * 0.15;
                t.alt = Math.round((Math.random() - 0.5) * 4000);
            }
        }
    }

    function resetFlightSim() {
        var ac = AIRCRAFT[shared.settings.aircraft];
        flightSim.n1Current = ac.n1Idle;
        flightSim.egtCurrent = 380;
        flightSim.progress = 0;
        flightSim.totalNM = 800 + Math.random() * 4200;
        flightSim.routePoints = buildRoutePoints();
        flightSim.calloutsDone = {};
        flightSim.windDir = 200 + Math.random() * 160;
        flightSim.windSpd = 20 + Math.random() * 60;
        flightSim.heading = 90;
        flightSim.bank = 0;
        flightSim.announcedPhases = {};
        flightSim.cabinAnnounced = {};
        spawnTraffic();
        lastRadioMsg = '';
        updateWeather();
        renderAircraftCode();
    }

    function renderAircraftCode() {
        var ac = AIRCRAFT[shared.settings.aircraft];
        if (shared.el.fdAircraft) shared.el.fdAircraft.textContent = ac.code;
    }

    /* ============================================================
       WEATHER
       ============================================================ */
    function pickWeather() {
        if (shared.settings.weather !== 'auto') return shared.settings.weather;
        var h = new Date().getHours();
        if (h < 6 || h >= 20) return 'night';
        var r = Math.random();
        if (r < 0.5) return 'clear';
        if (r < 0.78) return 'clouds';
        return 'rain';
    }

    function updateWeather() {
        var el = shared.el;
        var w = pickWeather();
        flightSim.weather.type = w;
        el.wRain.classList.toggle('on', w === 'rain');
        el.wClouds.classList.toggle('on', w === 'clouds' || w === 'rain');
        el.wNight.classList.toggle('on', w === 'night');
        var labels = { clear: 'Clear skies', clouds: 'Cloudy', rain: 'Rain', night: 'Night' };
        el.weatherIndicator.textContent = (labels[w] || 'Clear') + ' · ' + new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
    }

    /* ============================================================
       PFD
       ============================================================ */
    function buildPFD() {
        var el = shared.el;
        var svg = el.pfd;
        if (!svg) return;
        var h = '';
        h += '<defs><linearGradient id="skyG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#031527"/><stop offset="0.55" stop-color="#12466f"/><stop offset="1" stop-color="#4aa8dc"/></linearGradient><linearGradient id="grG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b06a2b"/><stop offset="0.4" stop-color="#6b3a14"/><stop offset="1" stop-color="#2a1505"/></linearGradient><clipPath id="ac"><rect x="100" y="40" width="240" height="240"/></clipPath><clipPath id="sc"><rect x="8" y="40" width="72" height="240"/></clipPath><clipPath id="alc"><rect x="360" y="40" width="72" height="240"/></clipPath><clipPath id="hc"><rect x="100" y="290" width="240" height="40"/></clipPath></defs>';
        h += '<rect width="440" height="340" fill="#050b14" rx="6"/>';
        h += '<rect width="440" height="26" fill="#000"/><line x1="146.6" y1="4" x2="146.6" y2="22" stroke="#1a3a5a"/><line x1="293.3" y1="4" x2="293.3" y2="22" stroke="#1a3a5a"/>';
        h += '<text id="fmaAt" x="73" y="18" text-anchor="middle" fill="#5bd45b" font-size="11" font-family="ui-monospace,monospace" font-weight="bold">A/T ARM</text>';
        h += '<text id="fmaRoll" x="220" y="18" text-anchor="middle" fill="#5bd45b" font-size="11" font-family="ui-monospace,monospace" font-weight="bold">LNAV</text>';
        h += '<text id="fmaPitch" x="366" y="18" text-anchor="middle" fill="#5bd45b" font-size="11" font-family="ui-monospace,monospace" font-weight="bold">VNAV</text>';
        h += '<rect x="8" y="40" width="80" height="240" fill="#0a1424" stroke="#2a4a6a"/><g clip-path="url(#sc)"><g id="spdSc"></g></g><path d="M 78 145 L 122 145 L 122 175 L 78 175 Z" fill="#000" stroke="#fff" stroke-width="1.5"/><text id="spdV" x="100" y="166" text-anchor="middle" fill="#fff" font-size="15" font-family="ui-monospace,monospace" font-weight="bold">0</text>';
        h += '<text x="48" y="34" text-anchor="middle" fill="#6a9cc0" font-size="8" font-family="ui-monospace,monospace">IAS</text><text x="48" y="292" text-anchor="middle" fill="#6a9cc0" font-size="8" font-family="ui-monospace,monospace">KTS</text>';
        h += '<rect x="100" y="40" width="240" height="240" fill="#000"/><g clip-path="url(#ac)"><g id="attT" transform="translate(220,160)"><g id="attI"><rect x="-400" y="-400" width="800" height="400" fill="url(#skyG)"/><rect x="-400" y="0" width="800" height="400" fill="url(#grG)"/><line x1="-400" y1="0" x2="400" y2="0" stroke="#fff" stroke-width="1.6"/><g id="lad"></g></g></g></g><rect x="100" y="40" width="240" height="240" fill="none" stroke="#2a4a6a"/>';
        h += '<g id="bk"></g><g id="sl"></g><g id="fdir"></g><g id="acf"><line x1="140" y1="160" x2="200" y2="160" stroke="#ffd400" stroke-width="3"/><line x1="240" y1="160" x2="300" y2="160" stroke="#ffd400" stroke-width="3"/><circle cx="220" cy="160" r="3" fill="#ffd400"/><line x1="200" y1="160" x2="205" y2="168" stroke="#ffd400" stroke-width="3"/><line x1="240" y1="160" x2="235" y2="168" stroke="#ffd400" stroke-width="3"/></g>';
        h += '<g transform="translate(318,55)"><g id="wArr"><polygon points="0,-9 4,5 0,2 -4,5" fill="#5bd45b"/></g><text id="wTxt" x="10" y="3" fill="#5bd45b" font-size="9" font-family="ui-monospace,monospace" font-weight="bold">280/45</text></g>';
        h += '<rect x="352" y="40" width="80" height="240" fill="#0a1424" stroke="#2a4a6a"/><g clip-path="url(#alc)"><g id="altSc"></g></g><path d="M 318 145 L 362 145 L 362 175 L 318 175 Z" fill="#000" stroke="#fff" stroke-width="1.5"/><text id="altV" x="340" y="166" text-anchor="middle" fill="#fff" font-size="15" font-family="ui-monospace,monospace" font-weight="bold">0</text><text x="392" y="34" text-anchor="middle" fill="#6a9cc0" font-size="8" font-family="ui-monospace,monospace">ALT</text><text x="392" y="292" text-anchor="middle" fill="#6a9cc0" font-size="8" font-family="ui-monospace,monospace">FT</text>';
        h += '<g id="vsi"></g>';
        h += '<rect x="100" y="290" width="240" height="40" fill="#0a1424" stroke="#2a4a6a"/><g clip-path="url(#hc)"><g id="hdgSc"></g></g><path d="M 197 290 L 197 330 L 243 330 L 243 290 Z" fill="#000" stroke="#fff" stroke-width="1.5"/><text id="hdgV" x="220" y="317" text-anchor="middle" fill="#fff" font-size="15" font-family="ui-monospace,monospace" font-weight="bold">000</text><polygon points="220,286 213,278 227,278" fill="#fff"/>';
        h += '<g id="btm"></g>';
        svg.innerHTML = h;
        el.pfdAttT = svg.querySelector('#attT');
        el.lad = svg.querySelector('#lad');
        el.spdSc = svg.querySelector('#spdSc');
        el.spdV = svg.querySelector('#spdV');
        el.altSc = svg.querySelector('#altSc');
        el.altV = svg.querySelector('#altV');
        el.hdgSc = svg.querySelector('#hdgSc');
        el.hdgV = svg.querySelector('#hdgV');
        el.bk = svg.querySelector('#bk');
        el.sl = svg.querySelector('#sl');
        el.fdir = svg.querySelector('#fdir');
        el.vsi = svg.querySelector('#vsi');
        el.btm = svg.querySelector('#btm');
        el.fmaAt = svg.querySelector('#fmaAt');
        el.fmaRoll = svg.querySelector('#fmaRoll');
        el.fmaPitch = svg.querySelector('#fmaPitch');
        el.wArr = svg.querySelector('#wArr');
        el.wTxt = svg.querySelector('#wTxt');
        buildPFDStatic();
        pfdBuilt = true;
    }

    function buildPFDStatic() {
        var svg = shared.el.pfd;
        var lad = '', pxd = 5.5;
        for (var d = -30; d <= 30; d += 5) {
            if (d === 0) continue;
            var y = -d * pxd, w = (d % 10 === 0) ? 130 : 65;
            lad += '<line x1="' + (-w / 2) + '" y1="' + y + '" x2="' + (w / 2) + '" y2="' + y + '" stroke="#fff" stroke-width="1.2"/>';
            if (d % 10 === 0) {
                lad += '<text x="' + (-w / 2 - 5) + '" y="' + (y + 3.5) + '" text-anchor="end" fill="#fff" font-size="9" font-family="ui-monospace,monospace">' + Math.abs(d) + '</text>';
                lad += '<text x="' + (w / 2 + 5) + '" y="' + (y + 3.5) + '" text-anchor="start" fill="#fff" font-size="9" font-family="ui-monospace,monospace">' + Math.abs(d) + '</text>';
            }
        }
        shared.el.lad.innerHTML = lad;
        var pxk = 1.7, sc = '';
        for (var s = 40; s <= 520; s += 10) {
            var ys = -s * pxk;
            if (s % 20 === 0) { sc += '<line x1="72" y1="' + ys + '" x2="80" y2="' + ys + '" stroke="#fff" stroke-width="1"/><text x="68" y="' + (ys + 4) + '" text-anchor="end" fill="#fff" font-size="12" font-family="ui-monospace,monospace">' + s + '</text>'; }
            else { sc += '<line x1="76" y1="' + ys + '" x2="80" y2="' + ys + '" stroke="#fff" stroke-width="0.6"/>'; }
        }
        shared.el.spdSc.innerHTML = sc;
        shared.el.spdSc._px = pxk;
        var pxf = 0.05, al = '';
        for (var a = 0; a <= 45000; a += 500) {
            var ya = -a * pxf;
            if (a % 1000 === 0) { al += '<line x1="0" y1="' + ya + '" x2="8" y2="' + ya + '" stroke="#fff" stroke-width="1"/><text x="12" y="' + (ya + 4) + '" text-anchor="start" fill="#fff" font-size="12" font-family="ui-monospace,monospace">' + String(a).padStart(5, '0') + '</text>'; }
            else { al += '<line x1="0" y1="' + ya + '" x2="4" y2="' + ya + '" stroke="#fff" stroke-width="0.6"/>'; }
        }
        var by = -38000 * pxf;
        al += '<polygon points="72,' + by + ' 62,' + (by - 5) + ' 62,' + (by + 5) + '" fill="#ff00ff"/>';
        shared.el.altSc.innerHTML = al;
        shared.el.altSc._px = pxf;
        var pxh = 4, hd = '';
        for (var d2 = -360; d2 <= 720; d2 += 5) {
            var x2 = d2 * pxh, mod = ((d2 % 360) + 360) % 360;
            if (mod % 10 === 0) {
                var lb = mod === 0 ? '360' : String(mod).padStart(3, '0');
                hd += '<line x1="' + x2 + '" y1="26" x2="' + x2 + '" y2="34" stroke="#fff" stroke-width="1"/><text x="' + x2 + '" y="20" text-anchor="middle" fill="#fff" font-size="11" font-family="ui-monospace,monospace">' + lb + '</text>';
            } else { hd += '<line x1="' + x2 + '" y1="30" x2="' + x2 + '" y2="34" stroke="#fff" stroke-width="0.6"/>'; }
        }
        shared.el.hdgSc.innerHTML = hd;
        shared.el.hdgSc._px = pxh;
        var bk = '', cx = 220, cy = 160, r = 120;
        [-60, -45, -30, -20, -10, 0, 10, 20, 30, 45, 60].forEach(function (deg) {
            var rad = (deg - 90) * Math.PI / 180, mj = (deg % 30 === 0), r2 = r + (mj ? 12 : 6);
            bk += '<line x1="' + (cx + Math.cos(rad) * r) + '" y1="' + (cy + Math.sin(rad) * r) + '" x2="' + (cx + Math.cos(rad) * r2) + '" y2="' + (cy + Math.sin(rad) * r2) + '" stroke="#fff" stroke-width="' + (mj ? 1.8 : 1) + '"/>';
        });
        bk += '<polygon id="bkP" points="220,40 213,52 227,52" fill="#ffd400" stroke="#000" stroke-width="0.5"/>';
        shared.el.bk.innerHTML = bk;
        shared.el.bkP = svg.querySelector('#bkP');
        shared.el.sl.innerHTML = '<rect x="212" y="276" width="16" height="4" fill="none" stroke="#fff"/><rect id="slR" x="217" y="277" width="6" height="2" fill="#ffd400"/>';
        shared.el.slR = svg.querySelector('#slR');
        shared.el.fdir.innerHTML = '<line id="fdH" x1="150" y1="160" x2="290" y2="160" stroke="#ff00ff" stroke-width="2"/><line id="fdV" x1="220" y1="100" x2="220" y2="220" stroke="#ff00ff" stroke-width="2"/>';
        shared.el.fdH = svg.querySelector('#fdH');
        shared.el.fdV = svg.querySelector('#fdV');
        var vs = '';
        [-2000, -1000, -500, 0, 500, 1000, 2000].forEach(function (v) {
            var yv = 160 - (v / 2000) * 100;
            var len = (v === 0) ? 12 : (v % 1000 === 0 ? 10 : 6);
            vs += '<line x1="' + (352 - len) + '" y1="' + yv + '" x2="352" y2="' + yv + '" stroke="#6a9cc0"/>';
        });
        vs += '<text x="334" y="94" text-anchor="middle" fill="#6a9cc0" font-size="8" font-family="ui-monospace,monospace">2</text><text x="334" y="234" text-anchor="middle" fill="#6a9cc0" font-size="8" font-family="ui-monospace,monospace">2</text><text x="336" y="163" text-anchor="middle" fill="#6a9cc0" font-size="7" font-family="ui-monospace,monospace">VSI</text><line id="vsiN" x1="352" y1="160" x2="334" y2="160" stroke="#ffd400" stroke-width="2.5" stroke-linecap="round"/>';
        shared.el.vsi.innerHTML = vs;
        shared.el.vsiN = svg.querySelector('#vsiN');
