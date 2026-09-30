# Pomodoro Focus

A single-file Pomodoro timer, task manager, flight deck simulator, and a small collection of study and developer tools.

Built with HTML, Tailwind CSS, and vanilla JavaScript. No build step, no backend, no accounts. All data stays in your browser.

## Table of contents

- [Live site](#live-site)
- [What's inside](#whats-inside)
- [Keyboard shortcuts](#keyboard-shortcuts)
- [Data storage](#data-storage)
- [Local development](#local-development)
- [File structure](#file-structure)
- [Privacy](#privacy)
- [Disclaimer](#disclaimer)
- [Browser support](#browser-support)
- [License](#license)

## Live site

Open [https://hchunhei81-cyber.github.io/pomodoro-focus/](https://hchunhei81-cyber.github.io/pomodoro-focus/)

No sign-up required. Everything is stored in your own browser.

## What's inside

### 1. Pomodoro Timer (index.html)

- Four modes: Focus, Short Break, Long Break, Stopwatch
- Adjustable durations
- SVG progress ring that changes color by mode
- Deep Focus mode: full-screen, minimal, just the timer and your task
- Session intent: write the one thing you will finish before starting
- Distraction counter that does not pause the timer
- Reflection prompt and landing rating after each session
- Daily goal tracker
- Ambient sound: off, brown noise, or rain (generated locally)
- Notifications and vibration
- Light and dark theme
- Task list with drag-to-reorder, per-task Pomodoro count, undo delete
- Export and import tasks as JSON

### 2. Flight Deck (index.html)

An optional theme that turns each session into a flight.

- PFD (Primary Flight Display) with attitude indicator, speed tape, altitude tape, heading tape, vertical speed, flight director
- ND (Navigation Display) with route, waypoints, range rings, TCAS traffic, wind arrow
- Eight phases: Pre-flight, Taxi, Takeoff, Climb, Cruise, Descent, Approach, Landing
- Five aircraft types with different cruise altitude, climb rate, and engine behavior
- Weather that follows local time: clear, cloudy, rain, night
- Cabin announcements at cruise, top of descent, and prepare-for-landing
- Live flight tracking via OpenSky Network (with 10-second cooldown)

### 3. Tools (tools.html)

A small launcher for optional utilities.

#### Study Cards (note.html)

- Multiple subjects with their own card decks
- Per-card stats: got-it and missed counts
- Flip, highlight, edit, delete
- Accuracy per subject
- Export and import the entire deck library as JSON

#### Calculator (calc.html)

- Scientific mode with trig, logs, exponentials, powers, factorial
- Live preview as you type
- Calculation history log
- Calculus mode: derivative, definite integral, canvas plotter
- Programmer mode: hex, decimal, octal, binary and bitwise operations
- Statistics mode: mean, median, standard deviation, variance, permutations, combinations
- Matrix mode: 2x2 and 3x3 determinant, inverse, addition, multiplication

#### Code Playground (code.html)

- Online HTML, CSS, and JavaScript editor
- Live sandbox preview
- Multi-file projects
- Console, network, performance, and test panels
- Templates: Vanilla, Vue 3, React JSX, Canvas 2D
- CDN package manager
- Snapshots and share-by-link (compressed)
- Export as ZIP or single HTML
- Command palette and inspector

## Keyboard shortcuts

### Pomodoro

| Key | Action |
|---|---|
| `Space` | Start or pause |
| `G` | Deep Focus mode |
| `R` | Reset current session |
| `S` | Skip to next phase |
| `F` | Fullscreen focus |
| `D` | Toggle Classic and Flight Deck |
| `V` | Toggle PFD and ND |
| `T` | Toggle light and dark theme |
| `N` | Jump to new task input |
| `1` `2` `3` `4` | Focus, Short, Long, Stopwatch |
| `?` | Open shortcuts help |
| `Esc` | Close modal or exit focus mode |

### Study Cards

| Key | Action |
|---|---|
| `Space` | Flip card |
| `Left` `Right` | Previous or next card |
| `N` | New card |
| `E` | Edit current card |
| `D` | Delete current card |
| `G` | Mark as got it |
| `M` | Mark as missed |
| `?` | Shortcuts help |
| `Esc` | Close modal |

### Code Playground

| Key | Action |
|---|---|
| `Ctrl+S` | Run project |
| `Ctrl+Shift+P` | Open command palette |
| `Esc` | Close modals and drawers |

## Data storage

Everything is stored in `localStorage`, scoped to your browser and domain.

| Key | Contents | Page |
|---|---|---|
| `pomodoro.v6.settings` | Timer settings | index.html |
| `pomodoro.v6.tasks` | Task list | index.html |
| `pomodoro.v6.session` | Current session state | index.html |
| `pomodoro.v6.stats` | Daily stats | index.html |
| `pomodoro.v6.history` | Session history | index.html |
| `pomodoro.v6.reflection` | Reflection log | index.html |
| `study_cards_v1` | Study card data | note.html |
| `htmlc_projects` | Code Playground projects | code.html |
| `htmlc_current_project` | Active project id | code.html |
| `htmlc_snapshots_*` | Project snapshots | code.html |
| `htmlc_cdn_*` | Per-project CDN packages | code.html |

**The pages are isolated.** Each tool uses its own storage keys. Data saved in one page is not visible to another.

**Notes:**

- Clearing browser data will delete all of the above
- Data does not follow you across browsers, devices, or domains
- Use the export feature on each page to back things up

## Local development

No build tools required.

## File structure
.
├── index.html          Pomodoro timer and tasks
├── styles.css
├── app.js
├── flight.js           Flight Deck module
│
├── tools.html          Tool launcher
├── tools.css
│
├── note.html           Study Cards
├── note.css
├── note.js
│
├── calc.html           Calculator
├── calc.css
├── calc.js
│
├── code.html           Code Playground
├── code.css
├── code.js
├── config.js
│
├── manifest.json
├── icon.svg
├── robots.txt
├── README.md
└── LICENSE

## Privacy
No data is sent to any server
No cookies
No analytics
No third-party scripts except the CDNs used for Tailwind CSS, Font Awesome, CodeMirror, JSZip, FileSaver, and LZString
The Flight Deck "live flight" feature sends a geographic bounding box to the public OpenSky Network API, nothing else
The page includes <meta name="robots" content="noindex, nofollow"> so it will not be indexed by search engines

# Disclaimer
This is a personal project shared as-is. No warranty of any kind.

Flight Deck is a visual simulation for entertainment and focus. It is not a flight training tool and must not be used for real aviation.

Live flight data comes from the public OpenSky Network API. It is provided as-is, without any guarantee of accuracy or availability. Do not use it for any operational purpose.

Data is stored in your browser's localStorage. Clearing browser data will permanently delete your tasks, sessions, study cards, and Code Playground projects. Export regularly if you care about your data.

Code Playground executes user-written JavaScript inside a sandboxed iframe. Do not paste code from untrusted sources.

## Browser support
Tested on:

Chrome and Edge 88+
Firefox 85+
Safari 14+
Some features rely on newer Web APIs:

Notifications: requires user permission
Voice announcements: requires speechSynthesis
Ambient sound: requires AudioContext
Share links: requires CompressionStream or falls back to a textarea

