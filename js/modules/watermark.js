class WatermarkModule {
  constructor(app) {
    this.app = app;
    this.watermark = {
      text: '',
      size: 24,
      color: '#ffffff',
      position: 'center',
      opacity: 50,
      rotate: 0,
      font_family: 'Arial',
      font_weight: 'normal',
      offset_x: 0,
      offset_y: 0,
      pattern_mode: false
    };
    this.google_fonts = [
      'Arial',
      'Noto Sans Thai',
      'Roboto',
      'Open Sans',
      'Playfair Display',
      'Montserrat',
      'Lato',
      'Poppins',
      'Inter',
      'Raleway'
    ];
    this.InitializeElements();
    this.LoadGoogleFonts();
  }

  InitializeElements() {
    this.elements = {
      watermark_text: document.getElementById('watermark-text'),
      watermark_size: document.getElementById('watermark-size'),
      watermark_color: document.getElementById('watermark-color'),
      watermark_opacity: document.getElementById('watermark-opacity'),
      watermark_opacity_value: document.getElementById(
        'watermark-opacity-value'
      ),
      watermark_rotate: document.getElementById('watermark-rotate'),
      watermark_rotate_value: document.getElementById('watermark-rotate-value'),
      watermark_font: document.getElementById('watermark-font'),
      watermark_offset_x: document.getElementById('watermark-offset-x'),
      watermark_offset_x_value: document.getElementById(
        'watermark-offset-x-value'
      ),
      watermark_offset_y: document.getElementById('watermark-offset-y'),
      watermark_offset_y_value: document.getElementById(
        'watermark-offset-y-value'
      ),
      watermark_font_weight: document.getElementById('watermark-font-weight'),
      watermark_pattern_mode: document.getElementById('watermark-pattern-mode'),
      watermark_position_btns: document.querySelectorAll(
        '.watermark-position-btn'
      )
    };
  }

  LoadGoogleFonts() {
    const font_names = this.google_fonts
      .map(f => f.replace(/\s+/g, '+'))
      .join('|');
    const link = document.createElement('link');
    link.href = `https://fonts.googleapis.com/css2?family=${font_names}:wght@400;700&display=swap`;
    link.rel = 'stylesheet';
    document.head.appendChild(link);
  }

  HandleWatermarkPosition(event) {
    const btn = event.currentTarget;
    const position = btn?.dataset?.position;
    if (!position) return;
    this.elements.watermark_position_btns?.forEach(b =>
      b.classList.remove('active')
    );
    btn.classList.add('active');
    this.watermark.position = position;
  }

  HandleRotateChange(event) {
    this.watermark.rotate = this.GetFloatValue(event?.target?.value, 0);
    if (this.elements.watermark_rotate_value) {
      this.elements.watermark_rotate_value.textContent = this.watermark.rotate;
    }
  }

  HandleFontChange(event) {
    this.watermark.font_family = event?.target?.value || 'Arial';
  }

  HandleFontWeightChange(event) {
    this.watermark.font_weight = event?.target?.value || 'normal';
  }

  HandleOffsetXChange(event) {
    this.watermark.offset_x = this.GetIntegerValue(event?.target?.value, 0);
    if (this.elements.watermark_offset_x_value) {
      this.elements.watermark_offset_x_value.textContent =
        this.watermark.offset_x;
    }
  }

  HandleOffsetYChange(event) {
    this.watermark.offset_y = this.GetIntegerValue(event?.target?.value, 0);
    if (this.elements.watermark_offset_y_value) {
      this.elements.watermark_offset_y_value.textContent =
        this.watermark.offset_y;
    }
  }

  HandlePatternModeChange(event) {
    this.watermark.pattern_mode = event?.target?.checked ?? false;
  }

  GetIntegerValue(value, default_value) {
    const parsed_value = parseInt(value, 10);
    return Number.isFinite(parsed_value) ? parsed_value : default_value;
  }

  GetFloatValue(value, default_value) {
    const parsed_value = parseFloat(value);
    return Number.isFinite(parsed_value) ? parsed_value : default_value;
  }

  ApplyWatermark() {
    this.watermark.text = this.elements.watermark_text?.value || '';
    this.watermark.size = this.GetIntegerValue(
      this.elements.watermark_size?.value,
      24
    );
    this.watermark.color = this.elements.watermark_color?.value || '#ffffff';
    this.watermark.opacity = this.GetIntegerValue(
      this.elements.watermark_opacity?.value,
      50
    );
    this.watermark.rotate = this.GetFloatValue(
      this.elements.watermark_rotate?.value,
      0
    );
    this.watermark.font_family = this.elements.watermark_font?.value || 'Arial';
    this.watermark.offset_x = this.GetIntegerValue(
      this.elements.watermark_offset_x?.value,
      0
    );
    this.watermark.offset_y = this.GetIntegerValue(
      this.elements.watermark_offset_y?.value,
      0
    );
    this.watermark.font_weight =
      this.elements.watermark_font_weight?.value || 'normal';
    this.watermark.pattern_mode =
      this.elements.watermark_pattern_mode?.checked ?? false;
    this.app.UpdatePreview();
  }

  SyncWatermarkControls() {
    if (this.elements.watermark_text) {
      this.elements.watermark_text.value = this.watermark.text;
    }
    if (this.elements.watermark_size) {
      this.elements.watermark_size.value = this.watermark.size;
    }
    if (this.elements.watermark_color) {
      this.elements.watermark_color.value = this.watermark.color;
    }
    if (this.elements.watermark_opacity) {
      this.elements.watermark_opacity.value = this.watermark.opacity;
    }
    if (this.elements.watermark_opacity_value) {
      this.elements.watermark_opacity_value.textContent =
        this.watermark.opacity;
    }
    if (this.elements.watermark_rotate) {
      this.elements.watermark_rotate.value = this.watermark.rotate;
    }
    if (this.elements.watermark_rotate_value) {
      this.elements.watermark_rotate_value.textContent = this.watermark.rotate;
    }
    if (this.elements.watermark_font) {
      this.elements.watermark_font.value = this.watermark.font_family;
    }
    if (this.elements.watermark_font_weight) {
      this.elements.watermark_font_weight.value = this.watermark.font_weight;
    }
    if (this.elements.watermark_offset_x) {
      this.elements.watermark_offset_x.value = this.watermark.offset_x;
    }
    if (this.elements.watermark_offset_x_value) {
      this.elements.watermark_offset_x_value.textContent =
        this.watermark.offset_x;
    }
    if (this.elements.watermark_offset_y) {
      this.elements.watermark_offset_y.value = this.watermark.offset_y;
    }
    if (this.elements.watermark_offset_y_value) {
      this.elements.watermark_offset_y_value.textContent =
        this.watermark.offset_y;
    }
    if (this.elements.watermark_pattern_mode) {
      this.elements.watermark_pattern_mode.checked =
        this.watermark.pattern_mode;
    }
    this.elements.watermark_position_btns?.forEach(btn => {
      const is_active = btn.dataset.position === this.watermark.position;
      btn.classList.toggle('active', is_active);
    });
  }

  DrawWatermark(ctx, width, height, is_preview = false) {
    if (!this.watermark.text) return;
    if (this.watermark.pattern_mode) {
      this.DrawWatermarkPattern(ctx, width, height, is_preview);
      return;
    }
    ctx.save();
    const scale_factor = is_preview ? 1 : width / 800;
    const scaled_size = Math.round(this.watermark.size * scale_factor);
    const scaled_offset_x = Math.round(this.watermark.offset_x * scale_factor);
    const scaled_offset_y = Math.round(this.watermark.offset_y * scale_factor);
    const font_weight =
      this.watermark.font_weight === 'bold' ? 'bold' : 'normal';
    ctx.font = `${font_weight} ${scaled_size}px "${this.watermark.font_family}"`;
    ctx.fillStyle = this.watermark.color;
    ctx.globalAlpha = this.watermark.opacity / 100;
    const text_metrics = ctx.measureText(this.watermark.text);
    const text_width = text_metrics.width;
    const text_height = scaled_size;
    let x = 0;
    let y = 0;
    switch (this.watermark.position) {
      case 'top-left':
        x = 20;
        y = 20 + text_height;
        break;
      case 'top-center':
        x = (width - text_width) / 2;
        y = 20 + text_height;
        break;
      case 'top-right':
        x = width - text_width - 20;
        y = 20 + text_height;
        break;
      case 'center-left':
        x = 20;
        y = (height + text_height) / 2;
        break;
      case 'center':
        x = (width - text_width) / 2;
        y = (height + text_height) / 2;
        break;
      case 'center-right':
        x = width - text_width - 20;
        y = (height + text_height) / 2;
        break;
      case 'bottom-left':
        x = 20;
        y = height - 20;
        break;
      case 'bottom-center':
        x = (width - text_width) / 2;
        y = height - 20;
        break;
      case 'bottom-right':
        x = width - text_width - 20;
        y = height - 20;
        break;
    }
    x += scaled_offset_x;
    y += scaled_offset_y;
    if (this.watermark.rotate !== 0) {
      ctx.translate(x, y);
      ctx.rotate((this.watermark.rotate * Math.PI) / 180);
      ctx.fillText(this.watermark.text, 0, 0);
    } else {
      ctx.fillText(this.watermark.text, x, y);
    }
    ctx.restore();
  }

  DrawWatermarkPattern(ctx, width, height, is_preview = false) {
    ctx.save();
    const scale_factor = is_preview ? 1 : width / 800;
    const scaled_size = Math.round(this.watermark.size * scale_factor);
    const scaled_offset_x = Math.round(this.watermark.offset_x * scale_factor);
    const scaled_offset_y = Math.round(this.watermark.offset_y * scale_factor);
    const font_weight =
      this.watermark.font_weight === 'bold' ? 'bold' : 'normal';
    ctx.font = `${font_weight} ${scaled_size}px "${this.watermark.font_family}"`;
    ctx.fillStyle = this.watermark.color;
    ctx.globalAlpha = this.watermark.opacity / 100;
    const text_metrics = ctx.measureText(this.watermark.text);
    const text_width = text_metrics.width;
    const text_height = scaled_size;
    const MIN_PATTERN_SPACING = Math.max(1, Math.round(20 * scale_factor));
    const spacing_x = Math.max(
      MIN_PATTERN_SPACING,
      text_width + 50 * scale_factor + scaled_offset_x
    );
    const spacing_y = Math.max(
      MIN_PATTERN_SPACING,
      text_height + 50 * scale_factor + scaled_offset_y
    );
    const angle = (this.watermark.rotate * Math.PI) / 180;
    const diagonal = Math.sqrt(width * width + height * height);
    const start_x = -diagonal;
    const start_y = -diagonal;
    const end_x = width + diagonal;
    const end_y = height + diagonal;
    for (let y = start_y; y < end_y; y += spacing_y) {
      for (let x = start_x; x < end_x; x += spacing_x) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle);
        ctx.fillText(this.watermark.text, 0, 0);
        ctx.restore();
      }
    }
    ctx.restore();
  }
}
