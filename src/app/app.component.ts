import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CalenderComponent } from '../calender/calender/calender.component';
import { ToastrModule } from 'ngx-toastr';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet,CalenderComponent,ToastrModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'calender-app';
}
