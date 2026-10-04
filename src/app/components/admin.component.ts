import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiGatewayService } from '../services/api-gateway.service';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.css']
})
export class AdminComponent {
  api = inject(ApiGatewayService);
}
