class BatchModule {
  constructor(app) {
    this.app = app;
    this.batch_images = [];
    this.current_batch_index = 0;
    this.latest_settings = null;
    this.is_applying_settings = false;
    this.InitializeElements();
  }

  InitializeElements() {
    this.elements = {
      batch_input: document.getElementById('batch-input'),
      batch_download_btn: document.getElementById('batch-download-btn'),
      batch_apply_all_btn: document.getElementById('batch-apply-all-btn'),
      batch_list: document.getElementById('batch-list'),
      batch_count: document.getElementById('batch-count'),
      batch_section: document.getElementById('batch-section'),
      progress_container: document.getElementById('progress-container'),
      progress_bar: document.getElementById('progress-bar'),
      progress_text: document.getElementById('progress-text')
    };
  }

  HandleBatchUpload(event) {
    const files = event?.target?.files;
    if (!files || files.length === 0) return;
    const image_files = Array.from(files).filter(f =>
      f?.type?.startsWith('image/')
    );
    if (image_files.length === 0) {
      alert('กรุณาเลือกไฟล์ภาพที่ถูกต้อง');
      return;
    }
    this.batch_images = [];
    this.current_batch_index = 0;
    this.latest_settings = null;
    let processed_count = 0;
    let failed_count = 0;
    const FinishRead = () => {
      processed_count++;
      if (processed_count !== image_files.length) return;
      if (this.batch_images.length === 0) {
        alert('ไม่สามารถอ่านไฟล์ภาพที่เลือกได้');
        return;
      }
      this.batch_images.sort((a, b) => a.index - b.index);
      this.ShowBatchList();
      this.LoadBatchImage(0);
      if (failed_count > 0) {
        alert(`อ่านไฟล์ไม่สำเร็จ ${failed_count} ไฟล์`);
      }
    };
    image_files.forEach((file, index) => {
      const reader = new FileReader();
      reader.onload = e => {
        const image_data = e?.target?.result;
        if (typeof image_data === 'string') {
          this.batch_images.push({
            name: file.name,
            data: image_data,
            index: index,
            settings: null
          });
        } else {
          failed_count++;
        }
        FinishRead();
      };
      reader.onerror = () => {
        failed_count++;
        FinishRead();
      };
      reader.readAsDataURL(file);
    });
  }

  ShowBatchList() {
    if (!this.elements.batch_list) return;
    this.elements.batch_list.innerHTML = '';
    if (this.elements.batch_count) {
      this.elements.batch_count.textContent = `${this.batch_images.length} ไฟล์`;
    }
    this.batch_images.forEach((img, index) => {
      const item = document.createElement('button');
      item.type = 'button';
      item.className = 'batch-item';
      this.SetBatchItemActive(item, index === this.current_batch_index);
      item.textContent = `${index + 1}. ${img.name}`;
      item.addEventListener('click', () => this.LoadBatchImage(index));
      this.elements.batch_list.appendChild(item);
    });
    this.UpdateBatchBadges();
    this.elements.batch_section?.classList.remove('hidden');
    this.elements.batch_download_btn?.classList.remove('hidden');
    this.elements.batch_download_btn?.removeAttribute('disabled');
  }

  async LoadBatchImage(index) {
    if (index < 0 || index >= this.batch_images.length) return false;
    this.current_batch_index = index;
    const img = this.batch_images[index];
    this.app.cropper_module.pending_batch_settings =
      this.GetEffectiveSettings(index);
    this.UpdateBatchListActive();
    const was_applying_settings = this.is_applying_settings;
    this.is_applying_settings = true;
    try {
      return await this.app.LoadImage(img.data);
    } finally {
      this.is_applying_settings = was_applying_settings;
    }
  }

  GetEffectiveSettings(index) {
    return this.batch_images[index]?.settings ?? this.latest_settings;
  }

  RecordCurrentImageEdit() {
    if (this.is_applying_settings) return;
    if (!this.batch_images[this.current_batch_index]) return;
    const settings = this.SaveCurrentCropSettings();
    if (!settings) return;
    this.batch_images = this.batch_images.map((image, index) =>
      index === this.current_batch_index ? { ...image, settings } : image
    );
    this.latest_settings = {
      ...settings,
      watermark: settings.watermark ? { ...settings.watermark } : null
    };
    this.UpdateBatchBadges();
  }

  UpdateBatchListActive() {
    if (!this.elements.batch_list) return;
    const items = this.elements.batch_list.querySelectorAll('.batch-item');
    items.forEach((item, index) => {
      this.SetBatchItemActive(item, index === this.current_batch_index);
    });
  }

  SetBatchItemActive(item, is_active) {
    item.classList.toggle('active', is_active);
    if (is_active) {
      item.setAttribute('aria-current', 'true');
    } else {
      item.removeAttribute('aria-current');
    }
  }

  UpdateBatchBadges() {
    if (!this.elements.batch_list) return;
    const items = this.elements.batch_list.querySelectorAll('.batch-item');
    items.forEach((item, index) => {
      const has_own_settings = Boolean(this.batch_images[index]?.settings);
      const badge = item.querySelector('.batch-item-badge');
      if (has_own_settings && !badge) {
        const new_badge = document.createElement('span');
        new_badge.className = 'badge badge-success batch-item-badge';
        new_badge.textContent = 'ปรับเอง';
        item.appendChild(new_badge);
      } else if (!has_own_settings && badge) {
        badge.remove();
      }
    });
  }

  HandleApplyToAll() {
    if (this.batch_images.length === 0 || !this.app.cropper) return;
    const is_confirmed = confirm(
      'ใช้การตั้งค่าของภาพนี้กับทุกภาพ? ค่าที่ปรับแยกไว้ของแต่ละภาพจะถูกแทนที่'
    );
    if (!is_confirmed) return;
    const settings = this.SaveCurrentCropSettings();
    if (!settings) return;
    this.latest_settings = settings;
    this.batch_images = this.batch_images.map(image => ({
      ...image,
      settings: null
    }));
    this.UpdateBatchBadges();
  }

  async HandleBatchDownload() {
    if (this.batch_images.length === 0) {
      alert('กรุณาอัปโหลดภาพก่อน');
      return;
    }
    if (typeof JSZip === 'undefined') {
      alert('ไม่สามารถโหลด JSZip ได้');
      return;
    }
    if (!this.app.cropper) {
      alert('กรุณาตั้งค่า Crop ก่อน');
      return;
    }
    this.SwitchToEditorTab();
    this.ShowProgress(0, `กำลังเตรียม... (0/${this.batch_images.length})`);
    const zip = new JSZip();
    const folder = zip.folder('cropped-images');
    this.is_applying_settings = true;
    try {
      for (let i = 0; i < this.batch_images.length; i++) {
        const img = this.batch_images[i];
        const image_settings = this.GetEffectiveSettings(i);
        await this.LoadBatchImage(i);
        if (this.app.cropper) {
          const img_data = this.app.cropper.getImageData();
          const crop_data = this.app.cropper.getData();
          if (image_settings?.y_position_type === 'top') {
            this.app.cropper.setData({ y: 0 });
          } else if (image_settings?.y_position_type === 'bottom') {
            const max_y = img_data.naturalHeight - crop_data.height;
            this.app.cropper.setData({ y: Math.max(0, max_y) });
          }
          this.app.cropper.ConstrainSelectionToImage();
          await this.app.cropper.WaitForRender();
        }
        const canvas = await this.app.GetFinalCanvas(false);
        if (canvas) {
          const blob = await new Promise(resolve => {
            canvas.toBlob(
              resolve,
              `image/${this.app.export_format}`,
              this.app.quality
            );
          });
          if (blob) {
            const name_without_ext = img.name.replace(/\.[^/.]+$/, '');
            folder.file(
              `${name_without_ext}-cropped.${this.app.export_format}`,
              blob
            );
          }
        }
        const progress = ((i + 1) / this.batch_images.length) * 100;
        this.ShowProgress(
          progress,
          `กำลังประมวลผล... (${i + 1}/${this.batch_images.length})`
        );
      }
    } finally {
      this.is_applying_settings = false;
    }
    this.ShowProgress(100, 'กำลังสร้างไฟล์ ZIP...');
    const content = await zip.generateAsync({ type: 'blob' });
    const link = document.createElement('a');
    const download_url = URL.createObjectURL(content);
    link.href = download_url;
    link.download = `cropped-images-${Date.now()}.zip`;
    link.click();
    const REVOKE_DELAY_MS = 1000;
    setTimeout(() => URL.revokeObjectURL(download_url), REVOKE_DELAY_MS);
    this.HideProgress();
    alert(`ดาวน์โหลด ${this.batch_images.length} ไฟล์เสร็จสิ้น!`);
  }

  ShowProgress(percent, text) {
    if (this.elements.progress_container) {
      this.elements.progress_container.classList.remove('hidden');
    }
    if (this.elements.progress_bar) {
      this.elements.progress_bar.style.width = `${percent}%`;
    }
    if (this.elements.progress_text) {
      this.elements.progress_text.textContent = text;
    }
  }

  HideProgress() {
    if (this.elements.progress_container) {
      this.elements.progress_container.classList.add('hidden');
    }
  }

  SwitchToEditorTab() {
    const editor_tab_btn = document.querySelector('[data-tab="editor"]');
    if (editor_tab_btn) {
      editor_tab_btn.classList.remove('active');
      editor_tab_btn.classList.add('active');
      document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.add('hidden');
      });
      const target_tab = document.getElementById('tab-editor');
      if (target_tab) {
        target_tab.classList.remove('hidden');
      }
    }
  }

  SaveCurrentCropSettings() {
    if (!this.app.cropper) return null;
    const crop_data = this.app.cropper.getData();
    const crop_box_data = this.app.cropper.getCropBoxData();
    const container_data = this.app.cropper.getContainerData();
    const image_data = this.app.cropper.getImageData();
    const canvas_data = this.app.cropper.getCanvasData();
    const crop_height = crop_data.height;
    const crop_width = crop_data.width;
    const max_y = image_data.naturalHeight - crop_height;
    const max_x = image_data.naturalWidth - crop_width;
    const is_full_width =
      crop_data.x <= 5 &&
      crop_data.x + crop_width >= image_data.naturalWidth - 5;
    let y_position_type = 'ratio';
    let y_ratio = 0;
    if (max_y <= 5) {
      y_ratio = 0.5;
    } else if (crop_data.y <= 5) {
      y_position_type = 'top';
    } else if (crop_data.y >= max_y - 5) {
      y_position_type = 'bottom';
    } else {
      y_ratio = max_y > 0 ? crop_data.y / max_y : 0;
    }
    return {
      aspect_ratio: this.app.cropper.options.aspectRatio,
      y_position_type: y_position_type,
      y_ratio: y_ratio,
      x_ratio: max_x > 5 ? crop_data.x / max_x : 0.5,
      width_mode: is_full_width ? 'full' : 'ratio',
      absolute_x: crop_data.x,
      absolute_y: crop_data.y,
      ratio_width: crop_data.width / image_data.naturalWidth,
      crop_height_ratio: crop_data.height / image_data.naturalHeight,
      crop_box_ratio_left:
        (crop_box_data.left - canvas_data.left) / canvas_data.width,
      crop_box_ratio_top:
        (crop_box_data.top - canvas_data.top) / canvas_data.height,
      crop_box_ratio_width: crop_box_data.width / canvas_data.width,
      crop_box_ratio_height: crop_box_data.height / canvas_data.height,
      rotate: crop_data.rotate,
      scaleX: crop_data.scaleX,
      scaleY: crop_data.scaleY,
      zoom:
        parseFloat(this.app.cropper_module?.elements.zoom_slider?.value) || 1,
      flip_horizontal: this.app.cropper_module?.flip_horizontal ?? false,
      flip_vertical: this.app.cropper_module?.flip_vertical ?? false,
      brightness: this.app.filters_module?.brightness ?? 100,
      contrast: this.app.filters_module?.contrast ?? 100,
      saturation: this.app.filters_module?.saturation ?? 100,
      hue: this.app.filters_module?.hue ?? 0,
      blur: this.app.filters_module?.blur ?? 0,
      grayscale: this.app.filters_module?.grayscale ?? false,
      sepia: this.app.filters_module?.sepia ?? false,
      watermark: this.app.watermark_module?.watermark
        ? { ...this.app.watermark_module.watermark }
        : null
    };
  }

  ApplySavedCropSettings(settings) {
    if (!settings || !this.app.cropper) return;
    const aspect_ratio = settings.aspect_ratio;
    if (aspect_ratio !== undefined && !isNaN(aspect_ratio)) {
      this.app.cropper.setAspectRatio(aspect_ratio);
    }
    if (settings.flip_horizontal) {
      this.app.cropper_module.flip_horizontal = true;
      this.app.cropper.scaleX(-1);
    }
    if (settings.flip_vertical) {
      this.app.cropper_module.flip_vertical = true;
      this.app.cropper.scaleY(-1);
    }
    if (settings.rotate !== undefined && settings.rotate !== 0) {
      this.app.cropper.rotateTo(settings.rotate);
    }
    this.app.cropper.ApplySavedSelectionSettings(settings);
    if (this.app.filters_module && settings.brightness !== undefined) {
      this.app.filters_module.brightness = settings.brightness;
      this.app.filters_module.contrast = settings.contrast;
      this.app.filters_module.saturation = settings.saturation;
      this.app.filters_module.hue = settings.hue;
      this.app.filters_module.blur = settings.blur;
      this.app.filters_module.grayscale = settings.grayscale;
      this.app.filters_module.sepia = settings.sepia;
    }
    if (this.app.watermark_module && settings.watermark) {
      this.app.watermark_module.watermark = { ...settings.watermark };
    }
    this.app.UpdatePreview();
  }
}
