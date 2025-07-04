const { app, BrowserWindow, ipcMain, Tray, Menu, screen, dialog, shell } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs').promises;

// Keep a global reference of the window object
let mainWindow;
let tray;
let pythonBackend;
let windowState = {
  x: undefined,
  y: undefined,
  width: 400,
  height: 600,
  isAlwaysOnTop: true,
  isVisible: true
};

// Configure app behavior
app.commandLine.appendSwitch('disable-features', 'OutOfBlinkCors');

// Security: Prevent new window creation
app.on('web-contents-created', (event, contents) => {
  contents.on('new-window', (event, navigationUrl) => {
    event.preventDefault();
    shell.openExternal(navigationUrl);
  });
});

function saveWindowState() {
  if (!mainWindow) return;
  
  const bounds = mainWindow.getBounds();
  windowState = {
    ...windowState,
    x: bounds.x,
    y: bounds.y,
    width: bounds.width,
    height: bounds.height,
    isAlwaysOnTop: mainWindow.isAlwaysOnTop(),
    isVisible: mainWindow.isVisible()
  };
}

function createWindow() {
  // Get primary display dimensions
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;

  // Calculate default position (right side of screen)
  const defaultX = width - windowState.width - 20;
  const defaultY = 50;

  // Create the floating chat window with enhanced configuration
  mainWindow = new BrowserWindow({
    width: windowState.width,
    height: windowState.height,
    x: windowState.x !== undefined ? windowState.x : defaultX,
    y: windowState.y !== undefined ? windowState.y : defaultY,
    minWidth: 300,
    maxWidth: 600,
    minHeight: 400,
    maxHeight: 800,
    alwaysOnTop: windowState.isAlwaysOnTop,
    resizable: true,
    minimizable: true,
    maximizable: false,
    fullscreenable: false,
    frame: true,
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    title: 'Space - CAD AI Assistant',
    icon: path.join(__dirname, 'assets', 'icon.png'),
    show: true, // Show immediately
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: true,
      allowRunningInsecureContent: false,
      experimentalFeatures: false
    }
  });

  // Content Security Policy
  mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: localhost:* ws://localhost:*"
        ]
      }
    });
  });

  // Load the React app
  if (process.env.NODE_ENV === 'development') {
    console.log('Loading development URL: http://localhost:3000');
    mainWindow.loadURL('http://localhost:3000');
    // Open DevTools to see any errors
    mainWindow.webContents.openDevTools();
  } else {
    console.log('Loading production file:', path.join(__dirname, 'dist', 'index.html'));
    mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html'));
  }

  // Window event handlers
  mainWindow.on('closed', () => {
    saveWindowState();
    mainWindow = null;
  });

  mainWindow.on('moved', saveWindowState);
  mainWindow.on('resized', saveWindowState);

  // Handle window focus/blur for auto-hide behavior
  mainWindow.on('blur', () => {
    // Future: Auto-hide when CAD software gains focus
    // This will be implemented in Phase 3 with CAD software detection
  });

  mainWindow.on('focus', () => {
    // Ensure window stays on top when focused
    if (windowState.isAlwaysOnTop) {
      mainWindow.setAlwaysOnTop(true);
    }
  });

  // Show window when ready
  mainWindow.on('ready-to-show', () => {
    if (windowState.isVisible) {
      mainWindow.show();
      mainWindow.focus();
    }
  });

  // Handle external links
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

function createTray() {
  // Create system tray icon
  const trayIconPath = path.join(__dirname, 'assets', 'tray-icon.png');
  
  // Check if tray icon exists, use default if not
  const iconExists = require('fs').existsSync(trayIconPath);
  if (!iconExists) {
    console.warn('Tray icon not found, using default');
  }
  
  tray = new Tray(iconExists ? trayIconPath : path.join(__dirname, 'assets', 'icon.png'));

  // Create context menu for tray
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show Space',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
        } else {
          createWindow();
        }
      }
    },
    {
      label: 'Hide Space',
      click: () => {
        if (mainWindow) {
          mainWindow.hide();
        }
      }
    },
    { type: 'separator' },
    {
      label: `Always on Top`,
      type: 'checkbox',
      checked: windowState.isAlwaysOnTop,
      click: (menuItem) => {
        if (mainWindow) {
          mainWindow.setAlwaysOnTop(menuItem.checked);
          windowState.isAlwaysOnTop = menuItem.checked;
        }
      }
    },
    { type: 'separator' },
    {
      label: 'Settings',
      click: () => {
        // Open settings panel (to be implemented in Phase 4)
        if (mainWindow) {
          mainWindow.webContents.send('open-settings');
        }
      }
    },
    {
      label: 'About',
      click: () => {
        dialog.showMessageBox(mainWindow, {
          type: 'info',
          title: 'About Space',
          message: 'Space - CAD AI Assistant',
          detail: `Version: ${app.getVersion()}\nPlatform: ${process.platform}\nElectron: ${process.versions.electron}`
        });
      }
    },
    { type: 'separator' },
    {
      label: 'Quit',
      accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
      click: () => {
        app.quit();
      }
    }
  ]);

  tray.setContextMenu(contextMenu);
  tray.setToolTip('Space - CAD AI Assistant');

  // Handle tray icon click
  tray.on('click', () => {
    if (mainWindow) {
      if (mainWindow.isVisible()) {
        mainWindow.hide();
      } else {
        mainWindow.show();
        mainWindow.focus();
      }
    } else {
      createWindow();
    }
  });

  // Handle double-click on tray (Windows/Linux)
  tray.on('double-click', () => {
    if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
    } else {
      createWindow();
    }
  });
}

function startPythonBackend() {
  // This will be implemented in Phase 2.1
  // For now, just log that it would start
  console.log('Python backend startup will be implemented in Phase 2.1');
  
  // Future implementation:
  // const pythonPath = path.join(__dirname, 'backend', 'main.py');
  // pythonBackend = spawn('python', [pythonPath], {
  //   stdio: ['pipe', 'pipe', 'pipe'],
  //   cwd: path.join(__dirname, 'backend')
  // });
}

// App event handlers
app.whenReady().then(() => {
  // Set app user model ID for Windows
  if (process.platform === 'win32') {
    app.setAppUserModelId('com.space.desktop');
  }

  createWindow();
  createTray();
  startPythonBackend();

  app.on('activate', () => {
    // On macOS, re-create a window when the dock icon is clicked
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    } else if (mainWindow) {
      mainWindow.show();
    }
  });
});

app.on('window-all-closed', () => {
  // On macOS, keep app running even when all windows are closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', (event) => {
  // Save window state before quitting
  saveWindowState();
  
  // Clean up Python backend process
  if (pythonBackend) {
    pythonBackend.kill('SIGTERM');
    
    // Give it time to clean up, then force kill if necessary
    setTimeout(() => {
      if (pythonBackend && !pythonBackend.killed) {
        pythonBackend.kill('SIGKILL');
      }
    }, 3000);
  }
});

// Enhanced IPC Handlers for communication between main and renderer processes

// App information handlers
ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

ipcMain.handle('get-system-info', () => {
  return {
    platform: process.platform,
    arch: process.arch,
    version: process.getSystemVersion(),
    electronVersion: process.versions.electron,
    nodeVersion: process.versions.node,
    chromeVersion: process.versions.chrome
  };
});

// Window control handlers
ipcMain.handle('window-controls', (event, action) => {
  if (!mainWindow) return false;

  switch (action) {
    case 'minimize':
      mainWindow.minimize();
      return true;
    case 'close':
      mainWindow.close();
      return true;
    case 'toggle-always-on-top':
      const newState = !mainWindow.isAlwaysOnTop();
      mainWindow.setAlwaysOnTop(newState);
      windowState.isAlwaysOnTop = newState;
      return newState;
    case 'show':
      mainWindow.show();
      mainWindow.focus();
      return true;
    case 'hide':
      mainWindow.hide();
      return true;
    default:
      return false;
  }
});

// CAD software detection (placeholder for Phase 3)
ipcMain.handle('detect-cad-software', async () => {
  // Placeholder implementation - will be enhanced in Phase 3
  return {
    fusion360: false,
    autocad: false,
    solidworks: false,
    detected: false,
    message: 'CAD detection will be implemented in Phase 3'
  };
});

// Workspace information (placeholder for Phase 2)
ipcMain.handle('get-workspace-info', async () => {
  // Placeholder implementation - will be enhanced in Phase 2
  return {
    path: null,
    files: [],
    message: 'Workspace detection will be implemented in Phase 2'
  };
});

// Settings management
ipcMain.handle('get-settings', async () => {
  // Load settings from file or return defaults
  const defaultSettings = {
    alwaysOnTop: windowState.isAlwaysOnTop,
    apiKey: null,
    theme: 'dark',
    autoHide: false,
    notifications: true
  };
  
  try {
    const settingsPath = path.join(app.getPath('userData'), 'settings.json');
    const settingsData = await fs.readFile(settingsPath, 'utf8');
    return { ...defaultSettings, ...JSON.parse(settingsData) };
  } catch (error) {
    return defaultSettings;
  }
});

ipcMain.handle('update-settings', async (event, settings) => {
  try {
    const settingsPath = path.join(app.getPath('userData'), 'settings.json');
    await fs.writeFile(settingsPath, JSON.stringify(settings, null, 2));
    
    // Apply settings immediately
    if (mainWindow && 'alwaysOnTop' in settings) {
      mainWindow.setAlwaysOnTop(settings.alwaysOnTop);
      windowState.isAlwaysOnTop = settings.alwaysOnTop;
    }
    
    return { success: true };
  } catch (error) {
    console.error('Failed to save settings:', error);
    return { success: false, error: error.message };
  }
});

// Error handling and logging
ipcMain.handle('log-error', async (event, error) => {
  console.error('Renderer Error:', error);
  
  // Future: Send to logging service
  return { logged: true };
});

ipcMain.handle('report-bug', async (event, bugReport) => {
  // Future: Implement bug reporting
  console.log('Bug Report:', bugReport);
  return { reported: true };
});

// File dialog handlers
ipcMain.handle('select-workspace-folder', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Select Workspace Folder',
    properties: ['openDirectory'],
    message: 'Choose the folder containing your CAD files'
  });
  
  if (!result.canceled && result.filePaths.length > 0) {
    return {
      success: true,
      path: result.filePaths[0]
    };
  }
  
  return { success: false };
});

// Development helpers
if (process.env.NODE_ENV === 'development') {
  ipcMain.handle('dev-reload', () => {
    if (mainWindow) {
      mainWindow.reload();
    }
  });
  
  ipcMain.handle('dev-toggle-devtools', () => {
    if (mainWindow) {
      mainWindow.webContents.toggleDevTools();
    }
  });
}

console.log('Space Desktop App - Main process started'); 