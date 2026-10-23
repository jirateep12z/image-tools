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

  SaveHistory(is_user_edit = true) {
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
    if (is_user_edit) {
      this.app.batch_module?.RecordCurrentImageEdit();
    }
  }

  GetCurrentState() {
    const crop_data = this.app.cropper ? this.app.cropper.getData() : null;
    const crop_box_data = this.app.cropper
      ? this.app.cropper.getCropBoxData()
      : null;
    return {
      crop_data: crop_data,
      crop_box_data: crop_box_data,
      aspect_ratio: this.app.cropper ? this.app.cropper.GetAspectRatio() : NaN,
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
      watermark: this.app.watermark_module?.watermark
        ? { ...this.app.watermark_module.watermark }
        : null,
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
    if (state.aspect_ratio !== undefined) {
      this.app.cropper.ApplyAspectRatio(state.aspect_ratio);
      this.app.cropper_module?.SyncAspectRatioButtons(state.aspect_ratio);
    }
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
      this.app.filters_module.SyncFilterControls();
    }
    if (this.app.watermark_module && state.watermark) {
      this.app.watermark_module.watermark = { ...state.watermark };
      this.app.watermark_module.SyncWatermarkControls();
    }
    this.app.batch_module?.RecordCurrentImageEdit();
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
