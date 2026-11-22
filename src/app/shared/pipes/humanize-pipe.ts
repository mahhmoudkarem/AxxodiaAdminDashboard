import { Pipe, PipeTransform } from '@angular/core';
import { humanize } from '../../core/utils/format';

@Pipe({ name: 'humanize' })
export class HumanizePipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    return humanize(value);
  }
}
