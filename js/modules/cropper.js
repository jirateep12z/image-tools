class CropperModule {
  constructor(app) {
    this.app = app;
    this.is_cropping = false;
    this.grid_enabled = false;
    this.resize_timeout = null;
    this.pending_batch_settings = null;
    this.InitializeElements();
    this.InitializeResizeHandler();
  }

  InitializeResizeHandler() {
    window.addEventListener('resize', () => {
      if (this.resize_timeout) {
        clearTimeout(this.resize_timeout);
      }
      this.resize_timeout = setTimeout(() => {
        this.HandleResize();
      }, 150);
    });
  }

  HandleResize() {
    if (this.app.cropper && this.app.elements.crop_image) {
      const aspect_ratio = this.app.cropper.options.aspectRatio;
      const image_src = this.app.elements.crop_image.src;
      this.app.cropper.destroy();
      this.app.cropper = null;
      setTimeout(() => {
        if (this.app.elements.crop_image) {
          this.app.cropper = new Cropper(this.app.elements.crop_image, {
            aspectRatio: aspect_ratio,
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
            ready: () => {
              if (this.elements.zoom_slider) {
                this.elements.zoom_slider.value = 0.1;
                if (this.elements.zoom_value) {
                  this.elements.zoom_value.textContent = '10%';
                }
                this.app.cropper.zoomTo(0.1);
              }
              this.UpdateCropInfo();
            },
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
        }
      }, 50);
    }
  }

  InitializeElements() {
    this.elements = {
      grid_overlay: document.getElementById('grid-overlay'),
      grid_toggle: document.getElementById('grid-toggle'),
      zoom_slider: document.getElementById('zoom-slider'),
      zoom_value: document.getElementById('zoom-value'),
      rotate_slider: document.getElementById('rotate-slider'),
      rotate_input: document.getElementById('rotate-input'),
      rotate_left_btn: document.getElementById('rotate-left-btn'),
      rotate_right_btn: document.getElementById('rotate-right-btn'),
      crop_info: document.getElementById('crop-info'),
      crop_dimensions: document.getElementById('crop-dimensions'),
      crop_position: document.getElementById('crop-position'),
      aspect_ratio_btns: document.querySelectorAll('.aspect-ratio-btn'),
      flip_horizontal_btn: document.getElementById('flip-horizontal-btn'),
      flip_vertical_btn: document.getElementById('flip-vertical-btn')
    };
    this.flip_horizontal = false;
    this.flip_vertical = false;
    this.current_rotation = 0;
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
        if (this.pending_batch_settings) {
          this.ApplyBatchSettings(this.pending_batch_settings);
          this.pending_batch_settings = null;
        } else {
          if (this.elements.zoom_slider) {
            this.elements.zoom_slider.value = 0.1;
            if (this.elements.zoom_value) {
              this.elements.zoom_value.textContent = '10%';
            }
            this.app.cropper.zoomTo(0.1);
          }
        }
        this.UpdateCropInfo();
        this.app.UpdatePreview();
        this.app.ShowButtons();
        if (this.app.history_module && !this.pending_batch_settings) {
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
    this.elements.aspect_ratio_btns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
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
    const zoom_percent = Math.round(zoom * 100);
    if (this.elements.zoom_value) {
      this.elements.zoom_value.textContent = `${zoom_percent}%`;
    }
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
    this.current_rotation = rotate;
    if (this.elements.rotate_slider) this.elements.rotate_slider.value = rotate;
    if (this.app.cropper) {
      this.app.cropper.rotateTo(rotate);
    }
  }

  HandleRotateLeft() {
    this.current_rotation -= 90;
    if (this.current_rotation < -180) this.current_rotation += 360;
    this.UpdateRotationUI();
    if (this.app.cropper) {
      this.app.cropper.rotateTo(this.current_rotation);
    }
  }

  HandleRotateRight() {
    this.current_rotation += 90;
    if (this.current_rotation > 180) this.current_rotation -= 360;
    this.UpdateRotationUI();
    if (this.app.cropper) {
      this.app.cropper.rotateTo(this.current_rotation);
    }
  }

  UpdateRotationUI() {
    if (this.elements.rotate_slider)
      this.elements.rotate_slider.value = this.current_rotation;
    if (this.elements.rotate_input)
      this.elements.rotate_input.value = this.current_rotation;
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
      if (this.elements.zoom_slider) this.elements.zoom_slider.value = 1;
      if (this.elements.rotate_slider) this.elements.rotate_slider.value = 0;
      if (this.elements.rotate_input) this.elements.rotate_input.value = 0;
      if (this.elements.zoom_value)
        this.elements.zoom_value.textContent = '100%';
      this.current_rotation = 0;
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

  ApplyBatchSettings(settings) {
    if (!settings || !this.app.cropper) return;
    const image_data = this.app.cropper.getImageData();
    const aspect_ratio = settings.aspect_ratio;
    const img_width = image_data.naturalWidth;
    const img_height = image_data.naturalHeight;
    if (aspect_ratio !== undefined && !isNaN(aspect_ratio)) {
      this.app.cropper.setAspectRatio(aspect_ratio);
    }
    let calc_height, calc_width;
    if (aspect_ratio && !isNaN(aspect_ratio)) {
      calc_width = img_width;
      calc_height = calc_width / aspect_ratio;
      if (calc_height > img_height) {
        calc_height = img_height;
        calc_width = calc_height * aspect_ratio;
      }
      if (calc_width > img_width) {
        calc_width = img_width;
        calc_height = calc_width / aspect_ratio;
      }
    } else {
      calc_width = img_width * (settings.ratio_width || 1);
      calc_height = img_height;
    }
    let calc_y = 0;
    const max_y = img_height - calc_height;
    if (settings.y_position_type === 'top') {
      calc_y = 0;
    } else if (settings.y_position_type === 'bottom') {
      calc_y = Math.max(0, max_y);
    } else {
      calc_y = settings.y_ratio * img_height;
      calc_y = Math.max(0, Math.min(calc_y, max_y));
    }
    let calc_x = (img_width - calc_width) / 2;
    calc_x = Math.max(0, calc_x);
    if (settings.flip_horizontal) {
      this.flip_horizontal = true;
      this.app.cropper.scaleX(-1);
    }
    if (settings.flip_vertical) {
      this.flip_vertical = true;
      this.app.cropper.scaleY(-1);
    }
    if (settings.rotate !== undefined && settings.rotate !== 0) {
      this.app.cropper.rotateTo(settings.rotate);
    }
    this.app.cropper.setData({
      x: calc_x,
      y: calc_y,
      width: Math.max(1, calc_width),
      height: Math.max(1, calc_height),
      rotate: settings.rotate || 0,
      scaleX: settings.flip_horizontal ? -1 : 1,
      scaleY: settings.flip_vertical ? -1 : 1
    });
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
  }
}
