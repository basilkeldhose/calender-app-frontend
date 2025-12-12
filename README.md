# Angular Calendar App

Features:
- Monthly calendar grid
- Click a date to create event
- Click event to view / edit / delete
- Event categories with color-coding
- Reactive Forms, RxJS state, LocalStorage persistence
- No external calendar libraries

## Requirements
- Node 20+
- Angular CLI
- (Optional) install Angular Material for better UI

## Setup
1. `git clone <repo>`
2. `cd calendar-app`
3. `npm install`
4. `ng serve`

Open `http://localhost:4200`.

## Notes
- Times are local — convert to UTC for server-backed solutions
- LocalStorage key: `calendar_events_v1`
