import { Pipe, PipeTransform } from '@angular/core';
import { Api } from '../../core/services/api';

// "/uploads/x.webp" -> "{apiUrl}/uploads/x.webp" (absolute URLs are kept)
@Pipe({ name: 'fileUrl' })
export class FileUrlPipe implements PipeTransform {
  transform(value: string | null | undefined): string | null {
    return Api.fileUrl(value);
  }
}
