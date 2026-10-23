class KeyboardModule {
  constructor(app) {
    this.app = app;
    this.InitializeKeyboardShortcuts();
  }

  InitializeKeyboardShortcuts() {
    document.addEventListener('keydown', e => this.HandleKeyboard(e));
  }

  HandleKeyboard(event) {
    if (
      event.target.tagName === 'INPUT' ||
      event.target.tagName === 'TEXTAREA'
    ) {
      return;
    }
    if (event.ctrlKey || event.metaKey) {
      switch (event.key.toLowerCase()) {
        case 'z':
          event.preventDefault();
          if (this.app.history_module) {
            this.app.history_module.HandleUndo();
          }
          break;
        case 'y':
          event.preventDefault();
          if (this.app.history_module) {
            this.app.history_module.HandleRedo();
          }
          break;
      }
    } else {
      switch (event.key) {
        case 'ArrowUp':
          event.preventDefault();
          if (this.app.cropper_module) {
            this.app.cropper_module.MoveCropBox('up');
          }
          break;
        case 'ArrowDown':
          event.preventDefault();
          if (this.app.cropper_module) {
            this.app.cropper_module.MoveCropBox('down');
          }
          break;
        case 'ArrowLeft':
          event.preventDefault();
          if (this.app.cropper_module) {
            this.app.cropper_module.MoveCropBox('left');
          }
          break;
        case 'ArrowRight':
          event.preventDefault();
          if (this.app.cropper_module) {
            this.app.cropper_module.MoveCropBox('right');
          }
          break;
      }
    }
  }
}
