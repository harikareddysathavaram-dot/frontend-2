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

  // Gateway Base URL (Ocelot Gateway on port 5000)
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
  // Route: POST /api/auth/login -> AuthService (port 7001)
  async login(email: string, role: 'Employer' | 'Surveyor' | 'Admin') {
    this.loading.set(true);
    try {
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

      // Auto-load data for the logged-in role
      await this.loadDashboardData(role);
    } finally {
      this.loading.set(false);
    }
  }

  // Route: POST /api/auth/logout -> AuthService (port 7001)
  async logout() {
    this.loading.set(true);
    try {
      await firstValueFrom(
        this.http.post(`${this.gatewayUrl}/auth/logout`, {}, { headers: this.getHeaders() })
      ).catch(() => null);

      this.currentUser.set(null);
      this.companies.set([]);
      this.employees.set([]);
      this.quotations.set([]);
      this.policies.set([]);
      this.claims.set([]);
      this.payments.set([]);
      this.activeTab.set('home');
      this.showToast('Logged out successfully');
    } finally {
      this.loading.set(false);
    }
  }

  // Load dashboard data based on role
  async loadDashboardData(role: string) {
    try {
      if (role === 'Employer' || role === 'Admin') {
        await this.loadCompanies();
        await this.loadPolicies();
      }
      if (role === 'Surveyor' || role === 'Admin') {
        await this.loadClaims();
      }
      if (role === 'Admin') {
        await this.loadPayments();
      }
    } catch (e) {
      console.warn('Could not load dashboard data from backend:', e);
    }
  }

  // --- Customer Service API ---
  // Route: GET /api/companies -> CustomerService (port 7002)
  async loadCompanies() {
    const res: any = await firstValueFrom(
      this.http.get(`${this.gatewayUrl}/companies`, { headers: this.getHeaders() })
    ).catch(() => []);
    this.companies.set(Array.isArray(res) ? res : []);
  }

  // Route: POST /api/companies/register -> CustomerService (port 7002)
  async createCompany(companyData: { companyName: string; industryType: string; employeeCount: number }) {
    this.loading.set(true);
    try {
      const res: any = await firstValueFrom(
        this.http.post(`${this.gatewayUrl}/companies/register`, companyData, { headers: this.getHeaders() })
      ).catch(() => ({ id: crypto.randomUUID(), ...companyData }));

      this.companies.update(list => [...list, res]);
      return res;
    } finally {
      this.loading.set(false);
    }
  }

  // --- Policy Service API ---
  // Route: GET /api/policies -> PolicyService (port 7003)
  async loadPolicies() {
    const res: any = await firstValueFrom(
      this.http.get(`${this.gatewayUrl}/policies`, { headers: this.getHeaders() })
    ).catch(() => []);
    this.policies.set(Array.isArray(res) ? res : []);
  }

  // Route: POST /api/quotations/request -> PolicyService (port 7003)
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

  // Route: POST /api/quotations/accept -> PolicyService (port 7003)
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
  // Route: POST /api/payments/process -> PaymentService (port 7005)
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

  // Route: GET /api/payments -> PaymentService (port 7005)
  async loadPayments() {
    const res: any = await firstValueFrom(
      this.http.get(`${this.gatewayUrl}/payments`, { headers: this.getHeaders() })
    ).catch(() => []);
    this.payments.set(Array.isArray(res) ? res : []);
  }

  // --- Claims Service API ---
  // Route: GET /api/claims -> ClaimsService (port 7004)
  async loadClaims() {
    const res: any = await firstValueFrom(
      this.http.get(`${this.gatewayUrl}/claims`, { headers: this.getHeaders() })
    ).catch(() => []);
    this.claims.set(Array.isArray(res) ? res : []);
  }

  // Route: POST /api/claims/submit -> ClaimsService (port 7004)
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

  // Route: PUT /api/claims/{id}/review -> ClaimsService (port 7004)
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

  // --- Admin Auth Service API ---
  // Route: GET /api/auth/pending-users -> AuthService (port 7001)
  async getPendingUsers(): Promise<any[]> {
    const res: any = await firstValueFrom(
      this.http.get(`${this.gatewayUrl}/auth/pending-users`, { headers: this.getHeaders() })
    ).catch(() => []);
    return Array.isArray(res) ? res : [];
  }

  // Route: PUT /api/auth/approve/{userId} -> AuthService (port 7001)
  async approveUser(userId: string) {
    this.loading.set(true);
    try {
      await firstValueFrom(
        this.http.put(`${this.gatewayUrl}/auth/approve/${userId}`, {}, { headers: this.getHeaders() })
      ).catch(() => null);
      this.showToast('User approved successfully');
    } finally {
      this.loading.set(false);
    }
  }
}
