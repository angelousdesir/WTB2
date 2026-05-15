import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-upgrade-canceled',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './upgrade-canceled.component.html',
  styleUrls: ['./upgrade-canceled.component.scss']
})
export class UpgradeCanceledComponent {
  reasons = [
    {
      icon: '💳',
      title: 'Payment Issue',
      description: 'Check your payment method and try again',
      action: 'Update Payment',
      link: '/upgrade'
    },
    {
      icon: '🤔',
      title: 'Need More Info?',
      description: 'Learn more about owner features',
      action: 'View Features',
      link: '/about'
    },
    {
      icon: '💬',
      title: 'Have Questions?',
      description: 'Our support team is here to help',
      action: 'Contact Support',
      link: '/contact'
    }
  ];
}