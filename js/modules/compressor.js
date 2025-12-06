class CompressorModule {
  constructor(app) {
    this.app = app;
    this.quality = 100;
    this.format = 'jpeg';
    this.original_size = 0;
    this.compressed_size = 0;
    this.compressed_data_url = null;
    this.InitializeElements();
    this.AttachEventListeners();
  }

  InitializeElements() {
    this.elements = {
      compressor_preview: document.getElementById('compressor-preview'),
      compressor_placeholder: document.getElementById('compressor-placeholder'),
      compressor_quality_slider: document.getElementById(
        'compressor-quality-slider'
      ),
      compressor_quality_value: document.getElementById(
        'compressor-quality-value'
      ),
      compressor_format: document.getElementById('compressor-format'),
      compressor_info: document.getElementById('compressor-info'),
      compressor_original_size: document.getElementById(
        'compressor-original-size'
      ),
      compressor_compressed_size: document.getElementById(
        'compressor-compressed-size'
      ),
      compressor_reduction: document.getElementById('compressor-reduction')
    };
  }

  AttachEventListeners() {
    if (this.elements.compressor_quality_slider) {
      this.elements.compressor_quality_slider.addEventListener('input', e => {
        this.HandleQualityChange(e);
      });
    }
    if (this.elements.compressor_format) {
      this.elements.compressor_format.addEventListener('change', e => {
        this.HandleFormatChange(e);
      });
    }
  }

  HandleQualityChange(event) {
    this.quality = parseInt(event.target.value);
    if (this.elements.compressor_quality_value) {
      this.elements.compressor_quality_value.textContent = this.quality;
    }
    this.SyncQualityToSidebar(this.quality);
    this.UpdateCompression();
  }

  SyncQualityToSidebar(quality) {
    if (this.app.elements.quality_slider) {
      this.app.elements.quality_slider.value = quality;
    }
    if (this.app.elements.quality_value) {
      this.app.elements.quality_value.textContent = quality;
    }
    this.app.quality = quality / 100;
  }

  SyncQualityFromSidebar(quality) {
    this.quality = quality;
    if (this.elements.compressor_quality_slider) {
      this.elements.compressor_quality_slider.value = quality;
    }
    if (this.elements.compressor_quality_value) {
      this.elements.compressor_quality_value.textContent = quality;
    }
    const active_tab = document.querySelector('.tab-button.active');
    if (active_tab && active_tab.dataset.tab === 'compressor') {
      this.UpdateCompression();
    }
  }

  HandleFormatChange(event) {
    this.format = event.target.value;
    this.SyncFormatToSidebar(this.format);
    this.UpdateCompression();
  }

  SyncFormatToSidebar(format) {
    if (this.app.elements.export_format) {
      this.app.elements.export_format.value = format;
    }
    this.app.export_format = format;
  }

  SyncFormatFromSidebar(format) {
    this.format = format;
    if (this.elements.compressor_format) {
      this.elements.compressor_format.value = format;
    }
    const active_tab = document.querySelector('.tab-button.active');
    if (active_tab && active_tab.dataset.tab === 'compressor') {
      this.UpdateCompression();
    }
  }

  async UpdateCompression() {
    if (!this.app.cropper) return;
    const canvas = this.app.GetFinalCanvas(false);
    if (!canvas) return;
    this.original_size = await this.GetCanvasSize(canvas, 'png', 1.0);
    const quality = this.quality / 100;
    const compressed_blob = await new Promise(resolve => {
      canvas.toBlob(resolve, `image/${this.format}`, quality);
    });
    if (!compressed_blob) return;
    this.compressed_size = compressed_blob.size;
    const reader = new FileReader();
    reader.onload = e => {
      this.compressed_data_url = e.target.result;
      this.ShowPreview(this.compressed_data_url);
      this.UpdateInfo();
    };
    reader.readAsDataURL(compressed_blob);
  }

  async GetCanvasSize(canvas, format, quality) {
    return new Promise(resolve => {
      canvas.toBlob(
        blob => {
          resolve(blob ? blob.size : 0);
        },
        `image/${format}`,
        quality
      );
    });
  }

  ShowPreview(data_url) {
    if (
      this.elements.compressor_preview &&
      this.elements.compressor_placeholder
    ) {
      this.elements.compressor_preview.src = data_url;
      this.elements.compressor_preview.classList.remove('hidden');
      this.elements.compressor_placeholder.classList.add('hidden');
    }
  }

  HidePreview() {
    if (
      this.elements.compressor_preview &&
      this.elements.compressor_placeholder
    ) {
      this.elements.compressor_preview.classList.add('hidden');
      this.elements.compressor_placeholder.classList.remove('hidden');
    }
  }

  UpdateInfo() {
    if (!this.elements.compressor_info) return;
    this.elements.compressor_info.classList.remove('hidden');
    const original_kb = (this.original_size / 1024).toFixed(2);
    const compressed_kb = (this.compressed_size / 1024).toFixed(2);
    const reduction_percent = (
      ((this.original_size - this.compressed_size) / this.original_size) *
      100
    ).toFixed(1);
    if (this.elements.compressor_original_size) {
      this.elements.compressor_original_size.textContent = `${original_kb} KB`;
    }
    if (this.elements.compressor_compressed_size) {
      this.elements.compressor_compressed_size.textContent = `${compressed_kb} KB`;
    }
    if (this.elements.compressor_reduction) {
      this.elements.compressor_reduction.textContent = `${reduction_percent}%`;
    }
  }

  OnTabActivated() {
    if (this.app.cropper) {
      const sidebar_quality = parseFloat(
        this.app.elements.quality_slider?.value || 100
      );
      const sidebar_format = this.app.elements.export_format?.value || 'jpeg';
      this.quality = sidebar_quality;
      this.format = sidebar_format;
      if (this.elements.compressor_quality_slider) {
        this.elements.compressor_quality_slider.value = sidebar_quality;
      }
      if (this.elements.compressor_quality_value) {
        this.elements.compressor_quality_value.textContent = sidebar_quality;
      }
      if (this.elements.compressor_format) {
        this.elements.compressor_format.value = sidebar_format;
      }
      this.UpdateCompression();
    }
  }

  OnImageLoaded() {
    this.quality = 100;
    this.format = 'jpeg';
    if (this.elements.compressor_quality_slider) {
      this.elements.compressor_quality_slider.value = 100;
    }
    if (this.elements.compressor_quality_value) {
      this.elements.compressor_quality_value.textContent = '100';
    }
    if (this.elements.compressor_format) {
      this.elements.compressor_format.value = 'jpeg';
    }
    this.HidePreview();
    if (this.elements.compressor_info) {
      this.elements.compressor_info.classList.add('hidden');
    }
  }
}
