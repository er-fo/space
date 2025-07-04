const { contextBridge, ipcRenderer } = require('electron');

// Security: Only expose what's necessary and validate all inputs
const createSecureAPI = () => {
  // Input validation helpers
  const validateString = (value, maxLength = 1000) => {
    return typeof value === 'string' && value.length <= maxLength;
  };

  const validateObject = (value) => {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
  };

  return {
    // App information
    getAppVersion: () => ipcRenderer.invoke('get-app-version'),
    getSystemInfo: () => ipcRenderer.invoke('get-system-info'),

    // Window controls with validation
    minimizeWindow: () => ipcRenderer.invoke('window-controls', 'minimize'),
    closeWindow: () => ipcRenderer.invoke('window-controls', 'close'),
    showWindow: () => ipcRenderer.invoke('window-controls', 'show'),
    hideWindow: () => ipcRenderer.invoke('window-controls', 'hide'),
    toggleAlwaysOnTop: () => ipcRenderer.invoke('window-controls', 'toggle-always-on-top'),

    // CAD software detection (Phase 3)
    detectCADSoftware: () => ipcRenderer.invoke('detect-cad-software'),
    getWorkspaceInfo: () => ipcRenderer.invoke('get-workspace-info'),

    // File system operations (Phase 2)
    selectWorkspaceFolder: () => ipcRenderer.invoke('select-workspace-folder'),
    
    // File watching with cleanup function
    watchFiles: (callback) => {
      if (typeof callback !== 'function') {
        throw new Error('Callback must be a function');
      }
      
      const listener = (event, ...args) => callback(...args);
      ipcRenderer.on('file-changed', listener);
      
      // Return cleanup function
      return () => ipcRenderer.removeListener('file-changed', listener);
    },

    // Backend API communication (Phase 2)
    sendChatMessage: (message) => {
      if (!validateString(message, 10000)) {
        throw new Error('Invalid message format');
      }
      return ipcRenderer.invoke('send-chat-message', message);
    },
    
    onChatResponse: (callback) => {
      if (typeof callback !== 'function') {
        throw new Error('Callback must be a function');
      }
      
      const listener = (event, ...args) => callback(...args);
      ipcRenderer.on('chat-response', listener);
      return () => ipcRenderer.removeListener('chat-response', listener);
    },

    // Authentication (Phase 1.4)
    authenticateUser: (credentials) => {
      if (!validateObject(credentials)) {
        throw new Error('Invalid credentials format');
      }
      return ipcRenderer.invoke('authenticate-user', credentials);
    },
    getCurrentUser: () => ipcRenderer.invoke('get-current-user'),
    signOut: () => ipcRenderer.invoke('sign-out'),

    // Settings management with validation
    getSettings: () => ipcRenderer.invoke('get-settings'),
    updateSettings: (settings) => {
      if (!validateObject(settings)) {
        throw new Error('Invalid settings format');
      }
      return ipcRenderer.invoke('update-settings', settings);
    },
    
    // Error handling and logging
    logError: (error) => {
      const errorData = {
        message: error?.message || 'Unknown error',
        stack: error?.stack || '',
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent
      };
      return ipcRenderer.invoke('log-error', errorData);
    },
    
    reportBug: (bugReport) => {
      if (!validateObject(bugReport)) {
        throw new Error('Invalid bug report format');
      }
      return ipcRenderer.invoke('report-bug', {
        ...bugReport,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href
      });
    },

    // Agent system communication (Phase 2.2b)
    processWithAgent: (message) => {
      if (!validateString(message, 10000)) {
        throw new Error('Invalid message format');
      }
      return ipcRenderer.invoke('process-with-agent', message);
    },
    
    revertToCheckpoint: (checkpointId) => {
      if (!validateString(checkpointId, 100)) {
        throw new Error('Invalid checkpoint ID');
      }
      return ipcRenderer.invoke('revert-to-checkpoint', checkpointId);
    },
    
    getCheckpoints: () => ipcRenderer.invoke('get-checkpoints'),

    // Chat session management (Phase 2.2c)
    createNewChat: (title) => {
      if (title && !validateString(title, 200)) {
        throw new Error('Invalid chat title');
      }
      return ipcRenderer.invoke('create-new-chat', title);
    },
    
    switchChat: (chatId) => {
      if (!validateString(chatId, 100)) {
        throw new Error('Invalid chat ID');
      }
      return ipcRenderer.invoke('switch-chat', chatId);
    },
    
    getChatHistory: (chatId) => {
      if (!validateString(chatId, 100)) {
        throw new Error('Invalid chat ID');
      }
      return ipcRenderer.invoke('get-chat-history', chatId);
    },
    
    deleteChat: (chatId) => {
      if (!validateString(chatId, 100)) {
        throw new Error('Invalid chat ID');
      }
      return ipcRenderer.invoke('delete-chat', chatId);
    },

    // Fusion 360 integration (Phase 3)
    installFusionAddin: () => ipcRenderer.invoke('install-fusion-addin'),
    checkFusionConnection: () => ipcRenderer.invoke('check-fusion-connection'),
    
    onFusionStatusChange: (callback) => {
      if (typeof callback !== 'function') {
        throw new Error('Callback must be a function');
      }
      
      const listener = (event, ...args) => callback(...args);
      ipcRenderer.on('fusion-status-changed', listener);
      return () => ipcRenderer.removeListener('fusion-status-changed', listener);
    },

    // Development helpers (only available in development)
    ...(process.env.NODE_ENV === 'development' && {
      devReload: () => ipcRenderer.invoke('dev-reload'),
      devToggleDevTools: () => ipcRenderer.invoke('dev-toggle-devtools')
    })
  };
};

// Expose secure API to renderer process
contextBridge.exposeInMainWorld('electronAPI', createSecureAPI());

// Expose secure constants and configuration
contextBridge.exposeInMainWorld('appConfig', {
  version: process.env.npm_package_version || '1.0.0',
  platform: process.platform,
  isDevelopment: process.env.NODE_ENV === 'development',
  
  // API endpoints (will be configured in Phase 2)
  backendURL: process.env.NODE_ENV === 'development' 
    ? 'http://localhost:8000' 
    : 'http://localhost:8000',
  websocketURL: process.env.NODE_ENV === 'development' 
    ? 'ws://localhost:8000/ws' 
    : 'ws://localhost:8000/ws',
  
  // UI configuration
  windowConfig: {
    minWidth: 300,
    maxWidth: 600,
    minHeight: 400,
    maxHeight: 800,
    defaultWidth: 400,
    defaultHeight: 600
  },
  
  // Feature flags for phased development
  features: {
    authentication: false,        // Phase 1.4
    pythonBackend: false,         // Phase 2.1
    agentSystem: false,           // Phase 2.2b
    multiChat: false,             // Phase 2.2c
    fusionIntegration: false,     // Phase 3
    advancedFeatures: false       // Phase 4
  },
  
  // Supported file types
  supportedFileTypes: {
    cad: ['.step', '.stp', '.f3d', '.3dm', '.iges', '.igs'],
    export: ['.step', '.stp', '.stl', '.obj'],
    import: ['.step', '.stp', '.f3d']
  },
  
  // UI theme configuration
  theme: {
    defaultTheme: 'dark',
    availableThemes: ['light', 'dark', 'auto'],
    accentColors: ['blue', 'green', 'purple', 'orange']
  }
});

// Expose utility functions for renderer
contextBridge.exposeInMainWorld('utils', {
  // Platform detection
  isWindows: process.platform === 'win32',
  isMacOS: process.platform === 'darwin',
  isLinux: process.platform === 'linux',
  
  // File extension validation
  isCADFile: (filename) => {
    if (typeof filename !== 'string') return false;
    const ext = filename.toLowerCase().split('.').pop();
    return ['.step', '.stp', '.f3d', '.3dm', '.iges', '.igs'].includes(`.${ext}`);
  },
  
  // Safe JSON parsing
  safeJSONParse: (jsonString, defaultValue = null) => {
    try {
      return JSON.parse(jsonString);
    } catch (error) {
      console.warn('Invalid JSON:', error);
      return defaultValue;
    }
  },
  
  // Debounce function for performance
  debounce: (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },
  
  // Format file size
  formatFileSize: (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },
  
  // Format timestamp
  formatTimestamp: (timestamp) => {
    try {
      return new Date(timestamp).toLocaleString();
    } catch (error) {
      return 'Invalid date';
    }
  }
});

// Security: Prevent context bridge pollution
Object.freeze(window.electronAPI);
Object.freeze(window.appConfig);
Object.freeze(window.utils);

// Log successful preload
console.log('Space Desktop - Enhanced preload script loaded with security features');

// Performance monitoring for development
if (process.env.NODE_ENV === 'development') {
  // Monitor renderer performance
  window.addEventListener('load', () => {
    console.log('Renderer load time:', performance.now(), 'ms');
  });
  
  // Monitor memory usage
  if (window.performance && window.performance.memory) {
    setInterval(() => {
      const memory = window.performance.memory;
      if (memory.usedJSHeapSize > 50 * 1024 * 1024) { // 50MB threshold
        console.warn('High memory usage detected:', {
          used: Math.round(memory.usedJSHeapSize / 1024 / 1024) + 'MB',
          total: Math.round(memory.totalJSHeapSize / 1024 / 1024) + 'MB',
          limit: Math.round(memory.jsHeapSizeLimit / 1024 / 1024) + 'MB'
        });
      }
    }, 30000); // Check every 30 seconds
  }
} 