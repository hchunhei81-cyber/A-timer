
# Pomodoro Focus

A single-file Pomodoro timer, task manager, flight deck simulator, and a small collection of study and developer tools.

Built with HTML, Tailwind CSS, and vanilla JavaScript. No build step, no backend, no account. All data stays in your browser.

## Table of Contents

- [Use Online](#use-online)
- [What's Included](#whats-included)
- [Keyboard Shortcuts](#keyboard-shortcuts)
- [Data Storage](#data-storage)
- [Local Development](#local-development)
- [File Structure](#file-structure)
- [Privacy](#privacy)
- [Disclaimer](#disclaimer)
- [Browser Support](#browser-support)
- [License](#license)

## Use Online

Open [https://hchunhei81-cyber.github.io/pomodoro-focus/](https://hchunhei81-cyber.github.io/pomodoro-focus/)

No sign-up required. Everything is saved in your own browser.

## What's Included

### 1. Pomodoro (index.html)

- Four modes: Focus, Short Break, Long Break, Stopwatch
- Adjustable durations
- SVG progress ring that changes color with the mode
- Deep Focus mode: fullscreen, minimal, leaving only the timer and your task
- Session intention: write down the one thing you want to accomplish before starting
- Distraction counter that doesn't pause the timer
- Reflection prompt and landing rating after a session ends
- Daily goal tracking
- Ambient sound: off, brown noise, rain (generated locally)
- Browser notifications and vibration
- Light/dark theme
- Task list with drag-and-drop reordering, per-task Pomodoro count, and undo delete
- Export and import task list as JSON

### 2. Flight Deck (index.html)

An optional theme that turns each focus session into a flight.

- PFD (Primary Flight Display): artificial horizon, speed tape, altitude tape, heading tape, vertical speed, flight director
- ND (Navigation Display): route, waypoints, range rings, TCAS traffic, wind direction arrow
- Eight phases: Pre-flight, Taxi, Takeoff, Climb, Cruise, Descent, Approach, Landing
- Five aircraft types, each with different cruise altitude, climb rate, and engine performance
- Weather that changes with local time: clear, cloudy, rain, night
- Cabin announcements during cruise, start of descent, and when preparing to land
- Live flight tracking via OpenSky Network (with a 10-second cooldown)

### 3. Tools (tools.html)

A small tool launcher page.

#### Study Cards (note.html)

- Multiple subjects, each with its own deck
- Per-card stats: correct and incorrect counts
- Flip, highlight, edit, delete
- Accuracy per subject
- Export and import the entire card library as JSON

#### Calculator (calc.html)

- Scientific mode: trigonometry, logarithms, exponents, powers, factorial
- Live result preview as you type
- Calculation history
- Calculus mode: derivatives, definite integrals, Canvas plotting
- Programmer mode: hexadecimal, decimal, octal, binary, and bitwise operations
- Statistics mode: mean, median, standard deviation, variance, permutations, combinations
- Matrix mode: 2x2 and 3x3 determinant, inverse, addition, multiplication

#### Code Playground (code.html)

- Online HTML, CSS, JavaScript editor
- Live sandbox preview
- Multi-file projects
- Console, network, performance, and test panels
- Templates: Vanilla, Vue 3, React JSX, Canvas 2D
- CDN package manager
- Snapshots and share links (compressed)
- Export as ZIP or single HTML
- Command palette and element inspector

## Keyboard Shortcuts

### Pomodoro

| Key | Function |
|---|---|
| `Space` | Start or pause |
| `G` | Deep Focus mode |
| `R` | Reset current session |
| `S` | Skip to next phase |
| `F` | Fullscreen focus |
| `D` | Toggle Classic and Flight Deck |
| `V` | Toggle PFD and ND |
| `T` | Toggle light/dark theme |
| `N` | Jump to new task input |
| `1` `2` `3` `4` | Focus, Short Break, Long Break, Stopwatch |
| `?` | Open shortcut help |
| `Esc` | Close modal or exit focus mode |

### Study Cards

| Key | Function |
|---|---|
| `Space` | Flip card |
| `←` `→` | Previous or next card |
| `N` | New card |
| `E` | Edit current card |
| `D` | Delete current card |
| `G` | Mark as correct |
| `M` | Mark as incorrect |
| `?` | Shortcut help |
| `Esc` | Close modal |

### Code Playground

| Key | Function |
|---|---|
| `Ctrl+S` | Run project |
| `Ctrl+Shift+P` | Open command palette |
| `Esc` | Close modals and drawers |

## Data Storage

Everything is saved in `localStorage`, isolated by browser and domain.

| Key | Content | Page |
|---|---|---|
| `pomodoro.v6.settings` | Timer settings | index.html |
| `pomodoro.v6.tasks` | Task list | index.html |
| `pomodoro.v6.session` | Current session state | index.html |
| `pomodoro.v6.stats` | Daily stats | index.html |
| `pomodoro.v6.history` | Session history | index.html |
| `pomodoro.v6.reflection` | Reflection records | index.html |
| `study_cards_v1` | Study card data | note.html |
| `htmlc_projects` | Code Playground projects | code.html |
| `htmlc_current_project` | Current project id | code.html |
| `htmlc_snapshots_*` | Project snapshots | code.html |
| `htmlc_cdn_*` | CDN packages per project | code.html |

**Each page is isolated from the others.** Each tool uses its own storage keys. Data saved by one page is not visible to another page.

**Note:**

- Clearing browser data will delete all of the above
- Data does not sync across browsers, devices, or domains
- Use each page's export feature to back up your data

## Local Development

No build tools required.

## File Structure
.
├── index.html          Pomodoro and tasks
├── styles.css
├── app.js
├── flight.js           Flight deck module
│
├── tools.html          Tool launcher page
├── tools.css
│
├── note.html           Study cards
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
No cookies are used
No analytics tools are used
No third-party scripts are loaded except CDNs for Tailwind CSS, Font Awesome, CodeMirror, JSZip, FileSaver, and LZString
The Flight Deck's "Live Flights" feature sends a geographic bounding box to the public OpenSky Network API, and nothing else
Pages include `<meta name="robots" content="noindex, nofollow">` and will not be indexed by search engines

# Disclaimer
This is a personal project shared as-is. No warranty of any kind is provided.

The Flight Deck is a visual simulation for entertainment and focus. It is not a flight training tool and must not be used for real aviation.

Live flight data comes from the public OpenSky Network API. It is provided as-is, with no guarantee of accuracy or availability. Do not use it for any operational purpose.

Data is stored in your browser's localStorage. Clearing browser data will permanently delete your tasks, sessions, study cards, and Code Playground projects. If you care about your data, export it regularly.

Code Playground executes user-written JavaScript in a sandboxed iframe. Do not paste code from untrusted sources.

## Browser Support
Tested in the following browsers:

Chrome and Edge 88+
Firefox 85+
Safari 14+
Some features depend on newer Web APIs:

Notifications: require user permission
Voice announcements: require speechSynthesis
Ambient sound: requires AudioContext
Share links: require CompressionStream, otherwise falls back to a text box

## License
MIT. See LICENSE for details.
