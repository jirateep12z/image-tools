# Image Tools

A browser-based image editor for cropping, adjusting, watermarking, compressing, and batch-exporting images. Built with vanilla JavaScript, Tailwind CSS, and Cropper.js, and installable as a Progressive Web App. The user interface is in Thai.

## Features

### Image Input

- **File Upload**: Open a single image from your device.
- **Drag and Drop**: Drop an image onto the upload area; when several files are dropped, the first image is opened.
- **Clipboard Paste**: Paste an image anywhere on the page with `Ctrl+V`.
- **URL Loading**: Load an image from a URL. The host must allow cross-origin (CORS) access, and the image is converted to JPEG on load.

### Cropping and Transform

- **Interactive Cropper**: Select the crop area with Cropper.js 2 and see live crop dimensions and position in pixels.
- **Aspect Ratio Presets**: Free, 1:1, 16:9, 9:16, 4:3, 3:4, 3:2, 2:3, 21:9, 5:4, 4:5, and 1.91:1.
- **Rotation**: Rotate from -180° to 180° with a slider or number input, or in 90° steps with the rotate buttons.
- **Zoom**: Zoom the crop from 100% to 500%.
- **Flip**: Flip the image horizontally or vertically.
- **Grid Overlay**: Toggle a rule-of-thirds guide.
- **Reset**: Restore the crop, rotation, zoom, flip, and filters to their defaults.

### Filters and Adjustments

- **Brightness, Contrast, Saturation**: Adjust each from 0% to 200%.
- **Hue Rotation**: Shift hue from 0° to 360°.
- **Blur**: Apply a blur from 0px to 20px.
- **Grayscale and Sepia**: Toggle either effect; enabling one turns off the other.

### Text Watermark

- **Custom Text**: Add a text watermark with a live preview.
- **Typography**: Choose Arial, Noto Sans Thai, Roboto, Inter, or Montserrat in Normal or Bold, at 12px to 100px.
- **Color and Opacity**: Pick any color and set opacity from 0% to 100%.
- **Placement**: Snap to a 3×3 position grid, then fine-tune with X/Y offsets from -200px to 200px.
- **Rotation**: Rotate the watermark from -180° to 180°.
- **Pattern Mode**: Repeat the watermark across the entire image.

### Compression

- **Quality Control**: Set compression quality from 1% to 100% and preview the result.
- **Format Selection**: Compare JPEG, PNG, and WebP output.
- **Size Comparison**: View the original (PNG) size, the compressed size, and the percentage saved or added.
- **Synced Export Settings**: Quality and format changes stay in sync with the export settings.

### Before and After Comparison

- **Comparison Slider**: Drag the handle with a mouse or touch to compare the original image with the edited result.

### Batch Processing

- **Multi-Image Upload**: Select several images at once and switch between them from a list.
- **Per-Image Settings**: Images you edit keep their own crop, filter, and watermark settings and are marked in the list; unedited images follow the most recent edit.
- **Apply to All**: Copy the current image's settings to every image, replacing per-image settings.
- **ZIP Download**: Export every image into a single ZIP file with a progress indicator. Files are saved in a `cropped-images` folder as `<name>-cropped.<format>`.

### Export

- **Download**: Save the edited image as JPEG, PNG, or WebP with quality from 10% to 100%. The longest side is capped at 4096px.
- **Copy to Clipboard**: Copy the edited image directly to the clipboard where the browser supports it.

### History

- **Undo and Redo**: Step through up to 20 saved states of crop, transform, filter, and watermark changes.

### Interface

- **Dark and Light Mode**: Switch themes; the choice is saved in the browser.
- **Responsive Layout**: Use a mobile navigation bar and slide-out panels on small screens.

### Progressive Web App

- **Installable App**: Add Image Tools to supported desktop and mobile home screens.
- **App Shell Cache**: A service worker caches the local HTML, JavaScript modules, manifest, and icons after the first visit.

## Keyboard Shortcuts

Shortcuts other than paste are ignored while a text field or number input has focus.

| Shortcut                   | Action                              |
| -------------------------- | ----------------------------------- |
| `Ctrl+Z` / `Cmd+Z`         | Undo                                |
| `Ctrl+Y` / `Cmd+Y`         | Redo                                |
| `Ctrl+V` / `Cmd+V`         | Paste an image from the clipboard   |
| `Arrow` keys               | Move the crop area by 10px          |
| `Enter` (in the URL field) | Load the image from the entered URL |

## Limitations

- **Internet Required for Libraries**: Tailwind CSS, Lucide icons, Cropper.js, JSZip, and Google Fonts load from CDNs. The service worker does not cache these third-party files, so offline use depends on the browser's own cache.
- **Client-Side Only**: All processing happens in the browser; images are not uploaded to a server.

## License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

## Contributing

Contributions, issues and feature requests are welcome!

## Show your support

Give a ⭐️ if this project helped you!

## Author

**Made with ❤️ by @jirateep12z**
