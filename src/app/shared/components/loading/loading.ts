import { booleanAttribute, Component, input } from '@angular/core';

@Component({
  selector: 'app-loading',
  templateUrl: './loading.html',
})
export class Loading {
  readonly message = input('Loading...');
  readonly compact = input(false, { transform: booleanAttribute });
}
