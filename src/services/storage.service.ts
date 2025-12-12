import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class StorageService {
  get<T>(key: string): T | null {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) as T : null;
    } catch (err) {
      console.error('Storage get error', err);
      return null;
    }
  }

  set<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (err) {
      console.error('Storage set error', err);
    }
  }

  remove(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (err) {
      console.error('Storage remove error', err);
    }
  }
}
