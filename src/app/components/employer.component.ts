import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiGatewayService } from '../services/api-gateway.service';

export interface Plan {
  id: string;
  name: string;
  ratePerEmployee: number;
  badge?: string;
  features: string[];
}

@Component({
  selector: 'app-employer',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container" style="padding-top: 2rem; padding-bottom: 3rem;">
      <h1 class="brand-font" style="font-size: 2rem; margin-bottom: 0.5rem;">Employer Policy Portal</h1>
      <p style="color: var(--text-muted); margin-bottom: 2rem;">Pick a Workers' Compensation Plan & Manage Policies/Claims</p>

      <!-- Section 1: Choose from 3 Statically Defined Plans -->
      <div class="card" style="margin-bottom: 2.5rem;">
        <h3 style="margin-bottom: 1.25rem;">1. Select Workers' Compensation Plan</h3>
        
        <div class="grid grid-cols-3" style="margin-bottom: 1.5rem;">
          @for (plan of plans; track plan.id) {
            <div 
              (click)="selectPlan(plan)" 
              class="card" 
              [style.border-color]="selectedPlan().id === plan.id ? '#1b5fc4' : '#e2e8f0'"
              [style.background-color]="selectedPlan().id === plan.id ? '#f0f7ff' : '#ffffff'"
              style="cursor: pointer; position: relative;">

              @if (plan.badge) {
                <span class="badge badge-warning" style="position: absolute; top: 12px; right: 12px;">{{ plan.badge }}</span>
              }

              <h4 style="font-size: 1.15rem; margin-bottom: 0.5rem;">{{ plan.name }}</h4>
              <div style="font-size: 1.5rem; font-weight: 700; color: #1b5fc4; margin-bottom: 0.75rem;">
                ₹{{ plan.ratePerEmployee.toLocaleString() }} <span style="font-size: 0.85rem; color: #64748b; font-weight: normal;">/ emp / year</span>
              </div>

              <ul style="font-size: 0.85rem; color: #475569; list-style: none; display: flex; flex-direction: column; gap: 0.4rem;">
                @for (feat of plan.features; track feat) {
                  <li>✓ {{ feat }}</li>
                }
              </ul>
            </div>
          }
        </div>

        <!-- Live Premium Calculation & Company Inputs -->
        <div style="background: #f8fafc; padding: 1.25rem; border-radius: 10px; border: 1px solid #e2e8f0; margin-bottom: 1.5rem;">
          <h4 style="margin-bottom: 1rem;">Company & Payroll Details</h4>
          <div class="grid grid-cols-2">
            <div class="form-group">
              <label class="form-label">Company Name</label>
              <input type="text" class="form-control" [(ngModel)]="companyName" />
            </div>
            <div class="form-group">
              <label class="form-label">Industry Type</label>
              <input type="text" class="form-control" [(ngModel)]="industryType" />
            </div>
            <div class="form-group">
              <label class="form-label">Number of Employees</label>
              <input type="number" class="form-control" [(ngModel)]="employeeCount" />
            </div>
            <div class="form-group">
              <label class="form-label">Estimated Payroll (₹)</label>
              <input type="number" class="form-control" [(ngModel)]="payroll" />
            </div>
          </div>

          <!-- Total Calculation Display -->
          <div style="display: flex; justify-content: space-between; align-items: center; background: #ffffff; padding: 1rem; border-radius: 8px; border: 1px solid #cbd5e1; margin-top: 1rem;">
            <div>
              <div style="font-size: 0.85rem; color: #64748b;">Selected Plan: <strong>{{ selectedPlan().name }}</strong> (₹{{ selectedPlan().ratePerEmployee }} × {{ employeeCount() }} employees)</div>
              <div style="font-size: 1.25rem; font-weight: bold; color: #0f172a;">Calculated Premium: ₹{{ calculatedPremium().toLocaleString() }} / year</div>
            </div>
            <button class="btn btn-primary" (click)="handleBuyPolicy()">
              ⚡ Buy Now & Connect Backend
            </button>
          </div>
        </div>
      </div>

      <!-- Section 2: Active Policies List -->
      <div class="card" style="margin-bottom: 2.5rem;">
        <h3 style="margin-bottom: 1rem;">Your Active Policies</h3>
        @if (api.policies().length === 0) {
          <p style="color: var(--text-muted);">No policies purchased yet.</p>
        } @else {
          <table class="table">
            <thead>
              <tr>
                <th>Policy Number</th>
                <th>Status</th>
                <th>Annual Premium</th>
                <th>Coverage Amount</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (pol of api.policies(); track pol.id) {
                <tr>
                  <td style="font-weight: 600;">{{ pol.policyNumber || pol.id }}</td>
                  <td><span class="badge badge-success">{{ pol.status }}</span></td>
                  <td>₹{{ (pol.annualPremium || 25000).toLocaleString() }}</td>
                  <td>₹{{ (pol.coverageAmount || 250000).toLocaleString() }}</td>
                  <td>
                    @if (pol.status === 'PendingPayment') {
                      <button class="btn btn-primary" (click)="payPolicy(pol.id)">Pay & Activate</button>
                    } @else {
                      <span class="badge badge-primary">Active Cover</span>
                    }
                  </td>
                </tr>
              }
            </tbody>
          </table>
        }
      </div>

      <!-- Section 3: Raise Injury Claim -->
      <div class="card">
        <h3 style="margin-bottom: 1rem;">2. Submit Workplace Injury Claim</h3>
        <div class="grid grid-cols-2">
          <div class="form-group">
            <label class="form-label">Incident Description</label>
            <input type="text" class="form-control" [(ngModel)]="incidentDesc" placeholder="e.g. Employee slip during shift" />
          </div>
          <div class="form-group">
            <label class="form-label">Claimed Amount (₹)</label>
            <input type="number" class="form-control" [(ngModel)]="claimAmount" />
          </div>
        </div>

        <button class="btn btn-danger" (click)="handleRaiseClaim()">
          Submit Claim to Microservices
        </button>
      </div>
    </div>
  `
})
export class EmployerComponent {
  api = inject(ApiGatewayService);

  // 3 Defined Policy Plans
  plans: Plan[] = [
    {
      id: 'essential',
      name: 'Essential Plan',
      ratePerEmployee: 2400,
      features: ['Basic Medical Cost Coverage', 'Wage Support up to 60%', 'Standard Claims Processing']
    },
    {
      id: 'standard',
      name: 'Standard Plan',
      ratePerEmployee: 3600,
      badge: 'Popular',
      features: ['Full Medical & Rehabilitation', 'Wage Support up to 80%', 'Surveyor Verified Claims', '24/7 Digital Portal']
    },
    {
      id: 'premier',
      name: 'Premier Plan',
      ratePerEmployee: 5200,
      features: ['Maximum Medical Coverage', '100% Wage Support', 'Zero-Deductible Claims', 'Priority Settlement']
    }
  ];

  selectedPlan = signal<Plan>(this.plans[1]); // Standard default
  companyName = 'Stagwell Enterprises';
  industryType = 'Technology';
  employeeCount = signal<number>(25);
  payroll = 500000;

  incidentDesc = 'Workplace injury on assembly line';
  claimAmount = 35000;

  calculatedPremium = computed(() => this.selectedPlan().ratePerEmployee * this.employeeCount());

  selectPlan(p: Plan) {
    this.selectedPlan.set(p);
  }

  async handleBuyPolicy() {
    const comp = await this.api.createCompany({
      companyName: this.companyName,
      industryType: this.industryType,
      employeeCount: this.employeeCount()
    });

    const quote = await this.api.requestQuotation({
      companyId: comp.id,
      industryType: this.industryType,
      totalEmployees: this.employeeCount(),
      estimatedAnnualPayroll: this.payroll
    });

    const policy = await this.api.acceptQuotation(quote.id);
    
    await this.api.processPayment({
      companyId: comp.id,
      referenceId: policy.id,
      amount: this.calculatedPremium(),
      paymentType: 'PolicyPremium'
    });
  }

  async payPolicy(policyId: string) {
    await this.api.processPayment({
      companyId: this.api.companies()[0]?.id || crypto.randomUUID(),
      referenceId: policyId,
      amount: this.calculatedPremium(),
      paymentType: 'PolicyPremium'
    });
  }

  async handleRaiseClaim() {
    const policyId = this.api.policies()[0]?.id || crypto.randomUUID();
    const companyId = this.api.companies()[0]?.id || crypto.randomUUID();
    
    await this.api.submitClaim({
      companyId,
      employeeId: crypto.randomUUID(),
      policyId,
      incidentDescription: this.incidentDesc,
      claimedAmount: this.claimAmount
    });
  }
}
