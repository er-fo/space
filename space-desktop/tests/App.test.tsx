import React from 'react';
import { render, screen } from '@testing-library/react';
import App from '../src/App';

describe('App Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders app header with title', () => {
    render(<App />);
    
    expect(screen.getByText('Space')).toBeInTheDocument();
    expect(screen.getByText('CAD AI Assistant')).toBeInTheDocument();
  });

  test('renders authentication placeholder when not authenticated', () => {
    render(<App />);
    
    expect(screen.getByText('Authentication will be implemented in Phase 1.4')).toBeInTheDocument();
    expect(screen.getByText('Continue as Demo User')).toBeInTheDocument();
  });

  test('renders window controls', () => {
    render(<App />);
    
    // Check for control buttons
    expect(screen.getByTitle(/Pin.*window/)).toBeInTheDocument();
    expect(screen.getByTitle('Minimize')).toBeInTheDocument();
    expect(screen.getByTitle('Close')).toBeInTheDocument();
  });

  test('calls electronAPI on mount', () => {
    render(<App />);
    
    expect(global.electronAPI.getAppVersion).toHaveBeenCalled();
    expect(global.electronAPI.getSystemInfo).toHaveBeenCalled();
    expect(global.electronAPI.detectCADSoftware).toHaveBeenCalled();
    expect(global.electronAPI.getWorkspaceInfo).toHaveBeenCalled();
  });
}); 