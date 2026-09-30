/* ============================================================
   Code Playground — Multi-Language Edition (uses key.js)
   Requires: window.KeyHints (loaded from key.js)
   ============================================================ */

(function () {
    'use strict';

    /* ------------------------------------------------------------
       Dependency check
       ------------------------------------------------------------ */
    (function () {
        var missing = [];
        if (typeof CodeMirror === 'undefined') missing.push('CodeMirror');
        if (typeof LZString === 'undefined') missing.push('LZString');
        if (typeof JSZip === 'undefined') missing.push('JSZip');
        if (typeof saveAs === 'undefined') missing.push('FileSaver');

        if (missing.length > 0) {
            document.body.innerHTML =
                '<div style="position:fixed;inset:0;display:flex;align-items:center;justify-content:center;background:#0d1117;color:#c9d1d9;font-family:Inter,sans-serif;padding:24px;text-align:center;z-index:9999"><div style="max-width:520px"><h1 style="font-size:20px;font-weight:700;margin-bottom:10px">Code Playground could not start</h1><p style="font-size:13px;color:#8b949e;line-height:1.6;margin-bottom:14px">One or more required libraries failed to load.</p><div style="font-family:ui-monospace,monospace;font-size:12px;background:#161b22;border:1px solid #30363d;border-radius:10px;padding:12px;text-align:left;color:#f0883e">Missing: ' + missing.join(', ') + '</div><button onclick="location.reload()" style="margin-top:16px;background:#1f6feb;color:#fff;border:none;padding:10px 18px;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer">Reload</button></div></div>';
            throw new Error('Missing dependencies: ' + missing.join(', '));
        }

        // key.js is optional — warn but don't crash. Autocomplete will be disabled.
        if (typeof window.KeyHints === 'undefined') {
            console.warn('[Code Playground] key.js is missing — autocomplete will be disabled.');
        }
    })();

    /* ============================================================
       LANGUAGE DEFINITIONS (for the toolbar / runner dispatch)
       ============================================================ */
    const LANGUAGES = {
        html: { name: 'HTML', icon: 'fa-brands fa-html5', color: '#e34c26', mode: 'htmlmixed', ext: '.html', runner: 'web' },
        css: { name: 'CSS', icon: 'fa-brands fa-css3-alt', color: '#2965f1', mode: 'css', ext: '.css', runner: 'web' },
        javascript: { name: 'JavaScript', icon: 'fa-brands fa-js', color: '#f7df1e', mode: 'javascript', ext: '.js', runner: 'web' },
        typescript: { name: 'TypeScript', icon: 'fa-solid fa-code', color: '#3178c6', mode: 'javascript', ext: '.ts', runner: 'ts' },
        python: { name: 'Python', icon: 'fa-brands fa-python', color: '#3776ab', mode: 'python', ext: '.py', runner: 'pyodide' },
        c: { name: 'C', icon: 'fa-solid fa-c', color: '#a8b9cc', mode: 'text/x-csrc', ext: '.c', runner: 'wandbox', wandbox: 'gcc-head' },
        cpp: { name: 'C++', icon: 'fa-solid fa-code', color: '#00599c', mode: 'text/x-c++src', ext: '.cpp', runner: 'wandbox', wandbox: 'gcc-head' },
        rust: { name: 'Rust', icon: 'fa-brands fa-rust', color: '#dea584', mode: 'rust', ext: '.rs', runner: 'wandbox', wandbox: 'rustc-head' },
        go: { name: 'Go', icon: 'fa-solid fa-g', color: '#00add8', mode: 'go', ext: '.go', runner: 'go' },
        assembly: { name: 'Assembly', icon: 'fa-solid fa-microchip', color: '#6e4c13', mode: 'gas', ext: '.s', runner: 'wandbox', wandbox: 'nasm-head' },
        lua: { name: 'Lua', icon: 'fa-solid fa-moon', color: '#000080', mode: 'lua', ext: '.lua', runner: 'fengari' },
        sql: { name: 'SQL', icon: 'fa-solid fa-database', color: '#00758f', mode: 'sql', ext: '.sql', runner: 'sqljs' }
    };

    /* ============================================================
       DEFAULT PROJECT TEMPLATES
       ============================================================ */
    const DEFAULT_PROJECTS = {
        html: {
            name: 'HTML Hello World', language: 'html', activeFile: 'index.html',
            files: {
                'index.html': {
                    name: 'index.html', content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Hello World</title>
</head>
<body style="font-family:system-ui;padding:24px">
  <h1>Hello, World!</h1>
  <p>Edit the code on the left and click Run.</p>
</body>
</html>` }
            }
        },
        python: {
            name: 'Python', language: 'python', activeFile: 'main.py',
            files: {
                'main.py': {
                    name: 'main.py', content: `import math
import random

print("Hello from Python!")

for i in range(1, 6):
    print(f"  {i} squared = {i ** 2}")

print("sqrt(2) =", math.sqrt(2))
print("Random number:", random.randint(1, 100))

nums = [x * 2 for x in range(5)]
print("Doubled:", nums)
` }
            }
        },
        c: {
            name: 'C', language: 'c', activeFile: 'main.c',
            files: {
                'main.c': {
                    name: 'main.c', content: `#include <stdio.h>
#include <stdlib.h>
#include <math.h>

int main(void) {
    printf("Hello from C!\\n");

    for (int i = 1; i <= 5; i++) {
        printf("  %d squared = %d\\n", i, i * i);
    }

    printf("sqrt(2) = %.6f\\n", sqrt(2.0));
    return 0;
}
` }
            }
        },
        cpp: {
            name: 'C++', language: 'cpp', activeFile: 'main.cpp',
            files: {
                'main.cpp': {
                    name: 'main.cpp', content: `#include <iostream>
#include <vector>
#include <cmath>
#include <string>

int main() {
    std::cout << "Hello from C++!" << std::endl;

    for (int i = 1; i <= 5; ++i) {
        std::cout << "  " << i << " squared = " << i * i << std::endl;
    }

    std::vector<std::string> languages = {"C", "C++", "Rust", "Go"};
    std::cout << "Languages: ";
    for (const auto& lang : languages) std::cout << lang << " ";
    std::cout << std::endl;

    std::cout << "sqrt(2) = " << std::sqrt(2.0) << std::endl;
    return 0;
}
` }
            }
        },
        rust: {
            name: 'Rust', language: 'rust', activeFile: 'main.rs',
            files: {
                'main.rs': {
                    name: 'main.rs', content: `fn main() {
    println!("Hello from Rust!");

    for i in 1..=5 {
        println!("  {} squared = {}", i, i * i);
    }

    let langs = vec!["C", "C++", "Rust", "Go"];
    println!("Systems languages: {}", langs.join(", "));
}
` }
            }
        },
        go: {
            name: 'Go', language: 'go', activeFile: 'main.go',
            files: {
                'main.go': {
                    name: 'main.go', content: `package main

import (
    "fmt"
    "math"
)

func main() {
    fmt.Println("Hello from Go!")

    for i := 1; i <= 5; i++ {
        fmt.Printf("  %d squared = %d\\n", i, i*i)
    }

    fmt.Printf("sqrt(2) = %.6f\\n", math.Sqrt(2))
}
` }
            }
        },
        assembly: {
            name: 'Assembly', language: 'assembly', activeFile: 'main.s',
            files: {
                'main.s': {
                    name: 'main.s', content: `; x86-64 Assembly (NASM syntax)

section .data
    msg db 'Hello from Assembly!', 10
    len equ $ - msg

section .text
    global _start

_start:
    ; write(1, msg, len)
    mov rax, 1
    mov rdi, 1
    mov rsi, msg
    mov rdx, len
    syscall

    ; exit(0)
    mov rax, 60
    xor rdi, rdi
    syscall
` }
            }
        },
        lua: {
            name: 'Lua', language: 'lua', activeFile: 'main.lua',
            files: {
                'main.lua': {
                    name: 'main.lua', content: `print("Hello from Lua!")

for i = 1, 5 do
    print("  " .. i .. " squared = " .. (i * i))
end

local t = {}
for i = 1, 5 do
    t[i] = i * 2
end
print("Doubled: " .. table.concat(t, ", "))
` }
            }
        },
        sql: {
            name: 'SQL', language: 'sql', activeFile: 'query.sql',
            files: {
                'query.sql': {
                    name: 'query.sql', content: `-- SQLite syntax
CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT, age INTEGER);

INSERT INTO users (name, age) VALUES ('Alice', 30);
INSERT INTO users (name, age) VALUES ('Bob', 25);
INSERT INTO users (name, age) VALUES ('Carol', 35);

SELECT * FROM users ORDER BY age;
` }
            }
        }
    };

    /* ============================================================
       REMOTE RUNNERS
       ============================================================ */
    const Wandbox = {
        async run(compiler, code, stdin) {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 30000);
            try {
                const res = await fetch('https://wandbox.org/api/compile.json', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ compiler, code, stdin: stdin || '', options: '', save: false }),
                    signal: controller.signal
                });
                if (!res.ok) throw new Error(`Wandbox HTTP ${res.status}`);
                const data = await res.json();
                return {
                    ok: !data.compiler_error && data.status === '0',
                    stdout: data.program_output || '',
                    stderr: data.program_error || data.compiler_error || '',
                    exitCode: data.status
                };
            } finally {
                clearTimeout(timeout);
            }
        }
    };

    const GoPlay = {
        async run(code) {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 30000);
            try {
                const res = await fetch('https://play.golang.org/compile', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: 'version=2&body=' + encodeURIComponent(code),
                    signal: controller.signal
                });
                if (!res.ok) throw new Error(`Go HTTP ${res.status}`);
                const data = await res.json();
                const ev = data.Events || [];
                const stdout = ev.filter(e => e.Kind === 'stdout').map(e => e.Message).join('');
                const stderr = ev.filter(e => e.Kind === 'stderr').map(e => e.Message).join('');
                return { ok: !data.Errors, stdout, stderr: stderr + (data.Errors || ''), exitCode: data.Errors ? 1 : 0 };
            } finally {
                clearTimeout(timeout);
            }
        }
    };

    let sqlReady = null;
    function loadSqlRuntime() {
        if (sqlReady) return sqlReady;
        sqlReady = new Promise((resolve, reject) => {
            const s = document.createElement('script');
            s.src = 'https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/sql-wasm.js';
            s.onload = async () => {
                try {
                    const SQL = await window.initSqlJs({
                        locateFile: f => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/${f}`
                    });
                    resolve(SQL);
                } catch (e) { reject(e); }
            };
            s.onerror = () => reject(new Error('sql.js failed to load'));
            document.head.appendChild(s);
        });
        return sqlReady;
    }

    /* ============================================================
       MAIN APPLICATION
       ============================================================ */
    class HtmlCompiler {
        constructor() {
            this.projects = this._loadProjects();
            this.currentProjectId = localStorage.getItem('htmlc_current_project') || this.projects[0]?.id;
            this.project = this._getCurrentProject() || structuredClone(DEFAULT_PROJECTS.html);

            this.editor = null;
            this.inspectorActive = false;
            this.sandboxTheme = 'dark';
            this.currentSidebarTab = 'files';
            this.currentToolTab = 'palette';
            this._saveTimer = null;
            this._autoRunTimer = null;
            this._replHistory = [];
            this._replIndex = -1;
            this._fpsRaf = null;
            this._fpsFrames = 0;
            this._fpsLast = performance.now();
            this._cmdCommands = [];
            this._autoSaveEnabled = true;

            this.initEditor();
            this.initResizers();
            this.renderLanguageBar();
            this.renderSidebar();
            this.renderTabs();
            this.updateProjectName();
            this.runCode();
            this.bindGlobalEvents();
            this._startPerfMeter();
            this._initREPL();
            this._initCommandPalette();
            this._initIcons();
            this.generatePalette();
            this.updateKeyframePreview();
        }

        /* ============================================================
           PROJECTS
           ============================================================ */
        _loadProjects() {
            try {
                const raw = localStorage.getItem('htmlc_projects');
                if (raw) { const arr = JSON.parse(raw); if (Array.isArray(arr) && arr.length) return arr; }
            } catch (_) { }
            return [structuredClone(DEFAULT_PROJECTS.html)];
        }
        _saveProjects() {
            if (!this._autoSaveEnabled) return;
            clearTimeout(this._saveTimer);
            this._saveTimer = setTimeout(() => {
                try {
                    this._persistCurrentIntoProjects();
                    localStorage.setItem('htmlc_projects', JSON.stringify(this.projects));
                    localStorage.setItem('htmlc_current_project', this.currentProjectId);
                } catch (_) { this.showToast('Storage full', 'error'); }
            }, 250);
        }
        _persistCurrentIntoProjects() {
            const idx = this.projects.findIndex(p => p.id === this.currentProjectId);
            if (idx >= 0) this.projects[idx] = this.project; else this.projects.push(this.project);
        }
        _getCurrentProject() { return this.projects.find(p => p.id === this.currentProjectId); }
        updateProjectName() {
            const el = document.getElementById('currentProjectName');
            if (el) el.innerText = this.project.name || 'Untitled';
        }
        toggleProjectMenu() {
            const menu = document.getElementById('projectMenu');
            if (!menu) return;
            const wasHidden = menu.classList.contains('hidden');
            this._renderProjectList();
            menu.classList.toggle('hidden');
            if (wasHidden) setTimeout(() => document.addEventListener('click', this._closeProjectMenu, { once: true }), 0);
        }
        _closeProjectMenu = (e) => {
            const menu = document.getElementById('projectMenu');
            const btn = document.getElementById('projectDropdownBtn');
            if (menu && btn && !menu.contains(e.target) && !btn.contains(e.target)) menu.classList.add('hidden');
        }
        _renderProjectList() {
            const el = document.getElementById('projectList');
            if (!el) return;
            el.innerHTML = this.projects.map(p => {
                const lang = LANGUAGES[p.language || 'html'] || LANGUAGES.html;
                return `<button data-project-id="${this._escapeAttr(p.id)}" class="project-item w-full text-left px-3 py-1.5 hover:bg-studio-panel flex items-center justify-between ${p.id === this.currentProjectId ? 'text-blue-400' : 'text-studio-text'}"><span class="truncate"><i class="${lang.icon} mr-2" style="color:${lang.color}"></i>${this._escape(p.name)}</span>${p.id === this.currentProjectId ? '<i class="fa-solid fa-check text-[10px]"></i>' : ''}</button>`;
            }).join('');
            el.querySelectorAll('.project-item').forEach(btn => {
                btn.addEventListener('click', () => this.switchProject(btn.dataset.projectId));
            });
        }
        switchProject(id) {
            this._persistCurrentIntoProjects();
            this.currentProjectId = id;
            this.project = this._getCurrentProject();
            localStorage.setItem('htmlc_current_project', id);
            this.updateProjectName();
            this.openFile(this.project.activeFile || Object.keys(this.project.files)[0]);
            this.renderLanguageBar();
            this.renderTabs();
            this.renderSidebar();
            const menu = document.getElementById('projectMenu');
            if (menu) menu.classList.add('hidden');
            this.runCode();
            this.showToast(`Switched to "${this.project.name}"`, 'info');
        }
        newProject() {
            const name = prompt('New project name:', 'My Project');
            if (!name) return;
            const newProj = {
                id: 'proj_' + Date.now(), name, language: 'html', activeFile: 'index.html',
                files: { 'index.html': { name: 'index.html', content: `<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <title>${this._escape(name)}</title>\n</head>\n<body>\n  <h1>Hello, World!</h1>\n</body>\n</html>` } }
            };
            this._persistCurrentIntoProjects();
            this.projects.push(newProj);
            localStorage.setItem('htmlc_projects', JSON.stringify(this.projects));
            this.switchProject(newProj.id);
        }
        renameProject() {
            const name = prompt('Rename project:', this.project.name);
            if (!name) return;
            this.project.name = name;
            this.updateProjectName();
            this._saveProjects();
            this._renderProjectList();
            this.showToast('Renamed', 'success');
        }
        deleteProject() {
            if (this.projects.length <= 1) { this.showToast('Cannot delete your only project', 'error'); return; }
            if (!confirm(`Delete "${this.project.name}"?`)) return;
            this.projects = this.projects.filter(p => p.id !== this.currentProjectId);
            localStorage.setItem('htmlc_projects', JSON.stringify(this.projects));
            this.switchProject(this.projects[0].id);
            this.showToast('Project deleted', 'info');
        }

        /* ============================================================
           EDITOR
           ============================================================ */
        initEditor() {
            const textarea = document.getElementById('cmTextarea');
            const hasCloseTagAddon = typeof CodeMirror.commands.closeTag === 'function';
            const hasHints = typeof window.KeyHints !== 'undefined';

            this.editor = CodeMirror.fromTextArea(textarea, {
                lineNumbers: true,
                mode: 'htmlmixed',
                theme: 'dracula',
                matchBrackets: true,
                autoCloseBrackets: true,
                autoCloseTags: hasCloseTagAddon,
                tabSize: 2,
                lineWrapping: false,
                styleActiveLine: true,
                foldGutter: true,
                gutters: ['CodeMirror-linenumbers', 'CodeMirror-foldgutter'],
                extraKeys: {
                    "Ctrl-Space": (cm) => { if (hasHints) cm.showHint({ completeSingle: false }); },
                    "Cmd-Space": (cm) => { if (hasHints) cm.showHint({ completeSingle: false }); },
                    "Tab": (cm) => {
                        if (cm.state.completionActive && cm.state.completionActive.widget) {
                            cm.state.completionActive.widget.pick();
                        } else {
                            cm.execCommand("defaultTab");
                        }
                    },
                    "Enter": (cm) => {
                        if (cm.state.completionActive && cm.state.completionActive.widget) {
                            cm.state.completionActive.widget.pick();
                        } else {
                            cm.execCommand("newlineAndIndent");
                        }
                    },
                    "Ctrl-Enter": () => { this.runCode(); },
                    "Cmd-Enter": () => { this.runCode(); },
                    "Ctrl-S": () => { this.runCode(); this.showToast('Ran', 'success'); },
                    "Cmd-S": () => { this.runCode(); }
                }
            });

            // Dynamic, mode-aware hint provider from key.js (optional)
            if (hasHints) {
                this.editor.setOption('hintOptions', {
                    hint: (cm) => {
                        if (!window.KeyHints) return null;
                        const mode = cm.getOption('mode');
                        const provider = window.KeyHints.providerFor(mode);
                        if (!provider) return null;
                        return provider(cm);
                    },
                    completeSingle: false,
                    closeOnUnfocus: true,
                    alignWithWord: true,
                    className: 'cm-tag-hints'
                });
            }

            // Auto-close tag fallback (only if closetag addon missing)
            if (!hasCloseTagAddon) {
                this.editor.on('beforeChange', (cm, change) => {
                    if (change.origin !== '+input') return;
                    if (change.text.length !== 1 || change.text[0] !== '>') return;
                    if (change.removed && change.removed.length > 0) return;

                    const mode = cm.getOption('mode');
                    if (typeof mode === 'string' && mode !== 'htmlmixed' && mode !== 'xml' && mode !== 'vue') return;

                    const cur = cm.getCursor();
                    const line = cm.getLine(cur.line);
                    const before = line.slice(0, cur.ch);
                    const lt = before.lastIndexOf('<');
                    if (lt === -1) return;
                    const after = before.slice(lt + 1);
                    if (after.includes('>')) return;
                    if (!/^[a-zA-Z][a-zA-Z0-9-]*/.test(after)) return;

                    const match = after.match(/^([a-zA-Z][a-zA-Z0-9-]*)/);
                    if (!match) return;
                    const tagName = match[1].toLowerCase();
                    if (hasHints && window.KeyHints.VOID_TAGS.has(tagName)) return;

                    setTimeout(() => {
                        const c = cm.getCursor();
                        const l = cm.getLine(c.line);
                        if (l.charAt(c.ch - 1) !== '>') return;
                        if (l.slice(c.ch).startsWith('</')) return;
                        cm.replaceRange(`</${tagName}>`, c);
                        cm.setCursor(c);
                    }, 0);
                });
            }

            // Auto hint trigger on typing — unified path via hintOptions.hint
            if (hasHints) {
                this.editor.on('inputRead', (cm, change) => {
                    if (cm.state.completionActive) return;
                    if (change.origin === 'complete') return;
                    if (change.text && (change.text.length > 1 || (change.text[0] && change.text[0].length > 1))) return;

                    const mode = cm.getOption('mode');
                    if (!window.KeyHints || !window.KeyHints.providerFor(mode)) return;

                    const text = change.text[0] || '';
                    const last = text[text.length - 1];

                    // HTML: trigger on "<" or letters
                    if (mode === 'htmlmixed' || mode === 'xml' || mode === 'vue') {
                        if (last === '<' || /[a-zA-Z-]/.test(last)) {
                            cm.showHint({ completeSingle: false });
                        }
                        return;
                    }

                    // Everywhere else: trigger if character can start a word
                    if (!window.KeyHints.shouldTrigger(mode, last)) return;

                    // Only trigger when there's a partial word (>= 2 chars)
                    const cur = cm.getCursor();
                    const line = cm.getLine(cur.line);
                    const before = line.slice(0, cur.ch);
                    const m = before.match(/[A-Za-z_$][\w$.:\-!#@]*$/);
                    if (m && m[0].length >= 2) {
                        cm.showHint({ completeSingle: false });
                    }
                });
            }

            this.openFile(this.project.activeFile || Object.keys(this.project.files)[0]);

            this.editor.on('change', () => {
                const file = this.project.files[this.project.activeFile];
                if (file) file.content = this.editor.getValue();
                this._saveProjects();
                const autoRun = document.getElementById('autoRunToggle');
                if (autoRun && autoRun.checked && this._isWebProject()) {
                    clearTimeout(this._autoRunTimer);
                    this._autoRunTimer = setTimeout(() => this.runCode(), 600);
                }
            });
        }

        _isWebProject() {
            const lang = this.project.language || 'html';
            return lang === 'html' || lang === 'css' || lang === 'javascript' || lang === 'typescript';
        }

        openFile(filename) {
            if (!this.project.files[filename]) return;
            this.project.activeFile = filename;
            const file = this.project.files[filename];
            this.editor.setOption('mode', this._modeForFile(filename));
            this.editor.setValue(file.content || '');
            this.renderTabs();
            this.renderSidebar();
            this._saveProjects();
        }

        _modeForFile(name) {
            const ext = name.slice(name.lastIndexOf('.'));
            for (const key in LANGUAGES) {
                if (LANGUAGES[key].ext === ext) return LANGUAGES[key].mode;
            }
            if (name.endsWith('.vue')) return 'vue';
            if (name.endsWith('.jsx')) return 'jsx';
            if (name.endsWith('.md')) return 'markdown';
            if (name.endsWith('.ts')) return 'javascript';
            return 'javascript';
        }

        createFile() {
            const name = prompt('New file name (e.g. utils.js, main.py):');
            if (!name) return;
            if (this.project.files[name]) { this.showToast('File already exists', 'error'); return; }
            this.project.files[name] = { name, content: '' };
            this._saveProjects();
            this.openFile(name);
            this.showToast(`Created ${name}`, 'success');
        }
        deleteFile(filename, event) {
            event?.stopPropagation();
            if (Object.keys(this.project.files).length <= 1) { this.showToast('Cannot delete the only file', 'error'); return; }
            if (!confirm(`Delete ${filename}?`)) return;
            delete this.project.files[filename];
            if (this.project.activeFile === filename) this.project.activeFile = Object.keys(this.project.files)[0];
            this._saveProjects();
            this.openFile(this.project.activeFile);
            this.showToast(`Deleted ${filename}`, 'info');
        }
        renameFile(filename, event) {
            event?.stopPropagation();
            const newName = prompt(`Rename "${filename}" to:`, filename);
            if (!newName || newName === filename) return;
            const safe = newName.replace(/[\/\\\0]/g, '_').trim();
            if (!safe) { this.showToast('Invalid name', 'error'); return; }
            if (this.project.files[safe]) { this.showToast('Name already in use', 'error'); return; }
            const file = this.project.files[filename];
            file.name = safe;
            this.project.files[safe] = file;
            delete this.project.files[filename];
            if (this.project.activeFile === filename) this.project.activeFile = safe;
            this._saveProjects();
            this.renderTabs();
            this.renderSidebar();
            this.showToast(`Renamed to ${safe}`, 'success');
        }
        renderTabs() {
            const header = document.getElementById('tabsHeader');
            header.innerHTML = '';
            Object.keys(this.project.files).forEach(filename => {
                const isActive = filename === this.project.activeFile;
                const tab = document.createElement('div');
                tab.className = `h-full px-3 text-xs flex items-center space-x-2 border-r border-studio-border cursor-pointer transition shrink-0 ${isActive ? 'bg-studio-bg text-white border-t-2 border-t-blue-500 font-medium' : 'text-studio-muted hover:bg-studio-panel'}`;
                const label = document.createElement('span');
                label.textContent = filename;
                label.title = 'Double-click to rename';
                label.addEventListener('dblclick', (e) => this.renameFile(filename, e));
                const close = document.createElement('i');
                close.className = 'fa-solid fa-xmark text-[10px] hover:text-red-400 p-0.5 rounded';
                close.addEventListener('click', (e) => this.deleteFile(filename, e));
                tab.appendChild(label);
                tab.appendChild(close);
                tab.addEventListener('click', () => this.openFile(filename));
                header.appendChild(tab);
            });
        }

        /* ============================================================
           LANGUAGE BAR
           ============================================================ */
        renderLanguageBar() {
            const bar = document.getElementById('languageBar');
            if (!bar) return;
            bar.innerHTML = '';
            const current = this.project.language || 'html';
            Object.entries(LANGUAGES).forEach(([key, lang]) => {
                const chip = document.createElement('button');
                chip.className = 'lang-chip' + (key === current ? ' active' : '');
                chip.title = `Switch to ${lang.name}`;
                chip.innerHTML = `<i class="${lang.icon}" style="color:${key === current ? '#fff' : lang.color}"></i> ${lang.name}`;
                chip.addEventListener('click', () => this.switchLanguage(key));
                bar.appendChild(chip);
            });
        }

        switchLanguage(langKey) {
            const lang = LANGUAGES[langKey];
            if (!lang) return;
            const existingFile = Object.keys(this.project.files).find(f => f.endsWith(lang.ext));
            if (existingFile) {
                this.project.language = langKey;
                this.project.activeFile = existingFile;
                this._saveProjects();
                this.openFile(existingFile);
                this.renderLanguageBar();
                this.runCode();
                return;
            }
            const starterKey = (langKey === 'css' || langKey === 'javascript' || langKey === 'typescript') ? 'html' : langKey;
            const starter = DEFAULT_PROJECTS[starterKey];
            if (starter && confirm(`Switch to ${lang.name}? This will load a starter template.`)) {
                this._persistCurrentIntoProjects();
                const newId = 'proj_' + Date.now();
                this.project = {
                    id: newId,
                    name: `${lang.name} Project`,
                    language: langKey,
                    activeFile: Object.keys(starter.files)[0],
                    files: structuredClone(starter.files)
                };
                this.projects.push(this.project);
                this.currentProjectId = newId;
                localStorage.setItem('htmlc_projects', JSON.stringify(this.projects));
                localStorage.setItem('htmlc_current_project', newId);
                this.updateProjectName();
                this.openFile(this.project.activeFile);
                this.renderLanguageBar();
                this.renderTabs();
                this.renderSidebar();
                this.runCode();
                this.showToast(`Switched to ${lang.name}`, 'success');
            }
        }

        /* ============================================================
           SIDEBAR
           ============================================================ */
        switchSidebarTab(tab) {
            this.currentSidebarTab = tab;
            ['files', 'packages', 'search', 'snippets', 'snapshots'].forEach(t => {
                const btn = document.getElementById(`btnTab${t.charAt(0).toUpperCase() + t.slice(1)}`);
                if (!btn) return;
                btn.classList.toggle('text-blue-400', t === tab);
                btn.classList.toggle('text-studio-muted', t !== tab);
            });
            this.renderSidebar();
        }

        renderSidebar() {
            const c = document.getElementById('sidebarContent');
            if (!c) return;

            if (this.currentSidebarTab === 'files') {
                c.innerHTML = `
                <div class="flex items-center justify-between pb-2 border-b border-studio-border mb-2 text-xs">
                    <span class="font-bold text-studio-muted uppercase tracking-wider">Explorer</span>
                    <button data-action="new-file" class="p-1 text-studio-muted hover:text-white" title="New File"><i class="fa-solid fa-plus"></i></button>
                </div>
                <div class="space-y-0.5" id="fileList"></div>
            `;
                c.querySelector('[data-action="new-file"]').addEventListener('click', () => this.createFile());
                const list = c.querySelector('#fileList');
                Object.keys(this.project.files).forEach(filename => {
                    const row = document.createElement('div');
                    const active = filename === this.project.activeFile;
                    row.className = `group flex items-center justify-between p-1.5 rounded text-xs cursor-pointer ${active ? 'bg-studio-panel text-blue-400 font-semibold' : 'text-studio-text hover:bg-studio-panel/50'}`;
                    const left = document.createElement('div');
                    left.className = 'flex items-center space-x-2 overflow-hidden';
                    const icon = document.createElement('i');
                    icon.className = this._iconForFile(filename);
                    const name = document.createElement('span');
                    name.className = 'truncate';
                    name.textContent = filename;
                    name.title = 'Double-click to rename';
                    name.addEventListener('dblclick', (e) => this.renameFile(filename, e));
                    left.appendChild(icon);
                    left.appendChild(name);
                    const trash = document.createElement('i');
                    trash.className = 'fa-solid fa-trash text-[10px] text-studio-muted hover:text-red-400 p-1 opacity-0 group-hover:opacity-100';
                    trash.addEventListener('click', (e) => this.deleteFile(filename, e));
                    row.appendChild(left);
                    row.appendChild(trash);
                    row.addEventListener('click', () => this.openFile(filename));
                    list.appendChild(row);
                });
            } else if (this.currentSidebarTab === 'packages') {
                c.innerHTML = `
                <div class="pb-2 border-b border-studio-border mb-2 text-xs font-bold text-studio-muted uppercase">Packages</div>
                <div class="space-y-2 text-xs">
                    <div class="text-[10px] text-studio-muted">
                        Import libraries in code:
                        <div class="font-mono text-emerald-400 mt-1 space-y-0.5">
                            <div>Python: <code>import math</code></div>
                            <div>C: <code>#include &lt;stdio.h&gt;</code></div>
                            <div>C++: <code>#include &lt;iostream&gt;</code></div>
                        </div>
                    </div>
                    <div class="pt-2 border-t border-studio-border">
                        <div class="text-[10px] text-studio-muted uppercase mb-1">Web CDN</div>
                        <input id="pkgInput" placeholder="e.g. lodash, gsap" class="w-full bg-studio-panel border border-studio-border rounded p-1.5 text-white focus:outline-none focus:border-blue-500">
                        <button data-action="add-pkg" class="w-full bg-blue-600 hover:bg-blue-500 text-white p-1.5 rounded font-medium mt-1">Add CDN</button>
                    </div>
                    <div class="pt-2 border-t border-studio-border">
                        <div class="text-[10px] text-studio-muted uppercase mb-1">Active Imports</div>
                        <div id="activeCdnList" class="space-y-1"></div>
                    </div>
                </div>
            `;
                c.querySelector('[data-action="add-pkg"]').addEventListener('click', () => this.addCdnPackage());
                this._renderActiveCdn();
            } else if (this.currentSidebarTab === 'search') {
                c.innerHTML = `
                <div class="pb-2 border-b border-studio-border mb-2 text-xs font-bold text-studio-muted uppercase">Search</div>
                <div class="space-y-2 text-xs">
                    <input id="searchInput" placeholder="Find in project..." class="w-full bg-studio-panel border border-studio-border rounded p-1.5 text-white focus:outline-none">
                    <input id="replaceInput" placeholder="Replace with..." class="w-full bg-studio-panel border border-studio-border rounded p-1.5 text-white focus:outline-none">
                    <div class="flex gap-1">
                        <button data-action="search" class="flex-1 bg-studio-panel hover:bg-studio-border text-white p-1.5 rounded border border-studio-border">Find</button>
                        <button data-action="replace-all" class="flex-1 bg-studio-panel hover:bg-studio-border text-white p-1.5 rounded border border-studio-border">Replace All</button>
                    </div>
                    <div id="searchResults" class="space-y-1 pt-2"></div>
                </div>
            `;
                c.querySelector('[data-action="search"]').addEventListener('click', () => this.performSearch());
                c.querySelector('[data-action="replace-all"]').addEventListener('click', () => this.replaceAll());
                c.querySelector('#searchInput').addEventListener('keydown', e => { if (e.key === 'Enter') this.performSearch(); });
            } else if (this.currentSidebarTab === 'snippets') {
                const snippets = [
                    { id: 'fetch', label: 'Async Fetch (JS)', icon: 'fa-cloud' },
                    { id: 'flex', label: 'Flex Center (CSS)', icon: 'fa-align-center' },
                    { id: 'debounce', label: 'Debounce fn', icon: 'fa-clock' },
                    { id: 'pythonList', label: 'Python list comp.', icon: 'fa-brands fa-python' },
                    { id: 'cStdio', label: 'C stdio template', icon: 'fa-solid fa-c' },
                    { id: 'cppVector', label: 'C++ vector loop', icon: 'fa-solid fa-code' },
                    { id: 'rustMain', label: 'Rust main()', icon: 'fa-brands fa-rust' },
                    { id: 'goMain', label: 'Go main()', icon: 'fa-solid fa-g' },
                    { id: 'asmSyscall', label: 'ASM write syscall', icon: 'fa-solid fa-microchip' }
                ];
                c.innerHTML = `
                <div class="pb-2 border-b border-studio-border mb-2 text-xs font-bold text-studio-muted uppercase">Snippets</div>
                <div class="space-y-1 text-xs" id="snippetList"></div>
            `;
                const list = c.querySelector('#snippetList');
                snippets.forEach(s => {
                    const b = document.createElement('button');
                    b.className = 'snippet-trigger w-full text-left p-2 bg-studio-panel hover:bg-studio-border rounded border border-studio-border text-studio-text flex items-center space-x-2 transition';
                    b.innerHTML = `<i class="fa-solid ${s.icon} text-blue-400 w-4"></i><span>${s.label}</span>`;
                    b.addEventListener('click', () => this.insertSnippet(s.id));
                    list.appendChild(b);
                });
            } else if (this.currentSidebarTab === 'snapshots') {
                const snaps = this._getSnapshots();
                c.innerHTML = `
                <div class="flex items-center justify-between pb-2 border-b border-studio-border mb-2 text-xs">
                    <span class="font-bold text-studio-muted uppercase tracking-wider">Snapshots</span>
                    <button data-action="save-snap" class="p-1 text-studio-muted hover:text-white"><i class="fa-solid fa-camera"></i></button>
                </div>
                <div class="space-y-1" id="snapList"></div>
            `;
                c.querySelector('[data-action="save-snap"]').addEventListener('click', () => this.saveSnapshot());
                const list = c.querySelector('#snapList');
                if (!snaps.length) list.innerHTML = '<div class="text-[11px] text-studio-muted italic p-2">No snapshots yet.</div>';
                else snaps.forEach((s, i) => {
                    const row = document.createElement('div');
                    row.className = 'flex items-center justify-between p-1.5 rounded text-xs bg-studio-panel hover:bg-studio-border';
                    row.innerHTML = `<div class="flex flex-col truncate"><span class="text-studio-text truncate">${this._escape(s.label)}</span><span class="text-[10px] text-studio-muted">${new Date(s.ts).toLocaleString()}</span></div>`;
                    const actions = document.createElement('div');
                    actions.className = 'flex gap-1';
                    const restore = document.createElement('button');
                    restore.className = 'p-1 text-blue-400 hover:text-blue-300';
                    restore.innerHTML = '<i class="fa-solid fa-rotate-left"></i>';
                    restore.addEventListener('click', () => this.restoreSnapshot(i));
                    const del = document.createElement('button');
                    del.className = 'p-1 text-red-400 hover:text-red-300';
                    del.innerHTML = '<i class="fa-solid fa-trash"></i>';
                    del.addEventListener('click', () => this.deleteSnapshot(i));
                    actions.appendChild(restore);
                    actions.appendChild(del);
                    row.appendChild(actions);
                    list.appendChild(row);
                });
            }
        }

        _iconForFile(name) {
            if (name.endsWith('.html')) return 'fa-brands fa-html5 text-orange-400';
            if (name.endsWith('.css')) return 'fa-brands fa-css3-alt text-blue-400';
            if (name.endsWith('.js')) return 'fa-brands fa-js text-yellow-400';
            if (name.endsWith('.ts')) return 'fa-solid fa-code text-blue-400';
            if (name.endsWith('.py')) return 'fa-brands fa-python text-yellow-300';
            if (name.endsWith('.c')) return 'fa-solid fa-c text-blue-300';
            if (name.endsWith('.cpp') || name.endsWith('.cc')) return 'fa-solid fa-code text-blue-400';
            if (name.endsWith('.rs')) return 'fa-brands fa-rust text-orange-400';
            if (name.endsWith('.go')) return 'fa-solid fa-g text-cyan-400';
            if (name.endsWith('.s') || name.endsWith('.asm')) return 'fa-solid fa-microchip text-pink-400';
            if (name.endsWith('.lua')) return 'fa-solid fa-moon text-blue-300';
            if (name.endsWith('.sql')) return 'fa-solid fa-database text-teal-400';
            if (name.endsWith('.vue')) return 'fa-brands fa-vuejs text-emerald-400';
            if (name.endsWith('.jsx')) return 'fa-brands fa-react text-cyan-400';
            if (name.endsWith('.md')) return 'fa-brands fa-markdown text-studio-text';
            return 'fa-regular fa-file text-studio-muted';
        }

        /* ============================================================
           SNIPPETS
           ============================================================ */
        insertSnippet(id) {
            const snippets = {
                fetch: `async function loadData(url) {\n  try {\n    const res = await fetch(url);\n    if (!res.ok) throw new Error('HTTP ' + res.status);\n    return await res.json();\n  } catch (err) {\n    console.error('Fetch failed:', err);\n    throw err;\n  }\n}\n`,
                flex: `.flex-center {\n  display: flex;\n  justify-content: center;\n  align-items: center;\n  min-height: 100vh;\n}\n`,
                debounce: `function debounce(fn, delay = 250) {\n  let timer;\n  return (...args) => {\n    clearTimeout(timer);\n    timer = setTimeout(() => fn(...args), delay);\n  };\n}\n`,
                pythonList: `squares = [x ** 2 for x in range(10)]\nprint(squares)\n`,
                cStdio: `#include <stdio.h>\n\nint main(void) {\n    printf("Hello, World!\\n");\n    return 0;\n}\n`,
                cppVector: `#include <iostream>\n#include <vector>\n\nint main() {\n    std::vector<int> v = {1, 2, 3, 4, 5};\n    for (int x : v) std::cout << x << " ";\n    std::cout << std::endl;\n    return 0;\n}\n`,
                rustMain: `fn main() {\n    println!("Hello, Rust!");\n}\n`,
                goMain: `package main\n\nimport "fmt"\n\nfunc main() {\n    fmt.Println("Hello, Go!")\n}\n`,
                asmSyscall: `section .data\n    msg db 'Hello', 10\n    len equ $ - msg\n\nsection .text\n    global _start\n\n_start:\n    mov rax, 1\n    mov rdi, 1\n    mov rsi, msg\n    mov rdx, len\n    syscall\n\n    mov rax, 60\n    xor rdi, rdi\n    syscall\n`
            };
            const code = snippets[id];
            if (!code) return;
            const cursor = this.editor.getCursor();
            this.editor.replaceRange('\n' + code, cursor);
            this.editor.focus();
            this.showToast('Snippet inserted', 'success');
        }

        /* ============================================================
           SEARCH / REPLACE
           ============================================================ */
        performSearch() {
            const query = document.getElementById('searchInput')?.value || '';
            const results = document.getElementById('searchResults');
            if (!results) return;
            if (!query.trim()) { results.innerHTML = ''; return; }
            results.innerHTML = '';
            let total = 0;
            Object.entries(this.project.files).forEach(([filename, file]) => {
                const lines = (file.content || '').split('\n');
                const matches = [];
                lines.forEach((line, i) => {
                    if (line.toLowerCase().includes(query.toLowerCase())) matches.push({ line: i + 1, text: line.trim().slice(0, 80) });
                });
                if (matches.length) {
                    total += matches.length;
                    const block = document.createElement('div');
                    block.className = 'mb-2';
                    block.innerHTML = `<div class="text-[11px] font-bold text-blue-400 mb-1">${this._escape(filename)} (${matches.length})</div>`;
                    matches.forEach(m => {
                        const row = document.createElement('div');
                        row.className = 'text-[11px] p-1.5 hover:bg-studio-panel rounded cursor-pointer flex items-start space-x-2';
                        row.innerHTML = `<span class="text-studio-muted shrink-0">${m.line}:</span><span class="text-studio-text truncate">${this._escape(m.text)}</span>`;
                        row.addEventListener('click', () => this._jumpToMatch(filename, m.line));
                        block.appendChild(row);
                    });
                    results.appendChild(block);
                }
            });
            if (!total) results.innerHTML = `<div class="text-[11px] text-studio-muted italic">No matches.</div>`;
        }
        _jumpToMatch(filename, line) {
            this.openFile(filename);
            setTimeout(() => {
                this.editor.setCursor({ line: line - 1, ch: 0 });
                this.editor.scrollIntoView({ line: line - 1, ch: 0 }, 100);
                this.editor.focus();
            }, 60);
        }
        replaceAll() {
            const find = document.getElementById('searchInput')?.value || '';
            const replace = document.getElementById('replaceInput')?.value ?? '';
            if (!find.trim()) { this.showToast('Nothing to find', 'warn'); return; }
            let count = 0;
            const safeFind = find.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const re = new RegExp(safeFind, 'g');
            Object.values(this.project.files).forEach(f => {
                const before = f.content || '';
                const after = before.replace(re, replace);
                count += (before.match(re) || []).length;
                f.content = after;
            });
            const active = this.project.files[this.project.activeFile];
            if (active) {
                const cur = this.editor.getCursor();
                this.editor.setValue(active.content);
                this.editor.setCursor(cur);
            }
            this._saveProjects();
            this.renderSidebar();
            this.showToast(`Replaced ${count} occurrence(s)`, 'success');
        }

        /* ============================================================
           SNAPSHOTS
           ============================================================ */
        _getSnapshots() {
            try { return JSON.parse(localStorage.getItem('htmlc_snapshots_' + this.currentProjectId) || '[]'); }
            catch (_) { return []; }
        }
        saveSnapshot() {
            const label = prompt('Snapshot label:', 'Snapshot ' + new Date().toLocaleTimeString());
            if (!label) return;
            const snaps = this._getSnapshots();
            snaps.unshift({ label, ts: Date.now(), project: structuredClone(this.project) });
            if (snaps.length > 20) snaps.length = 20;
            localStorage.setItem('htmlc_snapshots_' + this.currentProjectId, JSON.stringify(snaps));
            this.renderSidebar();
            this.showToast('Snapshot saved', 'success');
        }
        restoreSnapshot(i) {
            const snaps = this._getSnapshots();
            if (!snaps[i]) return;
            if (!confirm(`Restore "${snaps[i].label}"? Current changes will be lost.`)) return;
            this.project = structuredClone(snaps[i].project);
            this.project.id = this.currentProjectId;
            this.updateProjectName();
            this.renderLanguageBar();
            this.renderTabs();
            this.openFile(this.project.activeFile || Object.keys(this.project.files)[0]);
            this._saveProjects();
            this.runCode();
            this.showToast('Restored snapshot', 'success');
        }
        deleteSnapshot(i) {
            const snaps = this._getSnapshots();
            snaps.splice(i, 1);
            localStorage.setItem('htmlc_snapshots_' + this.currentProjectId, JSON.stringify(snaps));
            this.renderSidebar();
        }

        /* ============================================================
           CDN
           ============================================================ */
        _getActiveCdn() {
            try { return JSON.parse(localStorage.getItem('htmlc_cdn_' + this.currentProjectId) || '[]'); }
            catch (_) { return []; }
        }
        _saveActiveCdn(list) { localStorage.setItem('htmlc_cdn_' + this.currentProjectId, JSON.stringify(list)); }
        addCdnPackage() {
            const input = document.getElementById('pkgInput');
            const name = input?.value?.trim();
            if (!name) return;
            const url = name.startsWith('http') ? name : `https://cdn.jsdelivr.net/npm/${name}`;
            this.addCdnUrl(url);
            if (input) input.value = '';
        }
        addCdnUrl(url) {
            const list = this._getActiveCdn();
            if (list.includes(url)) { this.showToast('Already added', 'info'); return; }
            list.push(url);
            this._saveActiveCdn(list);
            this._renderActiveCdn();
            if (this._isWebProject()) this.runCode();
            this.showToast('Library added', 'success');
        }
        removeCdnUrl(url) {
            const list = this._getActiveCdn().filter(u => u !== url);
            this._saveActiveCdn(list);
            this._renderActiveCdn();
            if (this._isWebProject()) this.runCode();
        }
        _renderActiveCdn() {
            const el = document.getElementById('activeCdnList');
            if (!el) return;
            const list = this._getActiveCdn();
            if (!list.length) { el.innerHTML = '<div class="text-[10px] text-studio-muted italic">No libraries added.</div>'; return; }
            el.innerHTML = '';
            list.forEach(url => {
                const row = document.createElement('div');
                row.className = 'flex items-center justify-between p-1.5 bg-studio-panel rounded border border-studio-border text-[10px]';
                const span = document.createElement('span');
                span.className = 'truncate font-mono text-studio-text';
                span.title = url;
                span.textContent = url.split('/').pop();
                const btn = document.createElement('button');
                btn.className = 'text-red-400 hover:text-red-300 ml-1';
                btn.innerHTML = '<i class="fa-solid fa-xmark"></i>';
                btn.addEventListener('click', () => this.removeCdnUrl(url));
                row.appendChild(span);
                row.appendChild(btn);
                el.appendChild(row);
            });
        }

        /* ============================================================
           RUN
           ============================================================ */
        async runCode() {
            const lang = this.project.language || 'html';
            const file = this.project.files[this.project.activeFile];
            if (!file) return;
            const code = file.content || '';

            const runBtn = document.getElementById('runBtn');
            const originalHTML = runBtn.innerHTML;
            runBtn.disabled = true;
            runBtn.innerHTML = '<span class="run-spinner"></span><span>Running</span>';

            try {
                this.clearConsole();
                const ldef = LANGUAGES[lang];
                if (!ldef) { this.showToast('Unknown language', 'error'); return; }
                if (ldef.runner === 'web' || ldef.runner === 'ts') await this.runWeb();
                else if (ldef.runner === 'pyodide') await this.runPython(code);
                else if (ldef.runner === 'wandbox') await this.runWandbox(ldef.wandbox, code);
                else if (ldef.runner === 'go') await this.runGo(code);
                else if (ldef.runner === 'fengari') await this.runLua(code);
                else if (ldef.runner === 'sqljs') await this.runSql(code);
            } catch (err) {
                this.addConsoleLog('error', ['Run failed: ' + (err.message || err)]);
            } finally {
                runBtn.disabled = false;
                runBtn.innerHTML = originalHTML;
            }
        }

        async runWeb() {
            const iframe = document.getElementById('sandboxIframe');
            const files = this.project.files;
            let entryName = files['index.html'] ? 'index.html' : Object.keys(files).find(f => f.endsWith('.html'));
            if (!entryName) {
                iframe.srcdoc = '<html><body style="color:#999;font-family:sans-serif;padding:20px">No HTML file. Switch to a project with index.html.</body></html>';
                return;
            }
            let html = files[entryName].content;
            const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            Object.entries(files).forEach(([name, f]) => {
                if (name === entryName) return;
                if (name.endsWith('.css')) {
                    const re = new RegExp(`<link[^>]*href=["']${escapeRe(name)}["'][^>]*>`, 'gi');
                    html = html.replace(re, `<style>\n${f.content}\n</style>`);
                }
                if (name.endsWith('.js')) {
                    const re = new RegExp(`<script[^>]*src=["']${escapeRe(name)}["'][^>]*><\\/script>`, 'gi');
                    const match = html.match(re);
                    const isModule = match && /type=["']module["']/.test(match[0]);
                    const attrs = isModule ? ' type="module"' : '';
                    html = html.replace(re, `<script${attrs}>\n${f.content}\n<\/script>`);
                }
            });
            const cdnList = this._getActiveCdn();
            const cdnTags = cdnList.map(url => url.endsWith('.css') ? `<link rel="stylesheet" href="${url}">` : `<script src="${url}"><\/script>`).join('\n');
            iframe.srcdoc = this._wrapSandbox(html, cdnTags);
            this.addConsoleLog('info', ['▶ Sandbox reloaded']);
        }

        _wrapSandbox(bodyHTML, extraHead = '') {
            const bridge = `
        <script>
        (function() {
            const send = (type, payload) => window.parent.postMessage({ type, ...payload }, '*');
            ['log','info','warn','error','debug'].forEach(m => {
                const orig = console[m];
                console[m] = function(...args) {
                    try {
                        const ser = args.map(a => {
                            try {
                                if (a instanceof Error) return a.stack || a.message;
                                if (typeof a === 'object' && a !== null) {
                                    const cache = new WeakSet();
                                    return JSON.stringify(a, (k, v) => {
                                        if (typeof v === 'object' && v !== null) { if (cache.has(v)) return '[Circular]'; cache.add(v); }
                                        if (typeof v === 'function') return '[Function]';
                                        return v;
                                    });
                                }
                                return String(a);
                            } catch { return String(a); }
                        });
                        send('CONSOLE_LOG', { level: m, args: ser });
                    } catch {}
                    orig.apply(console, args);
                };
            });
            window.addEventListener('error', e => send('CONSOLE_LOG', { level: 'error', args: ['Uncaught: ' + e.message + ' (line ' + e.lineno + ')'] }));
            window.addEventListener('unhandledrejection', e => send('CONSOLE_LOG', { level: 'error', args: ['Unhandled Promise: ' + (e.reason?.message || e.reason)] }));
            const origFetch = window.fetch;
            window.fetch = async function(...args) {
                const start = performance.now();
                try {
                    const res = await origFetch.apply(this, args);
                    send('NETWORK_LOG', { method: 'FETCH', url: String(args[0]), status: res.status, duration: Math.round(performance.now() - start) });
                    return res;
                } catch (err) {
                    send('NETWORK_LOG', { method: 'FETCH', url: String(args[0]), status: 'ERR', duration: 0 });
                    throw err;
                }
            };
            window.addEventListener('message', e => {
                const d = e.data || {};
                if (d.type === 'TOGGLE_INSPECTOR') window.__inspectorActive = !!d.active;
                if (d.type === 'EVAL_REPL') {
                    try {
                        const r = eval(d.code);
                        send('REPL_RESULT', { ok: true, value: typeof r === 'object' ? JSON.stringify(r) : String(r) });
                    } catch (err) { send('REPL_RESULT', { ok: false, value: err.message }); }
                }
            });
            window.__inspectorActive = false;
            let __hl = null;
            const clear = () => { if (__hl) { __hl.style.outline = ''; __hl.style.outlineOffset = ''; __hl = null; } };
            document.addEventListener('mouseover', e => {
                if (!window.__inspectorActive) return;
                clear();
                e.target.style.outline = '2px solid #58a6ff';
                e.target.style.outlineOffset = '2px';
                __hl = e.target;
            }, true);
            document.addEventListener('mouseout', e => {
                if (!window.__inspectorActive) return;
                e.target.style.outline = '';
                e.target.style.outlineOffset = '';
            }, true);
            document.addEventListener('click', e => {
                if (!window.__inspectorActive) return;
                e.preventDefault(); e.stopPropagation();
                const el = e.target;
                send('INSPECTOR_SELECT', {
                    tagName: el.tagName, id: el.id,
                    className: typeof el.className === 'string' ? el.className : '',
                    selector: el.id ? '#'+el.id : el.tagName.toLowerCase(),
                    html: el.outerHTML.slice(0, 200)
                });
            }, true);
        })();
        <\/script>`;
            return `<!DOCTYPE html>\n<html class="${this.sandboxTheme}">\n<head>\n<meta charset="UTF-8">\n${bridge}\n${extraHead}\n</head>\n<body>\n${bodyHTML}\n</body>\n</html>`;
        }

        async runPython(code) {
            const iframe = document.getElementById('sandboxIframe');
            const html = `
            <div id="status" style="font-family:system-ui;padding:20px;color:#58a6ff">
                ⏳ Loading Python runtime (Pyodide)… this can take 10-20s the first time.
            </div>
            <pre id="out" style="font-family:monospace;padding:20px;color:#c9d1d9;white-space:pre-wrap"></pre>
        `;
            const pyCode = `
            (async () => {
                const status = document.getElementById('status');
                const out = document.getElementById('out');
                try {
                    const py = await window.loadPyodide({ indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.25.0/full/' });
                    status.textContent = '✔ Python ready. Running…';
                    py.setStdout({ batched: (s) => { out.textContent += s + '\\n'; } });
                    py.setStderr({ batched: (s) => { out.textContent += s + '\\n'; } });
                    await py.runPythonAsync(${JSON.stringify(code)});
                    status.textContent = '✔ Finished.';
                } catch (err) {
                    status.textContent = '✖ Error';
                    out.textContent += '\\n' + (err && err.message ? err.message : String(err));
                }
            })();
        `;
            const headExtras = `
            <script src="https://cdn.jsdelivr.net/pyodide/v0.25.0/full/pyodide.js"><\/script>
            <script>${pyCode}<\/script>
        `;
            iframe.srcdoc = this._wrapSandbox(html, headExtras);
            this.addConsoleLog('info', ['▶ Loading Python…']);
        }

        async runWandbox(compiler, code) {
            this.addConsoleLog('info', ['▶ Compiling with Wandbox (' + compiler + ')…']);
            const result = await Wandbox.run(compiler, code, '');
            if (result.stdout) result.stdout.split('\n').forEach(l => this.addConsoleLog('log', [l]));
            if (result.stderr) result.stderr.split('\n').forEach(l => this.addConsoleLog('error', [l]));
            if (!result.stdout && !result.stderr) this.addConsoleLog('info', ['(no output)']);
            this.addConsoleLog('info', ['✔ Exit: ' + result.exitCode]);
        }

        async runGo(code) {
            this.addConsoleLog('info', ['▶ Compiling Go…']);
            const result = await GoPlay.run(code);
            if (result.stdout) result.stdout.split('\n').forEach(l => this.addConsoleLog('log', [l]));
            if (result.stderr) result.stderr.split('\n').forEach(l => this.addConsoleLog('error', [l]));
            if (!result.stdout && !result.stderr) this.addConsoleLog('info', ['(no output)']);
        }

        async runLua(code) {
            const iframe = document.getElementById('sandboxIframe');
            const html = `<pre id="out" style="font-family:monospace;padding:20px;color:#c9d1d9;white-space:pre-wrap"></pre>`;
            const headExtras = `
            <script src="https://cdn.jsdelivr.net/npm/fengari-web@0.1.4/dist/fengari-web.js"><\/script>
            <script>
                (function() {
                    const out = document.getElementById('out');
                    const userCode = ${JSON.stringify(code)};
                    setTimeout(() => {
                        try {
                            const originalWrite = console.log;
                            console.log = function() {
                                const s = Array.from(arguments).join(' ');
                                out.textContent += s + '\\n';
                                originalWrite.apply(console, arguments);
                            };
                            const fengari = window.fengari;
                            const lua = fengari.lauxlib.luaL_newstate();
                            fengari.lualib.luaL_openlibs(lua);
                            fengari.lauxlib.luaL_dostring(lua,
                                'print = function(...) local args = {...}; local s = ""; for i,v in ipairs(args) do s = s .. tostring(v) .. "\\\\t" end; io.write(s .. "\\\\n") end'
                            );
                            if (fengari.lauxlib.luaL_dostring(lua, userCode) !== 0) {
                                const err = fengari.lauxlib.lua_tostring(lua, -1);
                                out.textContent += 'Error: ' + err + '\\n';
                            }
                        } catch (err) {
                            out.textContent += 'Fengari error: ' + (err.message || err) + '\\n';
                        }
                    }, 200);
                })();
            <\/script>
        `;
            iframe.srcdoc = this._wrapSandbox(html, headExtras);
            this.addConsoleLog('info', ['▶ Loading Lua…']);
        }

        async runSql(code) {
            this.addConsoleLog('info', ['▶ Loading SQLite (sql.js)…']);
            const SQL = await loadSqlRuntime();
            const db = new SQL.Database();
            try {
                const result = db.exec(code);
                if (!result.length) this.addConsoleLog('log', ['(query ok — no rows returned)']);
                else result.forEach(rs => {
                    const cols = rs.columns.join(' | ');
                    this.addConsoleLog('log', [cols]);
                    this.addConsoleLog('log', ['-'.repeat(cols.length)]);
                    rs.values.forEach(row => this.addConsoleLog('log', [row.map(v => v === null ? 'NULL' : String(v)).join(' | ')]));
                });
                this.addConsoleLog('info', ['✔ Query executed']);
            } catch (err) {
                this.addConsoleLog('error', [err.message || String(err)]);
            } finally {
                db.close();
            }
        }

        /* ============================================================
           REPL
           ============================================================ */
        _initREPL() {
            const input = document.getElementById('consoleReplInput');
            if (!input) return;
            input.addEventListener('keydown', e => {
                if (e.key === 'Enter') {
                    const code = input.value;
                    if (!code) return;
                    this.addConsoleLog('info', ['> ' + code]);
                    this._replHistory.unshift(code);
                    this._replIndex = -1;
                    const iframe = document.getElementById('sandboxIframe');
                    try { iframe.contentWindow.postMessage({ type: 'EVAL_REPL', code }, '*'); }
                    catch (_) { this.addConsoleLog('error', ['REPL not available']); }
                    input.value = '';
                } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    if (this._replIndex < this._replHistory.length - 1) this._replIndex++;
                    input.value = this._replHistory[this._replIndex] || '';
                } else if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    if (this._replIndex > 0) this._replIndex--;
                    else this._replIndex = -1;
                    input.value = this._replIndex >= 0 ? this._replHistory[this._replIndex] : '';
                }
            });
        }

        /* ============================================================
           CONSOLE
           ============================================================ */
        switchConsoleTab(tab) {
            const map = {
                console: { pane: 'paneConsole', btn: 'tabBtnConsole' },
                network: { pane: 'paneNetwork', btn: 'tabBtnNetwork' },
                perf: { pane: 'panePerf', btn: 'tabBtnPerf' },
                tests: { pane: 'paneTests', btn: 'tabBtnTests' }
            };
            if (!map[tab]) return;
            Object.values(map).forEach(({ pane, btn }) => {
                const p = document.getElementById(pane);
                const b = document.getElementById(btn);
                if (p) p.classList.add('hidden');
                if (b) b.className = 'text-studio-muted hover:text-white flex items-center space-x-1.5 pb-1';
            });
            const ap = document.getElementById(map[tab].pane);
            const ab = document.getElementById(map[tab].btn);
            if (ap) ap.classList.remove('hidden');
            if (ab) ab.className = 'text-white font-semibold flex items-center space-x-1.5 border-b-2 border-blue-500 pb-1';
        }
        addConsoleLog(level, args) {
            const stream = document.getElementById('paneConsole');
            if (!stream) return;
            const line = document.createElement('div');
            let color = 'text-studio-text';
            if (level === 'error') color = 'text-red-400 bg-red-950/20';
            if (level === 'warn') color = 'text-amber-400';
            if (level === 'info') color = 'text-blue-400';
            line.className = `console-entry flex items-start space-x-2 font-mono text-xs ${color} py-0.5 px-1 rounded`;
            const time = new Date().toLocaleTimeString();
            const content = args.map(a => this._renderLogArg(a)).join(' ');
            line.innerHTML = `<span class="text-studio-muted text-[10px] shrink-0">[${time}]</span><div class="flex-1 break-all">${content}</div>`;
            stream.appendChild(line);
            stream.scrollTop = stream.scrollHeight;
            const badge = document.getElementById('consoleBadge');
            if (badge) { badge.classList.remove('hidden'); badge.innerText = stream.children.length; }
        }
        _renderLogArg(arg) {
            if (typeof arg !== 'string') return this._escape(String(arg));
            const t = arg.trim();
            if (t.length < 10000 && ((t.startsWith('{') && t.endsWith('}')) || (t.startsWith('[') && t.endsWith(']')))) {
                try { return this._jsonTree(JSON.parse(t), 0); } catch (_) { }
            }
            return this._escape(arg);
        }
        _jsonTree(obj, depth) {
            if (depth > 5) return '<span class="text-studio-muted">…</span>';
            if (obj === null) return '<span class="text-purple-400">null</span>';
            if (obj === undefined) return '<span class="text-purple-400">undefined</span>';
            if (typeof obj === 'number') return `<span class="text-amber-300">${obj}</span>`;
            if (typeof obj === 'boolean') return `<span class="text-purple-400">${obj}</span>`;
            if (typeof obj === 'string') return `<span class="text-emerald-400">"${this._escape(obj)}"</span>`;
            if (Array.isArray(obj)) {
                if (!obj.length) return '<span class="text-studio-muted">[]</span>';
                return `<span class="text-studio-muted">[</span>${obj.slice(0, 20).map(v => this._jsonTree(v, depth + 1)).join(', ')}${obj.length > 20 ? ', …' : ''}<span class="text-studio-muted">]</span>`;
            }
            if (typeof obj === 'object') {
                const entries = Object.entries(obj);
                if (!entries.length) return '<span class="text-studio-muted">{}</span>';
                const inner = entries.slice(0, 30).map(([k, v]) => `<div><span class="text-sky-400">${this._escape(k)}</span><span class="text-studio-muted">:</span> ${this._jsonTree(v, depth + 1)}</div>`).join('');
                return `<details ${depth < 2 ? 'open' : ''}><summary class="text-studio-muted inline-block">{${entries.length}}</summary><div class="console-tree">${inner}</div></details>`;
            }
            return this._escape(String(obj));
        }
        addNetworkLog(data) {
            const body = document.getElementById('networkTableBody');
            if (!body) return;
            const row = document.createElement('tr');
            row.className = 'border-b border-studio-border/50 text-xs hover:bg-studio-panel';
            const statusClass = (data.status >= 200 && data.status < 300) ? 'text-emerald-400' : data.status === 'ERR' ? 'text-red-400' : 'text-amber-400';
            row.innerHTML = `<td class="py-1 px-2 font-bold text-amber-400">${this._escape(String(data.method))}</td><td class="truncate max-w-[180px] text-studio-muted px-2" title="${this._escape(data.url)}">${this._escape(data.url)}</td><td class="${statusClass} px-2">${this._escape(String(data.status))}</td><td class="text-studio-muted px-2">${this._escape(String(data.duration))}ms</td>`;
            body.appendChild(row);
        }
        clearConsole() {
            const pane = document.getElementById('paneConsole');
            const net = document.getElementById('networkTableBody');
            const test = document.getElementById('testOutput');
            if (pane) pane.innerHTML = '';
            if (net) net.innerHTML = '';
            if (test) test.innerHTML = '';
            const badge = document.getElementById('consoleBadge');
            if (badge) { badge.classList.add('hidden'); badge.innerText = '0'; }
        }
        toggleConsoleCollapse() {
            const drawer = document.getElementById('consoleDrawer');
            const icon = document.getElementById('consoleCollapseIcon');
            if (!drawer || !icon) return;
            if (drawer.style.height === '32px') { drawer.style.height = '192px'; icon.className = 'fa-solid fa-chevron-down'; }
            else { drawer.style.height = '32px'; icon.className = 'fa-solid fa-chevron-up'; }
        }

        /* ============================================================
           PERFORMANCE
           ============================================================ */
        _startPerfMeter() {
            const tick = () => {
                this._fpsFrames++;
                const now = performance.now();
                if (now - this._fpsLast >= 1000) {
                    const fps = Math.round((this._fpsFrames * 1000) / (now - this._fpsLast));
                    const el = document.getElementById('fpsGauge');
                    if (el) el.innerText = fps;
                    this._fpsFrames = 0;
                    this._fpsLast = now;
                    try {
                        const doc = document.getElementById('sandboxIframe').contentDocument;
                        if (doc) { const dom = document.getElementById('domGauge'); if (dom) dom.innerText = doc.getElementsByTagName('*').length; }
                    } catch (_) { }
                    const mem = document.getElementById('memGauge');
                    if (mem) mem.innerText = performance.memory ? (performance.memory.usedJSHeapSize / 1048576).toFixed(1) + ' MB' : '—';
                }
                this._fpsRaf = requestAnimationFrame(tick);
            };
            this._fpsRaf = requestAnimationFrame(tick);
        }

        /* ============================================================
           TESTS
           ============================================================ */
        runTests() {
            const out = document.getElementById('testOutput');
            out.innerHTML = '';
            const iframe = document.getElementById('sandboxIframe');
            const tests = [
                { name: 'Sandbox iframe exists', run: () => !!iframe },
                { name: 'Sandbox has DOM', run: () => (iframe.contentDocument?.getElementsByTagName('*').length || 0) > 0 },
                { name: 'No console errors', run: () => !document.getElementById('paneConsole').innerHTML.includes('text-red-400') }
            ];
            let passed = 0;
            tests.forEach(t => {
                let ok = false;
                try { ok = !!t.run(); } catch (_) { ok = false; }
                if (ok) passed++;
                const row = document.createElement('div');
                row.className = `flex items-center space-x-2 text-xs p-1.5 rounded ${ok ? 'bg-emerald-900/20 text-emerald-400' : 'bg-red-900/20 text-red-400'}`;
                row.innerHTML = `<i class="fa-solid ${ok ? 'fa-circle-check' : 'fa-circle-xmark'}"></i><span>${this._escape(t.name)}</span>`;
                out.appendChild(row);
            });
            const summary = document.createElement('div');
            summary.className = 'text-xs text-studio-muted mt-2 pt-2 border-t border-studio-border';
            summary.innerText = `${passed} / ${tests.length} tests passed`;
            out.appendChild(summary);
        }

        /* ============================================================
           INSPECTOR / FRAMES / THEME
           ============================================================ */
        toggleInspector() {
            this.inspectorActive = !this.inspectorActive;
            const btn = document.getElementById('inspectorBtn');
            if (this.inspectorActive) { btn.classList.add('bg-blue-600', 'text-white', 'pulse-active'); this.showToast('Inspector: click elements in preview', 'info'); }
            else btn.classList.remove('bg-blue-600', 'text-white', 'pulse-active');
            try { document.getElementById('sandboxIframe').contentWindow.postMessage({ type: 'TOGGLE_INSPECTOR', active: this.inspectorActive }, '*'); } catch (_) { }
        }
        setDeviceFrame(device) {
            const iframe = document.getElementById('sandboxIframe');
            const res = document.getElementById('previewResolution');
            iframe.className = 'bg-white shadow-2xl transition-all';
            if (device === 'iphone') { iframe.classList.add('device-iphone'); res.innerText = '(390 × 844)'; }
            else if (device === 'pixel') { iframe.classList.add('device-pixel'); res.innerText = '(412 × 915)'; }
            else if (device === 'ipad') { iframe.classList.add('device-ipad'); res.innerText = '(820 × 1080)'; }
            else { iframe.classList.add('w-full', 'h-full', 'rounded'); res.innerText = '(100% Responsive)'; }
        }
        toggleSandboxTheme() {
            this.sandboxTheme = this.sandboxTheme === 'dark' ? 'light' : 'dark';
            document.getElementById('sandboxThemeIcon').className = this.sandboxTheme === 'dark' ? 'fa-solid fa-moon' : 'fa-solid fa-sun text-amber-400';
            if (this._isWebProject()) this.runCode();
        }
        openExternalPreview() {
            const files = this.project.files;
            const entry = files['index.html'] ? 'index.html' : Object.keys(files).find(f => f.endsWith('.html'));
            if (!entry) { this.showToast('No HTML file to preview', 'warn'); return; }
            let html = files[entry].content;
            const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            Object.entries(files).forEach(([name, f]) => {
                if (name === entry) return;
                if (name.endsWith('.css')) html = html.replace(new RegExp(`<link[^>]*href=["']${escapeRe(name)}["'][^>]*>`, 'gi'), `<style>${f.content}</style>`);
                if (name.endsWith('.js')) html = html.replace(new RegExp(`<script[^>]*src=["']${escapeRe(name)}["'][^>]*><\\/script>`, 'gi'), `<script>${f.content}<\/script>`);
            });
            const w = window.open('', '_blank');
            if (!w) { this.showToast('Popup blocked', 'error'); return; }
            w.document.write(html);
            w.document.close();
        }

        /* ============================================================
           COMMAND PALETTE
           ============================================================ */
        _initCommandPalette() {
            this._cmdCommands = [
                { label: 'Run Project', action: () => this.runCode(), icon: 'fa-play' },
                { label: 'Toggle Inspector', action: () => this.toggleInspector(), icon: 'fa-crosshairs' },
                { label: 'Toggle Sandbox Theme', action: () => this.toggleSandboxTheme(), icon: 'fa-moon' },
                { label: 'Open Templates', action: () => this.openModal('templatesModal'), icon: 'fa-cubes' },
                { label: 'Open Tools', action: () => this.openModal('toolsModal'), icon: 'fa-toolbox' },
                { label: 'Share Project', action: () => this.shareProject(), icon: 'fa-share-nodes' },
                { label: 'Save Snapshot', action: () => this.saveSnapshot(), icon: 'fa-camera' },
                { label: 'New File', action: () => this.createFile(), icon: 'fa-file-plus' },
                { label: 'New Project', action: () => this.newProject(), icon: 'fa-folder-plus' },
                { label: 'Export ZIP', action: () => this.exportProject('zip'), icon: 'fa-file-zipper' },
                { label: 'Clear Output', action: () => this.clearConsole(), icon: 'fa-ban' },
                { label: 'Open Settings', action: () => this.toggleDrawer('settingsDrawer'), icon: 'fa-gear' }
            ];
            const input = document.getElementById('cmdInput');
            input.addEventListener('input', e => this._filterCommands(e.target.value));
            input.addEventListener('keydown', e => {
                if (e.key === 'Escape') this.closeModal('commandPaletteModal');
                else if (e.key === 'Enter') this._runCurrentCommand();
            });
        }
        openCommandPalette() {
            this.openModal('commandPaletteModal');
            const input = document.getElementById('cmdInput');
            input.value = ''; input.focus();
            this._filterCommands('');
        }
        _filterCommands(q) {
            const results = document.getElementById('cmdResults');
            const query = q.toLowerCase();
            const fileHits = Object.keys(this.project.files).filter(f => f.toLowerCase().includes(query));
            const cmdHits = this._cmdCommands.filter(c => c.label.toLowerCase().includes(query));
            results.innerHTML = '';
            if (fileHits.length && query) {
                const sec = document.createElement('div');
                sec.innerHTML = '<div class="px-2 py-1 text-[10px] text-studio-muted uppercase">Files</div>';
                fileHits.forEach(f => {
                    const btn = document.createElement('button');
                    btn.className = 'w-full text-left px-3 py-2 rounded text-xs hover:bg-studio-panel flex items-center space-x-2';
                    btn.innerHTML = `<i class="fa-regular fa-file text-blue-400 w-4"></i><span>Open ${this._escape(f)}</span>`;
                    btn.onclick = () => { this.openFile(f); this.closeModal('commandPaletteModal'); };
                    sec.appendChild(btn);
                });
                results.appendChild(sec);
            }
            const cmdSec = document.createElement('div');
            cmdSec.innerHTML = '<div class="px-2 py-1 text-[10px] text-studio-muted uppercase mt-2">Commands</div>';
            cmdHits.forEach(c => {
                const btn = document.createElement('button');
                btn.className = 'cmd-item w-full text-left px-3 py-2 rounded text-xs hover:bg-studio-panel flex items-center space-x-2';
                btn.innerHTML = `<i class="fa-solid ${c.icon} text-emerald-400 w-4"></i><span>${this._escape(c.label)}</span>`;
                btn.onclick = () => { c.action(); this.closeModal('commandPaletteModal'); };
                cmdSec.appendChild(btn);
            });
            results.appendChild(cmdSec);
        }
        _runCurrentCommand() {
            const first = document.querySelector('#cmdResults button');
            if (first) first.click();
        }

        /* ============================================================
           SETTINGS
           ============================================================ */
        changeEditorTheme(theme) { this.editor.setOption('theme', theme); }
        changeKeymap(map) {
            if (map === 'vim') this.editor.setOption('keyMap', 'vim');
            else if (map === 'emacs') this.editor.setOption('keyMap', 'emacs');
            else this.editor.setOption('keyMap', 'default');
            this.showToast(`Keymap: ${map}`, 'info');
        }
        changeFontSize(size) {
            document.getElementById('lblFontSize').innerText = size;
            document.querySelectorAll('.CodeMirror').forEach(el => el.style.fontSize = size + 'px');
            this.editor.refresh();
        }
        toggleWordWrap(on) { this.editor.setOption('lineWrapping', on); }
        toggleLineNumbers(on) { this.editor.setOption('lineNumbers', on); this.editor.refresh(); }
        toggleAutoSave(on) { this._autoSaveEnabled = on; this.showToast(on ? 'Auto-save on' : 'Auto-save off', 'info'); }
        clearStorage() { if (!confirm('Delete all projects and settings?')) return; localStorage.clear(); location.reload(); }

        /* ============================================================
           EXPORT / SHARE
           ============================================================ */
        toggleExportMenu() { document.getElementById('exportMenu').classList.toggle('hidden'); }
        exportProject(type) {
            document.getElementById('exportMenu').classList.add('hidden');
            const files = this.project.files;
            const entry = files['index.html'] ? 'index.html' : Object.keys(files).find(f => f.endsWith('.html'));
            const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            if (type === 'zip') {
                const zip = new JSZip();
                Object.entries(files).forEach(([name, f]) => zip.file(name, f.content || ''));
                zip.generateAsync({ type: 'blob' }).then(blob => {
                    saveAs(blob, `${this.project.name.replace(/\s+/g, '-').toLowerCase()}.zip`);
                    this.showToast('Downloaded ZIP', 'success');
                });
            } else if (type === 'html' && entry) {
                let html = files[entry].content;
                Object.entries(files).forEach(([name, f]) => {
                    if (name === entry) return;
                    if (name.endsWith('.css')) html = html.replace(new RegExp(`<link[^>]*href=["']${escapeRe(name)}["'][^>]*>`, 'gi'), `<style>${f.content}</style>`);
                    if (name.endsWith('.js')) html = html.replace(new RegExp(`<script[^>]*src=["']${escapeRe(name)}["'][^>]*><\\/script>`, 'gi'), `<script>${f.content}<\/script>`);
                });
                saveAs(new Blob([html], { type: 'text/html' }), 'index.html');
                this.showToast('Downloaded HTML', 'success');
            }
        }
        async shareProject() {
            const encoded = LZString.compressToEncodedURIComponent(JSON.stringify(this.project));
            const url = `${location.origin}${location.pathname}#project=${encoded}`;
            try {
                if (navigator.clipboard && window.isSecureContext) {
                    await navigator.clipboard.writeText(url);
                    this.showToast('Share link copied!', 'success');
                } else throw new Error('no clipboard');
            } catch (_) {
                const modal = document.createElement('div');
                modal.className = 'fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4';
                modal.innerHTML = `<div class="bg-studio-sidebar border border-studio-border rounded-xl w-full max-w-lg p-5 space-y-3"><h3 class="text-white font-bold text-sm">Copy Share Link</h3><textarea readonly class="w-full h-24 bg-studio-bg border border-studio-border rounded p-2 text-xs text-white font-mono"></textarea><div class="flex justify-end"><button class="close-btn text-xs px-3 py-1.5 bg-studio-panel border border-studio-border rounded text-white hover:bg-studio-border">Close</button></div></div>`;
                document.body.appendChild(modal);
                const ta = modal.querySelector('textarea');
                ta.value = url; ta.select();
                modal.querySelector('.close-btn').addEventListener('click', () => modal.remove());
            }
        }

        /* ============================================================
           TOOLS
           ============================================================ */
        switchToolTab(tab) {
            this.currentToolTab = tab;
            ['Palette', 'Keyframes', 'Icons'].forEach(t => {
                const view = document.getElementById('toolView' + t);
                const btn = document.getElementById('toolTab' + t);
                if (view) view.classList.add('hidden');
                if (btn) btn.className = 'text-studio-muted hover:text-white';
            });
            const view = document.getElementById('toolView' + tab.charAt(0).toUpperCase() + tab.slice(1));
            const btn = document.getElementById('toolTab' + tab.charAt(0).toUpperCase() + tab.slice(1));
            if (view) view.classList.remove('hidden');
            if (btn) btn.className = 'text-blue-400 font-bold';
        }
        generatePalette() {
            const base = document.getElementById('paletteBaseColor').value;
            document.getElementById('paletteHexText').innerText = base;
            const hsl = this._hexToHsl(base);
            const container = document.getElementById('paletteRamp');
            container.innerHTML = '';
            [95, 80, 60, 40, 20].forEach(l => {
                const c = this._hslToHex(hsl.h, hsl.s, l);
                const wrap = document.createElement('div');
                wrap.className = 'rounded overflow-hidden';
                const swatch = document.createElement('div');
                swatch.className = 'h-16';
                swatch.style.background = c;
                const label = document.createElement('div');
                label.className = 'text-[10px] text-center p-1 bg-studio-panel text-studio-text font-mono cursor-pointer hover:bg-studio-border';
                label.textContent = c;
                label.addEventListener('click', () => this._copyColor(c));
                wrap.appendChild(swatch);
                wrap.appendChild(label);
                container.appendChild(wrap);
            });
        }
        _copyColor(c) { navigator.clipboard?.writeText(c); this.showToast(`Copied ${c}`, 'success'); }
        copyPalette() {
            const shades = Array.from(document.querySelectorAll('#paletteRamp .text-\\[10px\\]')).map(el => el.innerText);
            const css = shades.map((c, i) => `  --color-${(i + 1) * 100}: ${c};`).join('\n');
            navigator.clipboard?.writeText(`:root {\n${css}\n}`);
            this.showToast('Palette copied', 'success');
        }
        _hexToHsl(hex) {
            let r = parseInt(hex.slice(1, 3), 16) / 255, g = parseInt(hex.slice(3, 5), 16) / 255, b = parseInt(hex.slice(5, 7), 16) / 255;
            const max = Math.max(r, g, b), min = Math.min(r, g, b);
            let h, s, l = (max + min) / 2;
            if (max === min) h = s = 0;
            else { const d = max - min; s = l > 0.5 ? d / (2 - max - min) : d / (max + min); switch (max) { case r: h = (g - b) / d + (g < b ? 6 : 0); break; case g: h = (b - r) / d + 2; break; case b: h = (r - g) / d + 4; break; } h /= 6; }
            return { h: h * 360, s: s * 100, l: l * 100 };
        }
        _hslToHex(h, s, l) {
            s /= 100; l /= 100;
            const k = n => (n + h / 30) % 12;
            const a = s * Math.min(l, 1 - l);
            const f = n => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
            const toHex = x => Math.round(x * 255).toString(16).padStart(2, '0');
            return '#' + toHex(f(0)) + toHex(f(8)) + toHex(f(4));
        }
        updateKeyframePreview() {
            const tx = document.getElementById('kfTranslateX').value;
            const sc = document.getElementById('kfScale').value;
            const rt = document.getElementById('kfRotate').value;
            document.getElementById('kfTxVal').innerText = tx;
            document.getElementById('kfScaleVal').innerText = sc;
            document.getElementById('kfRotateVal').innerText = rt;
            document.getElementById('kfBox').style.transform = `translateX(${tx}px) scale(${sc}) rotate(${rt}deg)`;
            document.getElementById('kfOutputCss').value = `@keyframes customAnimation {\n  0% { transform: translateX(0) scale(1) rotate(0deg); }\n  100% { transform: translateX(${tx}px) scale(${sc}) rotate(${rt}deg); }\n}`;
        }
        insertKeyframeIntoSnippet() {
            const css = document.getElementById('kfOutputCss').value;
            this.editor.replaceRange('\n' + css + '\n', this.editor.getCursor());
            this.closeModal('toolsModal');
            this.showToast('Keyframes inserted', 'success');
        }
        _initIcons() {
            const icons = ['fa-house', 'fa-user', 'fa-gear', 'fa-heart', 'fa-star', 'fa-bell', 'fa-envelope', 'fa-search', 'fa-camera', 'fa-image', 'fa-video', 'fa-music', 'fa-cloud', 'fa-sun', 'fa-moon', 'fa-fire', 'fa-bolt', 'fa-leaf', 'fa-tree', 'fa-rocket', 'fa-plane', 'fa-car', 'fa-bicycle', 'fa-book', 'fa-graduation-cap', 'fa-code', 'fa-terminal', 'fa-database', 'fa-server', 'fa-lock', 'fa-key', 'fa-shield', 'fa-download', 'fa-upload', 'fa-share', 'fa-link', 'fa-paperclip', 'fa-tag', 'fa-bookmark', 'fa-comment', 'fa-comments', 'fa-thumbs-up', 'fa-thumbs-down', 'fa-eye', 'fa-eye-slash', 'fa-trash', 'fa-edit', 'fa-copy', 'fa-paste', 'fa-cut', 'fa-save', 'fa-folder', 'fa-file', 'fa-folder-open', 'fa-file-code', 'fa-file-image', 'fa-file-pdf', 'fa-play', 'fa-pause', 'fa-stop', 'fa-forward', 'fa-backward', 'fa-step-forward', 'fa-step-backward', 'fa-random', 'fa-repeat', 'fa-sync', 'fa-power-off', 'fa-wifi', 'fa-signal', 'fa-battery-full', 'fa-plug', 'fa-microchip', 'fa-memory', 'fa-hdd', 'fa-sd-card', 'fa-usb', 'fa-mobile', 'fa-tablet', 'fa-laptop', 'fa-desktop', 'fa-tv', 'fa-gamepad', 'fa-headphones', 'fa-microphone'];
            const grid = document.getElementById('iconGrid');
            grid.innerHTML = '';
            icons.forEach(i => {
                const btn = document.createElement('button');
                btn.title = i;
                btn.className = 'p-2 bg-studio-panel hover:bg-studio-border rounded border border-studio-border text-studio-text';
                btn.innerHTML = `<i class="fa-solid ${i}"></i>`;
                btn.addEventListener('click', () => this._insertIcon(i));
                grid.appendChild(btn);
            });
        }
        filterIcons(q) {
            const query = q.toLowerCase();
            Array.from(document.querySelectorAll('#iconGrid button')).forEach(b => {
                b.style.display = b.getAttribute('title').toLowerCase().includes(query) ? '' : 'none';
            });
        }
        _insertIcon(cls) {
            this.editor.replaceRange(`<i class="fa-solid ${cls}"></i>`, this.editor.getCursor());
            this.showToast(`Inserted ${cls}`, 'success');
        }

        /* ============================================================
           TEMPLATES
           ============================================================ */
        loadTemplate(key) {
            const starter = DEFAULT_PROJECTS[key];
            if (!starter) return;
            this._persistCurrentIntoProjects();
            const newId = 'proj_' + Date.now();
            this.project = {
                id: newId,
                name: starter.name,
                language: starter.language,
                activeFile: Object.keys(starter.files)[0],
                files: structuredClone(starter.files)
            };
            this.projects.push(this.project);
            this.currentProjectId = newId;
            localStorage.setItem('htmlc_projects', JSON.stringify(this.projects));
            localStorage.setItem('htmlc_current_project', newId);
            this.updateProjectName();
            this.openFile(this.project.activeFile);
            this.renderLanguageBar();
            this.renderTabs();
            this.renderSidebar();
            this.runCode();
            this.closeModal('templatesModal');
            this.showToast(`Loaded ${starter.name} template`, 'success');
        }

        /* ============================================================
           MODALS / DRAWERS / TOASTS
           ============================================================ */
        openModal(id) { const el = document.getElementById(id); el.classList.remove('hidden'); el.classList.add('flex'); }
        closeModal(id) { const el = document.getElementById(id); el.classList.add('hidden'); el.classList.remove('flex'); }
        toggleDrawer(id) {
            const el = document.getElementById(id);
            if (!el) return;
            const isOpen = el.dataset.open === 'true';
            el.dataset.open = isOpen ? 'false' : 'true';
            el.style.transform = isOpen ? 'translateX(100%)' : 'translateX(0)';
        }
        showToast(msg, type = 'info') {
            const c = document.getElementById('toastContainer');
            const t = document.createElement('div');
            const colors = { error: 'bg-red-600', success: 'bg-emerald-600', info: 'bg-blue-600', warn: 'bg-amber-600' };
            t.className = `toast px-3 py-2 rounded-lg text-xs font-medium shadow-xl flex items-center space-x-2 text-white pointer-events-auto ${colors[type] || colors.info}`;
            const icons = { error: 'fa-circle-xmark', success: 'fa-circle-check', info: 'fa-circle-info', warn: 'fa-triangle-exclamation' };
            t.innerHTML = `<i class="fa-solid ${icons[type] || icons.info}"></i><span>${this._escape(msg)}</span>`;
            c.appendChild(t);
            setTimeout(() => { t.style.opacity = '0'; t.style.transform = 'translateX(120%)'; t.style.transition = 'all .3s'; }, 2700);
            setTimeout(() => t.remove(), 3100);
        }

        /* ============================================================
           RESIZERS
           ============================================================ */
        initResizers() {
            const makeResizableH = (id, prevId) => {
                const r = document.getElementById(id);
                const prev = document.getElementById(prevId);
                if (!r || !prev) return;
                let startX = 0, startW = 0;
                const move = e => { prev.style.width = Math.max(150, Math.min(600, startW + (e.clientX - startX))) + 'px'; };
                const up = () => {
                    r.classList.remove('active');
                    document.removeEventListener('mousemove', move);
                    document.removeEventListener('mouseup', up);
                    if (this.editor) this.editor.refresh();
                };
                r.addEventListener('mousedown', e => { startX = e.clientX; startW = prev.getBoundingClientRect().width; r.classList.add('active'); document.addEventListener('mousemove', move); document.addEventListener('mouseup', up); e.preventDefault(); });
            };
            const makeResizableV = (id, prevId) => {
                const r = document.getElementById(id);
                const prev = document.getElementById(prevId);
                if (!r || !prev) return;
                let startY = 0, startH = 0;
                const move = e => { prev.style.height = Math.max(32, Math.min(600, startH - (e.clientY - startY))) + 'px'; };
                const up = () => { r.classList.remove('active'); document.removeEventListener('mousemove', move); document.removeEventListener('mouseup', up); };
                r.addEventListener('mousedown', e => { startY = e.clientY; startH = prev.getBoundingClientRect().height; r.classList.add('active'); document.addEventListener('mousemove', move); document.addEventListener('mouseup', up); e.preventDefault(); });
            };
            makeResizableH('resizerSidebar', 'sidebarPanel');
            makeResizableH('resizerMain', 'editorPane');
            makeResizableV('resizerConsole', 'consoleDrawer');
        }

        /* ============================================================
           GLOBAL EVENTS
           ============================================================ */
        bindGlobalEvents() {
            window.addEventListener('keydown', e => {
                if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'p') { e.preventDefault(); this.openCommandPalette(); }
                if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); this.runCode(); }
                if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); this.runCode(); }
                if (e.key === 'Escape') {
                    ['commandPaletteModal', 'templatesModal', 'toolsModal'].forEach(id => this.closeModal(id));
                    const drawer = document.getElementById('settingsDrawer');
                    if (drawer) {
                        drawer.dataset.open = 'false';
                        drawer.style.transform = 'translateX(100%)';
                    }
                }
            });
            window.addEventListener('message', e => {
                const d = e.data || {};
                if (d.type === 'CONSOLE_LOG') this.addConsoleLog(d.level, d.args);
                if (d.type === 'NETWORK_LOG') this.addNetworkLog(d);
                if (d.type === 'INSPECTOR_SELECT') this.showToast(`Selected <${d.tagName.toLowerCase()}>${d.id ? '#' + d.id : ''}`, 'info');
                if (d.type === 'REPL_RESULT') this.addConsoleLog(d.ok ? 'log' : 'error', [String(d.value)]);
            });
            document.addEventListener('click', e => {
                const menu = document.getElementById('exportMenu');
                if (menu && !menu.contains(e.target) && !e.target.closest('button[data-export-toggle]')) menu.classList.add('hidden');
            });
        }

        /* ============================================================
           HELPERS
           ============================================================ */
        _escape(s) {
            return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
        }
        _escapeAttr(s) { return this._escape(s); }
    }

    /* ============================================================
       BOOT
       ============================================================ */
    window.addEventListener('load', function () {
        try {
            let shared = null;
            try {
                const m = location.hash.match(/#project=(.+)/);
                if (m) {
                    const json = LZString.decompressFromEncodedURIComponent(m[1]);
                    if (json) shared = JSON.parse(json);
                }
            } catch (_) { }

            window.app = new HtmlCompiler();

            if (shared) {
                window.app._persistCurrentIntoProjects();
                shared.id = 'proj_shared_' + Date.now();
                shared.name = shared.name || 'Shared Project';
                window.app.projects.push(shared);
                window.app.currentProjectId = shared.id;
                window.app.project = shared;
                window.app.updateProjectName();
                window.app.openFile(window.app.project.activeFile || Object.keys(window.app.project.files)[0]);
                window.app.renderLanguageBar();
                window.app.renderTabs();
                window.app.renderSidebar();
                window.app.runCode();
                window.app.showToast('Loaded shared project', 'success');
                history.replaceState(null, '', location.pathname);
            }
        } catch (err) {
            console.error('Code Playground failed to start:', err);
            document.body.innerHTML = '<div style="position:fixed;inset:0;display:flex;align-items:center;justify-content:center;background:#0d1117;color:#c9d1d9;font-family:Inter,sans-serif;padding:24px;text-align:center;z-index:9999"><div style="max-width:520px"><h1 style="font-size:20px;font-weight:700;margin-bottom:10px">Something went wrong</h1><p style="font-size:13px;color:#8b949e;margin-bottom:14px">The editor could not initialize. Open the browser console for details.</p><pre style="font-family:ui-monospace,monospace;font-size:11px;background:#161b22;border:1px solid #30363d;border-radius:10px;padding:12px;text-align:left;color:#f0883e;overflow:auto">' + String(err && err.message ? err.message : err) + '</pre><button onclick="location.reload()" style="margin-top:16px;background:#1f6feb;color:#fff;border:none;padding:10px 18px;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer">Reload</button></div></div>';
        }
    });

})();