import React, { useState, useEffect, useRef } from 'react';
import ChatWindow from './components/ChatWindow';
import StatusBar from './components/StatusBar';
import ErrorBoundary from './components/ErrorBoundary';
import { useDrag } from './hooks/useDrag';
import { useWindowControls } from './hooks/useWindowControls';
import './styles/floating-chat.css';

// TypeScript interfaces for app state
interface AppState {
  isAuthenticated: boolean;
  currentUser: any;
  cadSoftwareDetected: {
    fusion360: boolean;
    autocad: boolean;
    solidworks: boolean;
    detected?: boolean;
    message?: string;
  };
  workspaceInfo: {
    path: string | null;
    files: string[];
    message?: string;
  };
}

const App: React.FC = () => {
  console.log('App component is rendering...');
  
  const [appState, setAppState] = useState<AppState>({
    isAuthenticated: false,
    currentUser: null,
    cadSoftwareDetected: {
      fusion360: false,
      autocad: false,
      solidworks: false
    },
    workspaceInfo: {
      path: null,
      files: []
    }
  });

  const [appVersion, setAppVersion] = useState<string>('');
  const [systemInfo, setSystemInfo] = useState<any>(null);
  const [isWindowCollapsed, setIsWindowCollapsed] = useState(false);

  // Floating window functionality
  const { windowState, isLoading, controls } = useWindowControls();
  const headerRef = useRef<HTMLDivElement>(null);

  const { isDragging, bindDragEvents } = useDrag({
    onDragStart: () => {
      console.log('Window drag started');
    },
    onDragEnd: () => {
      console.log('Window drag ended');
    },
    threshold: 5
  });

  // Bind drag events to header
  useEffect(() => {
    if (headerRef.current) {
      bindDragEvents(headerRef.current);
    }
  }, [bindDragEvents]);

  useEffect(() => {
    // Initialize app - get version and system info
    const initializeApp = async () => {
      try {
        if (window.electronAPI) {
          const version = await window.electronAPI.getAppVersion();
          const sysInfo = await window.electronAPI.getSystemInfo();
          
          setAppVersion(version || '1.0.0');
          setSystemInfo(sysInfo || {});

          // Detect CAD software
          const cadDetection = await window.electronAPI.detectCADSoftware();
          setAppState(prev => ({
            ...prev,
            cadSoftwareDetected: {
              ...(cadDetection || {
                fusion360: false,
                autocad: false,
                solidworks: false,
                message: 'CAD detection failed'
              }),
              detected: cadDetection?.detected || false
            }
          }));

          // Get workspace info
          const workspaceInfo = await window.electronAPI.getWorkspaceInfo();
          setAppState(prev => ({
            ...prev,
            workspaceInfo: workspaceInfo || {
              path: null,
              files: []
            }
          }));
        }
      } catch (error) {
        console.error('Failed to initialize app:', error);
        // Set default values on error
        setAppVersion('1.0.0');
        setSystemInfo({});
        setAppState(prev => ({
          ...prev,
          cadSoftwareDetected: {
            fusion360: false,
            autocad: false,
            solidworks: false,
            detected: false,
            message: 'CAD detection failed'
          },
          workspaceInfo: {
            path: null,
            files: []
          }
        }));
      }
    };

    initializeApp();
  }, []);

  const handleAuthentication = (user: any) => {
    setAppState(prev => ({
      ...prev,
      isAuthenticated: true,
      currentUser: user
    }));
  };

  const handleSignOut = async () => {
    setAppState(prev => ({
      ...prev,
      isAuthenticated: false,
      currentUser: null
    }));
  };

  const toggleWindowCollapse = () => {
    setIsWindowCollapsed(!isWindowCollapsed);
  };

  return (
    <ErrorBoundary>
      <div className={`space-app ${isDragging ? 'dragging' : ''} ${isWindowCollapsed ? 'collapsed' : ''}`}>
        <header 
          ref={headerRef}
          className="app-header draggable"
        >
          <div className="app-title">
            <h1>Space</h1>
            <span className="app-subtitle">CAD AI Assistant</span>
          </div>
          <div className="app-controls">
            <button 
              className="control-btn collapse"
              onClick={toggleWindowCollapse}
              title={isWindowCollapsed ? "Expand" : "Collapse"}
              disabled={isLoading}
            >
              {isWindowCollapsed ? '▲' : '▼'}
            </button>
            <button 
              className={`control-btn pin ${windowState.isAlwaysOnTop ? 'active' : ''}`}
              onClick={controls.toggleAlwaysOnTop}
              title={`${windowState.isAlwaysOnTop ? 'Unpin' : 'Pin'} window`}
              disabled={isLoading}
            >
              📌
            </button>
            <button 
              className="control-btn minimize"
              onClick={controls.minimize}
              title="Minimize"
              disabled={isLoading}
            >
              −
            </button>
            <button 
              className="control-btn close"
              onClick={controls.close}
              title="Close"
              disabled={isLoading}
            >
              ×
            </button>
          </div>
        </header>

        {!isWindowCollapsed && (
          <div className="app-body">
            <main className="app-main">
              {!appState.isAuthenticated ? (
                <div className="auth-placeholder">
                  <p>Authentication will be implemented in Phase 1.4</p>
                  <button onClick={() => handleAuthentication({ id: 'demo', name: 'Demo User' })}>
                    Continue as Demo User
                  </button>
                </div>
              ) : (
                <ChatWindow 
                  user={appState.currentUser}
                  cadSoftware={appState.cadSoftwareDetected}
                  workspace={appState.workspaceInfo}
                />
              )}
            </main>
            <aside className="app-right-panel">
              <div className="panel-content">
                <h3>Inspector</h3>
                <p>Modular snap-in sections will be placed here.</p>
              </div>
            </aside>
          </div>
        )}

        <footer className="app-footer">
          <StatusBar 
            cadDetected={appState.cadSoftwareDetected}
            workspacePath={appState.workspaceInfo.path}
            version={appVersion}
            platform={systemInfo?.platform}
            isAuthenticated={appState.isAuthenticated}
            user={appState.currentUser}
            errors={[]}
            onSignOut={handleSignOut}
          />
        </footer>

        {/* Floating controls when collapsed */}
        {isWindowCollapsed && (
          <div className="collapsed-controls">
            <button 
              className="expand-btn"
              onClick={toggleWindowCollapse}
              title="Expand window"
            >
              Space
            </button>
          </div>
        )}

        {/* Loading overlay */}
        {isLoading && (
          <div className="loading-overlay">
            <div className="loading-spinner"></div>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
};

export default App; 