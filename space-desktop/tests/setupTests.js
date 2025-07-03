import '@testing-library/jest-dom';

// Mock Electron APIs globally
global.electronAPI = {
  getAppVersion: jest.fn().mockResolvedValue('1.0.0'),
  getSystemInfo: jest.fn().mockResolvedValue({ platform: 'win32' }),
  detectCADSoftware: jest.fn().mockResolvedValue({
    fusion360: false,
    autocad: false,
    solidworks: false
  }),
  getWorkspaceInfo: jest.fn().mockResolvedValue({
    path: null,
    files: []
  }),
  minimizeWindow: jest.fn(),
  closeWindow: jest.fn(),
  toggleAlwaysOnTop: jest.fn(),
  showWindow: jest.fn(),
  hideWindow: jest.fn()
};

global.appConfig = {
  version: '1.0.0',
  platform: 'win32',
  isDevelopment: true,
  windowConfig: {
    minWidth: 300,
    maxWidth: 600,
    minHeight: 400,
    maxHeight: 800,
    defaultWidth: 400,
    defaultHeight: 600
  }
}; 