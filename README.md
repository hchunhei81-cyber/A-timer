# Pomodoro Focus

A single-file Pomodoro timer, task manager, and flight deck simulator — plus a standalone study card tool.

Built with HTML, Tailwind CSS, and vanilla JavaScript. No build step, no backend, no accounts. All data stays in your browser.

## Table of contents

- [Live site](#live-site)
- [Features](#features)
- [Keyboard shortcuts](#keyboard-shortcuts)
- [Flight Deck](#flight-deck)
- [Study Cards](#study-cards)
- [Data storage](#data-storage)
- [Local development](#local-development)
- [File structure](#file-structure)
- [Privacy](#privacy)
- [License](#license)

## Live site

Open [https://hchunhei81-cyber.github.io/](https://hchunhei81-cyber.github.io/)

No sign-up required. Everything is stored in your own browser.

## Features

### Pomodoro (index.html)

- **Four modes**: Focus / Short Break / Long Break / Stopwatch
- **Adjustable durations**: focus, short, long, and how many focus sessions before a long break
- **Progress ring**: SVG ring countdown that changes color by mode
- **Deep Focus**: full-screen, minimal view with just the timer and your task (press `G`)
- **Session intent**: asks you to write the one specific thing you'll finish this session
- **Distraction counter**: tap to log a distraction without pausing the timer
- **Reflection**: after each session, asks if you finished and gives a landing rating
- **Daily goal**: set a target number of sessions per day
- **Ambient sound**: off / brown noise / rain, generated locally with Web Audio, no network
- **Notifications and vibration**: alert when a session ends
- **Light / dark theme**: one-tap toggle
- **Task export / import**: export your task list as JSON

### Tasks (index.html)

- Add, check off, edit, and delete tasks
- Drag to reorder
- Set an estimated Pomodoro count per task and track completed ones
- Link a task to the current timer
- Search and filter (All / Active / Done)
- Undo delete (5-second window)
- Export / import tasks as JSON

### Study Cards (note.html)

- **Multiple subjects**: each subject has its own set of cards
- **Multiple cards per subject**
- **Got it / Missed**: tracks correct and incorrect responses per card
- **Flip cards**: tap the question or press `Space`
- **Highlight**: mark cards that need extra review
- **Stats**: total cards, got it, missed, accuracy per subject
- **Export / import**: back up the whole deck library as JSON

## Keyboard shortcuts

### Pomodoro

| Key | Action |
|---|---|
| `Space` | Start / pause |
| `G` | Deep Focus mode |
| `R` | Reset current session |
| `S` | Skip to next phase |
| `F` | Fullscreen focus |
| `D` | Toggle Classic / Flight Deck |
| `V` | Toggle PFD / ND |
| `T` | Toggle light / dark theme |
| `N` | Jump to new task input |
| `1` `2` `3` `4` | Focus / Short / Long / Stopwatch |
| `?` | Open shortcuts help |
| `Esc` | Close modal or exit focus mode |

### Study Cards

| Key | Action |
|---|---|
| `Space` | Flip card |
| `←` `→` | Previous / next card |
| `N` | New card |
| `E` | Edit current card |
| `D` | Delete current card |
| `G` | Mark as got it |
| `M` | Mark as missed |
| `?` | Shortcuts help |
| `Esc` | Close modal |

## Flight Deck

Replaces the classic timer with a flight simulator. Every focus session is a flight.

- **PFD (Primary Flight Display)**: attitude indicator, speed tape, altitude tape, heading tape, vertical speed indicator, flight director
- **ND (Navigation Display)**: route, waypoints, range rings, TCAS traffic, wind arrow
- **Eight phases**: Pre-flight → Taxi → Takeoff → Climb → Cruise → Descent → Approach → Landing
- **Five aircraft**: B737-800 / B787-8 / A320neo / A350-900 / B747-400, each with its own climb rate, cruise altitude, and engine behavior
- **Weather**: auto-selects clear / cloudy / rain / night based on local time
- **Cabin announcements**: plays at cruise, top of descent, and prepare-for-landing using the browser's speech synthesis
- **Live flight**: pulls a real aircraft from OpenSky Network with its call sign, altitude, speed, and heading

## Data storage

Everything is stored in `localStorage`, scoped to your browser and domain.

| Key | Contents |
|---|---|
| `pomodoro.v6.settings` | Timer settings |
| `pomodoro.v6.tasks` | Task list |
| `pomodoro.v6.session` | Current session state |
| `pomodoro.v6.stats` | Daily stats |
| `pomodoro.v6.history` | Session history |
| `pomodoro.v6.reflection` | Reflection log |
| `study_cards_v1` | Study card data |

**Notes:**

- Clearing browser data will delete all of the above
- Data does not follow you across browsers, devices, or domains
- Use the export feature to back things up

## Local development

No build tools required.

## File Structure
├── index.html      Pomodoro + tasks + Flight Deck
├── note.html       Study Cards
└── README.md       This file

## Privacy
No data is sent to any server
No cookies
No analytics
No third-party scripts except the Tailwind CSS CDN
The Flight Deck "live flight" feature sends a geographic bounding box to the public OpenSky Network API, nothing else
The page includes <meta name="robots" content="noindex, nofollow"> so it won't be indexed by search engines

## Disclaimer
## Disclaimer

This software is provided "as is", without warranty of any kind, express or
implied, including but not limited to the warranties of merchantability,
fitness for a particular purpose, and noninfringement.

In no event shall the author be liable for any claim, damages, or other
liability arising from, out of, or in connection with the software or the use
or other dealings in the software.

**Specifically:**

- The Flight Deck theme is a **visual simulation only**. It is not a real
  flight training tool and must not be used for actual aviation.
- The "live flight" feature pulls public data from OpenSky Network. Its
  accuracy is not guaranteed and it is not suitable for any operational use.
- Time, task, and study data are stored in your browser. Clearing browser
  data will delete everything. Export regularly if you care about it.
