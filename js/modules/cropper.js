class CropperModule {
  constructor(app) {
    this.app = app;
    this.is_cropping = false;
    this.grid_enabled = false;
    this.InitializeElements();
  }

  InitializeElements() {
    this.elements = {
      grid_overlay: document.getElementById('grid-overlay'),
      grid_toggle: document.getElementById('grid-toggle'),
      zoom_slider: document.getElementById('zoom-slider'),
      zoom_value: document.getElementById('zoom-value'),
      rotate_slider: document.getElementById('rotate-slider'),
      rotate_input: document.getElementById('rotate-input'),
      crop_info: document.getElementById('crop-info'),
      crop_dimensions: document.getElementById('crop-dimensions'),
      crop_position: document.getElementById('crop-position'),
      aspect_ratio_btns: document.querySelectorAll('.aspect-ratio-btn'),
      flip_horizontal_btn: document.getElementById('flip-horizontal-btn'),
      flip_vertical_btn: document.getElementById('flip-vertical-btn')
    };
    this.flip_horizontal = false;
    this.flip_vertical = false;
  }

  InitializeCropper() {
    if (typeof Cropper === 'undefined') {
      alert('ไม่สามารถโหลด Cropper.js ได้');
      return;
    }
    try {
      this.app.cropper = new Cropper(this.app.elements.crop_image, {
        aspectRatio: NaN,
        viewMode: 1,
        autoCropArea: 1,
        responsive: true,
        restore: true,
        guides: true,
        center: true,
        highlight: true,
        cropBoxMovable: true,
        cropBoxResizable: true,
        toggleDragModeOnDblclick: true,
        checkCrossOrigin: false,
        checkOrientation: false,
        cropstart: () => {
          this.is_cropping = true;
        },
        cropmove: () => {
          this.UpdateCropInfo();
          this.app.DebouncedPreviewUpdate();
        },
        cropend: () => {
          this.is_cropping = false;
          if (this.app.history_module) {
            this.app.history_module.SaveHistory();
          }
          this.app.UpdatePreview();
        },
        crop: () => {
          this.UpdateCropInfo();
          if (!this.is_cropping) {
            this.app.DebouncedPreviewUpdate();
          }
        }
      });
      setTimeout(() => {
        this.UpdateCropInfo();
        this.app.UpdatePreview();
        this.app.ShowButtons();
        if (this.app.history_module) {
          this.app.history_module.SaveHistory();
        }
      }, 100);
    } catch (error) {
      console.error('Error initializing Cropper:', error);
      alert('เกิดข้อผิดพลาดในการเริ่มต้น Cropper');
    }
  }

  UpdateCropInfo() {
    if (!this.app.cropper) return;
    const crop_box = this.app.cropper.getCropBoxData();
    if (
      crop_box &&
      this.elements.crop_dimensions &&
      this.elements.crop_position
    ) {
      this.elements.crop_dimensions.textContent = `${Math.round(
        crop_box.width
      )} × ${Math.round(crop_box.height)} px`;
      this.elements.crop_position.textContent = `(${Math.round(
        crop_box.left
      )}, ${Math.round(crop_box.top)})`;
      this.elements.crop_info?.classList.remove('hidden');
    }
  }

  HandleAspectRatioChange(event) {
    const btn = event.currentTarget;
    this.elements.aspect_ratio_btns.forEach(b =>
      b.classList.remove('border-blue-500')
    );
    btn.classList.add('border-blue-500');
    const ratio = parseFloat(btn.dataset.ratio);
    if (this.app.cropper) {
      this.app.cropper.setAspectRatio(ratio);
      if (this.app.history_module) {
        this.app.history_module.SaveHistory();
      }
    }
  }

  ToggleGrid(enabled) {
    this.grid_enabled = enabled;
    if (enabled) {
      this.ShowGrid();
    } else {
      this.HideGrid();
    }
  }

  ShowGrid() {
    if (!this.elements.grid_overlay) return;
    this.elements.grid_overlay.innerHTML = '';
    for (let i = 1; i <= 2; i++) {
      const h_line = document.createElement('div');
      h_line.className = 'grid-line horizontal';
      h_line.style.top = `${(i * 100) / 3}%`;
      this.elements.grid_overlay.appendChild(h_line);
      const v_line = document.createElement('div');
      v_line.className = 'grid-line vertical';
      v_line.style.left = `${(i * 100) / 3}%`;
      this.elements.grid_overlay.appendChild(v_line);
    }
    this.elements.grid_overlay.classList.remove('hidden');
  }

  HideGrid() {
    if (this.elements.grid_overlay) {
      this.elements.grid_overlay.classList.add('hidden');
    }
  }

  HandleZoomChange(event) {
    const zoom = parseFloat(event.target.value);
    this.elements.zoom_value.textContent = Math.round(zoom * 100);
    if (this.app.cropper) {
      this.app.cropper.zoomTo(zoom);
    }
  }

  HandleRotateSliderChange(event) {
    const rotate = parseFloat(event.target.value);
    this.elements.rotate_input.value = rotate;
    if (this.app.cropper) {
      this.app.cropper.rotateTo(rotate);
    }
  }

  HandleRotateInputChange(event) {
    const rotate = parseFloat(event.target.value);
    this.elements.rotate_slider.value = rotate;
    if (this.app.cropper) {
      this.app.cropper.rotateTo(rotate);
    }
  }

  HandleFlipHorizontal() {
    this.flip_horizontal = !this.flip_horizontal;
    if (this.app.history_module) {
      this.app.history_module.SaveHistory();
    }
    this.app.UpdatePreview();
  }

  HandleFlipVertical() {
    this.flip_vertical = !this.flip_vertical;
    if (this.app.history_module) {
      this.app.history_module.SaveHistory();
    }
    this.app.UpdatePreview();
  }

  HandleReset() {
    if (this.app.cropper) {
      this.app.cropper.reset();
      this.elements.zoom_slider.value = 0.1;
      this.elements.rotate_slider.value = 0;
      this.elements.rotate_input.value = 0;
      this.elements.zoom_value.textContent = '10';
      this.flip_horizontal = false;
      this.flip_vertical = false;
      if (this.app.filters_module) {
        this.app.filters_module.ResetFilters();
      }
      if (this.app.history_module) {
        this.app.history_module.SaveHistory();
      }
      this.app.UpdatePreview();
    }
  }

  MoveCropBox(direction, step = 10) {
    if (!this.app.cropper) return;
    const data = this.app.cropper.getData();
    switch (direction) {
      case 'up':
        this.app.cropper.setData({ y: data.y - step });
        break;
      case 'down':
        this.app.cropper.setData({ y: data.y + step });
        break;
      case 'left':
        this.app.cropper.setData({ x: data.x - step });
        break;
      case 'right':
        this.app.cropper.setData({ x: data.x + step });
        break;
    }
  }
}
