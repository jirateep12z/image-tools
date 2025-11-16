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
      item.className = `batch-item ${
        index === this.current_batch_index ? 'active' : ''
      }`;
      item.style.cssText =
        'padding: 0.5rem; cursor: pointer; border-radius: 6px; transition: all 0.2s;';
      item.textContent = `${index + 1}. ${img.name}`;
      item.addEventListener('click', () => this.LoadBatchImage(index));
      this.elements.batch_list.appendChild(item);
    });
    this.elements.batch_section?.classList.remove('hidden');
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
        item.style.background = 'var(--accent-color)';
        item.style.color = 'white';
      } else {
        item.classList.remove('active');
        item.style.background = 'var(--bg-tertiary)';
        item.style.color = 'var(--text-primary)';
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
      this.LoadBatchImage(i);
      await new Promise(resolve => setTimeout(resolve, 600));
      this.ApplySavedCropSettings(saved_settings);
      await new Promise(resolve => setTimeout(resolve, 300));
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
    const ratio_x = crop_data.x / image_data.naturalWidth;
    const ratio_y = crop_data.y / image_data.naturalHeight;
    const ratio_width = crop_data.width / image_data.naturalWidth;
    const ratio_height = crop_data.height / image_data.naturalHeight;
    const crop_box_ratio_left =
      (crop_box_data.left - canvas_data.left) / canvas_data.width;
    const crop_box_ratio_top =
      (crop_box_data.top - canvas_data.top) / canvas_data.height;
    const crop_box_ratio_width = crop_box_data.width / canvas_data.width;
    const crop_box_ratio_height = crop_box_data.height / canvas_data.height;
    return {
      aspect_ratio: this.app.cropper.options.aspectRatio,
      ratio_x: ratio_x,
      ratio_y: ratio_y,
      ratio_width: ratio_width,
      ratio_height: ratio_height,
      crop_box_ratio_left: crop_box_ratio_left,
      crop_box_ratio_top: crop_box_ratio_top,
      crop_box_ratio_width: crop_box_ratio_width,
      crop_box_ratio_height: crop_box_ratio_height,
      rotate: crop_data.rotate,
      scaleX: crop_data.scaleX,
      scaleY: crop_data.scaleY,
      zoom: this.app.cropper_module?.elements.zoom_slider?.value ?? 1,
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
    if (settings.aspect_ratio !== undefined) {
      this.app.cropper.setAspectRatio(settings.aspect_ratio);
    }
    if (settings.crop_box_ratio_left !== undefined) {
      const current_canvas_data = this.app.cropper.getCanvasData();
      const container_data = this.app.cropper.getContainerData();
      let new_crop_box_left =
        current_canvas_data.left +
        current_canvas_data.width * settings.crop_box_ratio_left;
      let new_crop_box_top =
        current_canvas_data.top +
        current_canvas_data.height * settings.crop_box_ratio_top;
      let new_crop_box_width =
        current_canvas_data.width * settings.crop_box_ratio_width;
      let new_crop_box_height = new_crop_box_width / settings.aspect_ratio;
      const max_height =
        current_canvas_data.height -
        (new_crop_box_top - current_canvas_data.top);
      if (new_crop_box_height > max_height) {
        new_crop_box_height = max_height;
        new_crop_box_width = new_crop_box_height * settings.aspect_ratio;
      }
      const new_crop_box_data = {
        left: new_crop_box_left,
        top: new_crop_box_top,
        width: new_crop_box_width,
        height: new_crop_box_height
      };
      this.app.cropper.setCropBoxData(new_crop_box_data);
    }
    if (settings.ratio_x !== undefined) {
      const current_image_data = this.app.cropper.getImageData();
      let calc_x = current_image_data.naturalWidth * settings.ratio_x;
      let calc_y = current_image_data.naturalHeight * settings.ratio_y;
      let calc_width = current_image_data.naturalWidth * settings.ratio_width;
      let calc_height = calc_width / settings.aspect_ratio;
      if (calc_y + calc_height > current_image_data.naturalHeight) {
        calc_height = current_image_data.naturalHeight - calc_y;
        calc_width = calc_height * settings.aspect_ratio;
      }
      if (calc_x + calc_width > current_image_data.naturalWidth) {
        calc_width = current_image_data.naturalWidth - calc_x;
        calc_height = calc_width / settings.aspect_ratio;
      }
      const new_crop_data = {
        x: calc_x,
        y: calc_y,
        width: calc_width,
        height: calc_height,
        rotate: settings.rotate || 0,
        scaleX: settings.scaleX || 1,
        scaleY: settings.scaleY || 1
      };
      this.app.cropper.setData(new_crop_data);
    }
    if (this.app.cropper_module) {
      if (settings.zoom !== undefined) {
        this.app.cropper.zoomTo(settings.zoom);
      }
      if (settings.rotate !== undefined) {
        this.app.cropper.rotateTo(settings.rotate);
      }
      if (settings.flip_horizontal) {
        this.app.cropper.scaleX(-1);
      }
      if (settings.flip_vertical) {
        this.app.cropper.scaleY(-1);
      }
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
