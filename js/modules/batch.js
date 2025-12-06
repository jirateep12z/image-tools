class BatchModule {
  constructor(app) {
    this.app = app;
    this.batch_images = [];
    this.current_batch_index = 0;
    this.InitializeElements();
  }

  InitializeElements() {
    this.elements = {
      batch_input: document.getElementById('batch-input'),
      batch_download_btn: document.getElementById('batch-download-btn'),
      batch_list: document.getElementById('batch-list'),
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
    let loaded_count = 0;
    image_files.forEach((file, index) => {
      const reader = new FileReader();
      reader.onload = e => {
        const image_data = e?.target?.result;
        if (typeof image_data === 'string') {
          this.batch_images.push({
            name: file.name,
            data: image_data,
            index: index
          });
          loaded_count++;
          if (loaded_count === image_files.length) {
            this.batch_images.sort((a, b) => a.index - b.index);
            this.ShowBatchList();
            this.LoadBatchImage(0);
          }
        }
      };
      reader.readAsDataURL(file);
    });
  }

  ShowBatchList() {
    if (!this.elements.batch_list) return;
    this.elements.batch_list.innerHTML = '';
    this.batch_images.forEach((img, index) => {
      const item = document.createElement('div');
      const is_active = index === this.current_batch_index;
      item.className = `batch-item ${is_active ? 'active' : ''}`;
      item.style.cssText = `
        padding: 10px 12px;
        cursor: pointer;
        border-radius: 8px;
        transition: all 0.2s;
        font-size: 13px;
        margin-bottom: 4px;
        background: ${
          is_active
            ? 'linear-gradient(135deg, var(--accent) 0%, var(--accent-dark) 100%)'
            : 'var(--bg-tertiary)'
        };
        color: ${is_active ? 'white' : 'var(--text-primary)'};
        font-weight: ${is_active ? '500' : 'normal'};
        box-shadow: ${is_active ? '0 2px 8px rgba(99, 102, 241, 0.3)' : 'none'};
      `;
      item.textContent = `${index + 1}. ${img.name}`;
      item.addEventListener('click', () => this.LoadBatchImage(index));
      item.addEventListener('mouseenter', () => {
        if (!item.classList.contains('active')) {
          item.style.background = 'var(--border-color)';
        }
      });
      item.addEventListener('mouseleave', () => {
        if (!item.classList.contains('active')) {
          item.style.background = 'var(--bg-tertiary)';
        }
      });
      this.elements.batch_list.appendChild(item);
    });
    this.elements.batch_section?.classList.remove('hidden');
    this.elements.batch_download_btn?.classList.remove('hidden');
    this.elements.batch_download_btn?.removeAttribute('disabled');
  }

  LoadBatchImage(index) {
    if (index < 0 || index >= this.batch_images.length) return;
    this.current_batch_index = index;
    const img = this.batch_images[index];
    this.app.LoadImage(img.data);
    this.UpdateBatchListActive();
  }

  UpdateBatchListActive() {
    if (!this.elements.batch_list) return;
    const items = this.elements.batch_list.querySelectorAll('.batch-item');
    items.forEach((item, index) => {
      if (index === this.current_batch_index) {
        item.classList.add('active');
        item.style.background =
          'linear-gradient(135deg, var(--accent) 0%, var(--accent-dark) 100%)';
        item.style.color = 'white';
        item.style.fontWeight = '500';
        item.style.boxShadow = '0 2px 8px rgba(99, 102, 241, 0.3)';
      } else {
        item.classList.remove('active');
        item.style.background = 'var(--bg-tertiary)';
        item.style.color = 'var(--text-primary)';
        item.style.fontWeight = 'normal';
        item.style.boxShadow = 'none';
      }
    });
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
    const saved_settings = this.SaveCurrentCropSettings();
    this.ShowProgress(0, `กำลังเตรียม... (0/${this.batch_images.length})`);
    const zip = new JSZip();
    const folder = zip.folder('cropped-images');
    for (let i = 0; i < this.batch_images.length; i++) {
      const img = this.batch_images[i];
      this.app.cropper_module.pending_batch_settings = saved_settings;
      this.LoadBatchImage(i);
      await new Promise(resolve => setTimeout(resolve, 500));
      if (this.app.cropper) {
        const img_data = this.app.cropper.getImageData();
        const crop_data = this.app.cropper.getData();
        if (saved_settings.y_position_type === 'top') {
          this.app.cropper.setData({ y: 0 });
        } else if (saved_settings.y_position_type === 'bottom') {
          const max_y = img_data.naturalHeight - crop_data.height;
          this.app.cropper.setData({ y: Math.max(0, max_y) });
        }
      }
      await new Promise(resolve => setTimeout(resolve, 100));
      const canvas = this.app.GetFinalCanvas(false);
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
    this.ShowProgress(100, 'กำลังสร้างไฟล์ ZIP...');
    const content = await zip.generateAsync({ type: 'blob' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(content);
    link.download = `cropped-images-${Date.now()}.zip`;
    link.click();
    URL.revokeObjectURL(link.href);
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
    const max_y = image_data.naturalHeight - crop_height;
    let y_position_type = 'ratio';
    let y_ratio = 0;
    if (crop_data.y <= 5) {
      y_position_type = 'top';
    } else if (crop_data.y >= max_y - 5) {
      y_position_type = 'bottom';
    } else {
      y_ratio = crop_data.y / image_data.naturalHeight;
    }
    return {
      aspect_ratio: this.app.cropper.options.aspectRatio,
      y_position_type: y_position_type,
      y_ratio: y_ratio,
      absolute_x: crop_data.x,
      absolute_y: crop_data.y,
      ratio_width: crop_data.width / image_data.naturalWidth,
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
        parseFloat(this.app.cropper_module?.elements.zoom_slider?.value) || 0.1,
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
    const current_image_data = this.app.cropper.getImageData();
    const aspect_ratio = settings.aspect_ratio;
    const img_width = current_image_data.naturalWidth;
    const img_height = current_image_data.naturalHeight;
    if (aspect_ratio !== undefined && !isNaN(aspect_ratio)) {
      this.app.cropper.setAspectRatio(aspect_ratio);
    }
    let calc_y = settings.absolute_y ?? 0;
    if (settings.absolute_y === 0) {
      calc_y = 0;
    }
    let available_height = img_height - calc_y;
    let calc_height, calc_width;
    if (aspect_ratio && !isNaN(aspect_ratio)) {
      calc_width = img_width;
      calc_height = calc_width / aspect_ratio;
      if (calc_height > available_height) {
        calc_height = available_height;
        calc_width = calc_height * aspect_ratio;
      }
      if (calc_width > img_width) {
        calc_width = img_width;
        calc_height = calc_width / aspect_ratio;
      }
    } else {
      calc_width = img_width * (settings.ratio_width || 1);
      calc_height = available_height;
    }
    let calc_x = (img_width - calc_width) / 2;
    calc_x = Math.max(0, calc_x);
    calc_y = Math.max(0, Math.min(calc_y, img_height - calc_height));
    if (settings.absolute_y === 0) {
      calc_y = 0;
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
    const new_crop_data = {
      x: calc_x,
      y: calc_y,
      width: Math.max(1, calc_width),
      height: Math.max(1, calc_height),
      rotate: settings.rotate || 0,
      scaleX: settings.flip_horizontal ? -1 : 1,
      scaleY: settings.flip_vertical ? -1 : 1
    };
    this.app.cropper.setData(new_crop_data);
    if (settings.absolute_y === 0) {
      this.app.cropper.setData({ y: 0 });
    }
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
