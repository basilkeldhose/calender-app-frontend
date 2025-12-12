import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { EventService } from '../../services/event.service';
import { CalendarEvent, Category } from '../../app/models/event-model';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { ToastrService } from 'ngx-toastr'
@Component({
  selector: 'app-event-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule
  ],
  templateUrl: './event-dialog.component.html',
  styleUrl: './event-dialog.component.scss'
})
export class EventDialogComponent implements OnInit {

  categories: { label: Category; color: string }[] = [
    { label: 'Work', color: '#1976d2' },
    { label: 'Personal', color: '#9c27b0' },
    { label: 'Study', color: '#388e3c' },
    { label: 'Other', color: '#ff9800' }
  ];

  form = this.fb.group({
    title: ['', Validators.required],
    description: [''],
    category: ['Work', Validators.required],
    color: ['#1976d2'],
    startTime: ['09:00', Validators.required],
    endTime: ['10:00', Validators.required]
  });

  editing?: CalendarEvent;
  dateIso: string;

  // ui state
  pastDateError = false;
  pastDateMessage = '';

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private fb: FormBuilder,
    private es: EventService,
    public dialogRef: MatDialogRef<EventDialogComponent>,
    private toastr: ToastrService
  ) {
    this.dateIso = (data.date instanceof Date) ? data.date.toISOString().slice(0,10) : data.date;
    if (data.event) this.editing = data.event;
  }

  ngOnInit() {
    if (this.editing) {
      this.form.patchValue({
        title: this.editing.title,
        description: this.editing.description,
        category: this.editing.category,
        color: this.editing.color,
        startTime: this.editing.startTime || '09:00',
        endTime: this.editing.endTime || '10:00'
      });
    }
    if (!this.editing && this.dateIso === this.todayIsoLocal()) {
      const now = new Date();
      now.setMinutes(now.getMinutes() + 15);
      const hh = now.getHours().toString().padStart(2,'0');
      const mm = now.getMinutes().toString().padStart(2,'0');
      this.form.patchValue({ startTime: `${hh}:${mm}`, endTime: `${(now.getHours() + 1).toString().padStart(2,'0')}:${mm}` });
    }
  }

  // ---- helpers to check past date/time ----
  private pad(n: number) {
    return n < 10 ? '0' + n : '' + n;
  }

  private todayIsoLocal(): string {
    const t = new Date();
    return `${t.getFullYear()}-${this.pad(t.getMonth() + 1)}-${this.pad(t.getDate())}`;
  }

  private minutesSinceMidnight(time: string | undefined): number {
    if (!time) return 0;
    const [hh, mm] = time.split(':').map(x => parseInt(x, 10));
    return (isNaN(hh) ? 0 : hh) * 60 + (isNaN(mm) ? 0 : mm);
  }

  isPastEvent(): boolean {
    if (this.editing) return false;

    const selectedDate = this.dateIso;
    console.log('Checking past event for date:', selectedDate);
    const today = this.todayIsoLocal();
    if (selectedDate < today) {
      this.pastDateMessage = 'Cannot create events on past dates.';
      return true;
    }

    // if selected day is today, check startTime vs now
    if (selectedDate === today) {
      const start = this.form.get('startTime')?.value || '00:00';
      const now = new Date();
      const nowMinutes = now.getHours() * 60 + now.getMinutes();
      const startMinutes = this.minutesSinceMidnight(start);

      if (startMinutes <= nowMinutes) {
        this.pastDateMessage = 'Cannot create events in the past (start time is earlier than current time).';
        return true;
      }
    }

    // otherwise ok
    this.pastDateMessage = '';
    return false;
  }

  // ---- save and delete ----
  save() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    if(!this.form.value.startTime || !this.form.value.endTime){
      this.toastr.error('Start time and end time are required.', 'Invalid Time Range');
      return;
    }
    if(this.form.value.startTime === this.form.value.endTime){
      this.toastr.error('Start time and end time cannot be the same.', 'Invalid Time Range');
      return;
    }
    if(this.form.value.startTime > this.form.value.endTime){
      this.toastr.error('Start time cannot be later than end time.', 'Invalid Time Range');
      return;
    }
    // check past event
    const past = this.isPastEvent();
    if (past) {
      this.pastDateError = true;
      window.alert(this.pastDateMessage || 'Cannot create events in the past.');
      return;
    }

    const payload = {
      date: this.dateIso,
      ...this.form.value
    } as Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt'>;

    if (this.editing) {
      const updated: CalendarEvent = { ...this.editing, ...payload };
      this.es.update(updated);
    } else {
      this.es.create(payload);
    }
    this.dialogRef.close(true);
  }

  delete() {
    if (!this.editing) return;
    const confirmed = window.confirm('Are you sure you want to delete this event?');
    if (confirmed) {
      this.es.delete(this.editing.id);
      this.dialogRef.close(true);
    }
  }

  pickColor(c: string) { this.form.patchValue({ color: c }); }
}
