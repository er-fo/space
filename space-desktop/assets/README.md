# Assets Directory

This directory contains the icon and image assets for the Space Desktop application.

## Required Files

### Application Icons
- `icon.png` - Main application icon (256x256 or 512x512 recommended)
- `icon.ico` - Windows application icon
- `icon.icns` - macOS application icon

### System Tray Icons
- `tray-icon.png` - System tray icon (16x16 or 32x32)
- `tray-icon@2x.png` - High DPI system tray icon (32x32 or 64x64)

## Temporary Solution

For development purposes, you can create simple placeholder images or the application will fall back to using the main icon for the tray icon.

The application will handle missing icons gracefully and log warnings instead of crashing.

## Production Requirements

For production builds, all icon files should be present and properly sized for the best user experience across different platforms and display densities. 