import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiGatewayService } from '../services/api-gateway.service';

@Component({
  selector: 'app-surveyor',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './surveyor.component.html',
  styleUrls: ['./surveyor.component.css']
})
export class SurveyorComponent {
  api = inject(ApiGatewayService);

  async review(claimId: string, approved: boolean) {
    await this.api.reviewClaim(claimId, approved, approved ? 'Verified by surveyor' : 'Claim documentation invalid');
  }

  async payClaim(claim: any) {
    await this.api.processPayment({
      companyId: claim.companyId || crypto.randomUUID(),
      referenceId: claim.id,
      amount: claim.claimedAmount,
      paymentType: 'ClaimPayout'
    });
  }
}
