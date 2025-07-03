import { useState, useCallback, useEffect } from 'react';

interface WindowState {
  isAlwaysOnTop: boolean;
  opacity: number;
  isVisible: boolean;
  isMinimized: boolean;
}

export function useWindowControls() {
  const [windowState, setWindowState] = useState<WindowState>({
    isAlwaysOnTop: true,
    opacity: 1.0,
    isVisible: true,
    isMinimized: false
  });

  const [isLoading, setIsLoading] = useState(false);

  // Initialize window state
  useEffect(() => {
    // Set initial state based on app config
    const config = window.appConfig?.windowConfig;
    if (config) {
      setWindowState(prev => ({
        ...prev,
        opacity: config.opacityRange?.max || 1.0
      }));
    }
  }, []);

  const minimize = useCallback(async () => {
    if (!window.electronAPI) return;
    
    setIsLoading(true);
    try {
      await window.electronAPI.minimizeWindow();
      setWindowState(prev => ({ ...prev, isMinimized: true }));
    } catch (error) {
      console.error('Failed to minimize window:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const close = useCallback(async () => {
    if (!window.electronAPI) return;
    
    setIsLoading(true);
    try {
      await window.electronAPI.closeWindow();
    } catch (error) {
      console.error('Failed to close window:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const toggleAlwaysOnTop = useCallback(async () => {
    if (!window.electronAPI) return;
    
    setIsLoading(true);
    try {
      const newState = await window.electronAPI.toggleAlwaysOnTop();
      setWindowState(prev => ({ ...prev, isAlwaysOnTop: newState }));
      return newState;
    } catch (error) {
      console.error('Failed to toggle always on top:', error);
      return windowState.isAlwaysOnTop;
    } finally {
      setIsLoading(false);
    }
  }, [windowState.isAlwaysOnTop]);

  const setOpacity = useCallback(async (opacity: number) => {
    if (!window.electronAPI) return;
    
    const config = window.appConfig?.windowConfig;
    const minOpacity = config?.opacityRange?.min || 0.1;
    const maxOpacity = config?.opacityRange?.max || 1.0;
    
    // Clamp opacity to valid range
    const clampedOpacity = Math.max(minOpacity, Math.min(maxOpacity, opacity));
    
    setIsLoading(true);
    try {
      const newOpacity = await window.electronAPI.setOpacity(clampedOpacity);
      setWindowState(prev => ({ ...prev, opacity: newOpacity }));
      return newOpacity;
    } catch (error) {
      console.error('Failed to set opacity:', error);
      return windowState.opacity;
    } finally {
      setIsLoading(false);
    }
  }, [windowState.opacity]);

  const toggleVisibility = useCallback(async () => {
    if (!window.electronAPI) return;
    
    setIsLoading(true);
    try {
      const newState = await window.electronAPI.toggleVisibility();
      setWindowState(prev => ({ ...prev, isVisible: newState }));
      return newState;
    } catch (error) {
      console.error('Failed to toggle visibility:', error);
      return windowState.isVisible;
    } finally {
      setIsLoading(false);
    }
  }, [windowState.isVisible]);

  const fadeOut = useCallback(async (targetOpacity: number = 0.3, duration: number = 300) => {
    const config = window.appConfig?.windowConfig;
    const minOpacity = config?.opacityRange?.min || 0.1;
    const clampedOpacity = Math.max(minOpacity, targetOpacity);
    
    return await setOpacity(clampedOpacity);
  }, [setOpacity]);

  const fadeIn = useCallback(async (duration: number = 200) => {
    const config = window.appConfig?.windowConfig;
    const maxOpacity = config?.opacityRange?.max || 1.0;
    
    return await setOpacity(maxOpacity);
  }, [setOpacity]);

  // Keyboard shortcut handlers
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const isCtrlOrCmd = event.ctrlKey || event.metaKey;
      
      if (isCtrlOrCmd && event.shiftKey) {
        switch (event.code) {
          case 'Space':
            event.preventDefault();
            toggleVisibility();
            break;
          case 'KeyT':
            event.preventDefault();
            toggleAlwaysOnTop();
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleVisibility, toggleAlwaysOnTop]);

  return {
    windowState,
    isLoading,
    controls: {
      minimize,
      close,
      toggleAlwaysOnTop,
      setOpacity,
      toggleVisibility,
      fadeOut,
      fadeIn
    }
  };
} 