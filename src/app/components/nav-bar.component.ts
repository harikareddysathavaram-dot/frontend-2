import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiGatewayService } from '../services/api-gateway.service';

@Component({
  selector: 'app-nav-bar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <header class="card" style="border-radius: 0; border-left: none; border-right: none; border-top: none; background: #0d2745; color: white;">
      <div class="container" style="display: flex; justify-content: space-between; align-items: center; padding: 1rem 1.5rem;">
        
        <!-- Logo -->
        <div style="display: flex; align-items: center; gap: 0.75rem; cursor: pointer;" (click)="api.activeTab.set('home')">
          <div style="background: #ffffff; color: #0d2745; width: 38px; height: 38px; border-radius: 8px; font-weight: bold; display: flex; align-items: center; justify-content: center; font-size: 1.3rem;">S</div>
          <span class="brand-font" style="font-size: 1.4rem; font-weight: bold; letter-spacing: 0.5px;">Stagwell Insurance</span>
        </div>

        <!-- Navigation Links -->
        <nav style="display: flex; gap: 1.75rem; font-size: 0.95rem; font-weight: 500;">
          <a (click)="api.activeTab.set('home')" [style.color]="api.activeTab() === 'home' ? '#38bdf8' : '#cbd5e1'" style="cursor: pointer; text-decoration: none;">Home</a>
          <a (click)="api.activeTab.set('employer')" [style.color]="api.activeTab() === 'employer' ? '#38bdf8' : '#cbd5e1'" style="cursor: pointer; text-decoration: none;">Employers</a>
          <a (click)="api.activeTab.set('surveyor')" [style.color]="api.activeTab() === 'surveyor' ? '#38bdf8' : '#cbd5e1'" style="cursor: pointer; text-decoration: none;">Surveyors</a>
          <a (click)="api.activeTab.set('admin')" [style.color]="api.activeTab() === 'admin' ? '#38bdf8' : '#cbd5e1'" style="cursor: pointer; text-decoration: none;">Admin</a>
        </nav>

        <!-- Profile / Auth State -->
        <div style="position: relative;">
          @if (api.isLoggedIn()) {
            <div style="display: flex; align-items: center; gap: 0.75rem;">
              <!-- User Profile Logo Avatar -->
              <div (click)="toggleDropdown()" style="display: flex; align-items: center; gap: 0.75rem; cursor: pointer; background: rgba(255,255,255,0.1); padding: 0.35rem 0.85rem; border-radius: 9999px; border: 1px solid rgba(255,255,255,0.2);">
                <div style="width: 32px; height: 32px; border-radius: 50%; background: #1b5fc4; color: white; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 0.85rem;">
                  {{ getUserInitials() }}
                </div>
                <div style="font-size: 0.85rem; text-align: left;">
                  <div style="font-weight: 600; line-height: 1.1;">{{ api.currentUser()?.fullName }}</div>
                  <div style="font-size: 0.75rem; color: #94a3b8;">{{ api.userRole() }}</div>
                </div>
                <span style="font-size: 0.7rem; margin-left: 0.25rem;">▼</span>
              </div>
            </div>

            <!-- Profile Info Dropdown -->
            @if (showProfileDropdown()) {
              <div style="position: absolute; right: 0; top: 110%; width: 260px; background: #ffffff; color: #1e293b; border-radius: 12px; box-shadow: 0 10px 25px rgba(0,0,0,0.15); border: 1px solid #e2e8f0; padding: 1.25rem; z-index: 100;">
                <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1rem; padding-bottom: 0.75rem; border-bottom: 1px solid #e2e8f0;">
                  <div style="width: 42px; height: 42px; border-radius: 50%; background: #1b5fc4; color: white; display: flex; align-items: center; justify-content: center; font-size: 1.1rem; font-weight: bold;">
                    {{ getUserInitials() }}
                  </div>
                  <div>
                    <div style="font-weight: 700; font-size: 0.95rem;">{{ api.currentUser()?.fullName }}</div>
                    <div style="font-size: 0.8rem; color: #64748b;">{{ api.currentUser()?.email }}</div>
                  </div>
                </div>

                <div style="margin-bottom: 1rem;">
                  <span class="badge badge-primary" style="width: 100%; justify-content: center; padding: 0.4rem;">
                    Role: {{ api.userRole() }}
                  </span>
                </div>

                <!-- Backend Connected Sign Out -->
                <button class="btn btn-danger" style="width: 100%; justify-content: center;" (click)="handleLogout()">
                  🔒 Sign Out
                </button>
              </div>
            }
          } @else {
            <button class="btn btn-primary" (click)="api.activeTab.set('login')">Sign in</button>
          }
        </div>
      </div>
    </header>

    @if (api.toastMessage()) {
      <div style="position: fixed; bottom: 20px; right: 20px; background: #0f172a; color: white; padding: 1rem 1.5rem; border-radius: 10px; z-index: 1000; box-shadow: 0 10px 20px rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.1);">
        {{ api.toastMessage() }}
      </div>
    }
  `
})
export class NavBarComponent {
  api = inject(ApiGatewayService);
  showProfileDropdown = signal(false);

  toggleDropdown() {
    this.showProfileDropdown.update(v => !v);
  }

  getUserInitials(): string {
    const name = this.api.currentUser()?.fullName || 'User';
    const parts = name.split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.substring(0, 2).toUpperCase();
  }

  async handleLogout() {
    this.showProfileDropdown.set(false);
    await this.api.logout();
  }
}
