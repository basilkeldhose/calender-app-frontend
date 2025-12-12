// src/app/components/calender/calender.component.ts
import { Component, OnDestroy, OnInit } from '@angular/core';
import { EventService } from '../../services/event.service';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { CalendarEvent } from '../../app/models/event-model';
import { EventDialogComponent } from '../../event-dialog/event-dialog/event-dialog.component';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';


interface DayCell {
  date: Date;
  iso: string;
  inMonth: boolean;
}

type ViewMode = 'month' | 'week';

@Component({
  selector: 'app-calender',
  standalone: true,
  imports: [CommonModule, MatDialogModule, ReactiveFormsModule, MatIconModule, MatButtonModule],
  templateUrl: './calender.component.html',
  styleUrls: ['./calender.component.scss']
})

export class CalenderComponent implements OnInit, OnDestroy {

  viewMode: ViewMode = 'month';
  current = new Date();
  selectedIso: string | null = null;
  weeks: DayCell[][] = [];
  weekDays: Date[] = [];
  hours: string[] = [];
  events: CalendarEvent[] = [];
  eventsByDate: Record<string, CalendarEvent[]> = {};
  upcoming_events: CalendarEvent[] = [];
  private destroy$ = new Subject<void>();

  constructor(private evtService: EventService, private dialog: MatDialog) { }

  ngOnInit() {
    // initialize month and week structures
    this.generateCalendar();
    this.buildWeek(this.current);
    this.buildHours();

    // subscribe to event stream and keep the map updated
    this.evtService.events$
      .pipe(takeUntil(this.destroy$))
      .subscribe(ev => {
        this.events = ev || [];
        this.buildEventMap(this.events);
        const now = new Date();
        this.upcoming_events = this.events.filter(e => {
          if (!e.createdAt) return false;
          const isoDateTime = `${e.date}T${e.startTime ?? "00:00"}`;
          return new Date(isoDateTime) > now;
        });
      });

  }


  // -------------------------
  // Event map utilities
  // -------------------------
  private buildEventMap(events: CalendarEvent[]) {
    const map: Record<string, CalendarEvent[]> = {};
    for (const e of events || []) {
      const key = e.date;
      if (!map[key]) map[key] = [];
      map[key].push(e);
    }

    // sort by startTime for consistent ordering
    for (const k of Object.keys(map)) {
      map[k].sort((a, b) => (a.startTime ?? '').localeCompare(b.startTime ?? ''));
    }
    this.eventsByDate = map;
  }

  getEventsForDayIso(iso: string): CalendarEvent[] {
    return this.eventsByDate[iso] || [];
  }

  // -------------------------
  // Month grid generation
  // -------------------------

  generateCalendar() {
    this.weeks = [];
    const year = this.current.getFullYear();
    const month = this.current.getMonth();

    const firstOfMonth = new Date(year, month, 1);
    const startDayIndex = firstOfMonth.getDay();
    const startDate = new Date(firstOfMonth);
    startDate.setDate(startDate.getDate() - startDayIndex);

    let day = new Date(startDate);
    for (let w = 0; w < 6; w++) {
      const row: DayCell[] = [];
      for (let d = 0; d < 7; d++) {
        const copy = new Date(day);
        row.push({
          date: copy,
          iso: this.toIsoDate(copy),
          inMonth: copy.getMonth() === month
        });
        day.setDate(day.getDate() + 1);
      }
      this.weeks.push(row);
    }
  }

  // -------------------------
  // Week view helpers
  // -------------------------

  buildWeek(ref: Date) {
    const d = new Date(ref);
    const day = d.getDay(); // 0..6
    const diffToMon = (day + 6) % 7;
    const monday = new Date(d);
    monday.setDate(d.getDate() - diffToMon);
    monday.setHours(0, 0, 0, 0);

    this.weekDays = Array.from({ length: 7 }).map((_, i) => {
      const dt = new Date(monday);
      dt.setDate(monday.getDate() + i);
      return dt;
    });
  }

  // Build visible hour rows (configurable)
  buildHours(startHour = 6, endHour = 22) {
    this.hours = [];
    for (let h = startHour; h <= endHour; h++) {
      this.hours.push(h.toString().padStart(2, '0') + ':00');
    }
  }

  // Event selection for week view: returns events for a date
  eventsForDate(date: Date): CalendarEvent[] {
    const key = this.toIsoDate(date);
    return this.eventsByDate[key] || [];
  }

  // Convert time string 'HH:mm' to minutes since midnight
  private minutesSinceMidnight(time: string) {
    const [hh, mm] = (time || '00:00').split(':').map(n => parseInt(n, 10));
    return hh * 60 + (isNaN(mm) ? 0 : mm);
  }

  // Positioning helpers (map visible window e.g., 06:00-22:00 to 0..100%)
  topPercent(start: string, visibleStart = 6 * 60, visibleEnd = 22 * 60) {
    const m = this.minutesSinceMidnight(start);
    const pct = ((m - visibleStart) / (visibleEnd - visibleStart)) * 100;
    return Math.max(0, Math.min(100, pct));
  }

  heightPercent(start: string, end: string, visibleStart = 6 * 60, visibleEnd = 22 * 60) {
    const m1 = this.minutesSinceMidnight(start);
    const m2 = this.minutesSinceMidnight(end);
    const dur = m2 - m1;
    const pct = (dur / (visibleEnd - visibleStart)) * 100;
    return Math.max(1, Math.min(100, pct));
  }

  // -------------------------
  // Navigation & View Toggle
  // -------------------------
  toggleView(mode?: ViewMode) {
    if (mode) this.viewMode = mode;
    else this.viewMode = this.viewMode === 'month' ? 'week' : 'month';

    // when switching to week view, ensure weekDays anchored at `current`
    if (this.viewMode === 'week') {
      this.buildWeek(this.current);
    } else {
      this.generateCalendar();
    }
  }

  prev() {
    if (this.viewMode === 'month') {
      this.prevMonth();
    } else {
      this.prevWeek();
    }
  }

  next() {
    if (this.viewMode === 'month') {
      this.nextMonth();
    } else {
      this.nextWeek();
    }
  }

  prevMonth() {
    this.current = new Date(this.current.getFullYear(), this.current.getMonth() - 1, 1);
    this.generateCalendar();
  }

  nextMonth() {
    this.current = new Date(this.current.getFullYear(), this.current.getMonth() + 1, 1);
    this.generateCalendar();
  }

  prevWeek() {
    // move current by -7 days and rebuild week
    const first = this.weekDays[0] ?? new Date(this.current);
    const d = new Date(first);
    d.setDate(first.getDate() - 7);
    this.buildWeek(d);
    this.current = d;
  }

  nextWeek() {
    const first = this.weekDays[0] ?? new Date(this.current);
    const d = new Date(first);
    d.setDate(first.getDate() + 7);
    this.buildWeek(d);
    this.current = d;
  }

  // -------------------------
  // Dialog / Popover (create/edit)
  // -------------------------
  openDialogForDate(day: DayCell, eventToEdit?: CalendarEvent) {
    this.selectedIso = day.iso;

    const dialogRef = this.dialog.open(EventDialogComponent, {
      width: '420px',
      data: { date: day.iso, event: eventToEdit }
    });

    dialogRef.afterClosed().pipe(takeUntil(this.destroy$)).subscribe(result => {
    });
  }

  // open create dialog for a week-date (for week view double-click / empty space)
  openDialogForWeekDate(date: Date, eventToEdit?: CalendarEvent) {
    const iso = this.toIsoDate(date);
    const dialogRef = this.dialog.open(EventDialogComponent, {
      width: '420px',
      data: { date: iso, event: eventToEdit }
    });
    dialogRef.afterClosed().pipe(takeUntil(this.destroy$)).subscribe();
  }

  // -------------------------
  // Helpers
  // -------------------------
  toIsoDate(d: Date): string {
    const y = d.getFullYear();
    const m = (d.getMonth() + 1).toString().padStart(2, '0');
    const da = d.getDate().toString().padStart(2, '0');
    return `${y}-${m}-${da}`;
  }

  isToday(iso: string) {
    return iso === this.toIsoDate(new Date());
  }

  // small utility: optional method to programmatically refresh events (if needed)
  refreshEventsNow() {
    this.buildEventMap(this.events);
  }


  goToToday(): void {
    this.current = new Date();
    this.generateCalendar();
    this.buildWeek(this.current);
  }

  isPastDate(iso: string): boolean {
    const todayIso = this.toIsoDate(new Date());
    return iso < todayIso;
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
