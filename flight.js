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
        h += '<defs><linearGradient id="skyG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#031527"/><stop offset="0.55" stop-color="#12466f"/><stop offset="1" stop-color="#4aa8dc"/></linearGradient><linearGradient id="grG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b06a2b"/><stop offset="0.4" stop-color="#6b3a14"/><stop offset="1" stop-color="#2a1505"/></linearGradient><clipPath id="ac"><rect x="100" y="40" width="240" height="240"/></clipPath><clipPath id="sc"><rect x="0" y="40" width="130" height="240"/></clipPath><clipPath id="alc"><rect x="310" y="40" width="130" height="240"/></clipPath><clipPath id="hc"><rect x="100" y="290" width="240" height="40"/></clipPath></defs>';
        h += '<rect width="440" height="340" fill="#050b14" rx="6"/>';
        h += '<rect width="440" height="26" fill="#000"/><line x1="146.6" y1="4" x2="146.6" y2="22" stroke="#1a3a5a"/><line x1="293.3" y1="4" x2="293.3" y2="22" stroke="#1a3a5a"/>';
        h += '<text id="fmaAt" x="73" y="18" text-anchor="middle" fill="#5bd45b" font-size="11" font-family="ui-monospace,monospace" font-weight="bold">A/T ARM</text>';
        h += '<text id="fmaRoll" x="220" y="18" text-anchor="middle" fill="#5bd45b" font-size="11" font-family="ui-monospace,monospace" font-weight="bold">LNAV</text>';
        h += '<text id="fmaPitch" x="366" y="18" text-anchor="middle" fill="#5bd45b" font-size="11" font-family="ui-monospace,monospace" font-weight="bold">VNAV</text>';
        h += '<rect x="8" y="40" width="80" height="240" fill="#0a1424" stroke="#2a4a6a"/><g clip-path="url(#sc)"><g id="spdSc"></g></g><path d="M 78 145 L 122 145 L 122 175 L 78 175 Z" fill="#000" stroke="#fff" stroke-width="1.5"/><text id="spdV" x="100" y="166" text-anchor="middle" fill="#fff" font-size="15" font-family="ui-monospace,monospace" font-weight="bold">0</text>';
        h += '<text x="48" y="34" text-anchor="middle" fill="#6a9cc0" font-size="8" font-family="ui-monospace,monospace">IAS</text><text x="48" y="292" text-anchor="middle" fill="#6a9cc0" font-size="8" font-family="ui-monospace,monospace">KTS</text>';
        h += '<rect x="100" y="40" width="240" height="240" fill="#000"/><g clip-path="url(#ac)"><g id="attT" transform="translate(220,160)"><g id="attI"><rect x="-400" y="-400" width="800" height="400" fill="url(#skyG)"/><rect x="-400" y="0" width="800" height="400" fill="url(#grG)"/><line x1="-400" y1="0" x2="400" y2="0" stroke="#fff" stroke-width="1.6"/><g id="lad"></g></g></g></g><rect x="100" y="40" width="240" height="240" fill="none" stroke="#2a4a6a"/>';
        h += '<g id="bk"></g><g id="sl"></g><g id="fdir"></g><g id="acf"><line x1="140" y1="160" x2="200" y2="160" stroke="#ffd400" stroke-width="3"/><line x1="240" y1="160" x2="300" y2="160" stroke="#ffd400" stroke-width="3"/><circle cx="220" cy="160" r="3" fill="#ffd400"/><line x1="200" y1="160" x2="205" y2="168" stroke="#ffd400" stroke-width="3"/><line x1="240" y1="160" x2="235" y2="168" stroke="#ffd400" stroke-width="3"/></g>';
        h += '<g transform="translate(280,55)"><g id="wArr"><polygon points="0,-9 4,5 0,2 -4,5" fill="#5bd45b"/></g><text id="wTxt" x="10" y="3" fill="#5bd45b" font-size="9" font-family="ui-monospace,monospace" font-weight="bold">280/45</text></g>';
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
        vs += '<line id="vsiN" x1="352" y1="160" x2="334" y2="160" stroke="#ffd400" stroke-width="2.5" stroke-linecap="round"/>';
        shared.el.vsi.innerHTML = vs;
        shared.el.vsiN = svg.querySelector('#vsiN');
        shared.el.btm.innerHTML = '<text id="mach" x="140" y="335" text-anchor="middle" fill="#5bd45b" font-size="11" font-family="ui-monospace,monospace" font-weight="bold">M .00</text><text id="gs" x="220" y="335" text-anchor="middle" fill="#5bd45b" font-size="11" font-family="ui-monospace,monospace" font-weight="bold">GS 0</text><text id="dist" x="300" y="335" text-anchor="middle" fill="#5bd45b" font-size="11" font-family="ui-monospace,monospace" font-weight="bold">---</text>';
        shared.el.mach = svg.querySelector('#mach');
        shared.el.gs = svg.querySelector('#gs');
        shared.el.dist = svg.querySelector('#dist');
    }

    function updatePFD(v) {
        var el = shared.el;
        if (!el.pfdAttT) return;
        var pp = v.pitch * 5.5;
        el.pfdAttT.setAttribute('transform', 'translate(220,160) rotate(' + v.bank.toFixed(2) + ') translate(0,' + pp.toFixed(2) + ')');
        if (el.bkP) el.bkP.setAttribute('transform', 'rotate(' + v.bank.toFixed(2) + ' 220 160)');
        if (el.fdH) { var fdy = 160 + v.fdPitch * 5.5; el.fdH.setAttribute('y1', fdy); el.fdH.setAttribute('y2', fdy); }
        if (el.fdV) { var fdx = 220 + v.fdRoll * 5.5; el.fdV.setAttribute('x1', fdx); el.fdV.setAttribute('x2', fdx); }
        if (el.spdSc) el.spdSc.setAttribute('transform', 'translate(0,' + (160 - v.ias * el.spdSc._px).toFixed(1) + ')');
        if (el.spdV) el.spdV.textContent = Math.round(v.ias);
        if (el.altSc) el.altSc.setAttribute('transform', 'translate(0,' + (160 - v.alt * el.altSc._px).toFixed(1) + ')');
        if (el.altV) el.altV.textContent = String(Math.round(v.alt)).padStart(5, '0');
        if (el.vsiN) { var yn = clamp(160 - (v.vs / 2000) * 100, 60, 260); el.vsiN.setAttribute('y1', yn); el.vsiN.setAttribute('y2', yn); }
        if (el.hdgSc) {
            var hdg = ((v.hdg % 360) + 360) % 360;
            el.hdgSc.setAttribute('transform', 'translate(' + (220 - hdg * el.hdgSc._px).toFixed(1) + ',0)');
            if (el.hdgV) el.hdgV.textContent = String(Math.round(hdg)).padStart(3, '0');
        }
        if (el.fmaAt) el.fmaAt.textContent = v.fmaAt;
        if (el.fmaRoll) el.fmaRoll.textContent = v.fmaRoll;
        if (el.fmaPitch) el.fmaPitch.textContent = v.fmaPitch;
        if (el.mach) el.mach.textContent = 'M ' + v.mach.toFixed(2);
        if (el.gs) el.gs.textContent = 'GS ' + Math.round(v.gs);
        if (el.dist) el.dist.textContent = v.nextWp || '---';
        if (el.wArr) { var wr = (flightSim.windDir + 180) - v.hdg; el.wArr.setAttribute('transform', 'rotate(' + wr.toFixed(0) + ')'); }
        if (el.wTxt) el.wTxt.textContent = String(Math.round(flightSim.windDir)).padStart(3, '0') + '/' + String(Math.round(flightSim.windSpd)).padStart(2, '0');
    }

    /* ============================================================
       ND
       ============================================================ */
    function initND() { if (!shared.el.nd) return; ndInit = true; }

    function renderND() {
        var el = shared.el;
        if (!el.nd) return;
        var canvas = el.nd;
        var ctx = canvas.getContext('2d');
        var W = canvas.width, H = canvas.height, cx = W / 2, cy = H / 2;
        var R = Math.min(W, H) * 0.44;
        ctx.clearRect(0, 0, W, H);
        ctx.fillStyle = '#050b14';
        ctx.fillRect(0, 0, W, H);
        var range = flightSim.ndRange, scale = R / range;
        var acPos = getACPos(flightSim.progress);
        var hdg = (shared.runtime.mode === 'work' || shared.runtime.mode === 'stopwatch') ? acPos.hdg : 273;
        var hr = hdg * Math.PI / 180, sinH = Math.sin(hr), cosH = Math.cos(hr);
        function proj(wx, wy) {
            var dx = wx - acPos.x, dy = wy - acPos.y;
            var fwd = dx * sinH + dy * cosH, rgt = dx * cosH - dy * sinH;
            return { x: cx + rgt * scale, y: cy - fwd * scale };
        }
        ctx.strokeStyle = 'rgba(120,180,255,.35)';
        ctx.lineWidth = 1;
        for (var deg = 0; deg < 360; deg += 10) {
            var sd = deg - hdg, rad = (sd - 90) * Math.PI / 180, mj = deg % 30 === 0, r1 = R + (mj ? -12 : -6);
            ctx.beginPath();
            ctx.moveTo(cx + Math.cos(rad) * r1, cy + Math.sin(rad) * r1);
            ctx.lineTo(cx + Math.cos(rad) * R, cy + Math.sin(rad) * R);
            ctx.stroke();
            if (mj) {
                ctx.fillStyle = 'rgba(120,180,255,.75)';
                ctx.font = 'bold 13px ui-monospace,monospace';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                var lb = deg === 0 ? 'N' : (deg === 90 ? 'E' : (deg === 180 ? 'S' : (deg === 270 ? 'W' : String(deg / 10))));
                ctx.fillText(lb, cx + Math.cos(rad) * (r1 - 15), cy + Math.sin(rad) * (r1 - 15));
            }
        }
        ctx.strokeStyle = 'rgba(120,180,255,.22)';
        ctx.lineWidth = 1.5;
        [0.25, 0.5, 0.75, 1].forEach(function (f) {
            ctx.beginPath();
            ctx.arc(cx, cy, R * f, 0, Math.PI * 2);
            ctx.stroke();
        });
        ctx.fillStyle = 'rgba(120,180,255,.55)';
        ctx.font = 'bold 12px ui-monospace,monospace';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        [1, 2, 3, 4].forEach(function (i) {
            ctx.fillText(String(Math.round(range / 4 * i)), cx + R * (i / 4) + 5, cy - 5);
        });
        if (flightSim.routePoints.length >= 2) {
            var pts = flightSim.routePoints;
            ctx.strokeStyle = '#ff00ff';
            ctx.lineWidth = 3;
            ctx.lineJoin = 'round';
            ctx.lineCap = 'round';
            ctx.beginPath();
            var started = false;
            for (var i = 0; i < pts.length; i++) {
                var p = proj(pts[i].x, pts[i].y);
                if (p.x < -200 || p.x > W + 200 || p.y < -200 || p.y > H + 200) {
                    if (started) { ctx.stroke(); ctx.beginPath(); started = false; }
                    continue;
                }
                if (!started) { ctx.moveTo(p.x, p.y); started = true; }
                else ctx.lineTo(p.x, p.y);
            }
            if (started) ctx.stroke();
            for (var j = 0; j < pts.length; j++) {
                var wp = pts[j], pr = proj(wp.x, wp.y);
                if (pr.x < -40 || pr.x > W + 40 || pr.y < -40 || pr.y > H + 40) continue;
                if (wp.type === 'apt') {
                    ctx.strokeStyle = '#fff';
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.arc(pr.x, pr.y, 9, 0, Math.PI * 2);
                    ctx.stroke();
                    ctx.fillStyle = '#fff';
                    ctx.beginPath();
                    ctx.arc(pr.x, pr.y, 3, 0, Math.PI * 2);
                    ctx.fill();
                } else {
                    ctx.strokeStyle = '#fff';
                    ctx.lineWidth = 1.8;
                    ctx.beginPath();
                    ctx.moveTo(pr.x, pr.y - 8);
                    ctx.lineTo(pr.x + 8, pr.y);
                    ctx.lineTo(pr.x, pr.y + 8);
                    ctx.lineTo(pr.x - 8, pr.y);
                    ctx.closePath();
                    ctx.stroke();
                }
                if (wp.name) {
                    ctx.fillStyle = '#fff';
                    ctx.font = 'bold 11px ui-monospace,monospace';
                    ctx.textAlign = 'left';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(wp.name, pr.x + 12, pr.y);
                }
            }
        }
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        for (var k = 0; k < flightSim.traffic.length; k++) {
            var t = flightSim.traffic[k], tp = proj(acPos.x + t.x, acPos.y + t.y);
            if (tp.x < -20 || tp.x > W + 20 || tp.y < -20 || tp.y > H + 20) continue;
            ctx.beginPath();
            ctx.moveTo(tp.x, tp.y - 8);
            ctx.lineTo(tp.x + 8, tp.y);
            ctx.lineTo(tp.x, tp.y + 8);
            ctx.lineTo(tp.x - 8, tp.y);
            ctx.closePath();
            ctx.stroke();
            if (t.alt !== 0) {
                ctx.fillStyle = 'rgba(255,255,255,.7)';
                ctx.font = '9px ui-monospace,monospace';
                ctx.textAlign = 'left';
                ctx.textBaseline = 'middle';
                ctx.fillText((t.alt > 0 ? '+' : '') + String(Math.round(t.alt / 100)), tp.x + 11, tp.y);
            }
        }
        ctx.strokeStyle = '#ffd400';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(cx - 42, cy); ctx.lineTo(cx - 20, cy);
        ctx.moveTo(cx + 20, cy); ctx.lineTo(cx + 42, cy);
        ctx.moveTo(cx, cy - 14); ctx.lineTo(cx, cy + 14);
        ctx.moveTo(cx - 42, cy); ctx.lineTo(cx - 42, cy + 7);
        ctx.moveTo(cx + 42, cy); ctx.lineTo(cx + 42, cy + 7);
        ctx.stroke();
        ctx.fillStyle = '#ffd400';
        ctx.beginPath();
        ctx.arc(cx, cy, 2.5, 0, Math.PI * 2);
        ctx.fill();
        var wr = (flightSim.windDir + 180) - hdg;
        var wrad = (wr - 90) * Math.PI / 180, waX = 60, waY = 60;
        ctx.save();
        ctx.translate(waX, waY);
        ctx.rotate(wrad + Math.PI / 2);
        ctx.fillStyle = '#5bd45b';
        ctx.beginPath();
        ctx.moveTo(0, -14); ctx.lineTo(6, 8); ctx.lineTo(0, 3); ctx.lineTo(-6, 8);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
        ctx.fillStyle = '#5bd45b';
        ctx.font = 'bold 13px ui-monospace,monospace';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(Math.round(flightSim.windDir)).padStart(3, '0') + '/' + String(Math.round(flightSim.windSpd)).padStart(2, '0'), waX + 14, waY);
        ctx.fillStyle = 'rgba(120,180,255,.75)';
        ctx.font = 'bold 13px ui-monospace,monospace';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.fillText('RNG ' + range + ' NM', W - 20, 40);
        ctx.textAlign = 'left';
        ctx.fillText(AIRCRAFT[shared.settings.aircraft].code + ' MAP', 20, 40);
        var nw = null, nd = Infinity;
        if (flightSim.routePoints.length >= 2) {
            for (var m = 0; m < flightSim.routePoints.length; m++) {
                var rp = flightSim.routePoints[m];
                var dxr = rp.x - acPos.x, dyr = rp.y - acPos.y;
                var d = Math.sqrt(dxr * dxr + dyr * dyr);
                var fwd = dxr * sinH + dyr * cosH;
                if (fwd > 0 && d < nd) { nd = d; nw = rp; }
            }
        }
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 13px ui-monospace,monospace';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'bottom';
        ctx.fillText(nw ? ('NEXT ' + (nw.name || '---') + ' ' + Math.round(nd) + ' NM') : 'ARRIVED', 20, H - 20);
        ctx.textAlign = 'right';
        ctx.fillStyle = 'rgba(120,180,255,.75)';
        ctx.fillText(Math.round(flightSim.progress * 100) + '%', W - 20, H - 20);
    }

    /* ============================================================
       PHASE / VALUES
       ============================================================ */
    function phaseAt(p) {
        for (var i = 0; i < PHASES.length; i++) if (p < PHASES[i].to || i === PHASES.length - 1) return PHASES[i];
        return PHASES[PHASES.length - 1];
    }
    function getCallout(p) {
        var m = null;
        for (var i = 0; i < TAKEOFF_CALLOUTS.length; i++) if (p >= TAKEOFF_CALLOUTS[i].at) m = TAKEOFF_CALLOUTS[i].msg;
        return m;
    }
    function targetN1(phase, lp) {
        var ac = AIRCRAFT[shared.settings.aircraft];
        switch (phase.id) {
            case 'preflight': return ac.n1Idle;
            case 'taxi': return ac.n1Idle + 2 + lp * 6;
            case 'takeoff': return ac.n1Takeoff + Math.sin(lp * Math.PI) * 4;
            case 'climb': return ac.n1Takeoff - 4 - lp * 10;
            case 'cruise': return ac.cruiseN1;
            case 'descent': return ac.cruiseN1 - 18 - lp * 10;
            case 'approach': return ac.n1Idle + 28 + Math.sin(lp * Math.PI * 2) * 3;
            case 'landing': return ac.n1Idle + 8;
            default: return ac.n1Idle;
        }
    }

    function computeFV(p, isWork) {
        var ac = AIRCRAFT[shared.settings.aircraft];
        if (!isWork) {
            var bp = BREAK_FLIGHT[shared.runtime.mode] || BREAK_FLIGHT.short;
            var et = shared.totalFor(shared.runtime.mode) - shared.runtime.remaining;
            var idx = Math.floor(et / 8) % bp.radio.length;
            return { ias: 0, alt: 0, vs: 0, hdg: 273, pitch: 0, bank: 0, slip: 0, mach: 0, gs: 0, windDir: flightSim.windDir, windSpd: flightSim.windSpd, fdPitch: 0, fdRoll: 0, fmaAt: 'A/T ARM', fmaRoll: '---', fmaPitch: '---', n1: flightSim.n1Current, egt: flightSim.egtCurrent, fuel: '100%', radio: bp.radio[idx], nextWp: '---' };
        }
        var phase = phaseAt(p);
        var lp = clamp((p - phase.from) / (phase.to - phase.from), 0, 1);
        var sm = lp * lp * (3 - 2 * lp);
        var alt = phase.altA + (phase.altB - phase.altA) * sm;
        var ias = phase.spdA + (phase.spdB - phase.spdA) * sm;
        var pitch = phase.pitchA + (phase.pitchB - phase.pitchA) * sm;
        var pm = (phase.to - phase.from) * shared.settings.work;
        var vs = 0;
        if (pm > 0 && phase.altB !== phase.altA) vs = (phase.altB - phase.altA) / pm;
        var acPos = getACPos(p);
        var hdg = acPos.hdg;
        var hA = getACPos(Math.min(1, p + 0.003)).hdg;
        var hB = getACPos(Math.max(0, p - 0.003)).hdg;
        var td = hA - hB;
        while (td > 180) td -= 360;
        while (td < -180) td += 360;
        var bank = clamp(td * 12, -22, 22);
        var mach = Math.min(0.85, ias / 600);
        var gs = ias + 20 + Math.sin(p * 8) * 4;
        var n1 = flightSim.n1Current, egt = flightSim.egtCurrent;
        var fp = Math.max(6, 100 - p * 55);
        var fmaAt = 'A/T ARM', fmaRoll = 'HDG SEL', fmaPitch = 'ALT HOLD';
        if (phase.id === 'takeoff') { fmaAt = 'THR REF'; fmaPitch = 'TO/GA'; }
        else if (phase.id === 'climb') { fmaAt = 'THR REF'; fmaRoll = 'LNAV'; fmaPitch = 'VNAV SPD'; }
        else if (phase.id === 'cruise') { fmaAt = 'SPD'; fmaRoll = 'LNAV'; fmaPitch = 'VNAV PTH'; }
        else if (phase.id === 'descent') { fmaAt = 'SPD'; fmaRoll = 'LNAV'; fmaPitch = 'VNAV PTH'; }
        else if (phase.id === 'approach') { fmaAt = 'SPD'; fmaRoll = 'LOC'; fmaPitch = 'G/S'; }
        else if (phase.id === 'landing') { fmaAt = 'SPD'; fmaRoll = 'LOC'; fmaPitch = p > 0.99 ? 'FLARE' : 'G/S'; }
        var radioMsg;
        if (phase.id === 'takeoff') radioMsg = getCallout(p) || 'Cleared for takeoff';
        else {
            var et2 = shared.totalFor(shared.runtime.mode) - shared.runtime.remaining;
            var ri = Math.floor(et2 / 7) % phase.radio.length;
            radioMsg = phase.radio[ri];
        }
        var nw = '---', nd = Infinity;
        if (flightSim.routePoints.length >= 2) {
            var sH = Math.sin(hdg * Math.PI / 180), cH = Math.cos(hdg * Math.PI / 180);
            for (var i = 0; i < flightSim.routePoints.length; i++) {
                var rp = flightSim.routePoints[i];
                var dxr = rp.x - acPos.x, dyr = rp.y - acPos.y;
                var fwd = dxr * sH + dyr * cH;
                var d = Math.sqrt(dxr * dxr + dyr * dyr);
                if (fwd > 0 && d < nd) { nd = d; nw = rp.name + ' ' + Math.round(d) + 'NM'; }
            }
        }
        return { ias: ias, alt: alt, vs: vs, hdg: hdg, pitch: pitch, bank: bank, slip: 0, mach: mach, gs: gs, windDir: flightSim.windDir, windSpd: flightSim.windSpd, fdPitch: 0, fdRoll: 0, fmaAt: fmaAt, fmaRoll: fmaRoll, fmaPitch: fmaPitch, n1: n1, egt: egt, fuel: Math.round(fp) + '%', radio: radioMsg, nextWp: nw, phase: phase };
    }

    /* ============================================================
       RAF LOOP
       ============================================================ */
    function startFlightAnim() {
        if (flightRafId !== null) return;
        if (shared.settings.deck !== 'flight') return;
        lastFrameTs = performance.now();
        flightRafId = requestAnimationFrame(flightFrame);
    }
    function stopFlightAnim() {
        if (flightRafId !== null) { cancelAnimationFrame(flightRafId); flightRafId = null; }
    }
    function updateSpool(dt) {
        var ac = AIRCRAFT[shared.settings.aircraft];
        var target = ac.n1Idle;
        if (shared.runtime.running && shared.runtime.mode === 'work') {
            var ph = phaseAt(flightSim.progress);
            var lp = clamp((flightSim.progress - ph.from) / (ph.to - ph.from), 0, 1);
            target = targetN1(ph, lp);
        }
        var alpha = 1 - Math.exp(-dt / 1.6);
        flightSim.n1Current += (target - flightSim.n1Current) * alpha;
        flightSim.n1Current = clamp(flightSim.n1Current, ac.n1Idle - 2, 102);
        var te = 380 + (flightSim.n1Current - 20) * 6.5;
        var ae = 1 - Math.exp(-dt / 3.2);
        flightSim.egtCurrent += (te - flightSim.egtCurrent) * ae;
    }
    function updateShake() {
        var el = shared.el;
        if (!el.pfdWrap) return;
        var shake = false;
        if (shared.runtime.running && shared.runtime.mode === 'work' && shared.settings.deck === 'flight' && !shared.settings.reduceMotion) {
            var p = flightSim.progress;
            if ((p > 0.19 && p < 0.30) || (p > 0.955 && p < 0.995)) shake = true;
        }
        el.pfdWrap.classList.toggle('shaking', shake);
    }
    function updateRadio(msg) {
        if (!msg || msg === lastRadioMsg) return;
        lastRadioMsg = msg;
        var el = shared.el;
        el.fdRadio.textContent = msg;
        el.fdRadio.classList.remove('flash');
        void el.fdRadio.offsetWidth;
        el.fdRadio.classList.add('flash');
    }
    function renderStepper(p, isWork) {
        var h = '';
        var el = shared.el;
        if (!isWork) {
            var bp = BREAK_FLIGHT[shared.runtime.mode] || BREAK_FLIGHT.short;
            var pct = clamp(p * 100, 0, 100);
            h += '<div class="fd-step active"><div class="fd-step-track"><span class="fd-step-fill" style="width:' + pct + '%"></span></div><div class="fd-step-label">' + bp.label + '</div></div>';
            el.fdStepper.innerHTML = h;
            return;
        }
        PHASES.forEach(function (ph, i) {
            var active = p >= ph.from && (p < ph.to || i === PHASES.length - 1);
            var done = p >= ph.to;
            var lpct = done ? 100 : (active ? clamp(((p - ph.from) / (ph.to - ph.from)) * 100, 0, 100) : 0);
            h += '<div class="fd-step' + (active ? ' active' : '') + (done ? ' done' : '') + '"><div class="fd-step-track"><span class="fd-step-fill" style="width:' + lpct.toFixed(1) + '%"></span></div><div class="fd-step-label">' + ph.short + '</div></div>';
        });
        el.fdStepper.innerHTML = h;
    }
    function checkCabinAnnouncements(p, phase) {
        if (!phase || !phase.cabin || !phase.cabin.length) return;
        if (flightSim.cabinAnnounced[phase.id]) return;
        flightSim.cabinAnnounced[phase.id] = true;
        var idx = Math.floor(Math.random() * phase.cabin.length);
        showCabin(phase.cabin[idx]);
    }
    function flightFrame(ts) {
        flightRafId = null;
        if (shared.settings.deck !== 'flight') return;
        var el = shared.el;
        var dt = Math.min(0.1, (ts - lastFrameTs) / 1000);
        lastFrameTs = ts;
        var total = shared.totalFor(shared.runtime.mode);
        flightSim.progress = total > 0 ? clamp(1 - shared.runtime.remaining / total, 0, 1) : 0;
        updateSpool(dt);
        if (shared.runtime.running) updateTraffic(dt);
        if ((shared.runtime.mode === 'work' || shared.runtime.mode === 'stopwatch') && flightSim.routePoints.length >= 2) {
            var ac = getACPos(flightSim.progress);
            flightSim.heading = ac.hdg;
            var hA = getACPos(Math.min(1, flightSim.progress + 0.003)).hdg;
            var hB = getACPos(Math.max(0, flightSim.progress - 0.003)).hdg;
            var td = hA - hB;
            while (td > 180) td -= 360;
            while (td < -180) td += 360;
            var tb = clamp(td * 12, -22, 22);
            flightSim.bank += (tb - flightSim.bank) * (1 - Math.exp(-dt / 0.4));
        } else {
            flightSim.heading = 273;
            flightSim.bank += (0 - flightSim.bank) * (1 - Math.exp(-dt / 0.4));
        }
        updateEngineAudio(flightSim.n1Current);
        var v = computeFV(flightSim.progress, shared.runtime.mode === 'work');
        if (flightSim.displayMode === 'pfd') updatePFD(v);
        else renderND();
        if (el.fdN1) el.fdN1.textContent = v.n1.toFixed(1) + '%';
        if (el.fdEgt) el.fdEgt.textContent = Math.round(v.egt) + '\u00B0C';
        updateRadio(v.radio);
        renderStepper(flightSim.progress, shared.runtime.mode === 'work');
        updateShake();
        if (shared.runtime.mode === 'work' && v.phase) checkCabinAnnouncements(flightSim.progress, v.phase);
        var pct = clamp(flightSim.progress * 100, 0, 100);
        el.fdRouteFill.style.width = pct + '%';
        el.fdRoutePlane.style.left = pct + '%';
        if (shared.settings.deck === 'flight') flightRafId = requestAnimationFrame(flightFrame);
    }

    /* ============================================================
       ENGINE AUDIO
       ============================================================ */
    function startEngineAudio() {
        if (!shared.settings.sound) return;
        try {
            var C = window.AudioContext || window.webkitAudioContext;
            if (!C) return;
            if (!engineAudio.ctx) engineAudio.ctx = new C();
            var ctx = engineAudio.ctx;
            if (ctx.state === 'suspended') ctx.resume();
            if (engineAudio.started) return;
            var bs = 2 * ctx.sampleRate;
            var buf = ctx.createBuffer(1, bs, ctx.sampleRate);
            var d = buf.getChannelData(0);
            var b0 = 0, b1 = 0, b2 = 0;
            for (var i = 0; i < bs; i++) {
                var w = Math.random() * 2 - 1;
                b0 = 0.99765 * b0 + w * 0.0990460;
                b1 = 0.96300 * b1 + w * 0.2965164;
                b2 = 0.57000 * b2 + w * 1.0526913;
                d[i] = (b0 + b1 + b2 + w * 0.1848) * 0.20;
            }
            var src = ctx.createBufferSource();
            src.buffer = buf;
            src.loop = true;
            var flt = ctx.createBiquadFilter();
            flt.type = 'lowpass';
            flt.frequency.value = 180;
            flt.Q.value = 0.8;
            var g = ctx.createGain();
            g.gain.value = 0;
            src.connect(flt);
            flt.connect(g);
            g.connect(ctx.destination);
            src.start();
            engineAudio.src = src;
            engineAudio.filter = flt;
            engineAudio.gain = g;
            engineAudio.started = true;
        } catch (e) { }
    }
    function updateEngineAudio(n1) {
        if (!engineAudio.started || !engineAudio.ctx) return;
        var t = clamp((n1 - 20) / 80, 0, 1);
        try {
            engineAudio.filter.frequency.setTargetAtTime(100 + t * 520, engineAudio.ctx.currentTime, 0.1);
            engineAudio.gain.gain.setTargetAtTime(0.010 + t * 0.055, engineAudio.ctx.currentTime, 0.15);
        } catch (e) { }
    }
    function silenceEngineAudio() {
        if (!engineAudio.started || !engineAudio.ctx) return;
        try { engineAudio.gain.gain.setTargetAtTime(0, engineAudio.ctx.currentTime, 0.2); } catch (e) { }
    }

    /* ============================================================
       CABIN
       ============================================================ */
    function showCabin(text, spoken) {
        if (!text) return;
        var el = shared.el;
        el.cabinText.textContent = text;
        el.cabinOverlay.classList.add('show');
        if (cabinTimer) clearTimeout(cabinTimer);
        cabinTimer = setTimeout(function () { el.cabinOverlay.classList.remove('show'); }, 6500);
        if (shared.settings.cabinVoice && spoken !== false && 'speechSynthesis' in window) {
            try {
                window.speechSynthesis.cancel();
                var u = new SpeechSynthesisUtterance(text);
                u.rate = 0.92;
                u.pitch = 1.0;
                u.volume = Math.min(1, (parseInt(el.ambientVol.value, 10) || 40) / 100 + 0.2);
                window.speechSynthesis.speak(u);
            } catch (e) { }
        }
    }

    /* ============================================================
       DISPLAY TOGGLES
       ============================================================ */
    function setDisplayMode(m) {
        flightSim.displayMode = m;
        var el = shared.el;
        var isND = m === 'nd';
        el.pfd.classList.toggle('hidden', isND);
        el.nd.classList.toggle('hidden', !isND);
        el.ndControls.classList.toggle('hidden', !isND);
        $$('.display-tab').forEach(function (b) {
            var on = b.dataset.display === m;
            b.classList.toggle('active', on);
            b.setAttribute('aria-selected', String(on));
        });
    }
    function setNDRange(r) {
        flightSim.ndRange = r;
        $$('.range-btn').forEach(function (b) {
            b.classList.toggle('active', parseInt(b.dataset.range, 10) === r);
        });
    }

    /* ============================================================
       LIVE FLIGHT (OpenSky)
       ============================================================ */
    var liveFlightCooldown = 0;
    function fetchLiveFlight() {
        var now = Date.now();
        if (now < liveFlightCooldown) {
            var secs = Math.ceil((liveFlightCooldown - now) / 1000);
            shared.toast('Please wait ' + secs + 's before fetching again');
            return;
        }
        liveFlightCooldown = now + 10000;
        shared.toast('Fetching live flight...');
        var btn = shared.el.liveFlightBtn;
        btn.disabled = true;
        var bounds = 'lamin=20&lomin=-130&lamax=60&lomax=20';
        fetch('https://opensky-network.org/api/states/all?' + bounds, { cache: 'no-store' })
            .then(function (r) {
                if (!r.ok) throw new Error('HTTP ' + r.status);
                return r.json();
            })
            .then(function (data) {
                var states = (data && data.states) || [];
                var valid = states.filter(function (s) {
                    return s[1] && s[1].trim() && s[5] != null && s[6] != null &&
                        s[8] != null && s[9] != null && s[5] > 20 && s[9] > 50 && s[10] != null;
                });
                if (!valid.length) throw new Error('No suitable aircraft found');
                var pick = valid[Math.floor(Math.random() * valid.length)];
                var callsign = (pick[1] || '').trim() || ('FLT' + Math.floor(Math.random() * 9999));
                shared.flight.dep = 'LIVE';
                shared.flight.depCity = 'Live from OpenSky';
                shared.flight.arr = callsign;
                shared.flight.arrCity = 'Call sign ' + callsign;
                shared.flight.number = callsign;
                shared.flight.squawk = String(Math.floor(Math.random() * 7000) + 1000);
                shared.flight.live = true;
                shared.flight.lat = pick[6];
                shared.flight.lon = pick[5];
                shared.flight.liveAlt = Math.round(pick[13] || pick[7] || 35000);
                shared.flight.liveVel = Math.round(pick[9] || 450);
                shared.flight.liveHdg = Math.round(pick[10] || 0);
                shared.pSession();
                renderRoute();
                resetFlightSim();
                shared.toast('Tracking ' + callsign + ' at ' + shared.flight.liveAlt + ' ft');
            })
            .catch(function (err) {
                shared.toast('Live fetch failed: ' + (err.message || 'unknown') + '. Using simulated flight.');
                liveFlightCooldown = Date.now() + 3000;
            })
            .then(function () {
                btn.disabled = false;
            });
    }

    /* ============================================================
       INIT / EXPORTS
       ============================================================ */
    function init(sharedObj) {
        shared = sharedObj;
    }

    window.FlightDeck = {
        init: init,
        AIRCRAFT: AIRCRAFT,
        flightSim: flightSim,
        newRoute: newRoute,
        renderRoute: renderRoute,
        resetFlightSim: resetFlightSim,
        buildPFD: buildPFD,
        initND: initND,
        updateWeather: updateWeather,
        renderAircraftCode: renderAircraftCode,
        setDisplayMode: setDisplayMode,
        setNDRange: setNDRange,
        fetchLiveFlight: fetchLiveFlight,
        startFlightAnim: startFlightAnim,
        stopFlightAnim: stopFlightAnim,
        startEngineAudio: startEngineAudio,
        silenceEngineAudio: silenceEngineAudio,
        showCabin: showCabin,
        renderND: renderND
    };

})();