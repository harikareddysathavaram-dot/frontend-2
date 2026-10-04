import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiGatewayService } from '../services/api-gateway.service';

@Component({
  selector: 'app-nav-bar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './nav-bar.component.html',
  styleUrls: ['./nav-bar.component.css']
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

  navigateTo(tab: 'home' | 'employer' | 'surveyor' | 'admin') {
    if (tab === 'home') {
      this.api.activeTab.set('home');
      return;
    }

    if (!this.api.isLoggedIn()) {
      this.api.showToast('Please sign in to access this section.');
      this.api.activeTab.set('login');
      return;
    }

    const role = this.api.userRole();
    if (tab === 'admin' && role !== 'Admin') {
      this.api.showToast('Access Denied: Admin privileges required.');
      return;
    }

    if (tab === 'surveyor' && role !== 'Surveyor' && role !== 'Admin') {
      this.api.showToast('Access Denied: Surveyor privileges required.');
      return;
    }

    if (tab === 'employer' && role !== 'Employer' && role !== 'Admin') {
      this.api.showToast('Access Denied: Employer privileges required.');
      return;
    }

    this.api.activeTab.set(tab);
  }

  async handleLogout() {
    this.showProfileDropdown.set(false);
    await this.api.logout();
  }
}
