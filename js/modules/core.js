class CropAppCore {
  constructor() {
    this.cropper = null;
    this.original_image_data = null;
    this.quality = 1.0;
    this.export_format = 'jpeg';
    this.is_dark_mode = true;
    this.InitializeElements();
    this.InitializeDarkMode();
    this.InitializeTabsScroll();
  }

  InitializeElements() {
    this.elements = {
      image_input: document.getElementById('image-input'),
      upload_section: document.getElementById('upload-section'),
      tools_section: document.getElementById('tools-section'),
      crop_image: document.getElementById('crop-image'),
      cropper_container: document.getElementById('cropper-container'),
      preview_image: document.getElementById('preview-image'),
      preview_placeholder: document.getElementById('preview-placeholder'),
      reset_btn: document.getElementById('reset-btn'),
      download_btn: document.getElementById('download-btn'),
      copy_btn: document.getElementById('copy-btn'),
      undo_btn: document.getElementById('undo-btn'),
      redo_btn: document.getElementById('redo-btn'),
      quality_slider: document.getElementById('quality-slider'),
      quality_value: document.getElementById('quality-value'),
      export_format: document.getElementById('export-format'),
      image_url_input: document.getElementById('image-url-input'),
      load_url_btn: document.getElementById('load-url-btn'),
      dark_mode_toggle: document.getElementById('dark-mode-toggle'),
      dark_mode_icon: document.getElementById('dark-mode-icon'),
      tab_buttons: document.querySelectorAll('.tab-btn'),
      tabs_container: document.getElementById('tabs-container')
    };
  }

  InitializeDarkMode() {
    const html = document.documentElement;
    const saved_mode = localStorage.getItem('dark_mode');
    this.is_dark_mode = saved_mode !== 'false';
    if (this.is_dark_mode) {
      html.classList.add('dark');
      this.elements.dark_mode_icon.textContent = '🌙';
    } else {
      html.classList.remove('dark');
      this.elements.dark_mode_icon.textContent = '☀️';
    }
  }

  InitializeTabsScroll() {
    if (this.elements.tabs_container) {
      this.elements.tabs_container.addEventListener('wheel', e => {
        e.preventDefault();
        this.elements.tabs_container.scrollLeft += e.deltaY;
      });
    }
  }

  ToggleDarkMode() {
    this.is_dark_mode = !this.is_dark_mode;
    const html = document.documentElement;
    if (this.is_dark_mode) {
      html.classList.add('dark');
      this.elements.dark_mode_icon.textContent = '🌙';
    } else {
      html.classList.remove('dark');
      this.elements.dark_mode_icon.textContent = '☀️';
    }
    localStorage.setItem('dark_mode', this.is_dark_mode);
  }

  HandleTabChange(event) {
    const tab_name = event.currentTarget.dataset.tab;
    this.elements.tab_buttons.forEach(btn => btn.classList.remove('active'));
    event.currentTarget.classList.add('active');
    document.querySelectorAll('.tab-content').forEach(content => {
      content.classList.add('hidden');
    });
    const target_tab = document.getElementById(`tab-${tab_name}`);
    if (target_tab) {
      target_tab.classList.remove('hidden');
    }
  }

  HandleImageUpload(event) {
    const file = event?.target?.files?.[0];
    if (!file || !file.type.startsWith('image/')) {
      alert('กรุณาเลือกไฟล์ภาพที่ถูกต้อง');
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => alert('ไม่สามารถอ่านไฟล์ได้');
    reader.onload = e => {
      const image_data = e?.target?.result;
      if (typeof image_data === 'string') {
        this.LoadImage(image_data);
      }
    };
    reader.readAsDataURL(file);
  }

  HandleDragOver(event) {
    event.preventDefault();
    event.stopPropagation();
    event.dataTransfer.dropEffect = 'copy';
  }

  HandleDrop(event) {
    event?.preventDefault();
    event?.stopPropagation();
    const files = event?.dataTransfer?.files;
    if (!files || files.length === 0) return;
    const image_files = Array.from(files).filter(f =>
      f?.type?.startsWith('image/')
    );
    if (image_files.length === 0) {
      alert('กรุณาลากไฟล์ภาพที่ถูกต้อง');
      return;
    }
    const reader = new FileReader();
    reader.onload = e => {
      const image_data = e?.target?.result;
      if (typeof image_data === 'string') {
        this.LoadImage(image_data);
      }
    };
    reader.readAsDataURL(image_files[0]);
  }

  HandleLoadFromUrl() {
    const url = this.elements.image_url_input?.value?.trim();
    if (!url) {
      alert('กรุณาใส่ URL ภาพ');
      return;
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        const image_data = canvas.toDataURL('image/jpeg');
        this.LoadImage(image_data);
        this.elements.image_url_input.value = '';
      }
    };
    img.onerror = () => alert('ไม่สามารถโหลดภาพจาก URL ได้');
    img.src = url;
  }

  HandlePaste(event) {
    const items = event?.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item?.kind === 'file' && item?.type?.startsWith('image/')) {
        event.preventDefault();
        const file = item.getAsFile();
        if (file) {
          const reader = new FileReader();
          reader.onload = e => {
            const image_data = e?.target?.result;
            if (typeof image_data === 'string') {
              this.LoadImage(image_data);
            }
          };
          reader.readAsDataURL(file);
        }
        return;
      }
    }
  }

  LoadImage(image_data) {
    if (!image_data || typeof image_data !== 'string') {
      alert('ข้อมูลภาพไม่ถูกต้อง');
      return;
    }
    this.original_image_data = image_data;
    this.elements.crop_image.src = image_data;
    this.elements.crop_image.alt = 'Crop Image';
    this.elements.upload_section?.classList.add('hidden');
    this.elements.tools_section?.classList.remove('hidden');
    if (this.cropper) {
      this.cropper.destroy();
      this.cropper = null;
    }
  }

  ShowButtons() {
    this.elements.reset_btn?.removeAttribute('disabled');
    this.elements.download_btn?.removeAttribute('disabled');
    this.elements.copy_btn?.removeAttribute('disabled');
    this.elements.undo_btn?.removeAttribute('disabled');
    this.elements.redo_btn?.removeAttribute('disabled');
  }

  HideButtons() {
    this.elements.reset_btn?.setAttribute('disabled', 'disabled');
    this.elements.download_btn?.setAttribute('disabled', 'disabled');
    this.elements.copy_btn?.setAttribute('disabled', 'disabled');
    this.elements.undo_btn?.setAttribute('disabled', 'disabled');
    this.elements.redo_btn?.setAttribute('disabled', 'disabled');
  }

  HandleQualityChange(event) {
    const quality = parseFloat(event?.target?.value);
    if (isNaN(quality) || quality < 10 || quality > 100) return;
    this.quality = quality / 100;
    if (this.elements?.quality_value) {
      this.elements.quality_value.textContent = quality;
    }
    if (this.compressor_module) {
      this.compressor_module.SyncQualityFromSidebar(quality);
    }
  }

  HandleFormatChange(event) {
    const format = event?.target?.value;
    if (!format || !['jpeg', 'png', 'webp'].includes(format)) return;
    this.export_format = format;
    if (this.compressor_module) {
      this.compressor_module.SyncFormatFromSidebar(format);
    }
  }

  HandleDownload() {
    if (!this.cropper) {
      alert('กรุณาอัปโหลดภาพก่อน');
      return;
    }
    const canvas = this.GetFinalCanvas();
    if (!canvas) {
      alert('ไม่สามารถสร้างภาพตัดได้');
      return;
    }
    const link = document.createElement('a');
    link.href = canvas.toDataURL(`image/${this.export_format}`, this.quality);
    link.download = `cropped-${Date.now()}.${this.export_format}`;
    link.click();
  }

  async HandleCopy() {
    if (!this.cropper) {
      alert('กรุณาอัปโหลดภาพก่อน');
      return;
    }
    const canvas = this.GetFinalCanvas();
    if (!canvas) {
      alert('ไม่สามารถสร้างภาพตัดได้');
      return;
    }
    canvas.toBlob(
      async blob => {
        if (!blob) return;
        try {
          await navigator?.clipboard?.write([
            new ClipboardItem({ [blob.type]: blob })
          ]);
          alert('คัดลอกไปยังคลิปบอร์ดแล้ว');
        } catch (error) {
          alert('ไม่สามารถคัดลอกได้');
        }
      },
      `image/${this.export_format}`,
      this.quality
    );
  }

  DebouncedPreviewUpdate() {
    if (this.preview_timeout) {
      clearTimeout(this.preview_timeout);
    }
    const now = Date.now();
    if (now - this.last_preview_time < 100) {
      this.preview_timeout = setTimeout(() => {
        this.UpdatePreview();
      }, 150);
    } else {
      this.last_preview_time = now;
      this.UpdatePreview();
    }
  }

  UpdatePreview() {
    if (!this.cropper) return;
    const canvas = this.GetFinalCanvas(true);
    if (!canvas) return;
    const preview_data = canvas.toDataURL(`image/${this.export_format}`, 0.8);
    if (this.elements?.preview_image) {
      this.elements.preview_image.src = preview_data;
      this.elements.preview_image.classList.remove('hidden');
    }
    if (this.elements?.preview_placeholder) {
      this.elements.preview_placeholder.classList.add('hidden');
    }
  }
}
