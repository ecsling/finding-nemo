# Video Setup Instructions

## Adding Your Cargo Ship Video

To display your cargo ship video in the Mission Console dashboard:

### 1. Prepare Your Video
- **Recommended Format**: MP4 (H.264)
- **Alternative Format**: WebM (for better compression)
- **Recommended Size**: 1920x1080 or smaller
- **Duration**: Any (will loop automatically)

### 2. Place Video File
Copy your cargo ship video to:
```
main/public/assets/cargo_ship.mp4
```

Or if using WebM format:
```
main/public/assets/cargo_ship.webm
```

### 3. Supported Formats
The video player supports both formats. If you have both, place them both in the folder and the browser will choose the best one.

### 4. Video Will Appear
- **Location**: Bottom left corner of Mission Console
- **Features**: 
  - Auto-play on page load
  - Loops continuously
  - Muted by default (for autoplay compatibility)
  - Live feed styling with timestamp
  - Professional overlay with location info

### Example File Structure
```
main/
├── public/
│   ├── assets/
│   │   ├── cargo_ship.mp4  ← Place your video here
│   │   ├── cargo_ship.webm (optional)
│   │   ├── shipping_container.glb
│   │   └── ...
```

### Tips
- Keep video file size under 50MB for fast loading
- Use tools like HandBrake to compress if needed
- The video will display at 420px width automatically
- Height adjusts automatically (max 240px)

## Testing
1. Place your video file
2. Go to http://localhost:3000/dashboard
3. Video should autoplay in bottom left corner
4. If not showing, check browser console for errors
