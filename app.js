(function () {
    'use strict';

    /* ============================================================
       MAIN APP — Pomodoro, Tasks, Deep Focus, Stats, Reflection
       ============================================================ */

    var $ = function (s, r) { return (r || document).querySelector(s) };
    var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)) };
    function clamp(n, a, b) { return Math.min(b, Math.max(a, n)) }
    function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 8) }
    function fmt(s) { var t = Math.max(0, Math.ceil(s)); var m = Math.floor(t / 60), x = t % 60; return String(m).padStart(2, '0') + ':' + String(x).padStart(2, '0') }
    function fmtDur(m) { m = Math.round(m); if (m < 60) return m + 'm'; var h = Math.floor(m / 60), r = m % 60; return r ? h + 'h ' + r + 'm' : h + 'h' }
    function hexA(h, a) { h = String(h).replace('#', ''); if (h.length === 3) h = h.split('').map(function (c) { return c + c }).join(''); var n = parseInt(h, 16); return 'rgba(' + ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')' }
    function dk(d) { var x = d ? new Date(d) : new Date(); return x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0') }
    function ago(ts) { var d = Math.floor((Date.now() - ts) / 1000); if (d < 60) return 'just now'; if (d < 3600) return Math.floor(d / 60) + 'm ago'; if (d < 86400) return Math.floor(d / 3600) + 'h ago'; var x = new Date(ts); return x.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) + ' ' + x.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }) }
    function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;') }
    function load(k, f) { try { var r = localStorage.getItem(k); if (r === null) return f; var v = JSON.parse(r); return (v === null || v === undefined) ? f : v } catch (e) { return f } }
    function save(k, v) { try { localStorage.setItem(k, JSON.stringify(v)) } catch (e) { } }

    /* ============================================================
       CONSTANTS
       ============================================================ */
    var STORE = { settings: 'pomodoro.v6.settings', tasks: 'pomodoro.v6.tasks', session: 'pomodoro.v6.session', stats: 'pomodoro.v6.stats', history: 'pomodoro.v6.history', cycle: 'pomodoro.v6.cycle', route: 'pomodoro.v6.route', reflection: 'pomodoro.v6.reflection' };
    var MODES = { work: 'Focus', short: 'Short Break', long: 'Long Break', stopwatch: 'Stopwatch' };
    var FLIGHT_MODE_LABELS = { work: 'Flight', short: 'Turnaround', long: 'Layover', stopwatch: 'Hold' };
    var ACCENT = { work: '#f43f5e', short: '#10b981', long: '#3b82f6', stopwatch: '#fbbf24' };
    var FLIGHT_ACCENT = { work: '#fbbf24', short: '#34d399', long: '#38bdf8', stopwatch: '#fbbf24' };
    var RADIUS = 126, CIRC = 2 * Math.PI * RADIUS;
    var DF_RADIUS = 180, DF_CIRC = 2 * Math.PI * DF_RADIUS;
    var TICK_MS = 200, MAX_HISTORY = 300;

    var DEFAULTS = { work: 25, short: 5, long: 15, longEvery: 4, autoStartNext: false, autoPauseHidden: false, sound: true, vibrate: true, notifications: false, theme: 'dark', reduceMotion: false, highContrast: false, deck: 'classic', dailyGoal: 8, requireIntent: true, reflectAfter: true, cabinVoice: true, aircraft: 'b738', weather: 'auto' };

    var BREAK_SUGGESTIONS = [
        'Stand up. Walk to a window. Look at something far away for 60 seconds.',
        'Drink a full glass of water. Slowly. Without your phone.',
        'Step outside. Even 30 seconds of fresh air resets your attention.',
        'Do 10 slow shoulder rolls and 5 deep breaths.',
        'Close your eyes for 60 seconds. Let your thoughts settle.',
        'Walk to the other side of the room and back. That is enough.',
        'Stretch your neck gently side to side. Five times each way.',
        'Look at something 20 feet away for 20 seconds. Your eyes need this.'
    ];

    /* ============================================================
       STATE
       ============================================================ */
    var settings = Object.assign({}, DEFAULTS, load(STORE.settings, {}));
    settings.work = clamp(parseInt(settings.work, 10) || 25, 1, 180);
    settings.short = clamp(parseInt(settings.short, 10) || 5, 1, 60);
    settings.long = clamp(parseInt(settings.long, 10) || 15, 1, 90);
    settings.longEvery = clamp(parseInt(settings.longEvery, 10) || 4, 1, 12);
    settings.dailyGoal = clamp(parseInt(settings.dailyGoal, 10) || 8, 1, 30);
    if (settings.deck !== 'flight') settings.deck = 'classic';
    if (!window.FlightDeck.AIRCRAFT[settings.aircraft]) settings.aircraft = 'b738';

    var tasks = load(STORE.tasks, []); if (!Array.isArray(tasks)) tasks = [];
    tasks = tasks.filter(function (t) { return t && typeof t.text === 'string' }).map(function (t) {
        return { id: t.id || uid(), text: t.text, done: !!t.done, estimate: clamp(parseInt(t.estimate, 10) || 1, 1, 20), pomodoros: Math.max(0, parseInt(t.pomodoros, 10) || 0), createdAt: t.createdAt || Date.now() };
    });

    var stats = load(STORE.stats, { days: {} }); if (!stats || typeof stats !== 'object' || !stats.days) stats = { days: {} };
    var history = load(STORE.history, []); if (!Array.isArray(history)) history = [];
    var reflections = load(STORE.reflection, []); if (!Array.isArray(reflections)) reflections = [];
    var cycle = Math.max(0, parseInt(load(STORE.cycle, 0), 10) || 0);

    var flight = load(STORE.route, null);
    if (!flight || !flight.dep || !flight.arr) flight = { dep: 'JFK', depCity: 'New York', arr: 'LHR', arrCity: 'London', number: 'PF-271', squawk: '4721', live: false };

    var runtime = { mode: 'work', remaining: settings.work * 60, running: false, endTime: 0, activeTaskId: null, intent: '', distractions: 0, distractionLog: [], stopwatchElapsed: 0, stopwatchStart: 0 };
    var ui = { filter: 'all', search: '', editingId: null, dragId: null, focusMode: false, settingsOpen: false, deepFocus: false, reflectChoice: null, rating: null };

    var intervalId = null, lastShownSecond = -1, pendingResumeCredit = false, dfMessageTimer = null;
    var ambientAudio = { ctx: null, src: null, filter: null, gain: null, type: 'off', started: false };

    /* ============================================================
       DOM REFS
       ============================================================ */
    var el = {};
    ['ring', 'ringFocus', 'timeLabel', 'timeFocus', 'modeLabel', 'modeFocus', 'taskFocus', 'startBtn', 'startIcon', 'startText', 'resetBtn', 'skipBtn', 'focusBtn', 'deepFocusBtn', 'focusStartBtn', 'focusStartIcon', 'focusStartText', 'focusResetBtn', 'focusSkipBtn', 'exitFocusBtn', 'focusOverlay', 'cycleDots', 'cycleHint', 'sessionCount', 'activeTaskWrap', 'activeTaskText', 'clearActiveTask', 'modeTabs', 'settingsToggle', 'settingsPanel', 'settingsChev', 'workInput', 'shortInput', 'longInput', 'everyInput', 'taskForm', 'taskInput', 'taskList', 'taskCount', 'taskFilters', 'taskSearch', 'emptyState', 'clearDoneBtn', 'exportTasksBtn', 'importTasksBtn', 'importFile', 'notifyBtn', 'statsBtn', 'helpBtn', 'themeBtn', 'deckBtn', 'noteLink', 'statsModal', 'statsContent', 'helpModal', 'helpContent', 'toastRoot', 'ariaLive', 'brandIcon', 'brandTitle', 'brandSub', 'pfd', 'nd', 'pfdWrap', 'ndControls', 'fdDep', 'fdDepCity', 'fdArr', 'fdArrCity', 'fdFlightNo', 'fdRouteFill', 'fdRoutePlane', 'fdStepper', 'fdN1', 'fdEgt', 'fdSquawk', 'fdRadio', 'goalCount', 'goalFill', 'goalEditBtn', 'deepFocusOverlay', 'dfSessionLabel', 'dfDistractCounter', 'dfDistractCount', 'dfRing', 'dfTime', 'dfMode', 'dfIntent', 'dfBreakNote', 'dfPlayBtn', 'dfDistractBtn', 'dfExitBtn', 'dfMessage', 'intentModal', 'intentInput', 'intentExamples', 'intentCancelBtn', 'intentStartBtn', 'reflectModal', 'reflectOptions', 'reflectNote', 'reflectSaveBtn', 'reflectSkipBtn', 'ratingDisplay', 'ratingBadge', 'ratingScore', 'aircraftSelect', 'weatherSelect', 'liveFlightBtn', 'newRouteBtn', 'wRain', 'wClouds', 'wNight', 'weatherIndicator', 'fdAircraft', 'ambientControls', 'ambientVol', 'cabinOverlay', 'cabinText'].forEach(function (id) { el[id] = document.getElementById(id) });

    /* ============================================================
       PERSISTENCE
       ============================================================ */
    function pSettings() { save(STORE.settings, settings) }
    function pTasks() { save(STORE.tasks, tasks) }
    function pStats() { save(STORE.stats, stats) }
    function pHistory() { save(STORE.history, history) }
    function pCycle() { save(STORE.cycle, cycle) }
    function pRoute() { save(STORE.route, flight) }
    function pReflections() { save(STORE.reflection, reflections) }
    function pSession() { save(STORE.session, { mode: runtime.mode, remaining: runtime.remaining, running: runtime.running, endTime: runtime.endTime, activeTaskId: runtime.activeTaskId, intent: runtime.intent, distractions: runtime.distractions, distractionLog: runtime.distractionLog, stopwatchElapsed: runtime.stopwatchElapsed }) }

    /* ============================================================
       INJECT SHARED INTO FLIGHT DECK
       ============================================================ */
    window.FlightDeck.init({
        settings: settings,
        runtime: runtime,
        el: el,
        flight: flight,
        pSession: pSession,
        toast: toast,
        notify: notify,
        announce: announce,
        totalFor: totalFor,
        FLIGHT_MODE_LABELS: FLIGHT_MODE_LABELS
    });

    /* ============================================================
       AUDIO / NOTIFY / TOAST
       ============================================================ */
    var audioCtx = null;
    function beep() { if (!settings.sound) return; try { var C = window.AudioContext || window.webkitAudioContext; if (!C) return; if (!audioCtx) audioCtx = new C(); if (audioCtx.state === 'suspended') audioCtx.resume(); var now = audioCtx.currentTime;[880, 987.77, 1174.66].forEach(function (f, i) { var o = audioCtx.createOscillator(), g = audioCtx.createGain(); o.type = 'sine'; o.frequency.setValueAtTime(f, now + i * 0.19); g.gain.setValueAtTime(0.0001, now + i * 0.19); g.gain.exponentialRampToValueAtTime(0.2, now + i * 0.19 + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.19 + 0.3); o.connect(g); g.connect(audioCtx.destination); o.start(now + i * 0.19); o.stop(now + i * 0.19 + 0.34); }); } catch (e) { } }
    function vibrate() { if (!settings.vibrate) return; if (navigator.vibrate) { try { navigator.vibrate([180, 90, 180]) } catch (e) { } } }
    function notify(t, b) { if (!settings.notifications) return; if (!('Notification' in window)) return; if (Notification.permission !== 'granted') return; try { var n = new Notification(t, { body: b, tag: 'pomodoro', renotify: true, silent: !settings.sound, icon: APP_ICON }); setTimeout(function () { try { n.close() } catch (e) { } }, 9000); } catch (e) { } }
    function announce(m) { el.ariaLive.textContent = ''; setTimeout(function () { el.ariaLive.textContent = m }, 60) }
    function toast(msg, opts) {
        opts = opts || {};
        var n = document.createElement('div');
        n.className = 'toast';
        var s = document.createElement('span');
        s.textContent = msg;
        n.appendChild(s);
        if (opts.undo) {
            var b = document.createElement('button');
            b.className = 'toast-undo';
            b.textContent = 'Undo';
            b.addEventListener('click', function () {
                opts.undo();
                n.classList.add('out');
                setTimeout(function () { if (n.parentNode) n.parentNode.removeChild(n) }, 260);
            });
            n.appendChild(b);
        }
        el.toastRoot.appendChild(n);
        setTimeout(function () {
            n.classList.add('out');
            setTimeout(function () { if (n.parentNode) n.parentNode.removeChild(n) }, 260);
        }, opts.duration || 2400);
    }

    function startAmbient(type, vol) {
        try {
            var C = window.AudioContext || window.webkitAudioContext;
            if (!C) return;
            if (!ambientAudio.ctx) ambientAudio.ctx = new C();
            var ctx = ambientAudio.ctx;
            if (ctx.state === 'suspended') ctx.resume();
            stopAmbientSource();
            if (type === 'off') return;
            var bs = 4 * ctx.sampleRate;
            var buf = ctx.createBuffer(1, bs, ctx.sampleRate);
            var d = buf.getChannelData(0);
            if (type === 'brown') {
                var last = 0;
                for (var i = 0; i < bs; i++) { var w = Math.random() * 2 - 1; last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5; }
            } else if (type === 'rain') {
                for (var j = 0; j < bs; j++) { d[j] = (Math.random() * 2 - 1) * 0.6; if (Math.random() < 0.0008) d[j] = 1.2 * (Math.random() * 2 - 1); }
            }
            var src = ctx.createBufferSource();
            src.buffer = buf; src.loop = true;
            var flt = ctx.createBiquadFilter();
            if (type === 'brown') { flt.type = 'lowpass'; flt.frequency.value = 420; flt.Q.value = 0.5; }
            else { flt.type = 'highpass'; flt.frequency.value = 800; flt.Q.value = 0.7; }
            var g = ctx.createGain();
            g.gain.value = vol * 0.4;
            src.connect(flt); flt.connect(g); g.connect(ctx.destination);
            src.start();
            ambientAudio.src = src; ambientAudio.filter = flt; ambientAudio.gain = g; ambientAudio.type = type; ambientAudio.started = true;
        } catch (e) { }
    }
    function stopAmbientSource() { if (ambientAudio.src) { try { ambientAudio.src.stop() } catch (e) { } ambientAudio.src = null } ambientAudio.started = false; ambientAudio.type = 'off' }
    function setAmbientVolume(v) { if (ambientAudio.gain && ambientAudio.ctx) { try { ambientAudio.gain.gain.setTargetAtTime(v * 0.4, ambientAudio.ctx.currentTime, 0.1) } catch (e) { } } }

    /* ============================================================
       APP ICON
       ============================================================ */
    var ICON_SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512"><rect width="512" height="512" rx="116" fill="#050b14"/><circle cx="256" cy="256" r="142" fill="none" stroke="#2a4a6a" stroke-width="30"/><path d="M256 114a142 142 0 0 1 100 242" fill="none" stroke="#fbbf24" stroke-width="30" stroke-linecap="round"/><circle cx="256" cy="256" r="16" fill="#fbbf24"/></svg>';
    var APP_ICON = 'data:image/svg+xml;base64,' + btoa(ICON_SVG);

    /* ============================================================
       ICONS
       ============================================================ */
    function ic(p, s) { s = s || 18; return '<svg viewBox="0 0 24 24" width="' + s + '" height="' + s + '" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + p + '</svg>' }
    var ICONS = {
        play: '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M8 5.2v13.6a1 1 0 0 0 1.52.85l11.2-6.8a1 1 0 0 0 0-1.7L9.52 4.35A1 1 0 0 0 8 5.2z"/></svg>',
        pause: '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><rect x="6" y="4.5" width="4" height="15" rx="1.2"/><rect x="14" y="4.5" width="4" height="15" rx="1.2"/></svg>',
        reset: ic('<path d="M3 12a9 9 0 1 0 2.9-6.6"/><path d="M3 4.5v5h5"/>'),
        skip: ic('<path d="M5 4.5l9.5 7.5L5 19.5z"/><path d="M18.5 5v14"/>'),
        expand: ic('<path d="M8 3H5.5A2.5 2.5 0 0 0 3 5.5V8"/><path d="M16 3h2.5A2.5 2.5 0 0 1 21 5.5V8"/><path d="M8 21H5.5A2.5 2.5 0 0 1 3 18.5V16"/><path d="M16 21h2.5a2.5 2.5 0 0 0 2.5-2.5V16"/>'),
        shrink: ic('<path d="M3 8h2.5A2.5 2.5 0 0 0 8 5.5V3"/><path d="M21 8h-2.5A2.5 2.5 0 0 1 16 5.5V3"/><path d="M3 16h2.5A2.5 2.5 0 0 1 8 18.5V21"/><path d="M21 16h-2.5a2.5 2.5 0 0 0-2.5 2.5V21"/>'),
        bell: ic('<path d="M18 8.5A6 6 0 0 0 6 8.5c0 6.5-2.5 8-2.5 8h17s-2.5-1.5-2.5-8"/><path d="M13.7 20.5a2 2 0 0 1-3.4 0"/>'),
        bellOff: ic('<path d="M13.7 20.5a2 2 0 0 1-3.4 0"/><path d="M18.2 13.4A15 15 0 0 1 18 8.5a6 6 0 0 0-9.5-4.9"/><path d="M6.2 6.2A6 6 0 0 0 6 8.5c0 6.5-2.5 8-2.5 8h13"/><path d="M2 2l20 20"/>'),
        chart: ic('<path d="M3 3v17.5h18"/><rect x="7" y="12" width="3" height="6" rx="1"/><rect x="12" y="8.5" width="3" height="9.5" rx="1"/><rect x="17" y="5" width="3" height="13" rx="1"/>'),
        help: ic('<circle cx="12" cy="12" r="9"/><path d="M9.3 9.2a2.8 2.8 0 0 1 5.5.9c0 1.9-2.8 2.4-2.8 3.9"/><path d="M12 17.2h.01"/>'),
        sun: ic('<circle cx="12" cy="12" r="4"/><path d="M12 2v2.2M12 19.8V22M4.2 4.2l1.6 1.6M18.2 18.2l1.6 1.6M2 12h2.2M19.8 12H22M4.2 19.8l1.6-1.6M18.2 5.8l1.6-1.6"/>'),
        moon: ic('<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>'),
        plane: ic('<path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/>'),
        timer: ic('<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 1.5"/><path d="M9 2h6"/>'),
        brain: ic('<path d="M9.5 3.5A2.5 2.5 0 0 1 12 6a2.5 2.5 0 0 1 2.5-2.5A2.5 2.5 0 0 1 17 6v1a2.5 2.5 0 0 1 2.5 2.5v1.8A3 3 0 0 1 21 14a3 3 0 0 1-1 2.2V18a2.5 2.5 0 0 1-2.5 2.5A2.5 2.5 0 0 1 15 18a2.5 2.5 0 0 1-3 2.4A2.5 2.5 0 0 1 9 18a2.5 2.5 0 0 1-2.5 2.5A2.5 2.5 0 0 1 4 18v-1.8A3 3 0 0 1 3 14a3 3 0 0 1 1.5-2.7V9.5A2.5 2.5 0 0 1 7 7V6a2.5 2.5 0 0 1 2.5-2.5z"/><path d="M12 6v14"/>'),
        note: ic('<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M8 13h8M8 17h5"/>'),
        check: ic('<path d="M20 6L9 17l-5-5"/>', 13),
        x: ic('<path d="M18 6L6 18M6 6l12 12"/>', 15),
        edit: ic('<path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z"/>', 15),
        grip: '<svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor"><circle cx="9" cy="6" r="1.5"/><circle cx="9" cy="12" r="1.5"/><circle cx="9" cy="18" r="1.5"/><circle cx="15" cy="6" r="1.5"/><circle cx="15" cy="12" r="1.5"/><circle cx="15" cy="18" r="1.5"/></svg>',
        target: ic('<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none"/>', 15),
        chevron: ic('<path d="M6 9l6 6 6-6"/>', 15)
    };

    /* ============================================================
       THEME
       ============================================================ */
    function applyTheme() {
        var root = document.documentElement;
        root.setAttribute('data-theme', settings.theme);
        root.setAttribute('data-contrast', settings.highContrast ? 'high' : 'normal');
        root.setAttribute('data-motion', settings.reduceMotion ? 'reduced' : 'auto');
        root.setAttribute('data-deck', settings.deck);
        var meta = document.querySelector('meta[name="theme-color"]');
        if (meta) meta.setAttribute('content', settings.deck === 'flight' ? '#050b14' : (settings.theme === 'light' ? '#eef2f7' : '#0b1120'));
        el.themeBtn.innerHTML = settings.theme === 'light' ? ICONS.moon : ICONS.sun;
        el.deckBtn.innerHTML = settings.deck === 'flight' ? ICONS.timer : ICONS.plane;
        el.deckBtn.classList.toggle('on', settings.deck === 'flight');
        el.deckBtn.style.color = settings.deck === 'flight' ? 'var(--accent)' : '';
        el.brandIcon.innerHTML = settings.deck === 'flight'
            ? '<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M12 2c-.8 0-1.5.7-1.5 1.5v5.2L3 12v2l7.5-2.2v5.4L8 19v2l4-1.2 4 1.2v-2l-2.5-1.8v-5.4L21 14v-2l-7.5-3.3V3.5C13.5 2.7 12.8 2 12 2z"/></svg>'
            : '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="13" r="8"></circle><path d="M12 9v4l2.5 1.5"></path><path d="M9 2h6"></path></svg>';
        el.brandTitle.textContent = settings.deck === 'flight' ? 'Flight Deck Focus' : 'Pomodoro Focus';
        el.brandSub.textContent = settings.deck === 'flight' ? 'Every session is a flight' : 'Timer and task manager';
        updateModeLabels();
        syncSettingsUI();
        el.deepFocusBtn.innerHTML = ICONS.brain;
        el.noteLink.innerHTML = ICONS.note;
        if (settings.deck === 'flight') {
            window.FlightDeck.buildPFD();
            window.FlightDeck.initND();
            window.FlightDeck.startFlightAnim();
        } else {
            window.FlightDeck.stopFlightAnim();
            window.FlightDeck.silenceEngineAudio();
        }
    }
    function updateModeLabels() {
        var f = settings.deck === 'flight';
        $$('.seg-btn', el.modeTabs).forEach(function (b) {
            b.textContent = f ? FLIGHT_MODE_LABELS[b.dataset.mode] : MODES[b.dataset.mode];
        });
    }
    function updateNotifyButton() {
        var g = ('Notification' in window) && Notification.permission === 'granted';
        var on = settings.notifications && g;
        el.notifyBtn.innerHTML = on ? ICONS.bell : ICONS.bellOff;
        el.notifyBtn.classList.toggle('on', on);
        el.notifyBtn.style.color = on ? 'var(--accent)' : '';
    }
    function syncSettingsUI() {
        el.workInput.value = settings.work;
        el.shortInput.value = settings.short;
        el.longInput.value = settings.long;
        el.everyInput.value = settings.longEvery;
        el.aircraftSelect.value = settings.aircraft;
        el.weatherSelect.value = settings.weather;
        $$('[data-setting]').forEach(function (b) {
            var k = b.dataset.setting;
            var v = k === 'deckFlight' ? (settings.deck === 'flight') : !!settings[k];
            b.setAttribute('aria-checked', String(v));
        });
    }

    /* ============================================================
       TIMER CORE
       ============================================================ */
    function totalFor(mode) {
        if (mode === 'stopwatch') return 0;
        var m = mode === 'work' ? settings.work : mode === 'short' ? settings.short : settings.long;
        return m * 60;
    }
    function activeTask() {
        if (!runtime.activeTaskId) return null;
        for (var i = 0; i < tasks.length; i++) if (tasks[i].id === runtime.activeTaskId) return tasks[i];
        return null;
    }
    function setAccent() {
        var a = settings.deck === 'flight' ? FLIGHT_ACCENT[runtime.mode] : ACCENT[runtime.mode];
        document.documentElement.style.setProperty('--accent', a);
        document.documentElement.style.setProperty('--accent-soft', hexA(a, 0.16));
    }
    function renderCycle() {
        var n = settings.longEvery, fl = Math.min(cycle, n), h = '';
        for (var i = 0; i < n; i++) h += '<span class="cycle-dot' + (i < fl ? ' on' : '') + '"></span>';
        el.cycleDots.innerHTML = h;
        var left = Math.max(0, n - fl);
        if (runtime.mode === 'long') el.cycleHint.textContent = 'long break time';
        else if (left === 0) el.cycleHint.textContent = 'next break is long';
        else el.cycleHint.textContent = left + ' until long break';
    }
    function renderActiveTask() {
        var t = activeTask();
        var d = t ? t.text : (runtime.intent || '');
        if (d) {
            el.activeTaskWrap.classList.remove('hidden');
            el.activeTaskText.textContent = d;
            el.taskFocus.textContent = d;
        } else {
            el.activeTaskWrap.classList.add('hidden');
            el.taskFocus.textContent = '';
        }
    }
    function renderGoal() {
        var today = stats.days[dk()] || { sessions: 0 };
        var s = today.sessions || 0, g = settings.dailyGoal, p = clamp((s / g) * 100, 0, 100);
        el.goalCount.textContent = s + ' / ' + g;
        el.goalFill.style.width = p + '%';
        el.goalFill.classList.toggle('complete', s >= g);
    }
    function render() {
        var total = totalFor(runtime.mode);
        var frac = runtime.mode === 'stopwatch' ? 0 : (total > 0 ? clamp(runtime.remaining / total, 0, 1) : 0);
        setAccent();
        el.ring.style.strokeDasharray = String(CIRC);
        el.ring.style.strokeDashoffset = String(CIRC * (1 - frac));
        el.ringFocus.style.strokeDasharray = String(CIRC);
        el.ringFocus.style.strokeDashoffset = String(CIRC * (1 - frac));
        var secs = runtime.mode === 'stopwatch' ? Math.floor(runtime.stopwatchElapsed) : Math.ceil(runtime.remaining);
        if (secs !== lastShownSecond) {
            lastShownSecond = secs;
            var txt = fmt(secs);
            el.timeLabel.textContent = txt;
            el.timeFocus.textContent = txt;
            document.title = txt + ' - ' + (settings.deck === 'flight' ? FLIGHT_MODE_LABELS[runtime.mode] : MODES[runtime.mode]);
        }
        var modeName = settings.deck === 'flight' ? FLIGHT_MODE_LABELS[runtime.mode] : MODES[runtime.mode];
        el.modeLabel.textContent = modeName;
        el.modeFocus.textContent = modeName;
        var si = runtime.running ? ICONS.pause : ICONS.play;
        var st = runtime.running ? 'Pause' : (runtime.mode === 'stopwatch' ? (runtime.stopwatchElapsed > 0 ? 'Resume' : 'Start') : (runtime.remaining < total - 0.5 ? 'Resume' : 'Start'));
        el.startIcon.innerHTML = si;
        el.startText.textContent = st;
        el.focusStartIcon.innerHTML = si;
        el.focusStartText.textContent = st;
        el.resetBtn.innerHTML = ICONS.reset;
        el.skipBtn.innerHTML = ICONS.skip;
        el.focusBtn.innerHTML = ui.focusMode ? ICONS.shrink : ICONS.expand;
        el.focusResetBtn.innerHTML = ICONS.reset;
        el.focusSkipBtn.innerHTML = ICONS.skip;
        $$('.seg-btn', el.modeTabs).forEach(function (b) {
            var on = b.dataset.mode === runtime.mode;
            b.classList.toggle('active', on);
            b.setAttribute('aria-selected', String(on));
        });
        var today = stats.days[dk()];
        el.sessionCount.textContent = today ? today.sessions : 0;
        renderCycle();
        renderActiveTask();
        renderGoal();
        updateTaskCount();
        if (ui.deepFocus) renderDeepFocus();
    }
    function stopClock() { if (intervalId) { clearInterval(intervalId); intervalId = null; } }
    function tick() {
        if (runtime.mode === 'stopwatch') { runtime.stopwatchElapsed = (Date.now() - runtime.stopwatchStart) / 1000; render(); return; }
        runtime.remaining = Math.max(0, (runtime.endTime - Date.now()) / 1000);
        if (runtime.remaining <= 0.05) { finishSession(false); return; }
        render();
    }
    function start() {
        if (runtime.running) return;
        if (runtime.mode === 'stopwatch') {
            if (runtime.stopwatchElapsed <= 0) runtime.stopwatchElapsed = 0;
            runtime.running = true;
            runtime.stopwatchStart = Date.now() - runtime.stopwatchElapsed * 1000;
            stopClock();
            intervalId = setInterval(tick, TICK_MS);
            if (settings.deck === 'flight') { window.FlightDeck.startEngineAudio(); window.FlightDeck.startFlightAnim(); }
            pSession(); render();
            return;
        }
        if (runtime.remaining <= 0.1) runtime.remaining = totalFor(runtime.mode);
        runtime.running = true;
        runtime.endTime = Date.now() + runtime.remaining * 1000;
        stopClock();
        intervalId = setInterval(tick, TICK_MS);
        if (settings.deck === 'flight') { window.FlightDeck.startEngineAudio(); window.FlightDeck.startFlightAnim(); }
        pSession(); render();
    }
    function pause() {
        if (!runtime.running) return;
        runtime.running = false;
        if (runtime.mode === 'stopwatch') {
            runtime.stopwatchElapsed = (Date.now() - runtime.stopwatchStart) / 1000;
            stopClock();
            if (runtime.stopwatchElapsed >= 300) {
                creditSession('stopwatch', null);
                toast('Logged ' + fmtDur(runtime.stopwatchElapsed / 60) + ' of focus');
                runtime.stopwatchElapsed = 0;
                pSession(); render();
                return;
            }
        } else {
            runtime.remaining = Math.max(0, (runtime.endTime - Date.now()) / 1000);
        }
        stopClock();
        pSession(); render();
    }
    function toggle() { if (runtime.running) pause(); else start(); }
    function reset() {
        stopClock();
        runtime.running = false;
        if (runtime.mode === 'stopwatch') {
            runtime.stopwatchElapsed = 0;
        } else {
            runtime.remaining = totalFor(runtime.mode);
            if (runtime.mode === 'work' && settings.deck === 'flight') window.FlightDeck.newRoute();
        }
        pSession(); render();
    }
    function setMode(mode, autoStart) {
        if (!MODES[mode]) mode = 'work';
        if (runtime.mode === 'stopwatch' && mode !== 'stopwatch' && runtime.stopwatchElapsed >= 300) {
            creditSession('stopwatch', null);
            toast('Logged ' + fmtDur(runtime.stopwatchElapsed / 60) + ' of focus');
            runtime.stopwatchElapsed = 0;
        }
        if (runtime.mode === 'long' && mode === 'work') { cycle = 0; pCycle(); }
        stopClock();
        runtime.mode = mode;
        if (mode === 'stopwatch') { runtime.stopwatchElapsed = 0; }
        else { runtime.remaining = totalFor(mode); }
        runtime.running = false;
        if (mode === 'work' && settings.deck === 'flight') window.FlightDeck.newRoute();
        pSession(); render();
        if (autoStart) start();
    }
    function nextMode(f) { if (f !== 'work') return 'work'; return cycle >= settings.longEvery ? 'long' : 'short'; }
    function creditSession(mode, extra) {
        var mins = mode === 'stopwatch' ? (runtime.stopwatchElapsed / 60) : (totalFor(mode) / 60);
        if (mins < 0.5) return;
        var key = dk();
        if (!stats.days[key]) stats.days[key] = { focusMinutes: 0, sessions: 0, tasksDone: 0 };
        if (mode === 'work' || mode === 'stopwatch') {
            stats.days[key].focusMinutes += mins;
            stats.days[key].sessions += 1;
            cycle += 1;
            pCycle();
            var t = activeTask();
            if (t) { t.pomodoros = (t.pomodoros || 0) + 1; pTasks(); }
        }
        var tt = '';
        var at = activeTask();
        if (at) tt = at.text;
        history.unshift({ ts: Date.now(), mode: mode, minutes: mins, taskText: tt, intent: runtime.intent || '', distractions: runtime.distractions || 0, route: settings.deck === 'flight' ? (flight.dep + '-' + flight.arr) : '', hour: new Date().getHours() });
        if (history.length > MAX_HISTORY) history.length = MAX_HISTORY;
        pStats(); pHistory();
    }
    function finishSession(fromReload) {
        if (runtime.mode === 'stopwatch') {
            pause();
            if (runtime.stopwatchElapsed >= 300) {
                creditSession('stopwatch', null);
                toast('Logged ' + fmtDur(runtime.stopwatchElapsed / 60) + ' of focus');
                runtime.stopwatchElapsed = 0;
                pSession(); render();
            } else if (runtime.stopwatchElapsed > 0) {
                toast('Under 5 minutes, not logged');
                runtime.stopwatchElapsed = 0;
                pSession(); render();
            }
            return;
        }
        stopClock();
        var fin = runtime.mode;
        runtime.running = false;
        runtime.remaining = 0;
        render();
        creditSession(fin, null);
        var next = nextMode(fin);
        window.FlightDeck.silenceEngineAudio();
        if (!fromReload) {
            beep(); vibrate();
            var title, body;
            if (settings.deck === 'flight') {
                if (fin === 'work') {
                    title = 'Flight complete - welcome to ' + flight.arr;
                    body = next === 'long' ? 'Layover time. Rest.' : 'Turnaround. Short break.';
                } else {
                    title = 'Ground service complete';
                    body = 'Ready for the next flight.';
                }
            } else {
                if (fin === 'work') {
                    title = 'Session complete';
                    body = next === 'long' ? 'Time for a long break.' : 'Take a short break.';
                } else {
                    title = 'Break complete';
                    body = 'Ready to focus again?';
                }
            }
            notify(title, body);
            announce(title + '. ' + body);
        }
        var doAuto = !fromReload && settings.autoStartNext;
        if (fin === 'work' && settings.reflectAfter && !fromReload) {
            setTimeout(function () { openReflectModal(next, doAuto) }, 500);
        } else {
            setTimeout(function () { setMode(next, doAuto) }, fromReload ? 0 : 850);
        }
    }
    function skip() { stopClock(); runtime.running = false; setMode(runtime.mode === 'work' ? 'short' : 'work', false); }
    function adjust(s) {
        if (runtime.mode === 'stopwatch') return;
        var t = totalFor(runtime.mode);
        var n = clamp(runtime.remaining + s, 5, t);
        if (n === runtime.remaining) return;
        runtime.remaining = n;
        if (runtime.running) runtime.endTime = Date.now() + n * 1000;
        pSession(); render();
    }

    /* ============================================================
       DEEP FOCUS
       ============================================================ */
    function enterDeepFocus() {
        ui.deepFocus = true;
        el.deepFocusOverlay.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
        el.dfRing.style.strokeDasharray = String(DF_CIRC);
        renderDeepFocus();
        setTimeout(function () { el.dfPlayBtn.focus() }, 100);
    }
    function exitDeepFocus() {
        ui.deepFocus = false;
        el.deepFocusOverlay.classList.add('hidden');
        document.body.style.overflow = '';
        if (dfMessageTimer) { clearTimeout(dfMessageTimer); dfMessageTimer = null; }
        el.dfMessage.classList.remove('show');
    }
    function renderDeepFocus() {
        var total = totalFor(runtime.mode);
        var frac = runtime.mode === 'stopwatch' ? 0 : (total > 0 ? clamp(runtime.remaining / total, 0, 1) : 0);
        el.dfRing.style.strokeDasharray = String(DF_CIRC);
        el.dfRing.style.strokeDashoffset = String(DF_CIRC * (1 - frac));
        el.dfTime.textContent = fmt(runtime.mode === 'stopwatch' ? Math.floor(runtime.stopwatchElapsed) : runtime.remaining);
        el.dfMode.textContent = MODES[runtime.mode];
        var rc = runtime.mode === 'work' ? 'rgba(216,212,204,.55)' : 'rgba(150,200,170,.55)';
        el.dfRing.style.stroke = rc;
        var t = activeTask();
        var dt = t ? t.text : (runtime.intent || '');
        if (dt) {
            el.dfIntent.textContent = dt;
            el.dfIntent.classList.remove('empty');
        } else {
            el.dfIntent.textContent = 'Nothing yet. Name the thing.';
            el.dfIntent.classList.add('empty');
        }
        var today = stats.days[dk()] || { sessions: 0 };
        var n = (today.sessions || 0) + 1;
        el.dfSessionLabel.textContent = MODES[runtime.mode] + ' · Session ' + n;
        el.dfPlayBtn.textContent = runtime.running ? 'Pause' : (runtime.mode === 'stopwatch' ? (runtime.stopwatchElapsed > 0 ? 'Resume' : 'Begin') : (runtime.remaining < total - 0.5 ? 'Resume' : 'Begin'));
        el.dfDistractCount.textContent = runtime.distractions;
        el.dfDistractCounter.classList.toggle('has', runtime.distractions > 0);
        if (runtime.mode !== 'work') {
            var seed = Math.floor(totalFor(runtime.mode)) + runtime.distractions;
            var idx = seed % BREAK_SUGGESTIONS.length;
            el.dfBreakNote.textContent = BREAK_SUGGESTIONS[idx];
            el.dfBreakNote.classList.remove('hidden');
        } else {
            el.dfBreakNote.classList.add('hidden');
        }
    }
    function logDistraction() {
        runtime.distractions += 1;
        runtime.distractionLog.push(Date.now());
        pSession();
        renderDeepFocus();
        showDFMessage('Get back to it.');
    }
    function showDFMessage(t) {
        el.dfMessage.textContent = t;
        el.dfMessage.classList.add('show');
        if (dfMessageTimer) clearTimeout(dfMessageTimer);
        dfMessageTimer = setTimeout(function () { el.dfMessage.classList.remove('show') }, 2200);
    }

    /* ============================================================
       INTENT MODAL
       ============================================================ */
    var intentPendingStart = false;
    function openIntentModal(auto) {
        intentPendingStart = !!auto;
        el.intentInput.value = runtime.intent || '';
        el.intentModal.classList.remove('hidden');
        setTimeout(function () { el.intentInput.focus(); el.intentInput.select() }, 80);
    }
    function closeIntentModal() { el.intentModal.classList.add('hidden') }
    function commitIntent() {
        var v = String(el.intentInput.value || '').trim();
        runtime.intent = v.slice(0, 200);
        pSession();
        closeIntentModal();
        render();
        if (intentPendingStart) { intentPendingStart = false; start(); }
    }

    /* ============================================================
       REFLECT MODAL
       ============================================================ */
    var reflectNextMode = null, reflectAutoStart = false;
    function openReflectModal(next, auto) {
        reflectNextMode = next;
        reflectAutoStart = auto;
        ui.reflectChoice = null;
        $$('.reflect-btn', el.reflectOptions).forEach(function (b) { b.classList.remove('selected') });
        el.reflectNote.value = '';
        el.ratingDisplay.classList.add('hidden');
        el.reflectModal.classList.remove('hidden');
        setTimeout(function () { var f = $('.reflect-btn', el.reflectOptions); if (f) f.focus() }, 80);
    }
    function closeReflectModal() { el.reflectModal.classList.add('hidden') }
    function computeRating() {
        var distract = runtime.distractions || 0;
        var score = 100 - distract * 12;
        if (runtime.intent) score += 5;
        var t = activeTask();
        if (t && t.pomodoros >= t.estimate) score += 5;
        score = clamp(score, 0, 100);
        var label, cls;
        if (score >= 92) { label = 'Butter smooth'; cls = 'rating-butter'; }
        else if (score >= 78) { label = 'Smooth landing'; cls = 'rating-smooth'; }
        else if (score >= 62) { label = 'Firm landing'; cls = 'rating-firm'; }
        else if (score >= 42) { label = 'Hard landing'; cls = 'rating-hard'; }
        else { label = 'Go-around recommended'; cls = 'rating-goaround'; }
        return { score: score, label: label, cls: cls };
    }
    function showRatingPreview() {
        var r = computeRating();
        ui.rating = r;
        el.ratingBadge.textContent = r.label;
        el.ratingBadge.className = 'rating-badge ' + r.cls;
        el.ratingScore.textContent = 'Score: ' + r.score + ' · ' + runtime.distractions + ' distraction' + (runtime.distractions === 1 ? '' : 's');
        el.ratingDisplay.classList.remove('hidden');
    }
    function commitReflection() {
        var r = null;
        if (ui.reflectChoice || runtime.distractions > 0) r = computeRating();
        if (ui.reflectChoice) {
            reflections.unshift({ ts: Date.now(), result: ui.reflectChoice, note: String(el.reflectNote.value || '').trim().slice(0, 200), intent: runtime.intent || '', mode: 'work', distractions: runtime.distractions, rating: r ? r.label : null, score: r ? r.score : null });
            if (reflections.length > 200) reflections.length = 200;
            pReflections();
        }
        if (r) {
            var last = history[0];
            if (last && last.mode === 'work') { last.rating = r.label; last.score = r.score; pHistory(); }
        }
        runtime.intent = '';
        runtime.distractions = 0;
        runtime.distractionLog = [];
        pSession();
        closeReflectModal();
        var n = reflectNextMode || 'short', a = reflectAutoStart;
        reflectNextMode = null;
        reflectAutoStart = false;
        setTimeout(function () { setMode(n, a) }, 200);
    }

    /* ============================================================
       STATS
       ============================================================ */
    function todayStats() {
        var k = dk();
        if (!stats.days[k]) stats.days[k] = { focusMinutes: 0, sessions: 0, tasksDone: 0 };
        return stats.days[k];
    }
    function streak() {
        var s = 0, d = new Date();
        for (var i = 0; i < 365; i++) {
            var k = dk(d), day = stats.days[k];
            if (day && day.sessions > 0) { s++; d.setDate(d.getDate() - 1); }
            else if (i === 0) d.setDate(d.getDate() - 1);
            else break;
        }
        return s;
    }
    function last7() {
        var out = [], d = new Date();
        d.setDate(d.getDate() - 6);
        for (var i = 0; i < 7; i++) {
            var k = dk(d), day = stats.days[k] || { focusMinutes: 0, sessions: 0 };
            out.push({ key: k, label: d.toLocaleDateString(undefined, { weekday: 'short' }).slice(0, 2), minutes: day.focusMinutes || 0, sessions: day.sessions || 0 });
            d.setDate(d.getDate() + 1);
        }
        return out;
    }
    function hourHistogram() {
        var h = new Array(24).fill(0);
        history.forEach(function (x) { var hr = x.hour != null ? x.hour : new Date(x.ts).getHours(); h[hr]++; });
        return h;
    }
    function statTile(l, v) {
        return '<div class="stat-tile"><div class="text-[10px] font-bold uppercase tracking-wider text-mute">' + l + '</div><div class="mt-1.5 text-[19px] font-bold tabnum tracking-tight">' + v + '</div></div>';
    }
    function renderStats() {
        var t = todayStats(), st = streak(), wk = last7();
        var mx = Math.max.apply(null, wk.map(function (d) { return d.minutes }).concat([1]));
        var tw = wk.reduce(function (a, d) { return a + d.minutes }, 0);
        var ts = wk.reduce(function (a, d) { return a + d.sessions }, 0);
        var isF = settings.deck === 'flight';
        var td = history.reduce(function (a, h) { return a + (h.distractions || 0) }, 0);
        var h = '';
        h += '<div class="grid grid-cols-2 gap-3 sm:grid-cols-4">';
        h += statTile(isF ? 'Airborne today' : 'Focus today', fmtDur(t.focusMinutes));
        h += statTile(isF ? 'Flights today' : 'Sessions today', String(t.sessions));
        h += statTile('Tasks done', String(t.tasksDone));
        h += statTile('Day streak', st + (st === 1 ? ' day' : ' days'));
        h += '</div>';
        if (td > 0) h += '<div class="mt-3 rounded-xl border px-4 py-3" style="border-color:var(--border);background:var(--surface-2)"><div class="text-[11px] font-bold uppercase tracking-wider text-mute">Total distractions logged</div><div class="mt-1 text-[16px] font-bold tabnum">' + td + '</div><div class="mt-1 text-[11.5px] text-mute">Awareness is the point.</div></div>';
        h += '<div class="mt-6"><div class="flex items-baseline justify-between"><h3 class="text-[13px] font-bold tracking-tight">Last 7 days</h3><span class="text-[11.5px] text-mute">' + fmtDur(tw) + ' &middot; ' + ts + ' sessions</span></div><div class="mt-3 flex items-end gap-2">';
        wk.forEach(function (d) {
            var p = Math.round((d.minutes / mx) * 100);
            h += '<div class="bar-col"><div class="bar-track"><div class="bar-fill" style="height:' + (d.minutes > 0 ? Math.max(p, 4) : 0) + '%"></div></div><span class="text-[10px] text-mute">' + d.label + '</span></div>';
        });
        h += '</div></div>';
        var hist = hourHistogram();
        var maxh = Math.max.apply(null, hist.concat([1]));
        var peakH = hist.indexOf(maxh);
        h += '<div class="mt-6"><h3 class="text-[13px] font-bold tracking-tight">When you focus</h3><p class="mt-1 text-[11.5px] text-mute">Sessions started by hour of day' + (maxh > 0 ? ' &middot; peak at ' + String(peakH).padStart(2, '0') + ':00' : '') + '</p><div class="tod-chart">';
        for (var i = 0; i < 24; i++) {
            var bh = (hist[i] / maxh) * 100;
            var cls = 'tod-bar' + (hist[i] > 0 ? ' has-data' : '') + (i === peakH && maxh > 0 ? ' peak' : '');
            h += '<div class="' + cls + '" style="height:' + Math.max(bh, 4) + '%" title="' + i + ':00 — ' + hist[i] + ' session' + (hist[i] === 1 ? '' : 's') + '"></div>';
        }
        h += '</div><div class="tod-labels"><span>00</span><span>06</span><span>12</span><span>18</span><span>23</span></div></div>';
        h += '<div class="mt-6"><div class="flex items-center justify-between gap-3"><h3 class="text-[13px] font-bold tracking-tight">Recent sessions</h3><button id="exportCsvBtn" class="btn btn-ghost btn-sm">Export CSV</button></div>';
        if (history.length === 0) h += '<p class="mt-3 text-[12.5px] text-mute">No sessions recorded yet.</p>';
        else {
            h += '<div class="mt-3 space-y-2">';
            history.slice(0, 12).forEach(function (x) {
                var c = (settings.deck === 'flight' ? FLIGHT_ACCENT : ACCENT)[x.mode] || ACCENT.work;
                h += '<div class="hist-row"><div class="flex min-w-0 items-center gap-2.5"><span class="dot-mode" style="background:' + c + '"></span><span class="truncate font-medium">' + MODES[x.mode] + '</span>';
                if (x.route) h += '<span class="shrink-0 text-mute" style="font-variant-numeric:tabular-nums">' + esc(x.route) + '</span>';
                if (x.intent) h += '<span class="truncate text-mute">&middot; ' + esc(x.intent) + '</span>';
                else if (x.taskText) h += '<span class="truncate text-mute">&middot; ' + esc(x.taskText) + '</span>';
                if (x.distractions > 0) h += '<span class="shrink-0 text-mute" style="color:#d4b483">' + x.distractions + 'd</span>';
                if (x.rating) h += '<span class="shrink-0 text-mute" style="color:#5bd45b">' + esc(x.rating) + '</span>';
                h += '</div><span class="shrink-0 text-mute">' + ago(x.ts) + '</span></div>';
            });
            h += '</div>';
        }
        h += '</div>';
        if (reflections.length > 0) {
            h += '<div class="mt-6"><h3 class="text-[13px] font-bold tracking-tight">How sessions went</h3><div class="mt-3 flex gap-2">';
            var c2 = { yes: 0, partial: 0, no: 0 };
            reflections.forEach(function (r) { if (c2[r.result] !== undefined) c2[r.result]++; });
            h += '<div class="stat-tile flex-1"><div class="text-[10px] font-bold uppercase tracking-wider text-mute">Finished</div><div class="mt-1 text-[16px] font-bold">' + c2.yes + '</div></div>';
            h += '<div class="stat-tile flex-1"><div class="text-[10px] font-bold uppercase tracking-wider text-mute">Partial</div><div class="mt-1 text-[16px] font-bold">' + c2.partial + '</div></div>';
            h += '<div class="stat-tile flex-1"><div class="text-[10px] font-bold uppercase tracking-wider text-mute">Not done</div><div class="mt-1 text-[16px] font-bold">' + c2.no + '</div></div>';
            h += '</div></div>';
        }
        h += '<div class="mt-6 border-t divider pt-4"><button id="resetStatsBtn" class="btn btn-ghost btn-sm" style="color:#fb7185;border-color:rgba(244,63,94,.35)">Reset all statistics</button></div>';
        el.statsContent.innerHTML = h;
        var cb = $('#exportCsvBtn'); if (cb) cb.addEventListener('click', exportCSV);
        var rb = $('#resetStatsBtn'); if (rb) rb.addEventListener('click', function () {
            if (!confirm('Reset all statistics and session history? This cannot be undone.')) return;
            stats = { days: {} }; history = []; cycle = 0; reflections = [];
            pStats(); pHistory(); pCycle(); pReflections();
            renderStats(); render();
            toast('Statistics reset');
        });
    }
    function download(fn, c, m) {
        try {
            var b = new Blob([c], { type: m || 'text/plain;charset=utf-8' });
            var u = URL.createObjectURL(b);
            var a = document.createElement('a');
            a.href = u; a.download = fn;
            document.body.appendChild(a); a.click(); document.body.removeChild(a);
            setTimeout(function () { URL.revokeObjectURL(u) }, 1500);
        } catch (e) { toast('Download failed'); }
    }
    function exportCSV() {
        if (!history.length) { toast('No sessions to export'); return }
        var rows = [['timestamp', 'mode', 'minutes', 'intent', 'task', 'distractions', 'route', 'rating', 'score', 'hour']];
        history.forEach(function (x) {
            rows.push([new Date(x.ts).toISOString(), x.mode, x.minutes, x.intent || '', x.taskText || '', x.distractions || 0, x.route || '', x.rating || '', x.score != null ? x.score : '', x.hour != null ? x.hour : '']);
        });
        var csv = rows.map(function (r) { return r.map(function (c) { return '"' + String(c).replace(/"/g, '""') + '"' }).join(',') }).join('\n');
        download('pomodoro-history.csv', csv, 'text/csv;charset=utf-8');
        toast('History exported');
    }

    /* ============================================================
       TASKS
       ============================================================ */
    function visibleTasks() {
        var q = ui.search.trim().toLowerCase();
        return tasks.filter(function (t) {
            if (ui.filter === 'active' && t.done) return false;
            if (ui.filter === 'done' && !t.done) return false;
            if (q && t.text.toLowerCase().indexOf(q) === -1) return false;
            return true;
        });
    }
    function canDrag() { return ui.filter === 'all' && !ui.search.trim() }
    function updateTaskCount() {
        var a = tasks.filter(function (t) { return !t.done }).length;
        el.taskCount.textContent = a + ' active';
    }
    function renderTasks() {
        var list = visibleTasks(), drag = canDrag();
        el.taskList.innerHTML = '';
        var dc = tasks.filter(function (t) { return t.done }).length;
        el.emptyState.classList.toggle('hidden', list.length > 0);
        el.clearDoneBtn.classList.toggle('hidden', dc === 0);
        if (list.length === 0) {
            if (tasks.length === 0) el.emptyState.textContent = 'No tasks yet. Add one above to get started.';
            else if (ui.search.trim()) el.emptyState.textContent = 'No tasks match your search.';
            else el.emptyState.textContent = ui.filter === 'done' ? 'No completed tasks yet.' : 'No active tasks. Nice work.';
        }
        list.forEach(function (t) { el.taskList.appendChild(buildTaskNode(t, drag)) });
        updateTaskCount();
    }
    function buildTaskNode(task, drag) {
        var li = document.createElement('li');
        li.className = 'task';
        li.dataset.id = task.id;
        li.draggable = !!drag;
        if (task.id === runtime.activeTaskId) li.classList.add('is-active');
        if (ui.editingId === task.id) return buildTaskEditor(li, task);
        var handle = document.createElement('span');
        handle.className = 'drag-handle';
        handle.innerHTML = ICONS.grip;
        if (!drag) handle.style.opacity = '.25';
        li.appendChild(handle);
        var check = document.createElement('button');
        check.type = 'button';
        check.className = 'check' + (task.done ? ' done' : '');
        check.dataset.act = 'toggle';
        check.innerHTML = ICONS.check;
        li.appendChild(check);
        var body = document.createElement('div');
        body.className = 'min-w-0 flex-1';
        var text = document.createElement('div');
        text.className = 'break-words text-[13px] leading-snug';
        text.style.color = task.done ? 'var(--text-mute)' : 'var(--text)';
        if (task.done) text.style.textDecoration = 'line-through';
        text.textContent = task.text;
        body.appendChild(text);
        var meta = document.createElement('div');
        meta.className = 'mt-1.5 flex items-center gap-2.5';
        var est = document.createElement('span');
        est.className = 'tabnum text-[10.5px] text-mute';
        est.textContent = task.pomodoros + ' / ' + task.estimate;
        meta.appendChild(est);
        var bar = document.createElement('div');
        bar.className = 'mini-bar';
        bar.style.width = '58px';
        var fl = document.createElement('span');
        fl.style.width = clamp((task.pomodoros / task.estimate) * 100, 0, 100) + '%';
        if (task.done) fl.style.background = 'var(--done)';
        bar.appendChild(fl);
        meta.appendChild(bar);
        body.appendChild(meta);
        li.appendChild(body);
        var actions = document.createElement('div');
        actions.className = 'flex shrink-0 items-center gap-0.5';
        var tgt = document.createElement('button');
        tgt.type = 'button';
        tgt.className = 'icon-btn' + (task.id === runtime.activeTaskId ? ' on' : '');
        tgt.dataset.act = 'active';
        tgt.innerHTML = ICONS.target;
        actions.appendChild(tgt);
        var ed = document.createElement('button');
        ed.type = 'button'; ed.className = 'icon-btn'; ed.dataset.act = 'edit'; ed.innerHTML = ICONS.edit;
        actions.appendChild(ed);
        var dl = document.createElement('button');
        dl.type = 'button'; dl.className = 'icon-btn danger'; dl.dataset.act = 'delete'; dl.innerHTML = ICONS.x;
        actions.appendChild(dl);
        li.appendChild(actions);
        return li;
    }
    function buildTaskEditor(li, task) {
        li.draggable = false;
        li.style.flexDirection = 'column';
        li.style.alignItems = 'stretch';
        li.style.gap = '10px';
        var input = document.createElement('input');
        input.type = 'text'; input.className = 'input'; input.value = task.text; input.maxLength = 180;
        var row = document.createElement('div');
        row.className = 'flex items-center gap-2';
        var el2 = document.createElement('span');
        el2.className = 'text-[11px] text-mute';
        el2.textContent = 'Sessions needed';
        var est = document.createElement('input');
        est.type = 'number'; est.min = '1'; est.max = '20';
        est.className = 'input tabnum text-center';
        est.style.width = '72px'; est.style.padding = '8px 10px'; est.value = task.estimate;
        var sp = document.createElement('div'); sp.className = 'flex-1';
        var c = document.createElement('button'); c.type = 'button'; c.className = 'btn btn-ghost btn-sm'; c.textContent = 'Cancel'; c.dataset.act = 'cancel-edit';
        var s = document.createElement('button'); s.type = 'button'; s.className = 'btn btn-primary btn-sm'; s.textContent = 'Save'; s.dataset.act = 'save-edit';
        row.appendChild(el2); row.appendChild(est); row.appendChild(sp); row.appendChild(c); row.appendChild(s);
        li.appendChild(input); li.appendChild(row);
        setTimeout(function () { input.focus(); input.select() }, 0);
        li.addEventListener('keydown', function (e) {
            if (e.key === 'Enter') { e.preventDefault(); commitEdit(task.id, input.value, est.value); }
            else if (e.key === 'Escape') { e.preventDefault(); ui.editingId = null; renderTasks(); }
        });
        li._commitEdit = function () { commitEdit(task.id, input.value, est.value) };
        return li;
    }
    function commitEdit(id, text, est) {
        var t = null;
        for (var i = 0; i < tasks.length; i++) if (tasks[i].id === id) t = tasks[i];
        if (!t) { ui.editingId = null; renderTasks(); return; }
        var c = String(text).trim();
        if (c) t.text = c;
        t.estimate = clamp(parseInt(est, 10) || 1, 1, 20);
        ui.editingId = null;
        pTasks(); renderTasks(); render();
    }
    function addTask(text) {
        var c = String(text).trim();
        if (!c) return;
        tasks.unshift({ id: uid(), text: c, done: false, estimate: 1, pomodoros: 0, createdAt: Date.now() });
        pTasks(); renderTasks();
    }
    function toggleTask(id) {
        var t = null;
        for (var i = 0; i < tasks.length; i++) if (tasks[i].id === id) t = tasks[i];
        if (!t) return;
        t.done = !t.done;
        var d = todayStats();
        d.tasksDone = t.done ? d.tasksDone + 1 : Math.max(0, d.tasksDone - 1);
        pStats();
        if (t.done && runtime.activeTaskId === id) { runtime.activeTaskId = null; pSession(); }
        pTasks(); renderTasks(); render();
    }
    function deleteTask(id) {
        var idx = -1, t = null;
        for (var i = 0; i < tasks.length; i++) if (tasks[i].id === id) { idx = i; t = tasks[i]; }
        if (idx === -1) return;
        var snap = JSON.parse(JSON.stringify(t));
        tasks.splice(idx, 1);
        if (runtime.activeTaskId === id) { runtime.activeTaskId = null; pSession(); }
        pTasks(); renderTasks(); render();
        toast('Task deleted', { undo: function () { tasks.splice(Math.min(idx, tasks.length), 0, snap); pTasks(); renderTasks(); render(); }, duration: 5000 });
    }
    function setActiveTask(id) {
        if (runtime.activeTaskId === id) { runtime.activeTaskId = null; toast('Task unlinked'); }
        else { runtime.activeTaskId = id; var t = activeTask(); if (t) toast('Now working on: ' + t.text); }
        pSession(); renderTasks(); render();
    }

    /* ============================================================
       DRAG & DROP
       ============================================================ */
    function onDragStart(e) {
        var li = e.target.closest ? e.target.closest('li[data-id]') : null;
        if (!li || !canDrag()) { e.preventDefault(); return }
        ui.dragId = li.dataset.id;
        li.classList.add('is-dragging');
        try { e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', ui.dragId) } catch (err) { }
    }
    function onDragOver(e) {
        if (!ui.dragId) return;
        e.preventDefault();
        try { e.dataTransfer.dropEffect = 'move' } catch (err) { }
        var overLi = e.target.closest ? e.target.closest('li[data-id]') : null;
        if (!overLi) return;
        var dragLi = el.taskList.querySelector('li[data-id="' + ui.dragId + '"]');
        if (!dragLi || overLi === dragLi) return;
        var r = overLi.getBoundingClientRect(), after = e.clientY > r.top + r.height / 2;
        el.taskList.insertBefore(dragLi, after ? overLi.nextSibling : overLi);
    }
    function onDragEnd() {
        if (!ui.dragId) return;
        var order = $$('li[data-id]', el.taskList).map(function (li) { return li.dataset.id });
        var dragged = el.taskList.querySelector('li[data-id="' + ui.dragId + '"]');
        if (dragged) dragged.classList.remove('is-dragging');
        if (order.length) {
            var map = {};
            tasks.forEach(function (t) { map[t.id] = t });
            var vis = {};
            order.forEach(function (id) { vis[id] = true });
            tasks = order.map(function (id) { return map[id] }).filter(Boolean).concat(tasks.filter(function (t) { return !vis[t.id] }));
            pTasks();
        }
        ui.dragId = null;
        renderTasks();
    }

    /* ============================================================
       MODALS / FOCUS
       ============================================================ */
    function openModal(n) {
        n.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
        var f = n.querySelector('button,input,[tabindex]');
        if (f) setTimeout(function () { f.focus() }, 40);
    }
    function closeModal(n) {
        n.classList.add('hidden');
        if (el.statsModal.classList.contains('hidden') && el.helpModal.classList.contains('hidden')) document.body.style.overflow = '';
    }
    function enterFocusMode() { ui.focusMode = true; el.focusOverlay.classList.remove('hidden'); document.body.style.overflow = 'hidden'; render() }
    function exitFocusMode() { ui.focusMode = false; el.focusOverlay.classList.add('hidden'); document.body.style.overflow = ''; render() }
    function toggleFocusMode() { if (ui.focusMode) exitFocusMode(); else enterFocusMode() }
    function renderHelp() {
        var rows = [['Space', 'Start or pause the timer'], ['G', 'Toggle deep focus mode'], ['R', 'Reset the current session'], ['S', 'Skip to the next session'], ['F', 'Toggle focus mode'], ['D', 'Switch between Classic and Flight Deck'], ['V', 'Swap PFD and ND (Flight Deck only)'], ['N', 'Jump to the new task field'], ['1 / 2 / 3 / 4', 'Focus, Short, Long, or Stopwatch'], ['T', 'Toggle light and dark theme'], ['?', 'Open this shortcuts panel'], ['Esc', 'Close panels or exit focus modes']];
        var h = '<div class="space-y-2">';
        rows.forEach(function (r) {
            h += '<div class="flex items-center justify-between gap-4 rounded-xl border px-3.5 py-2.5" style="border-color:var(--border);background:var(--surface-2)"><span class="text-[12.5px] text-dim">' + r[1] + '</span><span class="kbd shrink-0">' + r[0] + '</span></div>';
        });
        h += '</div>';
        h += '<div class="mt-5 rounded-xl border px-4 py-3" style="border-color:var(--border);background:var(--surface-2)"><div class="text-[12px] font-semibold text-dim mb-1.5">Flight Deck features</div><p class="text-[12px] text-mute leading-relaxed">Weather is automatic based on your local time. Aircraft type changes climb rate, cruise altitude, and engine feel. On focus sessions you get a landing rating based on distractions and whether you completed what you set out to do.</p></div>';
        el.helpContent.innerHTML = h;
    }

    /* ============================================================
       EVENTS
       ============================================================ */
    function bindEvents() {
        el.startBtn.addEventListener('click', function () {
            if (settings.sound && settings.deck === 'flight') window.FlightDeck.startEngineAudio();
            if (runtime.mode === 'work' && settings.requireIntent && !runtime.intent && !runtime.running) { openIntentModal(true); return }
            toggle();
        });
        el.resetBtn.addEventListener('click', reset);
        el.skipBtn.addEventListener('click', skip);
        el.focusBtn.addEventListener('click', toggleFocusMode);
        el.deepFocusBtn.addEventListener('click', function () { if (ui.deepFocus) exitDeepFocus(); else enterDeepFocus() });
        el.focusStartBtn.addEventListener('click', function () {
            if (settings.sound && settings.deck === 'flight') window.FlightDeck.startEngineAudio();
            toggle();
        });
        el.focusResetBtn.addEventListener('click', reset);
        el.focusSkipBtn.addEventListener('click', skip);
        el.exitFocusBtn.addEventListener('click', exitFocusMode);
        el.dfPlayBtn.addEventListener('click', function () {
            if (runtime.mode === 'work' && settings.requireIntent && !runtime.intent && !runtime.running) {
                var was = ui.deepFocus;
                if (was) { el.deepFocusOverlay.classList.add('hidden'); document.body.style.overflow = ''; }
                openIntentModal(true);
                return;
            }
            toggle();
            renderDeepFocus();
        });
        el.dfDistractBtn.addEventListener('click', logDistraction);
        el.dfExitBtn.addEventListener('click', exitDeepFocus);
        el.modeTabs.addEventListener('click', function (e) {
            var b = e.target.closest('.seg-btn');
            if (!b) return;
            var m = b.dataset.mode;
            if (m === runtime.mode && !runtime.running) return;
            setMode(m, false);
        });
        $$('[data-adjust]').forEach(function (b) {
            b.addEventListener('click', function () { adjust(parseInt(b.dataset.adjust, 10)) });
        });
        el.settingsToggle.addEventListener('click', function () {
            ui.settingsOpen = !ui.settingsOpen;
            el.settingsPanel.classList.toggle('open', ui.settingsOpen);
            el.settingsChev.classList.toggle('open', ui.settingsOpen);
            el.settingsChev.innerHTML = ICONS.chevron;
        });
        function readDur() {
            var p = totalFor(runtime.mode);
            settings.work = clamp(parseInt(el.workInput.value, 10) || 25, 1, 180);
            settings.short = clamp(parseInt(el.shortInput.value, 10) || 5, 1, 60);
            settings.long = clamp(parseInt(el.longInput.value, 10) || 15, 1, 90);
            settings.longEvery = clamp(parseInt(el.everyInput.value, 10) || 4, 1, 12);
            el.workInput.value = settings.work;
            el.shortInput.value = settings.short;
            el.longInput.value = settings.long;
            el.everyInput.value = settings.longEvery;
            var nt = totalFor(runtime.mode);
            if (!runtime.running && runtime.mode !== 'stopwatch') {
                if (Math.abs(runtime.remaining - p) < 0.6) runtime.remaining = nt;
                else runtime.remaining = Math.min(runtime.remaining, nt);
            }
            pSettings(); pSession(); render();
        }
        [el.workInput, el.shortInput, el.longInput, el.everyInput].forEach(function (i) {
            i.addEventListener('change', readDur);
            i.addEventListener('blur', readDur);
        });
        $$('[data-setting]').forEach(function (b) {
            b.addEventListener('click', function () {
                var k = b.dataset.setting;
                if (k === 'deckFlight') {
                    settings.deck = settings.deck === 'flight' ? 'classic' : 'flight';
                    pSettings(); applyTheme();
                    if (settings.deck === 'flight') {
                        if (!window.FlightDeck.flightSim.routePoints.length) window.FlightDeck.resetFlightSim();
                        window.FlightDeck.renderRoute();
                    }
                    render();
                    toast(settings.deck === 'flight' ? 'Flight Deck engaged' : 'Classic timer restored');
                    return;
                }
                settings[k] = !settings[k];
                b.setAttribute('aria-checked', String(settings[k]));
                pSettings(); applyTheme();
                if (k === 'sound') {
                    if (settings.sound && settings.deck === 'flight') window.FlightDeck.startEngineAudio();
                    else window.FlightDeck.silenceEngineAudio();
                    if (settings.sound) beep();
                }
                if (k === 'vibrate' && settings.vibrate) vibrate();
            });
        });
        el.deckBtn.addEventListener('click', function () {
            settings.deck = settings.deck === 'flight' ? 'classic' : 'flight';
            pSettings(); applyTheme();
            if (settings.deck === 'flight') {
                if (!window.FlightDeck.flightSim.routePoints.length) window.FlightDeck.resetFlightSim();
                window.FlightDeck.renderRoute();
            }
            render();
            toast(settings.deck === 'flight' ? 'Flight Deck engaged' : 'Classic timer restored');
        });
        el.aircraftSelect.addEventListener('change', function () {
            settings.aircraft = el.aircraftSelect.value;
            pSettings();
            window.FlightDeck.resetFlightSim();
            toast('Aircraft: ' + window.FlightDeck.AIRCRAFT[settings.aircraft].name);
        });
        el.weatherSelect.addEventListener('change', function () {
            settings.weather = el.weatherSelect.value;
            pSettings();
            window.FlightDeck.updateWeather();
        });
        el.liveFlightBtn.addEventListener('click', window.FlightDeck.fetchLiveFlight);
        el.newRouteBtn.addEventListener('click', window.FlightDeck.newRoute);
        el.goalEditBtn.addEventListener('click', function () {
            var v = prompt('Daily session goal:', String(settings.dailyGoal));
            if (v === null) return;
            var n = parseInt(v, 10);
            if (!n || n < 1) return;
            settings.dailyGoal = clamp(n, 1, 30);
            pSettings(); renderGoal();
            toast('Goal set to ' + settings.dailyGoal + ' sessions');
        });
        $$('.display-tab').forEach(function (b) {
            b.addEventListener('click', function () { window.FlightDeck.setDisplayMode(b.dataset.display) });
        });
        $$('.range-btn').forEach(function (b) {
            b.addEventListener('click', function () { window.FlightDeck.setNDRange(parseInt(b.dataset.range, 10)) });
        });
        el.taskForm.addEventListener('submit', function (e) {
            e.preventDefault();
            addTask(el.taskInput.value);
            el.taskInput.value = '';
            el.taskInput.focus();
        });
        el.taskList.addEventListener('click', function (e) {
            var b = e.target.closest('button[data-act]');
            if (!b) return;
            var li = b.closest('li[data-id]');
            if (!li) return;
            var id = li.dataset.id, act = b.dataset.act;
            if (act === 'toggle') toggleTask(id);
            else if (act === 'delete') deleteTask(id);
            else if (act === 'active') setActiveTask(id);
            else if (act === 'edit') { ui.editingId = id; renderTasks(); }
            else if (act === 'cancel-edit') { ui.editingId = null; renderTasks(); }
            else if (act === 'save-edit') { if (li._commitEdit) li._commitEdit(); }
        });
        el.taskList.addEventListener('dragstart', onDragStart);
        el.taskList.addEventListener('dragover', onDragOver);
        el.taskList.addEventListener('drop', function (e) { e.preventDefault() });
        el.taskList.addEventListener('dragend', onDragEnd);
        el.taskFilters.addEventListener('click', function (e) {
            var b = e.target.closest('.seg-btn');
            if (!b) return;
            ui.filter = b.dataset.filter;
            $$('.seg-btn', el.taskFilters).forEach(function (x) {
                var on = x.dataset.filter === ui.filter;
                x.classList.toggle('active', on);
                x.setAttribute('aria-selected', String(on));
            });
            renderTasks();
        });
        el.taskSearch.addEventListener('input', function () { ui.search = el.taskSearch.value; renderTasks() });
        el.clearDoneBtn.addEventListener('click', function () {
            var snap = JSON.parse(JSON.stringify(tasks.filter(function (t) { return t.done })));
            var n = snap.length;
            tasks = tasks.filter(function (t) { return !t.done });
            pTasks(); renderTasks();
            toast(n + (n === 1 ? ' task cleared' : ' tasks cleared'), {
                undo: function () { tasks = tasks.concat(snap); pTasks(); renderTasks(); render(); },
                duration: 5000
            });
        });
        el.clearActiveTask.addEventListener('click', function () {
            runtime.activeTaskId = null; pSession(); renderTasks(); render();
        });
        el.exportTasksBtn.addEventListener('click', function () {
            if (!tasks.length) { toast('No tasks to export'); return }
            var pl = { app: 'pomodoro-focus', version: 6, exportedAt: new Date().toISOString(), tasks: tasks };
            download('pomodoro-tasks.json', JSON.stringify(pl, null, 2), 'application/json');
            toast('Tasks exported');
        });
        el.importTasksBtn.addEventListener('click', function () { el.importFile.click() });
        el.importFile.addEventListener('change', function () {
            var f = el.importFile.files && el.importFile.files[0];
            if (!f) return;
            var r = new FileReader();
            r.onload = function () {
                try {
                    var p = JSON.parse(String(r.result));
                    var inc = Array.isArray(p) ? p : (p && p.tasks);
                    if (!Array.isArray(inc)) throw new Error('bad');
                    var ex = {};
                    tasks.forEach(function (t) { ex[t.text.toLowerCase() + '|' + t.done] = true });
                    var add = 0;
                    inc.forEach(function (raw) {
                        if (!raw || typeof raw.text !== 'string' || !raw.text.trim()) return;
                        var k = raw.text.trim().toLowerCase() + '|' + !!raw.done;
                        if (ex[k]) return;
                        ex[k] = true;
                        tasks.push({ id: uid(), text: raw.text.trim().slice(0, 180), done: !!raw.done, estimate: clamp(parseInt(raw.estimate, 10) || 1, 1, 20), pomodoros: Math.max(0, parseInt(raw.pomodoros, 10) || 0), createdAt: raw.createdAt || Date.now() });
                        add++;
                    });
                    pTasks(); renderTasks();
                    toast(add ? add + ' tasks imported' : 'No new tasks found');
                } catch (err) { toast('Could not read that file') }
                el.importFile.value = '';
            };
            r.readAsText(f);
        });
        el.intentCancelBtn.addEventListener('click', function () { closeIntentModal(); intentPendingStart = false });
        el.intentStartBtn.addEventListener('click', commitIntent);
        el.intentInput.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); commitIntent(); } });
        el.intentExamples.addEventListener('click', function (e) {
            var s = e.target.closest('.intent-example');
            if (!s) return;
            el.intentInput.value = s.textContent;
            el.intentInput.focus();
        });
        el.reflectOptions.addEventListener('click', function (e) {
            var b = e.target.closest('.reflect-btn');
            if (!b) return;
            ui.reflectChoice = b.dataset.result;
            $$('.reflect-btn', el.reflectOptions).forEach(function (x) { x.classList.toggle('selected', x === b) });
            showRatingPreview();
        });
        el.reflectSaveBtn.addEventListener('click', commitReflection);
        el.reflectSkipBtn.addEventListener('click', function () { ui.reflectChoice = null; commitReflection() });
        el.themeBtn.addEventListener('click', function () {
            settings.theme = settings.theme === 'light' ? 'dark' : 'light';
            pSettings(); applyTheme();
        });
        el.notifyBtn.addEventListener('click', function () {
            if (!('Notification' in window)) { toast('Notifications not supported'); return }
            if (Notification.permission === 'granted') {
                settings.notifications = !settings.notifications;
                pSettings(); updateNotifyButton();
                toast(settings.notifications ? 'Notifications enabled' : 'Notifications disabled');
                return;
            }
            if (Notification.permission === 'denied') { toast('Notifications blocked'); return }
            Notification.requestPermission().then(function (p) {
                settings.notifications = (p === 'granted');
                pSettings(); updateNotifyButton();
                toast(p === 'granted' ? 'Notifications enabled' : 'Not enabled');
            });
        });
        el.statsBtn.addEventListener('click', function () { renderStats(); openModal(el.statsModal) });
        el.helpBtn.addEventListener('click', function () { renderHelp(); openModal(el.helpModal) });
        $$('[data-close]').forEach(function (n) {
            n.addEventListener('click', function () { var r = n.closest('.modal-root'); if (r) closeModal(r) });
        });
        el.ambientControls.addEventListener('click', function (e) {
            var b = e.target.closest('.ambient-btn');
            if (!b) return;
            var t = b.dataset.ambient;
            $$('.ambient-btn').forEach(function (x) { x.classList.toggle('active', x.dataset.ambient === t) });
            if (t === 'off') { stopAmbientSource() }
            else { var vol = (parseInt(el.ambientVol.value, 10) || 40) / 100; startAmbient(t, vol); toast('Ambient: ' + t); }
        });
        el.ambientVol.addEventListener('input', function () { setAmbientVolume((parseInt(el.ambientVol.value, 10) || 40) / 100) });
        document.addEventListener('visibilitychange', function () {
            if (document.hidden && settings.autoPauseHidden && runtime.running) { pause(); toast('Paused because the tab was hidden'); }
        });
        document.addEventListener('keydown', function (e) {
            var tag = (e.target.tagName || '').toLowerCase();
            var typing = tag === 'input' || tag === 'textarea' || tag === 'select' || e.target.isContentEditable;
            if (e.key === 'Escape') {
                if (!el.intentModal.classList.contains('hidden')) { closeIntentModal(); intentPendingStart = false; return }
                if (!el.reflectModal.classList.contains('hidden')) return;
                if (!el.statsModal.classList.contains('hidden')) { closeModal(el.statsModal); return }
                if (!el.helpModal.classList.contains('hidden')) { closeModal(el.helpModal); return }
                if (ui.deepFocus) { exitDeepFocus(); return }
                if (ui.focusMode) { exitFocusMode(); return }
                if (ui.editingId) { ui.editingId = null; renderTasks(); return }
            }
            if (typing) return;
            var k = e.key;
            if (e.code === 'Space' || k === ' ') { e.preventDefault(); if (ui.deepFocus) el.dfPlayBtn.click(); else el.startBtn.click(); return }
            if (k === 'g' || k === 'G') { e.preventDefault(); if (ui.deepFocus) exitDeepFocus(); else enterDeepFocus(); return }
            if (k === 'r' || k === 'R') { e.preventDefault(); reset(); return }
            if (k === 's' || k === 'S') { e.preventDefault(); skip(); return }
            if (k === 'f' || k === 'F') { e.preventDefault(); toggleFocusMode(); return }
            if (k === 'd' || k === 'D') {
                e.preventDefault();
                settings.deck = settings.deck === 'flight' ? 'classic' : 'flight';
                pSettings(); applyTheme();
                if (settings.deck === 'flight') {
                    if (!window.FlightDeck.flightSim.routePoints.length) window.FlightDeck.resetFlightSim();
                    window.FlightDeck.renderRoute();
                }
                render();
                toast(settings.deck === 'flight' ? 'Flight Deck engaged' : 'Classic timer restored');
                return;
            }
            if (k === 'v' || k === 'V') {
                if (settings.deck === 'flight') { e.preventDefault(); window.FlightDeck.setDisplayMode(window.FlightDeck.flightSim.displayMode === 'pfd' ? 'nd' : 'pfd'); }
                return;
            }
            if (k === 't' || k === 'T') { e.preventDefault(); settings.theme = settings.theme === 'light' ? 'dark' : 'light'; pSettings(); applyTheme(); return }
            if (k === 'n' || k === 'N') { e.preventDefault(); el.taskInput.focus(); el.taskInput.select(); return }
            if (k === '?') { e.preventDefault(); renderHelp(); openModal(el.helpModal); return }
            if (k === '1') { setMode('work', false); return }
            if (k === '2') { setMode('short', false); return }
            if (k === '3') { setMode('long', false); return }
            if (k === '4') { setMode('stopwatch', false); return }
        });
        window.addEventListener('beforeunload', function () { pSession(); pSettings(); pTasks(); });
        window.addEventListener('resize', function () {
            if (settings.deck === 'flight') {
                if (window.FlightDeck.flightSim.displayMode === 'nd') window.FlightDeck.renderND();
                window.FlightDeck.updateWeather();
            }
        });
    }

    /* ============================================================
       INIT
       ============================================================ */
    function restoreSession() {
        var s = load(STORE.session, null);
        if (!s || typeof s !== 'object') return;
        if (MODES[s.mode]) runtime.mode = s.mode;
        if (s.activeTaskId && tasks.some(function (t) { return t.id === s.activeTaskId })) runtime.activeTaskId = s.activeTaskId;
        if (typeof s.intent === 'string') runtime.intent = s.intent;
        if (typeof s.distractions === 'number') runtime.distractions = s.distractions;
        if (Array.isArray(s.distractionLog)) runtime.distractionLog = s.distractionLog;
        if (typeof s.stopwatchElapsed === 'number') runtime.stopwatchElapsed = s.stopwatchElapsed;
        if (runtime.mode === 'stopwatch') {
            if (s.running && typeof s.stopwatchElapsed === 'number') runtime.running = false;
            return;
        }
        if (s.running && typeof s.endTime === 'number') {
            var rem = (s.endTime - Date.now()) / 1000;
            if (rem > 0.5) { runtime.remaining = rem; runtime.running = true; runtime.endTime = s.endTime; }
            else { runtime.remaining = 0; runtime.running = false; pendingResumeCredit = true; }
            return;
        }
        if (typeof s.remaining === 'number' && s.remaining > 0) runtime.remaining = Math.min(s.remaining, totalFor(runtime.mode));
        else runtime.remaining = totalFor(runtime.mode);
    }

    function init() {
        applyTheme();
        updateNotifyButton();
        el.ring.style.strokeDasharray = String(CIRC);
        el.ring.style.strokeDashoffset = '0';
        el.ringFocus.style.strokeDasharray = String(CIRC);
        el.ringFocus.style.strokeDashoffset = '0';
        el.dfRing.style.strokeDasharray = String(DF_CIRC);
        el.dfRing.style.strokeDashoffset = '0';
        el.settingsChev.innerHTML = ICONS.chevron;
        el.clearActiveTask.innerHTML = ICONS.x;
        el.deepFocusBtn.innerHTML = ICONS.brain;
        el.noteLink.innerHTML = ICONS.note;
        ui.filter = 'all';
        $$('.seg-btn', el.taskFilters).forEach(function (b) { b.classList.toggle('active', b.dataset.filter === 'all') });
        window.FlightDeck.flightSim.totalNM = 800 + Math.random() * 4200;
        window.FlightDeck.flightSim.routePoints = [];
        window.FlightDeck.newRoute();
        window.FlightDeck.updateWeather();
        window.FlightDeck.renderAircraftCode();
        $$('.ambient-btn').forEach(function (b) { b.classList.toggle('active', b.dataset.ambient === 'off') });
        if (settings.deck === 'flight') {
            window.FlightDeck.buildPFD();
            window.FlightDeck.initND();
            window.FlightDeck.startFlightAnim();
        }
        window.FlightDeck.setDisplayMode('pfd');
        window.FlightDeck.setNDRange(40);
        restoreSession();
        bindEvents();
        renderTasks();
        render();
        if (runtime.running) {
            stopClock();
            intervalId = setInterval(tick, TICK_MS);
            if (settings.deck === 'flight') window.FlightDeck.startEngineAudio();
        }
        if (pendingResumeCredit) {
            pendingResumeCredit = false;
            setTimeout(function () {
                var f = runtime.mode;
                runtime.remaining = 0;
                render();
                creditSession(f, null);
                var n = nextMode(f);
                announce('Your session finished while you were away.');
                setTimeout(function () { setMode(n, false) }, 500);
            }, 300);
        }
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();

})();
