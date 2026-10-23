class FiltersModule {
  constructor(app) {
    this.app = app;
    this.brightness = 100;
    this.contrast = 100;
    this.saturation = 100;
    this.hue = 0;
    this.blur = 0;
    this.grayscale = false;
    this.sepia = false;
    this.InitializeElements();
  }

  InitializeElements() {
    this.elements = {
      brightness_slider: document.getElementById('brightness-slider'),
      brightness_value: document.getElementById('brightness-value'),
      contrast_slider: document.getElementById('contrast-slider'),
      contrast_value: document.getElementById('contrast-value'),
      saturation_slider: document.getElementById('saturation-slider'),
      saturation_value: document.getElementById('saturation-value'),
      hue_slider: document.getElementById('hue-slider'),
      hue_value: document.getElementById('hue-value'),
      blur_slider: document.getElementById('blur-slider'),
      blur_value: document.getElementById('blur-value'),
      grayscale_btn: document.getElementById('grayscale-btn'),
      sepia_btn: document.getElementById('sepia-btn')
    };
  }

  GetClampedNumber(value, default_value, min_value, max_value) {
    const parsed_value = parseFloat(value);
    if (!Number.isFinite(parsed_value)) return default_value;
    return Math.max(min_value, Math.min(max_value, parsed_value));
  }

  HandleBrightnessChange(event) {
    this.brightness = this.GetClampedNumber(event?.target?.value, 100, 0, 200);
    if (event?.target) event.target.value = this.brightness;
    this.elements.brightness_value.textContent = this.brightness;
    this.app.DebouncedPreviewUpdate();
  }

  HandleContrastChange(event) {
    this.contrast = this.GetClampedNumber(event?.target?.value, 100, 0, 200);
    if (event?.target) event.target.value = this.contrast;
    this.elements.contrast_value.textContent = this.contrast;
    this.app.DebouncedPreviewUpdate();
  }

  HandleSaturationChange(event) {
    this.saturation = this.GetClampedNumber(event?.target?.value, 100, 0, 200);
    if (event?.target) event.target.value = this.saturation;
    this.elements.saturation_value.textContent = this.saturation;
    this.app.DebouncedPreviewUpdate();
  }

  HandleHueChange(event) {
    this.hue = this.GetClampedNumber(event?.target?.value, 0, 0, 360);
    if (event?.target) event.target.value = this.hue;
    this.elements.hue_value.textContent = this.hue;
    this.app.DebouncedPreviewUpdate();
  }

  HandleBlurChange(event) {
    this.blur = this.GetClampedNumber(event?.target?.value, 0, 0, 20);
    if (event?.target) event.target.value = this.blur;
    this.elements.blur_value.textContent = this.blur;
    this.app.DebouncedPreviewUpdate();
  }

  ToggleGrayscale() {
    this.grayscale = !this.grayscale;
    if (this.grayscale) {
      this.sepia = false;
      this.elements.sepia_btn?.classList.remove('active');
      this.elements.grayscale_btn?.classList.add('active');
    } else {
      this.elements.grayscale_btn?.classList.remove('active');
    }
    this.app.UpdatePreview();
    this.app.history_module?.SaveHistory();
  }

  ToggleSepia() {
    this.sepia = !this.sepia;
    if (this.sepia) {
      this.grayscale = false;
      this.elements.grayscale_btn?.classList.remove('active');
      this.elements.sepia_btn?.classList.add('active');
    } else {
      this.elements.sepia_btn?.classList.remove('active');
    }
    this.app.UpdatePreview();
    this.app.history_module?.SaveHistory();
  }

  ResetFilters() {
    this.brightness = 100;
    this.contrast = 100;
    this.saturation = 100;
    this.hue = 0;
    this.blur = 0;
    this.grayscale = false;
    this.sepia = false;
    this.elements.brightness_slider.value = 100;
    this.elements.contrast_slider.value = 100;
    this.elements.saturation_slider.value = 100;
    this.elements.hue_slider.value = 0;
    this.elements.blur_slider.value = 0;
    this.elements.brightness_value.textContent = '100';
    this.elements.contrast_value.textContent = '100';
    this.elements.saturation_value.textContent = '100';
    this.elements.hue_value.textContent = '0';
    this.elements.blur_value.textContent = '0';
    this.elements.grayscale_btn?.classList.remove('active');
    this.elements.sepia_btn?.classList.remove('active');
  }

  SyncFilterControls() {
    this.elements.brightness_slider.value = this.brightness;
    this.elements.contrast_slider.value = this.contrast;
    this.elements.saturation_slider.value = this.saturation;
    this.elements.hue_slider.value = this.hue;
    this.elements.blur_slider.value = this.blur;
    this.elements.brightness_value.textContent = this.brightness;
    this.elements.contrast_value.textContent = this.contrast;
    this.elements.saturation_value.textContent = this.saturation;
    this.elements.hue_value.textContent = this.hue;
    this.elements.blur_value.textContent = this.blur;
    this.elements.grayscale_btn?.classList.toggle('active', this.grayscale);
    this.elements.sepia_btn?.classList.toggle('active', this.sepia);
  }

  ApplyFilters(canvas) {
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return canvas;
    const has_filters =
      this.brightness !== 100 ||
      this.contrast !== 100 ||
      this.saturation !== 100 ||
      this.hue !== 0 ||
      this.blur !== 0 ||
      this.grayscale ||
      this.sepia;
    if (!has_filters) return canvas;
    let filter_string = '';
    if (this.brightness !== 100) {
      filter_string += `brightness(${this.brightness}%) `;
    }
    if (this.contrast !== 100) {
      filter_string += `contrast(${this.contrast}%) `;
    }
    if (this.saturation !== 100) {
      filter_string += `saturate(${this.saturation}%) `;
    }
    if (this.hue !== 0) {
      filter_string += `hue-rotate(${this.hue}deg) `;
    }
    if (this.blur !== 0) {
      filter_string += `blur(${this.blur}px) `;
    }
    if (this.grayscale) {
      filter_string += 'grayscale(100%) ';
    }
    if (this.sepia) {
      filter_string += 'sepia(100%) ';
    }
    if (filter_string) {
      ctx.filter = filter_string;
      ctx.drawImage(canvas, 0, 0);
      ctx.filter = 'none';
    }
    return canvas;
  }
}
