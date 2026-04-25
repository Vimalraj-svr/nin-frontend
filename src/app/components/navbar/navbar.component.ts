import { Component, OnInit, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AsyncPipe } from '@angular/common';
import { DiaryApiService } from '../../services/diary-api.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, AsyncPipe],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css',
})
export class NavbarComponent implements OnInit {
  authService = inject(AuthService);
  
  apiStatus: 'checking' | 'connected' | 'disconnected' = 'checking';
  memoryCount = 0;

  constructor(private api: DiaryApiService) {}

  ngOnInit() {
    this.api.checkHealth().subscribe({
      next: (h) => {
        // Updated health logic
        this.apiStatus = h.status === 'ok' ? 'connected' : 'disconnected';
        this.memoryCount = h.memory_entries ?? 0;
      },
      error: () => (this.apiStatus = 'disconnected'),
    });
  }
}
