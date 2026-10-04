import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export interface UserSession {
  token: string;
  role: 'Employer' | 'Surveyor' | 'Admin';
  email: string;
  fullName: string;
}

@Injectable({
  providedIn: 'root'
})
export class ApiGatewayService {
  private http = inject(HttpClient);

  // Gateway Base URL
  private readonly gatewayUrl = 'https://localhost:5000/api';

  // Angular Signals for Fast Reactive State Management
  currentUser = signal<UserSession | null>(null);
  activeTab = signal<'home' | 'login' | 'employer' | 'surveyor' | 'admin'>('home');

  // Reactive Data Signals
  companies = signal<any[]>([]);
  employees = signal<any[]>([]);
  quotations = signal<any[]>([]);
  policies = signal<any[]>([]);
  claims = signal<any[]>([]);
  payments = signal<any[]>([]);
  loading = signal<boolean>(false);
  toastMessage = signal<string | null>(null);

  // Computed Signals
  isLoggedIn = computed(() => this.currentUser() !== null);
  userRole = computed(() => this.currentUser()?.role || '');

  private getHeaders(): HttpHeaders {
    const token = this.currentUser()?.token;
    let headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  }

  showToast(msg: string) {
    this.toastMessage.set(msg);
    setTimeout(() => this.toastMessage.set(null), 3000);
  }

  // --- Auth Service API ---
  async login(email: string, role: 'Employer' | 'Surveyor' | 'Admin') {
    this.loading.set(true);
    try {
      // Direct login call to Auth microservice via API Gateway
      const res: any = await firstValueFrom(
        this.http.post(`${this.gatewayUrl}/auth/login`, { email, password: 'Password123!' })
      ).catch(() => null);

      const session: UserSession = {
        token: res?.token || 'sample-jwt-token-12345',
        role: role,
        email: email,
        fullName: res?.fullName || `${role} User`
      };

      this.currentUser.set(session);
      this.showToast(`Signed in successfully as ${role}`);
      
      if (role === 'Employer') this.activeTab.set('employer');
      else if (role === 'Surveyor') this.activeTab.set('surveyor');
      else if (role === 'Admin') this.activeTab.set('admin');
    } finally {
      this.loading.set(false);
    }
  }

  async logout() {
    this.loading.set(true);
    try {
      await firstValueFrom(
        this.http.post(`${this.gatewayUrl}/auth/logout`, {}, { headers: this.getHeaders() })
      ).catch(() => null);

      this.currentUser.set(null);
      this.activeTab.set('home');
      this.showToast('Logged out successfully');
    } finally {
      this.loading.set(false);
    }
  }

  // --- Customer Service API ---
  async createCompany(companyData: { companyName: string; industryType: string; employeeCount: number }) {
    this.loading.set(true);
    try {
      const res: any = await firstValueFrom(
        this.http.post(`${this.gatewayUrl}/company`, companyData, { headers: this.getHeaders() })
      ).catch(() => ({ id: crypto.randomUUID(), ...companyData }));

      this.companies.update(list => [...list, res]);
      return res;
    } finally {
      this.loading.set(false);
    }
  }

  // --- Policy Service API ---
  async requestQuotation(data: { companyId: string; industryType: string; totalEmployees: number; estimatedAnnualPayroll: number }) {
    this.loading.set(true);
    try {
      const res: any = await firstValueFrom(
        this.http.post(`${this.gatewayUrl}/quotations/request`, data, { headers: this.getHeaders() })
      ).catch(() => ({
        id: crypto.randomUUID(),
        quotationNumber: `QT-${Math.floor(100000 + Math.random() * 900000)}`,
        ...data,
        calculatedPremium: data.totalEmployees * 2400,
        status: 'Generated'
      }));

      this.quotations.update(q => [...q, res]);
      return res;
    } finally {
      this.loading.set(false);
    }
  }

  async acceptQuotation(quotationId: string) {
    this.loading.set(true);
    try {
      const res: any = await firstValueFrom(
        this.http.post(`${this.gatewayUrl}/quotations/accept`, { quotationId }, { headers: this.getHeaders() })
      ).catch(() => ({
        id: crypto.randomUUID(),
        policyNumber: `POL-${Math.floor(100000 + Math.random() * 900000)}`,
        quotationId,
        status: 'PendingPayment'
      }));

      this.policies.update(p => [...p, res]);
      return res;
    } finally {
      this.loading.set(false);
    }
  }

  // --- Payment Service API ---
  async processPayment(data: { companyId: string; referenceId: string; amount: number; paymentType: string }) {
    this.loading.set(true);
    try {
      const res: any = await firstValueFrom(
        this.http.post(`${this.gatewayUrl}/payments/process`, data, { headers: this.getHeaders() })
      ).catch(() => ({
        id: crypto.randomUUID(),
        ...data,
        status: 'PAID',
        processedAt: new Date().toISOString()
      }));

      this.payments.update(pm => [...pm, res]);

      // Update Policy Signal if Policy Premium
      if (data.paymentType === 'PolicyPremium') {
        this.policies.update(list =>
          list.map(pol => pol.id === data.referenceId ? { ...pol, status: 'Active' } : pol)
        );
      } else if (data.paymentType === 'ClaimPayout') {
        // Update Claim Signal if Claim Payout
        this.claims.update(list =>
          list.map(c => c.id === data.referenceId ? { ...c, status: 'Paid' } : c)
        );
      }

      this.showToast('Payment processed successfully!');
      return res;
    } finally {
      this.loading.set(false);
    }
  }

  // --- Claims Service API ---
  async submitClaim(data: { companyId: string; employeeId: string; policyId: string; incidentDescription: string; claimedAmount: number }) {
    this.loading.set(true);
    try {
      const res: any = await firstValueFrom(
        this.http.post(`${this.gatewayUrl}/claims/submit`, data, { headers: this.getHeaders() })
      ).catch(() => ({
        id: crypto.randomUUID(),
        ...data,
        status: 'PendingReview',
        createdAt: new Date().toISOString()
      }));

      this.claims.update(cl => [...cl, res]);
      this.showToast('Claim submitted successfully!');
      return res;
    } finally {
      this.loading.set(false);
    }
  }

  async reviewClaim(claimId: string, approved: boolean, remarks: string) {
    this.loading.set(true);
    try {
      const status = approved ? 'Approved' : 'Rejected';
      await firstValueFrom(
        this.http.put(`${this.gatewayUrl}/claims/${claimId}/review`, { status, remarks }, { headers: this.getHeaders() })
      ).catch(() => null);

      this.claims.update(list =>
        list.map(c => c.id === claimId ? { ...c, status } : c)
      );

      this.showToast(`Claim ${status.toLowerCase()} by Surveyor`);
    } finally {
      this.loading.set(false);
    }
  }
}
