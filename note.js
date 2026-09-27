(function () {
    'use strict';

    /* ============================================================
       STUDY CARDS — main logic
       ============================================================ */

    var STORAGE_KEY = 'study_cards_v1';
    var DEFAULT_SUBJECTS = ['General', 'Algorithms', 'Languages'];

    function $(id) { return document.getElementById(id) }
    function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 8) }
    function load(k, f) {
        try {
            var r = localStorage.getItem(k);
            if (r === null) return f;
            var v = JSON.parse(r);
            return (v === null || v === undefined) ? f : v;
        } catch (e) { return f }
    }
    function save(k, v) { try { localStorage.setItem(k, JSON.stringify(v)) } catch (e) { } }
    function clamp(n, a, b) { return Math.min(b, Math.max(a, n)) }

    function toast(msg) {
        var n = document.createElement('div');
        n.className = 'toast';
        n.textContent = msg;
        $('toastRoot').appendChild(n);
        setTimeout(function () {
            n.classList.add('out');
            setTimeout(function () { if (n.parentNode) n.parentNode.removeChild(n) }, 260);
        }, 2400);
    }

    function download(filename, content, mime) {
        try {
            var blob = new Blob([content], { type: mime || 'text/plain;charset=utf-8' });
            var url = URL.createObjectURL(blob);
            var a = document.createElement('a');
            a.href = url; a.download = filename;
            document.body.appendChild(a); a.click(); document.body.removeChild(a);
            setTimeout(function () { URL.revokeObjectURL(url) }, 1500);
        } catch (e) { toast('Download failed') }
    }

    /* ============================================================
       STATE
       ============================================================ */
    var state = {
        subjects: [],
        currentSubjectId: null,
        currentCardId: null,
        answerVisible: false,
        editingCardId: null
    };

    function makeDefaultCard() {
        return {
            id: uid(),
            q: 'Click edit to add a question',
            a: 'Click edit to add an answer',
            got: 0,
            missed: 0,
            highlighted: false,
            createdAt: Date.now()
        };
    }

    function makeDefaultSubject(name, withStarterCard) {
        var s = { id: uid(), name: name, cards: [], createdAt: Date.now() };
        if (withStarterCard !== false) {
            s.cards.push({
                id: uid(),
                q: 'What is spaced repetition?',
                a: 'A learning technique where review intervals increase each time you recall something correctly, so you review material right before you forget it.',
                got: 0, missed: 0, highlighted: false, createdAt: Date.now()
            });
        }
        return s;
    }

    function findSubject(id) {
        for (var i = 0; i < state.subjects.length; i++)
            if (state.subjects[i].id === id) return state.subjects[i];
        return null;
    }
    function findCard(subjectId, cardId) {
        var s = findSubject(subjectId);
        if (!s) return null;
        for (var i = 0; i < s.cards.length; i++)
            if (s.cards[i].id === cardId) return s.cards[i];
        return null;
    }
    function currentSubject() { return findSubject(state.currentSubjectId) }
    function currentCard() {
        if (!state.currentCardId) return null;
        return findCard(state.currentSubjectId, state.currentCardId);
    }

    /* ============================================================
       PERSISTENCE
       ============================================================ */
    function persist() {
        save(STORAGE_KEY, {
            subjects: state.subjects,
            currentSubjectId: state.currentSubjectId,
            currentCardId: state.currentCardId
        });
    }

    function initData() {
        var saved = load(STORAGE_KEY, null);

        if (saved && Array.isArray(saved.subjects) && saved.subjects.length) {
            state.subjects = saved.subjects.map(function (s) {
                return {
                    id: s.id || uid(),
                    name: String(s.name || 'Untitled'),
                    cards: Array.isArray(s.cards) ? s.cards.map(function (c) {
                        return {
                            id: c.id || uid(),
                            q: String(c.q != null ? c.q : ''),
                            a: String(c.a != null ? c.a : ''),
                            got: Math.max(0, parseInt(c.got, 10) || 0),
                            missed: Math.max(0, parseInt(c.missed, 10) || 0),
                            highlighted: !!c.highlighted,
                            createdAt: c.createdAt || Date.now()
                        };
                    }) : [],
                    createdAt: s.createdAt || Date.now()
                };
            });
            state.subjects.forEach(function (s) {
                if (s.cards.length === 0) s.cards.push(makeDefaultCard());
            });
            state.currentSubjectId = saved.currentSubjectId && findSubject(saved.currentSubjectId)
                ? saved.currentSubjectId
                : state.subjects[0].id;
            var sub = currentSubject();
            state.currentCardId = saved.currentCardId && sub.cards.some(function (c) { return c.id === saved.currentCardId })
                ? saved.currentCardId
                : sub.cards[0].id;
            return;
        }

        // Fresh install
        state.subjects = DEFAULT_SUBJECTS.map(function (n) { return makeDefaultSubject(n, true) });
        state.currentSubjectId = state.subjects[0].id;
        state.currentCardId = state.subjects[0].cards[0].id;
        persist();
    }

    /* ============================================================
       RENDERING
       ============================================================ */
    function renderSubjects() {
        var wrap = $('subjectSelector');
        wrap.innerHTML = '';
        state.subjects.forEach(function (s) {
            var b = document.createElement('button');
            b.className = 'subj-btn' + (s.id === state.currentSubjectId ? ' active' : '');
            b.textContent = s.name;
            b.addEventListener('click', function () {
                if (s.id === state.currentSubjectId) return;
                state.currentSubjectId = s.id;
                state.currentCardId = s.cards.length ? s.cards[0].id : null;
                state.answerVisible = false;
                persist();
                renderAll();
            });
            wrap.appendChild(b);
        });
    }

    function renderCard() {
        var sub = currentSubject();
        var card = currentCard();

        // Navigator
        var total = sub ? sub.cards.length : 0;
        var idx = (sub && card) ? sub.cards.findIndex(function (c) { return c.id === card.id }) + 1 : 0;
        $('cardCount').textContent = idx + ' / ' + total;
        $('navProgressFill').style.width = total ? (idx / total * 100) + '%' : '0%';

        // Buttons
        $('prevCardBtn').disabled = idx <= 1;
        $('nextCardBtn').disabled = idx === 0 || idx >= total;
        $('deleteCardBtn').disabled = !card || total <= 1;
        $('editCardBtn').disabled = !card;
        $('flipBtn').disabled = !card;
        $('highlightBtn').disabled = !card;
        $('gotItBtn').disabled = !card;
        $('missedBtn').disabled = !card;
        $('resetStatsBtn').disabled = !card;

        // Empty state
        if (!card) {
            $('flashcard').innerHTML =
                '<div class="empty">' +
                '<div class="empty-icon">' +
                '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">' +
                '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>' +
                '<path d="M14 2v6h6"/>' +
                '</svg>' +
                '</div>' +
                'No cards in this subject yet. Click <b>+</b> above to add one.' +
                '</div>';
            $('flashcard').classList.remove('highlighted');
            updateStatsPanel();
            return;
        }

        // Rebuild content
        $('flashcard').innerHTML =
            '<div class="card-question" id="cardQuestion"></div>' +
            '<div class="card-divider"></div>' +
            '<div class="card-answer-wrap hidden-answer" id="cardAnswerWrap">' +
            '<div class="card-answer" id="cardAnswer"></div>' +
            '</div>' +
            '<div class="card-hint" id="cardHint">Press <span>Space</span> to flip</div>';

        $('cardQuestion').textContent = card.q || '(empty question)';
        $('cardAnswer').textContent = card.a || '(empty answer)';

        var wrap = $('cardAnswerWrap');
        if (state.answerVisible) {
            wrap.classList.remove('hidden-answer');
            $('cardHint').innerHTML = 'Press <span>Space</span> to hide';
        } else {
            wrap.classList.add('hidden-answer');
            $('cardHint').innerHTML = 'Press <span>Space</span> to flip';
        }

        $('flashcard').classList.toggle('highlighted', !!card.highlighted);
        $('cardQuestion').addEventListener('click', toggleFlip);

        updateStatsPanel();
    }

    function updateStatsPanel() {
        var sub = currentSubject();
        var totalCards = 0, totalGot = 0, totalMissed = 0;
        if (sub) {
            totalCards = sub.cards.length;
            sub.cards.forEach(function (c) {
                totalGot += c.got || 0;
                totalMissed += c.missed || 0;
            });
        }
        var attempts = totalGot + totalMissed;
        var acc = attempts > 0 ? Math.round(totalGot / attempts * 100) + '%' : '—';

        $('statCards').textContent = totalCards;
        $('statGot').textContent = totalGot;
        $('statMissed').textContent = totalMissed;
        $('statAcc').textContent = acc;
    }

    function renderAll() {
        renderSubjects();
        renderCard();
    }

    /* ============================================================
       CARD ACTIONS
       ============================================================ */
    function toggleFlip() {
        state.answerVisible = !state.answerVisible;
        renderCard();
    }

    function nextCard() {
        var sub = currentSubject();
        if (!sub || !sub.cards.length) return;
        var idx = sub.cards.findIndex(function (c) { return c.id === state.currentCardId });
        if (idx < sub.cards.length - 1) {
            state.currentCardId = sub.cards[idx + 1].id;
            state.answerVisible = false;
            persist();
            renderCard();
        } else {
            toast('End of deck');
        }
    }

    function prevCard() {
        var sub = currentSubject();
        if (!sub || !sub.cards.length) return;
        var idx = sub.cards.findIndex(function (c) { return c.id === state.currentCardId });
        if (idx > 0) {
            state.currentCardId = sub.cards[idx - 1].id;
            state.answerVisible = false;
            persist();
            renderCard();
        }
    }

    function newCard() {
        var sub = currentSubject();
        if (!sub) return;
        var c = makeDefaultCard();
        c.q = '';
        c.a = '';
        sub.cards.push(c);
        state.currentCardId = c.id;
        state.answerVisible = false;
        persist();
        renderCard();
        openEditModal(c.id);
    }

    function deleteCard() {
        var sub = currentSubject();
        if (!sub || sub.cards.length <= 1) { toast('At least one card must remain'); return }
        var card = currentCard();
        if (!card) return;
        if (!confirm('Delete this card? This cannot be undone.')) return;
        var idx = sub.cards.findIndex(function (c) { return c.id === card.id });
        sub.cards.splice(idx, 1);
        state.currentCardId = sub.cards[Math.max(0, idx - 1)].id;
        state.answerVisible = false;
        persist();
        renderCard();
        toast('Card deleted');
    }

    function markGot() {
        var card = currentCard();
        if (!card) return;
        card.got = (card.got || 0) + 1;
        persist();
        toast('Marked: got it');
        nextCard();
    }

    function markMissed() {
        var card = currentCard();
        if (!card) return;
        card.missed = (card.missed || 0) + 1;
        persist();
        toast('Marked: missed');
        nextCard();
    }

    function toggleHighlight() {
        var card = currentCard();
        if (!card) return;
        card.highlighted = !card.highlighted;
        persist();
        renderCard();
    }

    function resetCurrentCardStats() {
        var card = currentCard();
        if (!card) return;
        card.got = 0;
        card.missed = 0;
        persist();
        renderCard();
        toast('Card stats reset');
    }

    /* ============================================================
       EDIT MODAL
       ============================================================ */
    function openEditModal(cardId) {
        var card = findCard(state.currentSubjectId, cardId);
        if (!card) { toast('Card not found'); return }
        state.editingCardId = cardId;
        $('editModalTitle').textContent = card.q ? 'Edit Card' : 'New Card';
        $('editQuestion').value = card.q || '';
        $('editAnswer').value = card.a || '';
        $('editModal').classList.remove('hidden');
        setTimeout(function () { $('editQuestion').focus() }, 60);
    }

    function closeEditModal() {
        $('editModal').classList.add('hidden');
        state.editingCardId = null;
    }

    function saveEdit() {
        var card = state.editingCardId ? findCard(state.currentSubjectId, state.editingCardId) : null;
        if (!card) { closeEditModal(); return }
        var q = $('editQuestion').value.trim();
        var a = $('editAnswer').value.trim();
        if (!q || !a) { toast('Both question and answer are required'); return }
        card.q = q;
        card.a = a;
        persist();
        closeEditModal();
        renderCard();
        toast('Card saved');
    }

    /* ============================================================
       SUBJECT ACTIONS
       ============================================================ */
    function addSubject() {
        var name = prompt('New subject name:');
        if (name === null) return;
        name = name.trim();
        if (!name) return;
        if (state.subjects.some(function (s) { return s.name.toLowerCase() === name.toLowerCase() })) {
            toast('A subject with that name already exists');
            return;
        }
        var s = makeDefaultSubject(name, true);
        state.subjects.push(s);
        state.currentSubjectId = s.id;
        state.currentCardId = s.cards[0].id;
        state.answerVisible = false;
        persist();
        renderAll();
        toast('Subject created');
    }

    function deleteSubject() {
        if (state.subjects.length <= 1) { toast('At least one subject must remain'); return }
        var s = currentSubject();
        if (!s) return;
        if (!confirm('Delete subject "' + s.name + '" and all its cards?')) return;
        var idx = state.subjects.findIndex(function (x) { return x.id === s.id });
        state.subjects.splice(idx, 1);
        var next = state.subjects[Math.max(0, idx - 1)];
        state.currentSubjectId = next.id;
        state.currentCardId = next.cards[0].id;
        state.answerVisible = false;
        persist();
        renderAll();
        toast('Subject deleted');
    }

    /* ============================================================
       EXPORT / IMPORT
       ============================================================ */
    function exportAll() {
        var payload = {
            app: 'study-cards',
            version: 1,
            exportedAt: new Date().toISOString(),
            subjects: state.subjects
        };
        download('study-cards.json', JSON.stringify(payload, null, 2), 'application/json');
        toast('Exported');
    }

    function importAll() {
        $('importFile').click();
    }

    function handleImportFile(e) {
        var file = e.target.files && e.target.files[0];
        if (!file) return;
        var reader = new FileReader();
        reader.onload = function () {
            try {
                var parsed = JSON.parse(String(reader.result));
                var incoming = Array.isArray(parsed) ? parsed : (parsed && parsed.subjects);
                if (!Array.isArray(incoming)) throw new Error('bad format');

                var added = 0;
                incoming.forEach(function (raw) {
                    if (!raw || typeof raw.name !== 'string') return;
                    if (!Array.isArray(raw.cards)) return;
                    if (state.subjects.some(function (s) { return s.name.toLowerCase() === raw.name.toLowerCase() })) return;
                    var s = {
                        id: uid(),
                        name: raw.name,
                        cards: raw.cards.map(function (c) {
                            return {
                                id: uid(),
                                q: String(c.q || ''),
                                a: String(c.a || ''),
                                got: Math.max(0, parseInt(c.got, 10) || 0),
                                missed: Math.max(0, parseInt(c.missed, 10) || 0),
                                highlighted: !!c.highlighted,
                                createdAt: c.createdAt || Date.now()
                            };
                        }),
                        createdAt: Date.now()
                    };
                    if (s.cards.length === 0) s.cards.push(makeDefaultCard());
                    state.subjects.push(s);
                    added++;
                });

                if (added === 0) {
                    toast('No new subjects imported');
                } else {
                    state.currentSubjectId = state.subjects[state.subjects.length - 1].id;
                    state.currentCardId = state.subjects[state.subjects.length - 1].cards[0].id;
                    state.answerVisible = false;
                    persist();
                    renderAll();
                    toast(added + ' subject' + (added === 1 ? '' : 's') + ' imported');
                }
            } catch (err) {
                toast('Could not read that file');
            }
            e.target.value = '';
        };
        reader.readAsText(file);
    }

    /* ============================================================
       MODAL MANAGEMENT
       ============================================================ */
    function openHelp() { $('helpModal').classList.remove('hidden') }
    function closeModal(node) { node.classList.add('hidden') }

    /* ============================================================
       EVENTS
       ============================================================ */
    function bindEvents() {
        $('addSubjectBtn').addEventListener('click', addSubject);
        $('deleteSubjectBtn').addEventListener('click', deleteSubject);

        $('prevCardBtn').addEventListener('click', prevCard);
        $('nextCardBtn').addEventListener('click', nextCard);
        $('newCardBtn').addEventListener('click', newCard);
        $('editCardBtn').addEventListener('click', function () {
            if (state.currentCardId) openEditModal(state.currentCardId);
        });
        $('deleteCardBtn').addEventListener('click', deleteCard);

        $('flipBtn').addEventListener('click', toggleFlip);
        $('highlightBtn').addEventListener('click', toggleHighlight);
        $('gotItBtn').addEventListener('click', markGot);
        $('missedBtn').addEventListener('click', markMissed);
        $('resetStatsBtn').addEventListener('click', resetCurrentCardStats);

        $('exportBtn').addEventListener('click', exportAll);
        $('importBtn').addEventListener('click', importAll);
        $('importFile').addEventListener('change', handleImportFile);
        $('helpBtn').addEventListener('click', openHelp);

        $('saveEditBtn').addEventListener('click', saveEdit);
        document.querySelectorAll('[data-close]').forEach(function (n) {
            n.addEventListener('click', function () {
                var root = n.closest('.modal-root');
                if (root) closeModal(root);
            });
        });

        $('editAnswer').addEventListener('keydown', function (e) {
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); saveEdit(); }
        });

        document.addEventListener('keydown', function (e) {
            var tag = (e.target.tagName || '').toLowerCase();
            var typing = tag === 'input' || tag === 'textarea' || tag === 'select' || e.target.isContentEditable;

            if (e.key === 'Escape') {
                if (!$('editModal').classList.contains('hidden')) { closeEditModal(); return }
                if (!$('helpModal').classList.contains('hidden')) { closeModal($('helpModal')); return }
            }

            if (typing) return;

            if (e.code === 'Space' || e.key === ' ') { e.preventDefault(); toggleFlip(); return }
            if (e.key === 'ArrowRight') { e.preventDefault(); nextCard(); return }
            if (e.key === 'ArrowLeft') { e.preventDefault(); prevCard(); return }
            if (e.key === 'n' || e.key === 'N') { e.preventDefault(); newCard(); return }
            if (e.key === 'e' || e.key === 'E') { e.preventDefault(); if (state.currentCardId) openEditModal(state.currentCardId); return }
            if (e.key === 'd' || e.key === 'D') { e.preventDefault(); deleteCard(); return }
            if (e.key === 'g' || e.key === 'G') { e.preventDefault(); markGot(); return }
            if (e.key === 'm' || e.key === 'M') { e.preventDefault(); markMissed(); return }
            if (e.key === '?') { e.preventDefault(); openHelp(); return }
        });

        window.addEventListener('beforeunload', persist);
    }

    /* ============================================================
       INIT
       ============================================================ */
    function init() {
        initData();
        bindEvents();
        renderAll();
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();

})();
