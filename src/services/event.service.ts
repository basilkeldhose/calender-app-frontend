import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { StorageService } from './storage.service';
// import { v4 as uuidv4 } from 'uuid';
import { CalendarEvent } from '../app/models/event-model';

const STORAGE_KEY = 'calendar_events';

@Injectable({
  providedIn: 'root'
})
export class EventService {

  private eventsSubject = new BehaviorSubject<CalendarEvent[]>([]);
  events$: Observable<CalendarEvent[]> = this.eventsSubject.asObservable();

  constructor(private storage: StorageService) {
    const saved = this.storage.get<CalendarEvent[]>(STORAGE_KEY) || [];
    this.eventsSubject.next(saved);
  }

  // Add or update storage and notify subscribers
  private addToStorage(events: CalendarEvent[]) {
    this.storage.set(STORAGE_KEY, events);
    this.eventsSubject.next(events);
  }

  // List all events
  listAll(): CalendarEvent[] {
    return [...this.eventsSubject.value];
  }

  getByDate(date: string): CalendarEvent[] {
    return this.eventsSubject.value.filter(e => e.date === date);
  }

  // Create new event
  create(event: Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt'>): CalendarEvent {
    const newEvent: CalendarEvent = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...event
    };
    const events = [...this.eventsSubject.value, newEvent];
    this.addToStorage(events);
    return newEvent;
  }

  // Update existing event
  update(updated: CalendarEvent): CalendarEvent {
    const events = this.eventsSubject.value.map(e => e.id === updated.id ? { ...updated, updatedAt: new Date().toISOString() } : e);
    this.addToStorage(events);
    return updated;
  }

  // Delete selected event
  delete(id: string): void {
    const events = this.eventsSubject.value.filter(e => e.id !== id);
    this.addToStorage(events);
  }

  // Clear all events
  clearAll(): void {
    this.addToStorage([]);
  }
}
