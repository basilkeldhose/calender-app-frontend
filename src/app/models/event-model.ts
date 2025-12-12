export type Category = 'Work' | 'Personal' | 'Study' | 'Other';

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  date: string;
  startTime?: string;
  endTime?: string;
  category: Category;
  color: string;
  createdAt?: string;
  updatedAt?: string;
}
