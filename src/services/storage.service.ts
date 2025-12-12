import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class StorageService {
  
  // Get Events form localStorage
  get<T>(key: string): T | null {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) as T : null;
    } catch (err) {
      console.error('Storage get error', err);
      return null;
    }
  }

  // Set Events for localStorage
  set<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (err) {
      console.error('Storage set error', err);
    }
  }

}
