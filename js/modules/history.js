class HistoryModule {
  constructor(app) {
    this.app = app;
    this.history = [];
    this.history_index = -1;
    this.max_history = 20;
    this.InitializeElements();
  }

  InitializeElements() {
    this.elements = {
      undo_btn: document.getElementById('undo-btn'),
      redo_btn: document.getElementById('redo-btn')
    };
  }

  SaveHistory() {
    if (!this.app.cropper) return;
    const state = this.GetCurrentState();
    this.history_index++;
    this.history = this.history.slice(0, this.history_index);
    this.history.push(state);
    if (this.history.length > this.max_history) {
      this.history.shift();
      this.history_index--;
    }
    this.UpdateHistoryButtons();
  }

  GetCurrentState() {
    const crop_data = this.app.cropper ? this.app.cropper.getData() : null;
    const crop_box_data = this.app.cropper
      ? this.app.cropper.getCropBoxData()
      : null;
    return {
      crop_data: crop_data,
      crop_box_data: crop_box_data,
      zoom: this.app.cropper_module?.elements.zoom_slider?.value ?? 1,
      rotate: this.app.cropper_module?.elements.rotate_slider?.value ?? 0,
      flip_horizontal: this.app.cropper_module?.flip_horizontal ?? false,
      flip_vertical: this.app.cropper_module?.flip_vertical ?? false,
      brightness: this.app.filters_module?.brightness ?? 100,
      contrast: this.app.filters_module?.contrast ?? 100,
      saturation: this.app.filters_module?.saturation ?? 100,
      hue: this.app.filters_module?.hue ?? 0,
      blur: this.app.filters_module?.blur ?? 0,
      grayscale: this.app.filters_module?.grayscale ?? false,
      sepia: this.app.filters_module?.sepia ?? false,
      timestamp: Date.now()
    };
  }

  HandleUndo() {
    if (this.history_index > 0) {
      this.history_index--;
      this.RestoreFromHistory();
    }
  }

  HandleRedo() {
    if (this.history_index < this.history.length - 1) {
      this.history_index++;
      this.RestoreFromHistory();
    }
  }

  RestoreFromHistory() {
    const state = this.history[this.history_index];
    if (!state || !this.app.cropper) return;
    if (state.crop_data) {
      this.app.cropper.setData(state.crop_data);
    }
    if (state.crop_box_data) {
      this.app.cropper.setCropBoxData(state.crop_box_data);
    }
    if (this.app.cropper_module) {
      this.app.cropper_module.elements.zoom_slider.value = state.zoom;
      this.app.cropper_module.elements.rotate_slider.value = state.rotate;
      this.app.cropper_module.elements.rotate_input.value = state.rotate;
      this.app.cropper_module.elements.zoom_value.textContent = Math.round(
        state.zoom * 100
      );
      this.app.cropper_module.flip_horizontal = state.flip_horizontal;
      this.app.cropper_module.flip_vertical = state.flip_vertical;
      this.app.cropper.rotateTo(state.rotate);
      this.app.cropper.zoomTo(state.zoom);
    }
    if (this.app.filters_module) {
      this.app.filters_module.brightness = state.brightness;
      this.app.filters_module.contrast = state.contrast;
      this.app.filters_module.saturation = state.saturation;
      this.app.filters_module.hue = state.hue;
      this.app.filters_module.blur = state.blur;
      this.app.filters_module.grayscale = state.grayscale;
      this.app.filters_module.sepia = state.sepia;
      this.app.filters_module.elements.brightness_slider.value =
        state.brightness;
      this.app.filters_module.elements.contrast_slider.value = state.contrast;
      this.app.filters_module.elements.saturation_slider.value =
        state.saturation;
      this.app.filters_module.elements.hue_slider.value = state.hue;
      this.app.filters_module.elements.blur_slider.value = state.blur;
      this.app.filters_module.elements.brightness_value.textContent =
        state.brightness;
      this.app.filters_module.elements.contrast_value.textContent =
        state.contrast;
      this.app.filters_module.elements.saturation_value.textContent =
        state.saturation;
      this.app.filters_module.elements.hue_value.textContent = state.hue;
      this.app.filters_module.elements.blur_value.textContent = state.blur;
      if (state.grayscale) {
        this.app.filters_module.elements.grayscale_btn?.classList.add(
          'border-blue-500'
        );
      } else {
        this.app.filters_module.elements.grayscale_btn?.classList.remove(
          'border-blue-500'
        );
      }
      if (state.sepia) {
        this.app.filters_module.elements.sepia_btn?.classList.add(
          'border-blue-500'
        );
      } else {
        this.app.filters_module.elements.sepia_btn?.classList.remove(
          'border-blue-500'
        );
      }
    }
    this.app.UpdatePreview();
    this.UpdateHistoryButtons();
  }

  UpdateHistoryButtons() {
    const can_undo = this.history_index > 0;
    const can_redo = this.history_index < this.history.length - 1;
    if (this.elements.undo_btn) {
      this.elements.undo_btn.disabled = !can_undo;
      this.elements.undo_btn.style.opacity = can_undo ? '1' : '0.5';
    }
    if (this.elements.redo_btn) {
      this.elements.redo_btn.disabled = !can_redo;
      this.elements.redo_btn.style.opacity = can_redo ? '1' : '0.5';
    }
  }

  ResetHistory() {
    this.history = [];
    this.history_index = -1;
    this.UpdateHistoryButtons();
  }
}
