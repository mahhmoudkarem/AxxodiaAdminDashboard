import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-modal',
  templateUrl: './modal.html',
  host: { '(document:keydown.escape)': 'open() && close.emit()' },
})
export class Modal {
  readonly open = input(false);
  readonly title = input('');
  readonly subtitle = input('');
  readonly size = input<'sm' | 'md' | 'lg' | 'xl'>('md');
  readonly close = output<void>();

  widthClass(): string {
    return { sm: 'max-w-md', md: 'max-w-xl', lg: 'max-w-3xl', xl: 'max-w-5xl' }[this.size()];
  }
}
