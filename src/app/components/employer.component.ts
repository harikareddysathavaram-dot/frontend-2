import { Component, inject, signal } from '@angular/core';
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
  templateUrl: './employer.component.html',
  styleUrls: ['./employer.component.css']
})
export class EmployerComponent {
  api = inject(ApiGatewayService);

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

  selectedPlan = signal<Plan>(this.plans[1]);
  companyName = 'Stagwell Enterprises';
  industryType = 'Technology';
  employeeCount = 25;
  payroll = 500000;

  incidentDesc = 'Workplace injury on assembly line';
  claimAmount = 35000;

  get calculatedPremium(): number {
    return this.selectedPlan().ratePerEmployee * this.employeeCount;
  }

  selectPlan(p: Plan) {
    this.selectedPlan.set(p);
  }

  async handleBuyPolicy() {
    const comp = await this.api.createCompany({
      companyName: this.companyName,
      industryType: this.industryType,
      employeeCount: this.employeeCount
    });

    const quote = await this.api.requestQuotation({
      companyId: comp.id,
      industryType: this.industryType,
      totalEmployees: this.employeeCount,
      estimatedAnnualPayroll: this.payroll
    });

    const policy = await this.api.acceptQuotation(quote.id);
    
    await this.api.processPayment({
      companyId: comp.id,
      referenceId: policy.id,
      amount: this.calculatedPremium,
      paymentType: 'PolicyPremium'
    });
  }

  async payPolicy(policyId: string) {
    await this.api.processPayment({
      companyId: this.api.companies()[0]?.id || crypto.randomUUID(),
      referenceId: policyId,
      amount: this.calculatedPremium,
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
