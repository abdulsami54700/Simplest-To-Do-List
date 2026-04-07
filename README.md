# Simple PWA Todo App

A minimal, fast, and distraction-free todo app built as a Progressive Web App (PWA) for personal use.

## Features
- Add tasks with title and description
- Optional scheduling (date & time)
- Task completion with confirmation
- History section for completed tasks
- Data stored locally (localStorage)
- Works offline
- Installable on mobile (Add to Home Screen)

## Tech Stack
- HTML, CSS, JavaScript
- Vite (build tool)
- PWA (manifest + service worker)
- Hosted on Vercel

## How It Works
- All tasks are stored in localStorage
- Scheduled tasks trigger notifications (only when app is open)
- No backend, no login, fully client-side

## Usage
1. Open the app
2. Add a task using the "+" button
3. (Optional) Set a scheduled time
4. Mark task as completed → moves to history

## Installation (Mobile)
- Open the app in Chrome
- Tap "Add to Home Screen"
- Use it like a native app

## Limitations
- Notifications only work when the app is open
- No cloud sync (local use only)

## Deployment
- Code is hosted on GitHub
- Deployed via Vercel with automatic updates on push

## License
Personal use only