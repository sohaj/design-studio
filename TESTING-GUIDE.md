# Manual Testing Guide for 3D Mockup Video Generator

## Test Setup

### Create Test Image
You have several options:

1. **Use the SVG test image** (already created):
   - File: `test-image.svg`
   - Location: Root of the project

2. **Generate a PNG test image** (recommended):
   - Open `generate-test-image.html` in your browser
   - It will auto-download a `test-screen.png` file
   - Or use any image from your computer

3. **Use existing assets**:
   - `public/vite.svg`
   - `src/assets/react.svg`

## Testing Steps

### 1. Open the Application
```bash
# Open in your default browser
open http://localhost:5175
# OR manually navigate to: http://localhost:5175
```

### 2. Initial Page Load Check
**Expected:**
- Page loads with a large upload area in the center
- Heading: "Create Stunning Demo Videos"
- Subtitle: "Upload your Figma mobile designs and generate beautiful 3D showcase videos"
- Upload dropzone with text: "Drop your screens here or click to browse"
- Feature pills at the bottom showing: iPhone 15 Pro Frame, Pixel 8 Frame, 6 Animation Presets, Video Upload Support, WebM Export

**Check Console:**
- Press `F12` or `Cmd+Option+I` (Mac) to open DevTools
- Go to the Console tab
- Should see no red errors (warnings are okay)

### 3. Upload Test Image

**Method A: Drag and Drop**
1. Drag `test-image.svg` or `test-screen.png` from your file system
2. Drop it onto the upload dropzone

**Method B: Click to Browse**
1. Click anywhere on the upload dropzone
2. File picker dialog should open
3. Select `test-image.svg` or any image file
4. Click "Open"

### 4. After Upload - Check UI Changes

**Expected UI Changes:**
✅ Page layout should change to show:
- **Left Sidebar** with:
  - Compact upload button at top ("+ Add screens or videos")
  - "Screens (1)" section showing thumbnail of uploaded image
  - Controls Panel with sections:
    - Device (iPhone, Android, Both)
    - Animation (6 presets)
    - Background (color picker, gradient toggle, base shadow toggle)
    - Export (duration, quality settings)
    
- **Right Side** - 3D Preview Area:
  - Dark background (gradient by default)
  - 3D iPhone device frame in the center
  - **YOUR IMAGE should appear ON THE PHONE SCREEN**
  - Phone should be slowly rotating/floating (showcase animation)
  - Ambient particles floating in the background
  - Professional lighting effects

- **Top Header** with buttons:
  - "⏸ Pause" or "▶ Preview" button
  - "⏺ Record & Export MP4" button

### 5. Verify Image Display on 3D Phone

**CRITICAL CHECK:**
Look at the phone screen in the 3D preview:

✅ **EXPECTED (Good):**
- Your uploaded image is clearly visible on the phone screen
- Image fits the phone screen properly
- Image colors are accurate
- Image is not pixelated or distorted

❌ **PROBLEM (Bad):**
- Phone screen is black/blank
- Phone screen shows only gray color (#111122)
- Image appears but is heavily distorted
- Console shows texture loading errors

### 6. Check Browser Console for Errors

**Open DevTools Console** (F12 or Cmd+Option+I):

**No Errors Expected:**
- Should see no red error messages
- React warnings (orange) are usually okay
- Three.js initialization messages are normal

**Possible Errors to Watch For:**
```javascript
// BAD - Texture loading error
Error: THREE.TextureLoader: Failed to load texture

// BAD - WebGL context error
WebGL context lost
WebGL: CONTEXT_LOST_WEBGL

// BAD - CORS error
Access to fetch at 'blob:...' from origin 'http://localhost:5175' has been blocked

// BAD - Memory error
Out of memory

// GOOD - These are normal
[HMR] Waiting for update signal from WDS...
THREE.WebGLRenderer: ...
```

### 7. Test Animations

Click on different animation presets in the left sidebar:
- **Showcase** - Elegant slow rotation with floating
- **Orbit** - Continuous 360° rotation
- **Flip Reveal** - Devices flip in dramatically
- **Scroll Through** - Vertical panning with parallax
- **Side by Side** - Spread apart (better with 2 images)
- **Single Focus** - Cinematic close-up

**Check:**
- Animation changes when you click a preset
- Phone continues moving smoothly
- No console errors appear

### 8. Test Device Types

Click on device buttons:
- **iPhone** - Shows iPhone 15 Pro with Dynamic Island
- **Android** - Shows Pixel 8 with punch-hole camera
- **Both** - Shows both devices side by side

### 9. Test Recording (Optional)

1. Click "⏺ Record & Export MP4"
2. Wait for the recording to complete (default 6 seconds)
3. Should see "Converting to MP4..." message
4. Browser should download an MP4 file

**Check Console:**
- FFmpeg loading messages are normal
- Should see no errors during conversion

## Common Issues and Solutions

### Issue: Image doesn't show (black screen)

**Possible Causes:**
1. **Texture loading error** - Check console for THREE.TextureLoader errors
2. **Image format issue** - Try a different image (PNG, JPG)
3. **File size too large** - Try a smaller image
4. **Browser issue** - Try Chrome/Firefox (best WebGL support)

**Solution:**
- Check DevTools Console for specific error
- Try a different image file
- Try converting image to PNG format

### Issue: 3D preview is blank or frozen

**Possible Causes:**
1. **WebGL not supported** - Old browser or GPU disabled
2. **GPU acceleration disabled** - Browser settings
3. **Memory issue** - Too many tabs open

**Solution:**
- Update your browser
- Enable hardware acceleration in browser settings
- Close other tabs and refresh

### Issue: "Converting to MP4..." hangs

**Possible Causes:**
1. **FFmpeg failed to load** - Network issue loading from CDN
2. **Browser memory issue** - Not enough RAM
3. **Codec not supported** - Browser doesn't support VP9/H.264

**Solution:**
- Check Network tab in DevTools for failed FFmpeg downloads
- Try recording a shorter duration (3-4 seconds)
- Check console for FFmpeg errors

## Expected Console Output (Normal)

When everything is working correctly, you might see:
```
[Vite] connected.
[HMR] Waiting for update signal from WDS...
THREE.WebGLRenderer: ...
```

## Report Template

After testing, please report:

### ✅ Success Criteria
- [ ] Page loaded without errors
- [ ] Upload interface appeared
- [ ] Image uploaded successfully
- [ ] **Image appears on 3D phone screen** (NOT black)
- [ ] Phone animates smoothly
- [ ] No console errors
- [ ] Can change animations
- [ ] Can change device types

### ❌ Issues Found
- Console errors: [copy exact error message]
- Visual issues: [describe what you see]
- Upload issues: [describe what happened]

### 📸 Screenshots
Include screenshots of:
1. DevTools Console (showing any errors)
2. 3D preview with uploaded image
3. Full page after upload

---

## Quick Test Command

You can also quickly open the page from terminal:
```bash
# macOS
open http://localhost:5175

# Linux
xdg-open http://localhost:5175

# Windows
start http://localhost:5175
```

Then drag and drop `test-image.svg` onto the page and observe the results.
