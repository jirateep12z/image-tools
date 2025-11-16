class ComparisonModule {
  constructor(app) {
    this.app = app;
    this.is_dragging = false;
    this.InitializeElements();
  }

  InitializeElements() {
    this.elements = {
      compare_before: document.getElementById('compare-before'),
      compare_after: document.getElementById('compare-after'),
      comparison_handle: document.getElementById('comparison-handle'),
      comparison_slider: document.getElementById('comparison-slider')
    };
  }

  InitializeComparisonSlider() {
    if (!this.elements.comparison_handle) return;
    this.elements.comparison_handle.addEventListener('mousedown', e => {
      this.is_dragging = true;
      e.preventDefault();
    });
    document.addEventListener('mousemove', e => {
      if (!this.is_dragging) return;
      this.UpdateSliderPosition(e.clientX);
    });
    document.addEventListener('mouseup', () => {
      this.is_dragging = false;
    });
    this.elements.comparison_handle.addEventListener('touchstart', e => {
      this.is_dragging = true;
      e.preventDefault();
    });
    document.addEventListener('touchmove', e => {
      if (!this.is_dragging) return;
      const touch = e.touches[0];
      this.UpdateSliderPosition(touch.clientX);
    });
    document.addEventListener('touchend', () => {
      this.is_dragging = false;
    });
  }

  UpdateSliderPosition(client_x) {
    if (!this.elements.comparison_slider) return;
    const rect = this.elements.comparison_slider.getBoundingClientRect();
    let x = client_x - rect.left;
    x = Math.max(0, Math.min(x, rect.width));
    const percentage = (x / rect.width) * 100;
    this.elements.comparison_handle.style.left = `${percentage}%`;
    this.elements.compare_after.style.clipPath = `inset(0 ${
      100 - percentage
    }% 0 0)`;
  }

  UpdateComparisonSlider() {
    if (!this.app.original_image_data) return;
    this.elements.compare_before.src = this.app.original_image_data;
    const canvas = this.app.GetFinalCanvas(true);
    if (canvas) {
      this.elements.compare_after.src = canvas.toDataURL('image/jpeg', 0.8);
    }
  }
}
