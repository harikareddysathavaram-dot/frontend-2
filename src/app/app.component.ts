import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiGatewayService } from './services/api-gateway.service';
import { NavBarComponent } from './components/nav-bar.component';
import { LoginComponent } from './components/login.component';
import { EmployerComponent } from './components/employer.component';
import { SurveyorComponent } from './components/surveyor.component';
import { AdminComponent } from './components/admin.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    NavBarComponent,
    LoginComponent,
    EmployerComponent,
    SurveyorComponent,
    AdminComponent
  ],
  template: `
    <app-nav-bar></app-nav-bar>

    <main>
      @switch (api.activeTab()) {
        @case ('home') {
          <div style="background: var(--navy); color: white; padding: 4rem 0;">
            <div class="container" style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; align-items: center;">
              <div>
                <h1 class="brand-font" style="font-size: 2.75rem; line-height: 1.2; margin-bottom: 1rem;">
                  Insurance that keeps your life and business moving.
                </h1>
                <p style="color: #94a3b8; font-size: 1.1rem; margin-bottom: 2rem;">
                  Compare cover, buy online and settle claims digitally. Powered by microservices architecture.
                </p>
                <div style="display: flex; gap: 1rem;">
                  <button class="btn btn-primary" (click)="api.activeTab.set('employer')">Explore Employers</button>
                  <button class="btn btn-outline" style="color: white; border-color: rgba(255,255,255,0.3);" (click)="api.activeTab.set('login')">Sign In</button>
                </div>
              </div>
              <div class="card" style="background: rgba(255,255,255,0.05); border-color: rgba(255,255,255,0.1); color: white;">
                <h3 style="margin-bottom: 1rem;">Microservices Architecture Active</h3>
                <ul style="list-style: none; display: flex; flex-direction: column; gap: 0.75rem;">
                  <li>🛡️ <strong>AuthService</strong>: JWT Authentication & User Sessions</li>
                  <li>🏢 <strong>CustomerService</strong>: Employers & Employee Data</li>
                  <li>📄 <strong>PolicyService</strong>: Quotations & Policy Lifecycle</li>
                  <li>🩺 <strong>ClaimsService</strong>: Workplace Injury Claims & Verification</li>
                  <li>💳 <strong>PaymentService</strong>: Premium Payments & Claim Payouts</li>
                  <li>🌐 <strong>ApiGateway (Ocelot)</strong>: Single Endpoint Entry (Port 5000)</li>
                </ul>
              </div>
            </div>
          </div>
        }
        @case ('login') {
          <app-login></app-login>
        }
        @case ('employer') {
          <app-employer></app-employer>
        }
        @case ('surveyor') {
          <app-surveyor></app-surveyor>
        }
        @case ('admin') {
          <app-admin></app-admin>
        }
      }
    </main>
  `
})
export class AppComponent {
  api = inject(ApiGatewayService);
}
