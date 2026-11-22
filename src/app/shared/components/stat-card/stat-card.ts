import { Component, computed, input } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-stat-card',
  imports: [RouterLink, NgTemplateOutlet],
  templateUrl: './stat-card.html',
})
export class StatCard {
  readonly label = input.required<string>();
  readonly value = input<number | string | null>(0);
  readonly icon = input('fa-chart-simple');
  readonly hint = input('');
  readonly tone = input<'brown' | 'gold' | 'success' | 'warning' | 'danger' | 'info'>('brown');
  readonly link = input<string | null>(null);

  readonly toneClass = computed(() => {
    switch (this.tone()) {
      case 'gold':
        return 'bg-brand-gold/15 text-brand-gold';
      case 'success':
        return 'bg-success/12 text-success';
      case 'warning':
        return 'bg-warning/15 text-warning';
      case 'danger':
        return 'bg-danger/12 text-danger';
      case 'info':
        return 'bg-info/12 text-info';
      default:
        return 'bg-brand-brown/10 text-brand-brown';
    }
  });
}
