class CropperV2Adapter {
  constructor(cropper, app, cropper_module) {
    this.cropper = cropper;
    this.app = app;
    this.cropper_module = cropper_module;
    this.options = {
      aspectRatio: NaN
    };
    this.current_zoom = 1;
    this.current_rotation = 0;
  }

  destroy() {
    this.cropper.destroy();
  }

  GetCropperCanvas() {
    return this.cropper.getCropperCanvas();
  }

  GetCropperImage() {
    return this.cropper.getCropperImage();
  }

  GetCropperSelection() {
    return this.cropper.getCropperSelection();
  }

  GetNaturalImageSize() {
    const source_image = this.GetSourceImage();
    return {
      naturalWidth: source_image?.naturalWidth || 0,
      naturalHeight: source_image?.naturalHeight || 0
    };
  }

  GetSourceImage() {
    const image = this.GetCropperImage();
    const nested_image = image?.querySelector?.('img');
    return nested_image || this.cropper.element;
  }

  GetImageBounds() {
    const cropper_canvas = this.GetCropperCanvas();
    const cropper_image = this.GetCropperImage();
    if (!cropper_canvas || !cropper_image) return null;
    const canvas_rect = cropper_canvas.getBoundingClientRect();
    const image_rect = cropper_image.getBoundingClientRect();
    const natural_size = this.GetNaturalImageSize();
    if (
      !canvas_rect.width ||
      !canvas_rect.height ||
      !image_rect.width ||
      !image_rect.height ||
      !natural_size.naturalWidth ||
      !natural_size.naturalHeight
    ) {
      return null;
    }
    return {
      canvas_rect: canvas_rect,
      image_rect: image_rect,
      natural_width: natural_size.naturalWidth,
      natural_height: natural_size.naturalHeight,
      image_left: image_rect.left - canvas_rect.left,
      image_top: image_rect.top - canvas_rect.top,
      scale_x: natural_size.naturalWidth / image_rect.width,
      scale_y: natural_size.naturalHeight / image_rect.height,
      display_scale_x: image_rect.width / natural_size.naturalWidth,
      display_scale_y: image_rect.height / natural_size.naturalHeight
    };
  }

  GetSelectionData() {
    const selection = this.GetCropperSelection();
    if (!selection) return null;
    return {
      x: selection.x,
      y: selection.y,
      width: selection.width,
      height: selection.height
    };
  }

  GetImageLimitRect() {
    const image_bounds = this.GetImageBounds();
    if (!image_bounds) return null;
    const left = Math.ceil(Math.max(0, image_bounds.image_left));
    const top = Math.ceil(Math.max(0, image_bounds.image_top));
    const right = Math.floor(
      Math.min(
        image_bounds.canvas_rect.width,
        image_bounds.image_left + image_bounds.image_rect.width
      )
    );
    const bottom = Math.floor(
      Math.min(
        image_bounds.canvas_rect.height,
        image_bounds.image_top + image_bounds.image_rect.height
      )
    );
    return {
      left: left,
      top: top,
      width: Math.max(1, right - left),
      height: Math.max(1, bottom - top)
    };
  }

  ClampSelectionRect(
    x,
    y,
    width,
    height,
    aspect_ratio = this.options.aspectRatio
  ) {
    const image_limit = this.GetImageLimitRect();
    if (!image_limit) return null;
    let next_width = Math.max(1, width);
    let next_height = Math.max(1, height);
    const has_aspect_ratio = Number.isFinite(aspect_ratio) && aspect_ratio > 0;
    if (has_aspect_ratio) {
      if (next_width / next_height > aspect_ratio) {
        next_width = next_height * aspect_ratio;
      } else {
        next_height = next_width / aspect_ratio;
      }
      if (next_width > image_limit.width) {
        next_width = image_limit.width;
        next_height = next_width / aspect_ratio;
      }
      if (next_height > image_limit.height) {
        next_height = image_limit.height;
        next_width = next_height * aspect_ratio;
      }
      next_width = Math.max(1, Math.floor(next_width));
      next_height = Math.max(1, Math.round(next_width / aspect_ratio));
    } else {
      next_width = Math.floor(Math.min(next_width, image_limit.width));
      next_height = Math.floor(Math.min(next_height, image_limit.height));
    }
    next_width = Math.max(1, Math.min(next_width, image_limit.width));
    next_height = Math.max(1, Math.min(next_height, image_limit.height));
    const center_x = x + width / 2;
    const center_y = y + height / 2;
    const max_left = image_limit.left + image_limit.width - next_width;
    const max_top = image_limit.top + image_limit.height - next_height;
    const next_left = Math.min(
      Math.max(center_x - next_width / 2, image_limit.left),
      Math.max(image_limit.left, max_left)
    );
    const next_top = Math.min(
      Math.max(center_y - next_height / 2, image_limit.top),
      Math.max(image_limit.top, max_top)
    );
    return {
      left: next_left,
      top: next_top,
      width: next_width,
      height: next_height
    };
  }

  ChangeSelectionWithinImage(
    x,
    y,
    width,
    height,
    aspect_ratio = this.options.aspectRatio
  ) {
    const selection = this.GetCropperSelection();
    const rect = this.ClampSelectionRect(x, y, width, height, aspect_ratio);
    if (!selection || !rect) return;
    selection.$change(
      rect.left,
      rect.top,
      rect.width,
      rect.height,
      aspect_ratio
    );
  }

  WaitForRender() {
    return new Promise(resolve => {
      requestAnimationFrame(() => {
        requestAnimationFrame(resolve);
      });
    });
  }

  WaitForImageLayout() {
    const cropper_image = this.GetCropperImage();
    const source_image = cropper_image?.$image;
    if (!cropper_image || !source_image || cropper_image.$isReady) {
      return Promise.resolve();
    }
    return new Promise(resolve => {
      const HandleSettled = () => {
        source_image.removeEventListener('load', HandleSettled);
        source_image.removeEventListener('error', HandleSettled);
        resolve();
      };
      source_image.addEventListener('load', HandleSettled);
      source_image.addEventListener('error', HandleSettled);
    });
  }

  GetMaxSelectionRect(aspect_ratio = this.options.aspectRatio) {
    const image_limit = this.GetImageLimitRect();
    if (!image_limit) return null;
    const has_aspect_ratio = Number.isFinite(aspect_ratio) && aspect_ratio > 0;
    if (!has_aspect_ratio) {
      return {
        left: image_limit.left,
        top: image_limit.top,
        width: image_limit.width,
        height: image_limit.height
      };
    }
    let width = image_limit.width;
    let height = width / aspect_ratio;
    if (height > image_limit.height) {
      height = image_limit.height;
      width = height * aspect_ratio;
    }
    return {
      left: image_limit.left + (image_limit.width - width) / 2,
      top: image_limit.top + (image_limit.height - height) / 2,
      width: width,
      height: height
    };
  }

  getData() {
    const selection = this.GetSelectionData();
    const image_bounds = this.GetImageBounds();
    if (!selection || !image_bounds) {
      return {
        x: 0,
        y: 0,
        width: 0,
        height: 0,
        rotate: this.current_rotation,
        scaleX: this.cropper_module.flip_horizontal ? -1 : 1,
        scaleY: this.cropper_module.flip_vertical ? -1 : 1
      };
    }
    const crop_left =
      (selection.x - image_bounds.image_left) * image_bounds.scale_x;
    const crop_top =
      (selection.y - image_bounds.image_top) * image_bounds.scale_y;
    const crop_right =
      (selection.x + selection.width - image_bounds.image_left) *
      image_bounds.scale_x;
    const crop_bottom =
      (selection.y + selection.height - image_bounds.image_top) *
      image_bounds.scale_y;
    const x = Math.max(0, Math.min(crop_left, image_bounds.natural_width - 1));
    const y = Math.max(0, Math.min(crop_top, image_bounds.natural_height - 1));
    const right = Math.max(
      x + 1,
      Math.min(crop_right, image_bounds.natural_width)
    );
    const bottom = Math.max(
      y + 1,
      Math.min(crop_bottom, image_bounds.natural_height)
    );
    return {
      x: x,
      y: y,
      width: Math.max(1, right - x),
      height: Math.max(1, bottom - y),
      rotate: this.current_rotation,
      scaleX: this.cropper_module.flip_horizontal ? -1 : 1,
      scaleY: this.cropper_module.flip_vertical ? -1 : 1
    };
  }

  setData(data) {
    const selection = this.GetCropperSelection();
    const current_data = this.getData();
    const image_bounds = this.GetImageBounds();
    if (!selection || !image_bounds) return;
    const next_data = {
      x: data.x ?? current_data.x,
      y: data.y ?? current_data.y,
      width: data.width ?? current_data.width,
      height: data.height ?? current_data.height
    };
    const next_x =
      image_bounds.image_left + next_data.x * image_bounds.display_scale_x;
    const next_y =
      image_bounds.image_top + next_data.y * image_bounds.display_scale_y;
    const next_width = next_data.width * image_bounds.display_scale_x;
    const next_height = next_data.height * image_bounds.display_scale_y;
    if (data.rotate !== undefined) {
      this.rotateTo(data.rotate);
    }
    if (data.scaleX !== undefined) {
      this.cropper_module.flip_horizontal = data.scaleX < 0;
    }
    if (data.scaleY !== undefined) {
      this.cropper_module.flip_vertical = data.scaleY < 0;
    }
    this.ChangeSelectionWithinImage(
      next_x,
      next_y,
      Math.max(1, next_width),
      Math.max(1, next_height),
      this.options.aspectRatio
    );
  }

  getCropBoxData() {
    const selection = this.GetSelectionData();
    if (!selection) {
      return {
        left: 0,
        top: 0,
        width: 0,
        height: 0
      };
    }
    return {
      left: selection.x,
      top: selection.y,
      width: selection.width,
      height: selection.height
    };
  }

  setCropBoxData(data) {
    const selection = this.GetCropperSelection();
    const current_data = this.getCropBoxData();
    if (!selection) return;
    this.ChangeSelectionWithinImage(
      data.left ?? current_data.left,
      data.top ?? current_data.top,
      data.width ?? current_data.width,
      data.height ?? current_data.height,
      this.options.aspectRatio
    );
  }

  getImageData() {
    const natural_size = this.GetNaturalImageSize();
    const image_bounds = this.GetImageBounds();
    return {
      naturalWidth: natural_size.naturalWidth,
      naturalHeight: natural_size.naturalHeight,
      width: image_bounds?.image_rect.width ?? 0,
      height: image_bounds?.image_rect.height ?? 0
    };
  }

  getCanvasData() {
    const canvas_rect = this.GetCropperCanvas()?.getBoundingClientRect();
    return {
      left: 0,
      top: 0,
      width: canvas_rect?.width ?? 0,
      height: canvas_rect?.height ?? 0
    };
  }

  getContainerData() {
    return this.getCanvasData();
  }

  GetAspectRatio() {
    return this.options.aspectRatio;
  }

  ApplyAspectRatio(aspect_ratio) {
    this.options.aspectRatio = Number.isFinite(aspect_ratio)
      ? aspect_ratio
      : NaN;
    const selection = this.GetCropperSelection();
    if (selection) {
      selection.aspectRatio = this.options.aspectRatio;
    }
  }

  setAspectRatio(aspect_ratio) {
    this.ApplyAspectRatio(aspect_ratio);
    if (!this.GetCropperSelection()) return;
    this.FitSelectionToImage(this.options.aspectRatio);
    this.ApplyCropZoom(this.current_zoom);
  }

  zoomTo(zoom) {
    if (!Number.isFinite(zoom) || zoom <= 0) return;
    this.ApplyCropZoom(zoom);
  }

  rotateTo(rotate) {
    const cropper_image = this.GetCropperImage();
    if (!cropper_image || !Number.isFinite(rotate)) return;
    const rotate_delta = rotate - this.current_rotation;
    this.current_rotation = rotate;
    cropper_image.$rotate(`${rotate_delta}deg`);
  }

  scaleX(scale_x) {
    this.cropper_module.flip_horizontal = scale_x < 0;
  }

  scaleY(scale_y) {
    this.cropper_module.flip_vertical = scale_y < 0;
  }

  reset() {
    this.current_zoom = 1;
    this.current_rotation = 0;
    this.cropper_module.current_rotation = 0;
    this.cropper_module.flip_horizontal = false;
    this.cropper_module.flip_vertical = false;
    this.GetCropperImage()?.$resetTransform();
    this.GetCropperSelection()?.$reset();
    this.FitSelectionToImage();
  }

  ResetImageToContain() {
    const cropper_canvas = this.GetCropperCanvas();
    const cropper_image = this.GetCropperImage();
    const natural_size = this.GetNaturalImageSize();
    const canvas_rect = cropper_canvas?.getBoundingClientRect();
    if (
      !cropper_image ||
      !canvas_rect?.width ||
      !canvas_rect?.height ||
      !natural_size.naturalWidth ||
      !natural_size.naturalHeight
    ) {
      return;
    }
    const scale = Math.min(
      canvas_rect.width / natural_size.naturalWidth,
      canvas_rect.height / natural_size.naturalHeight
    );
    const width = natural_size.naturalWidth * scale;
    const height = natural_size.naturalHeight * scale;
    const left = (canvas_rect.width - width) / 2;
    const top = (canvas_rect.height - height) / 2;
    const origin_offset_x = ((1 - scale) * natural_size.naturalWidth) / 2;
    const origin_offset_y = ((1 - scale) * natural_size.naturalHeight) / 2;
    cropper_image.$setTransform?.(
      scale,
      0,
      0,
      scale,
      left - origin_offset_x,
      top - origin_offset_y
    );
    if (this.current_rotation) {
      cropper_image?.$rotate?.(`${this.current_rotation}deg`);
    }
  }

  FitSelectionToImage(aspect_ratio = this.options.aspectRatio) {
    const rect = this.GetMaxSelectionRect(aspect_ratio);
    if (!rect) return;
    this.ChangeSelectionWithinImage(
      rect.left,
      rect.top,
      rect.width,
      rect.height,
      aspect_ratio
    );
  }

  ApplyCropZoom(zoom) {
    const next_zoom = Math.max(1, zoom);
    const max_rect = this.GetMaxSelectionRect(this.options.aspectRatio);
    const current_rect = this.getCropBoxData();
    if (!max_rect || !current_rect) return;
    const center_x = current_rect.left + current_rect.width / 2;
    const center_y = current_rect.top + current_rect.height / 2;
    const next_width = max_rect.width / next_zoom;
    const next_height = max_rect.height / next_zoom;
    this.current_zoom = next_zoom;
    this.ChangeSelectionWithinImage(
      center_x - next_width / 2,
      center_y - next_height / 2,
      next_width,
      next_height,
      this.options.aspectRatio
    );
  }

  ApplySavedSelectionSettings(settings) {
    if (!settings) return;
    const image_limit = this.GetImageLimitRect();
    if (!image_limit) return;
    const aspect_ratio = this.options.aspectRatio;
    const has_aspect_ratio = Number.isFinite(aspect_ratio) && aspect_ratio > 0;
    const crop_zoom = Math.max(1, settings.zoom || 1);
    const base_rect =
      (has_aspect_ratio && this.GetMaxSelectionRect(aspect_ratio)) ||
      image_limit;
    let width, height;
    if (has_aspect_ratio) {
      width = base_rect.width / crop_zoom;
      height = base_rect.height / crop_zoom;
    } else {
      width =
        settings.width_mode === 'full'
          ? image_limit.width
          : image_limit.width * (settings.ratio_width || 1);
      height = image_limit.height * (settings.crop_height_ratio || 1);
    }
    const max_x = Math.max(0, image_limit.width - width);
    const max_y = Math.max(0, image_limit.height - height);
    const x =
      image_limit.left +
      Math.max(0, Math.min((settings.x_ratio ?? 0.5) * max_x, max_x));
    let y = image_limit.top;
    if (settings.y_position_type === 'bottom') {
      y = image_limit.top + max_y;
    } else if (settings.y_position_type !== 'top') {
      y =
        image_limit.top +
        Math.max(0, Math.min((settings.y_ratio ?? 0) * max_y, max_y));
    }
    this.current_zoom = crop_zoom;
    this.ChangeSelectionWithinImage(x, y, width, height, aspect_ratio);
  }

  ConstrainSelectionToImage() {
    const crop_box = this.getCropBoxData();
    this.ChangeSelectionWithinImage(
      crop_box.left,
      crop_box.top,
      crop_box.width,
      crop_box.height,
      this.options.aspectRatio
    );
  }

  async ToCanvas(max_size) {
    const selection = this.GetCropperSelection();
    if (!selection) return null;
    this.ConstrainSelectionToImage();
    await this.WaitForRender();
    const crop_data = this.getData();
    const max_dimension = Math.max(crop_data.width, crop_data.height);
    const scale = max_dimension > max_size ? max_size / max_dimension : 1;
    const width = Math.max(1, Math.floor(crop_data.width * scale));
    const height = Math.max(1, Math.floor(crop_data.height * scale));
    const source_image = this.GetSourceImage();
    if (source_image && this.current_rotation === 0) {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return canvas;
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(
        source_image,
        crop_data.x,
        crop_data.y,
        crop_data.width,
        crop_data.height,
        0,
        0,
        width,
        height
      );
      return canvas;
    }
    const canvas = await selection.$toCanvas({
      width: width,
      height: height,
      beforeDraw: (ctx, output_canvas) => {
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, output_canvas.width, output_canvas.height);
      }
    });
    return canvas;
  }
}

class CropperModule {
  constructor(app) {
    this.app = app;
    this.is_cropping = false;
    this.grid_enabled = false;
    this.resize_timeout = null;
    this.pending_batch_settings = null;
    this.flip_horizontal = false;
    this.flip_vertical = false;
    this.current_rotation = 0;
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
    if (!this.app.cropper) return;
    this.app.cropper.ResetImageToContain();
    setTimeout(() => {
      if (!this.app.cropper) return;
      this.app.cropper.ApplyCropZoom(this.app.cropper.current_zoom);
      this.UpdateCropInfo();
      this.app.UpdatePreview();
    }, 0);
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
  }

  GetTemplate() {
    return `
      <cropper-canvas background>
        <cropper-image initial-center-size="contain" rotatable></cropper-image>
        <cropper-shade hidden></cropper-shade>
        <cropper-handle action="select" plain></cropper-handle>
        <cropper-selection initial-coverage="1" movable resizable outlined>
          <cropper-grid role="grid" bordered covered></cropper-grid>
          <cropper-crosshair centered></cropper-crosshair>
          <cropper-handle action="move" theme-color="rgba(255, 255, 255, 0.35)"></cropper-handle>
          <cropper-handle action="n-resize"></cropper-handle>
          <cropper-handle action="e-resize"></cropper-handle>
          <cropper-handle action="s-resize"></cropper-handle>
          <cropper-handle action="w-resize"></cropper-handle>
          <cropper-handle action="ne-resize"></cropper-handle>
          <cropper-handle action="nw-resize"></cropper-handle>
          <cropper-handle action="se-resize"></cropper-handle>
          <cropper-handle action="sw-resize"></cropper-handle>
        </cropper-selection>
      </cropper-canvas>
    `;
  }

  InitializeCropper() {
    const cropper_namespace = window.Cropper;
    const CropperConstructor =
      typeof cropper_namespace === 'function'
        ? cropper_namespace
        : cropper_namespace?.default;
    if (typeof CropperConstructor === 'undefined') {
      alert('ไม่สามารถโหลด Cropper.js ได้');
      return Promise.resolve(false);
    }
    return new Promise(resolve => {
      try {
        const cropper = new CropperConstructor(this.app.elements.crop_image, {
          container: this.app.elements.cropper_container,
          template: this.GetTemplate()
        });
        this.app.cropper = new CropperV2Adapter(cropper, this.app, this);
        const cropper_canvas = this.app.cropper.GetCropperCanvas();
        const cropper_image = this.app.cropper.GetCropperImage();
        if (!cropper_image) {
          alert('ไม่สามารถสร้าง Cropper Image ได้');
          resolve(false);
          return;
        }
        cropper_canvas?.addEventListener('actionstart', () => {
          this.is_cropping = true;
        });
        cropper_canvas?.addEventListener('actionmove', () => {
          this.UpdateCropInfo();
          this.app.DebouncedPreviewUpdate();
        });
        cropper_canvas?.addEventListener('actionend', () => {
          this.is_cropping = false;
          this.app.cropper.ConstrainSelectionToImage();
          if (this.app.history_module) {
            this.app.history_module.SaveHistory();
          }
          this.app.UpdatePreview();
        });
        cropper_canvas?.addEventListener('action', () => {
          this.UpdateCropInfo();
          if (!this.is_cropping) {
            this.app.DebouncedPreviewUpdate();
          }
        });
        const cropper_selection = this.app.cropper.GetCropperSelection();
        cropper_selection?.addEventListener('change', () => {
          queueMicrotask(() => this.UpdateCropInfo());
        });
        cropper_image
          .$ready()
          .then(async () => {
            await this.app.cropper.WaitForImageLayout();
            const has_pending_batch_settings = Boolean(
              this.pending_batch_settings
            );
            if (has_pending_batch_settings) {
              this.app.cropper.ResetImageToContain();
              await this.app.cropper.WaitForRender();
              this.ApplyBatchSettings(this.pending_batch_settings);
              this.pending_batch_settings = null;
              await this.app.cropper.WaitForRender();
            } else {
              if (this.elements.zoom_slider) {
                this.elements.zoom_slider.value = 1;
                if (this.elements.zoom_value) {
                  this.elements.zoom_value.textContent = '100%';
                }
                this.app.cropper.zoomTo(1);
              }
              this.app.cropper.ResetImageToContain();
              this.app.cropper.FitSelectionToImage();
              setTimeout(() => {
                this.app.cropper?.ResetImageToContain();
                this.app.cropper?.FitSelectionToImage();
                this.UpdateCropInfo();
                this.app.UpdatePreview();
              }, 100);
            }
            this.UpdateCropInfo();
            this.app.UpdatePreview();
            this.app.ShowButtons();
            if (this.app.history_module) {
              this.app.history_module.SaveHistory(false);
            }
            resolve(true);
          })
          .catch(error => {
            console.error('Error loading image in Cropper:', error);
            alert('เกิดข้อผิดพลาดในการโหลดภาพใน Cropper');
            resolve(false);
          });
      } catch (error) {
        console.error('Error initializing Cropper:', error);
        alert('เกิดข้อผิดพลาดในการเริ่มต้น Cropper');
        resolve(false);
      }
    });
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
      this.app.UpdatePreview();
    }
  }

  SyncAspectRatioButtons(aspect_ratio) {
    this.elements.aspect_ratio_btns.forEach(btn => {
      const button_ratio = parseFloat(btn.dataset.ratio);
      const is_match = Number.isNaN(aspect_ratio)
        ? Number.isNaN(button_ratio)
        : button_ratio === aspect_ratio;
      btn.classList.toggle('active', is_match);
    });
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
    const raw_zoom = parseFloat(event?.target?.value);
    const zoom = Number.isFinite(raw_zoom) ? Math.max(1, raw_zoom) : 1;
    const zoom_percent = Math.round(zoom * 100);
    if (event?.target) {
      event.target.value = zoom;
    }
    if (this.elements.zoom_value) {
      this.elements.zoom_value.textContent = `${zoom_percent}%`;
    }
    if (this.app.cropper) {
      this.app.cropper.zoomTo(zoom);
      this.UpdateCropInfo();
      this.app.UpdatePreview();
    }
  }

  GetValidRotation(value) {
    const rotate = parseFloat(value);
    if (!Number.isFinite(rotate)) return null;
    return Math.max(-180, Math.min(180, rotate));
  }

  HandleRotateSliderChange(event) {
    const rotate = this.GetValidRotation(event.target.value);
    if (rotate === null) return;
    this.current_rotation = rotate;
    this.elements.rotate_input.value = rotate;
    if (this.app.cropper) {
      this.app.cropper.rotateTo(rotate);
      this.app.UpdatePreview();
    }
  }

  HandleRotateInputChange(event) {
    const rotate = this.GetValidRotation(event.target.value);
    if (rotate === null) return;
    this.current_rotation = rotate;
    if (this.elements.rotate_slider) this.elements.rotate_slider.value = rotate;
    if (this.app.cropper) {
      this.app.cropper.rotateTo(rotate);
      this.app.UpdatePreview();
    }
  }

  HandleRotateLeft() {
    this.current_rotation -= 90;
    if (this.current_rotation < -180) this.current_rotation += 360;
    this.UpdateRotationUI();
    if (this.app.cropper) {
      this.app.cropper.rotateTo(this.current_rotation);
      this.app.UpdatePreview();
      this.app.history_module?.SaveHistory();
    }
  }

  HandleRotateRight() {
    this.current_rotation += 90;
    if (this.current_rotation > 180) this.current_rotation -= 360;
    this.UpdateRotationUI();
    if (this.app.cropper) {
      this.app.cropper.rotateTo(this.current_rotation);
      this.app.UpdatePreview();
      this.app.history_module?.SaveHistory();
    }
  }

  UpdateRotationUI() {
    if (this.elements.rotate_slider)
      this.elements.rotate_slider.value = this.current_rotation;
    if (this.elements.rotate_input)
      this.elements.rotate_input.value = this.current_rotation;
  }

  SyncZoomControls(zoom) {
    if (this.elements.zoom_slider) this.elements.zoom_slider.value = zoom;
    if (this.elements.zoom_value) {
      this.elements.zoom_value.textContent = `${Math.round(zoom * 100)}%`;
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
    this.app.batch_module?.RecordCurrentImageEdit();
    this.app.UpdatePreview();
  }

  ApplyBatchSettings(settings) {
    if (!settings || !this.app.cropper) return;
    const aspect_ratio = settings.aspect_ratio;
    if (aspect_ratio !== undefined && !isNaN(aspect_ratio)) {
      this.app.cropper.setAspectRatio(aspect_ratio);
    }
    this.SyncAspectRatioButtons(this.app.cropper.GetAspectRatio());
    this.flip_horizontal = Boolean(settings.flip_horizontal);
    this.flip_vertical = Boolean(settings.flip_vertical);
    const rotate = Number.isFinite(settings.rotate) ? settings.rotate : 0;
    this.current_rotation = rotate;
    this.app.cropper.rotateTo(rotate);
    this.UpdateRotationUI();
    this.app.cropper.ApplySavedSelectionSettings(settings);
    this.SyncZoomControls(this.app.cropper.current_zoom);
    if (this.app.filters_module && settings.brightness !== undefined) {
      this.app.filters_module.brightness = settings.brightness;
      this.app.filters_module.contrast = settings.contrast;
      this.app.filters_module.saturation = settings.saturation;
      this.app.filters_module.hue = settings.hue;
      this.app.filters_module.blur = settings.blur;
      this.app.filters_module.grayscale = settings.grayscale;
      this.app.filters_module.sepia = settings.sepia;
      this.app.filters_module.SyncFilterControls();
    }
    if (this.app.watermark_module && settings.watermark) {
      this.app.watermark_module.watermark = { ...settings.watermark };
      this.app.watermark_module.SyncWatermarkControls();
    }
  }
}
