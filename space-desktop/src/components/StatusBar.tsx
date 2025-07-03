import React, { useState } from 'react';
import type { CADDetectionResult, User } from '../types/electron';

interface AppError {
  message: string;
  details?: string;
  timestamp: string;
}

interface StatusBarProps {
  cadDetected: CADDetectionResult;
  workspacePath: string | null;
  version: string;
  platform?: string;
  isAuthenticated: boolean;
  user: User | null;
  errors: AppError[];
  onSignOut: () => Promise<void>;
}

const StatusBar: React.FC<StatusBarProps> = ({ 
  cadDetected, 
  workspacePath, 
  version, 
  platform,
  isAuthenticated,
  user,
  errors,
  onSignOut
}) => {
  const [showErrorDetails, setShowErrorDetails] = useState(false);

  const getCADStatus = () => {
    if (!cadDetected.detected) {
      return { text: 'No CAD Detected', status: 'disconnected' };
    }

    const detectedSoftware = [];
    if (cadDetected.fusion360) detectedSoftware.push('Fusion 360');
    if (cadDetected.autocad) detectedSoftware.push('AutoCAD');
    if (cadDetected.solidworks) detectedSoftware.push('SolidWorks');
    
    return { 
      text: `Connected: ${detectedSoftware.join(', ')}`, 
      status: 'connected' 
    };
  };

  const getBackendStatus = () => {
    if (window.appConfig.features.pythonBackend) {
      return { text: 'Backend: Ready', status: 'connected' };
    }
    return { text: 'Backend: Phase 2', status: 'pending' };
  };

  const cadStatus = getCADStatus();
  const backendStatus = getBackendStatus();
  const hasRecentErrors = errors.length > 0;

  return (
    <div className="status-bar">
      <div className="status-left">
        <div className={`status-item cad-status ${cadStatus.status}`}>
          <span className="status-dot">●</span>
          <span className="status-text">{cadStatus.text}</span>
        </div>
        
        <div className="status-item workspace">
          <span className="status-icon">📁</span>
          <span className="status-text">
            {workspacePath ? 
              `Workspace: ${workspacePath.split(/[/\\]/).pop()}` : 
              'No Workspace'
            }
          </span>
        </div>

        <div className={`status-item backend ${backendStatus.status}`}>
          <span className="status-dot">●</span>
          <span className="status-text">{backendStatus.text}</span>
        </div>

        {/* Error indicator */}
        {hasRecentErrors && (
          <div 
            className="status-item error-indicator"
            onClick={() => setShowErrorDetails(!showErrorDetails)}
            title={`${errors.length} recent error(s)`}
          >
            <span className="status-icon">⚠️</span>
            <span className="status-text">{errors.length}</span>
          </div>
        )}

        {/* Error details popup */}
        {showErrorDetails && hasRecentErrors && (
          <div className="error-details-popup">
            <h4>Recent Errors</h4>
            {errors.slice(-3).map((error, index) => (
              <div key={index} className="error-item">
                <div className="error-message">{error.message}</div>
                <div className="error-time">
                  {new Date(error.timestamp).toLocaleTimeString()}
                </div>
              </div>
            ))}
            <button 
              className="error-close"
              onClick={() => setShowErrorDetails(false)}
            >
              Close
            </button>
          </div>
        )}
      </div>

      <div className="status-right">
        {/* User info */}
        {isAuthenticated && user && (
          <div className="status-item user-info">
            <span className="status-icon">👤</span>
            <span className="status-text">{user.name}</span>
            <button 
              className="sign-out-btn"
              onClick={onSignOut}
              title="Sign out"
            >
              🚪
            </button>
          </div>
        )}

        {/* Feature flags indicator */}
        {window.appConfig.isDevelopment && (
          <div className="status-item features" title="Feature Status">
            <span className="status-icon">🔧</span>
            <span className="status-text">
              {Object.values(window.appConfig.features).filter(Boolean).length}/
              {Object.keys(window.appConfig.features).length}
            </span>
          </div>
        )}
        
        <div className="status-item version">
          <span className="status-text">v{version}</span>
        </div>
        
        {platform && (
          <div className="status-item platform">
            <span className="status-text">{platform}</span>
          </div>
        )}

        {/* Development mode indicator */}
        {window.appConfig.isDevelopment && (
          <div className="status-item dev-mode" title="Development Mode">
            <span className="status-icon">🔧</span>
            <span className="status-text">DEV</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default StatusBar; 