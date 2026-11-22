import { Component, computed, inject, input, OnInit, signal } from '@angular/core';
import { switchMap } from 'rxjs';
import { EntityImage, ImageEntityType, MediaPurpose } from '../../../core/models';
import { Confirm } from '../../../core/services/confirm';
import { Toast } from '../../../core/services/toast';
import { CatalogApi } from '../../../features/catalog/services/catalog-api';
import { FileUrlPipe } from '../../pipes/file-url-pipe';

// Gallery of a location / unit type / room:
//   1) POST /admin/media (multipart, purpose)  2) POST /admin/entity-images (attach)
//   PUT /admin/entity-images/{id}/cover, DELETE /admin/entity-images/{id}
@Component({
  selector: 'app-image-manager',
  imports: [FileUrlPipe],
  templateUrl: './image-manager.html',
})
export class ImageManager implements OnInit {
  private readonly api = inject(CatalogApi);
  private readonly toast = inject(Toast);
  private readonly confirm = inject(Confirm);

  readonly entityType = input.required<ImageEntityType>();
  readonly entityId = input.required<number>();
  readonly canEdit = input(true);

  readonly images = signal<EntityImage[]>([]);
  readonly loading = signal(true);
  readonly uploading = signal(0);
  readonly placeholders = computed(() => Array.from({ length: this.uploading() }));

  private get purpose(): MediaPurpose {
    return ({ Location: 'location', UnitType: 'unit_type', Room: 'room' } as const)[this.entityType()];
  }

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.api.entityImages(this.entityType(), this.entityId()).subscribe({
      next: (list) => {
        this.images.set([...list].sort((a, b) => Number(b.is_cover) - Number(a.is_cover) || a.sort_order - b.sort_order));
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  onFiles(input: HTMLInputElement): void {
    const files = Array.from(input.files ?? []);
    input.value = '';
    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        this.toast.warning(`${file.name} is not an image.`);
        continue;
      }
      if (file.size > 5 * 1024 * 1024) {
        this.toast.warning(`${file.name} is larger than 5 MB.`);
        continue;
      }
      this.uploading.update((n) => n + 1);
      const first = this.images().length === 0;
      this.api
        .uploadMedia(file, this.purpose)
        .pipe(
          switchMap((media) =>
            this.api.addEntityImage({
              entity_type: this.entityType(),
              entity_id: this.entityId(),
              media_id: media.id,
              sort_order: this.images().length + 1,
              is_cover: first,
            }),
          ),
        )
        .subscribe({
          next: () => {
            this.uploading.update((n) => n - 1);
            this.load();
          },
          error: () => this.uploading.update((n) => n - 1),
        });
    }
  }

  setCover(img: EntityImage): void {
    this.api.setCover(img.id).subscribe(() => {
      this.toast.success('Cover image updated.');
      this.load();
    });
  }

  async remove(img: EntityImage): Promise<void> {
    const ok = await this.confirm.ask({ title: 'Remove image?', message: 'The image will be removed from the gallery.', danger: true, confirmText: 'Remove' });
    if (!ok) return;
    this.api.deleteEntityImage(img.id).subscribe(() => {
      this.images.update((list) => list.filter((i) => i.id !== img.id));
      this.toast.success('Image removed.');
    });
  }
}
