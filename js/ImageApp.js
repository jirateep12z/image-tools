class ImageApp extends CropAppCore {
  constructor() {
    super();
    this.preview_timeout = null;
    this.last_preview_time = 0;
    this.cropper_module = new CropperModule(this);
    this.filters_module = new FiltersModule(this);
    this.history_module = new HistoryModule(this);
    this.watermark_module = new WatermarkModule(this);
    this.compressor_module = new CompressorModule(this);
    this.comparison_module = new ComparisonModule(this);
    this.keyboard_module = new KeyboardModule(this);
    this.batch_module = new BatchModule(this);
    this.AttachAllEventListeners();
  }

  AttachAllEventListeners() {
    if (this.elements.image_input) {
      this.elements.image_input.addEventListener('change', e =>
        this.HandleImageUpload(e)
      );
    }
    if (this.elements.upload_section) {
      this.elements.upload_section.addEventListener('dragover', e =>
        this.HandleDragOver(e)
      );
      this.elements.upload_section.addEventListener('drop', e =>
        this.HandleDrop(e)
      );
    }
    if (this.elements.load_url_btn) {
      this.elements.load_url_btn.addEventListener('click', () =>
        this.HandleLoadFromUrl()
      );
    }
    if (this.elements.image_url_input) {
      this.elements.image_url_input.addEventListener('keypress', e => {
        if (e.key === 'Enter') this.HandleLoadFromUrl();
      });
    }
    if (this.elements.dark_mode_toggle) {
      this.elements.dark_mode_toggle.addEventListener('click', () =>
        this.ToggleDarkMode()
      );
    }
    if (this.elements.tab_buttons) {
      this.elements.tab_buttons.forEach(btn => {
        btn.addEventListener('click', e => {
          this.HandleTabChange(e);
          if (e.currentTarget.dataset.tab === 'editor') {
            this.cropper_module.HandleResize();
          }
          if (e.currentTarget.dataset.tab === 'compare') {
            this.comparison_module.UpdateComparisonSlider();
          }
          if (e.currentTarget.dataset.tab === 'compressor') {
            this.compressor_module.OnTabActivated();
          }
        });
      });
    }
    if (this.elements.quality_slider) {
      this.elements.quality_slider.addEventListener('input', e =>
        this.HandleQualityChange(e)
      );
    }
    if (this.elements.export_format) {
      this.elements.export_format.addEventListener('change', e =>
        this.HandleFormatChange(e)
      );
    }
    if (this.elements.download_btn) {
      this.elements.download_btn.addEventListener('click', () =>
        this.HandleDownload()
      );
    }
    if (this.elements.copy_btn) {
      this.elements.copy_btn.addEventListener('click', () => this.HandleCopy());
    }
    if (this.cropper_module.elements.aspect_ratio_btns) {
      this.cropper_module.elements.aspect_ratio_btns.forEach(btn => {
        btn.addEventListener('click', e =>
          this.cropper_module.HandleAspectRatioChange(e)
        );
      });
    }
    if (this.cropper_module.elements.grid_toggle) {
      this.cropper_module.elements.grid_toggle.addEventListener('change', e =>
        this.cropper_module.ToggleGrid(e.target.checked)
      );
    }
    if (this.cropper_module.elements.zoom_slider) {
      this.cropper_module.elements.zoom_slider.addEventListener('input', e =>
        this.cropper_module.HandleZoomChange(e)
      );
    }
    if (this.cropper_module.elements.rotate_slider) {
      this.cropper_module.elements.rotate_slider.addEventListener('input', e =>
        this.cropper_module.HandleRotateSliderChange(e)
      );
    }
    if (this.cropper_module.elements.rotate_input) {
      this.cropper_module.elements.rotate_input.addEventListener('input', e =>
        this.cropper_module.HandleRotateInputChange(e)
      );
    }
    if (this.cropper_module.elements.rotate_left_btn) {
      this.cropper_module.elements.rotate_left_btn.addEventListener(
        'click',
        () => this.cropper_module.HandleRotateLeft()
      );
    }
    if (this.cropper_module.elements.rotate_right_btn) {
      this.cropper_module.elements.rotate_right_btn.addEventListener(
        'click',
        () => this.cropper_module.HandleRotateRight()
      );
    }
    if (this.cropper_module.elements.flip_horizontal_btn) {
      this.cropper_module.elements.flip_horizontal_btn.addEventListener(
        'click',
        () => this.cropper_module.HandleFlipHorizontal()
      );
    }
    if (this.cropper_module.elements.flip_vertical_btn) {
      this.cropper_module.elements.flip_vertical_btn.addEventListener(
        'click',
        () => this.cropper_module.HandleFlipVertical()
      );
    }
    if (this.filters_module.elements.brightness_slider) {
      this.filters_module.elements.brightness_slider.addEventListener(
        'input',
        e => this.filters_module.HandleBrightnessChange(e)
      );
    }
    if (this.filters_module.elements.contrast_slider) {
      this.filters_module.elements.contrast_slider.addEventListener(
        'input',
        e => this.filters_module.HandleContrastChange(e)
      );
    }
    if (this.filters_module.elements.saturation_slider) {
      this.filters_module.elements.saturation_slider.addEventListener(
        'input',
        e => this.filters_module.HandleSaturationChange(e)
      );
    }
    if (this.filters_module.elements.hue_slider) {
      this.filters_module.elements.hue_slider.addEventListener('input', e =>
        this.filters_module.HandleHueChange(e)
      );
    }
    if (this.filters_module.elements.blur_slider) {
      this.filters_module.elements.blur_slider.addEventListener('input', e =>
        this.filters_module.HandleBlurChange(e)
      );
    }
    if (this.filters_module.elements.grayscale_btn) {
      this.filters_module.elements.grayscale_btn.addEventListener('click', () =>
        this.filters_module.ToggleGrayscale()
      );
    }
    if (this.filters_module.elements.sepia_btn) {
      this.filters_module.elements.sepia_btn.addEventListener('click', () =>
        this.filters_module.ToggleSepia()
      );
    }
    if (this.watermark_module.elements.watermark_text) {
      this.watermark_module.elements.watermark_text.addEventListener(
        'input',
        () => this.watermark_module.ApplyWatermark()
      );
    }
    if (this.watermark_module.elements.watermark_size) {
      this.watermark_module.elements.watermark_size.addEventListener(
        'input',
        () => this.watermark_module.ApplyWatermark()
      );
    }
    if (this.watermark_module.elements.watermark_color) {
      this.watermark_module.elements.watermark_color.addEventListener(
        'input',
        () => this.watermark_module.ApplyWatermark()
      );
    }
    if (this.watermark_module.elements.watermark_opacity) {
      this.watermark_module.elements.watermark_opacity.addEventListener(
        'input',
        e => {
          this.watermark_module.watermark.opacity = parseInt(e.target.value);
          this.watermark_module.elements.watermark_opacity_value.textContent =
            this.watermark_module.watermark.opacity;
          this.watermark_module.ApplyWatermark();
        }
      );
    }
    if (this.watermark_module.elements.watermark_rotate) {
      this.watermark_module.elements.watermark_rotate.addEventListener(
        'input',
        e => {
          this.watermark_module.HandleRotateChange(e);
          this.watermark_module.ApplyWatermark();
        }
      );
    }
    if (this.watermark_module.elements.watermark_font) {
      this.watermark_module.elements.watermark_font.addEventListener(
        'change',
        e => {
          this.watermark_module.HandleFontChange(e);
          this.watermark_module.ApplyWatermark();
        }
      );
    }
    if (this.watermark_module.elements.watermark_font_weight) {
      this.watermark_module.elements.watermark_font_weight.addEventListener(
        'change',
        e => {
          this.watermark_module.HandleFontWeightChange(e);
          this.watermark_module.ApplyWatermark();
        }
      );
    }
    if (this.watermark_module.elements.watermark_offset_x) {
      this.watermark_module.elements.watermark_offset_x.addEventListener(
        'input',
        e => {
          this.watermark_module.HandleOffsetXChange(e);
          this.watermark_module.ApplyWatermark();
        }
      );
    }
    if (this.watermark_module.elements.watermark_offset_y) {
      this.watermark_module.elements.watermark_offset_y.addEventListener(
        'input',
        e => {
          this.watermark_module.HandleOffsetYChange(e);
          this.watermark_module.ApplyWatermark();
        }
      );
    }
    if (this.watermark_module.elements.watermark_pattern_mode) {
      this.watermark_module.elements.watermark_pattern_mode.addEventListener(
        'change',
        e => {
          this.watermark_module.HandlePatternModeChange(e);
          this.watermark_module.ApplyWatermark();
        }
      );
    }
    if (this.history_module.elements.undo_btn) {
      this.history_module.elements.undo_btn.addEventListener('click', () =>
        this.history_module.HandleUndo()
      );
    }
    if (this.history_module.elements.redo_btn) {
      this.history_module.elements.redo_btn.addEventListener('click', () =>
        this.history_module.HandleRedo()
      );
    }
    if (this.batch_module.elements.batch_input) {
      this.batch_module.elements.batch_input.addEventListener('change', e =>
        this.batch_module.HandleBatchUpload(e)
      );
    }
    if (this.batch_module.elements.batch_download_btn) {
      this.batch_module.elements.batch_download_btn.addEventListener(
        'click',
        () => this.batch_module.HandleBatchDownload()
      );
    }
    this.comparison_module.InitializeComparisonSlider();
    document.addEventListener('paste', e => this.HandlePaste(e));
  }

  LoadImage(image_data) {
    super.LoadImage(image_data);
    this.history_module.ResetHistory();
    this.compressor_module.OnImageLoaded();
    setTimeout(() => this.cropper_module.InitializeCropper(), 200);
  }

  GetFinalCanvas(is_preview = false) {
    if (!this.cropper) return null;
    const max_size = is_preview ? 800 : 4096;
    let canvas = this.cropper.getCroppedCanvas({
      maxWidth: max_size,
      maxHeight: max_size,
      fillColor: '#fff',
      imageSmoothingEnabled: true,
      imageSmoothingQuality: is_preview ? 'medium' : 'high'
    });
    if (!canvas) return null;
    canvas = this.filters_module.ApplyFilters(canvas);
    if (
      this.cropper_module.flip_horizontal ||
      this.cropper_module.flip_vertical
    ) {
      canvas = this.ApplyFlip(canvas);
    }
    if (this.watermark_module.watermark.text) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        this.watermark_module.DrawWatermark(
          ctx,
          canvas.width,
          canvas.height,
          is_preview
        );
      }
    }
    return canvas;
  }

  ApplyFlip(canvas) {
    const temp_canvas = document.createElement('canvas');
    temp_canvas.width = canvas.width;
    temp_canvas.height = canvas.height;
    const temp_ctx = temp_canvas.getContext('2d');
    if (!temp_ctx) return canvas;
    temp_ctx.drawImage(canvas, 0, 0);
    const ctx = canvas.getContext('2d');
    if (!ctx) return canvas;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    let scale_x = 1;
    let scale_y = 1;
    let translate_x = 0;
    let translate_y = 0;
    if (this.cropper_module.flip_horizontal) {
      scale_x = -1;
      translate_x = -canvas.width;
    }
    if (this.cropper_module.flip_vertical) {
      scale_y = -1;
      translate_y = -canvas.height;
    }
    ctx.scale(scale_x, scale_y);
    ctx.drawImage(temp_canvas, translate_x, translate_y);
    ctx.restore();
    return canvas;
  }
}

function InitializeApp() {
  if (typeof Cropper === 'undefined') {
    setTimeout(InitializeApp, 100);
    return;
  }
  new ImageApp();
}

document.addEventListener('DOMContentLoaded', InitializeApp);
