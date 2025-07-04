// TypeScript definitions for Electron API exposed in preload.js

interface ElectronAPI {
  // App information
  getAppVersion: () => Promise<string>;
  getSystemInfo: () => Promise<SystemInfo>;

  // Window controls
  minimizeWindow: () => Promise<boolean>;
  closeWindow: () => Promise<boolean>;
  showWindow: () => Promise<boolean>;
  hideWindow: () => Promise<boolean>;
  toggleAlwaysOnTop: () => Promise<boolean>;

  // CAD software detection
  detectCADSoftware: () => Promise<CADDetectionResult>;
  getWorkspaceInfo: () => Promise<WorkspaceInfo>;

  // File system operations (to be implemented in Phase 2)
  selectWorkspaceFolder: () => Promise<FolderSelectionResult>;
  watchFiles: (callback: FileChangeCallback) => () => void;

  // Backend API communication (to be implemented in Phase 2)
  sendChatMessage: (message: string) => Promise<ChatResponse>;
  onChatResponse: (callback: ChatResponseCallback) => () => void;

  // Authentication (to be implemented in Phase 1.4)
  authenticateUser: (credentials: UserCredentials) => Promise<AuthResult>;
  getCurrentUser: () => Promise<User | null>;
  signOut: () => Promise<void>;

  // Settings management
  getSettings: () => Promise<AppSettings>;
  updateSettings: (settings: Partial<AppSettings>) => Promise<SettingsUpdateResult>;

  // Error handling and logging
  logError: (error: Error | ErrorData) => Promise<LogResult>;
  reportBug: (bugReport: BugReport) => Promise<BugReportResult>;

  // Agent system communication (to be implemented in Phase 2.2b)
  processWithAgent: (message: string) => Promise<AgentResponse>;
  revertToCheckpoint: (checkpointId: string) => Promise<CheckpointResult>;
  getCheckpoints: () => Promise<Checkpoint[]>;

  // Chat session management (to be implemented in Phase 2.2c)
  createNewChat: (title?: string) => Promise<ChatSession>;
  switchChat: (chatId: string) => Promise<ChatSession>;
  getChatHistory: (chatId: string) => Promise<ChatMessage[]>;
  deleteChat: (chatId: string) => Promise<DeleteResult>;

  // Fusion 360 integration (to be implemented in Phase 3)
  installFusionAddin: () => Promise<InstallationResult>;
  checkFusionConnection: () => Promise<ConnectionStatus>;
  onFusionStatusChange: (callback: FusionStatusCallback) => () => void;

  // Development helpers (only available in development)
  devReload?: () => Promise<void>;
  devToggleDevTools?: () => Promise<void>;
}

interface AppConfig {
  version: string;
  platform: string;
  isDevelopment: boolean;
  backendURL: string;
  websocketURL: string;
  windowConfig: WindowConfig;
  features: FeatureFlags;
  supportedFileTypes: SupportedFileTypes;
  theme: ThemeConfig;
}

interface UtilityFunctions {
  isWindows: boolean;
  isMacOS: boolean;
  isLinux: boolean;
  isCADFile: (filename: string) => boolean;
  safeJSONParse<T>(jsonString: string, defaultValue?: T): T;
  debounce<T extends (...args: any[]) => any>(func: T, wait: number): T;
  formatFileSize: (bytes: number) => string;
  formatTimestamp: (timestamp: string | number | Date) => string;
}

interface SystemInfo {
  platform: string;
  arch: string;
  version: string;
  electronVersion: string;
  nodeVersion: string;
  chromeVersion: string;
}

interface WindowConfig {
  minWidth: number;
  maxWidth: number;
  minHeight: number;
  maxHeight: number;
  defaultWidth: number;
  defaultHeight: number;
}

interface FeatureFlags {
  authentication: boolean;
  pythonBackend: boolean;
  agentSystem: boolean;
  multiChat: boolean;
  fusionIntegration: boolean;
  advancedFeatures: boolean;
}

interface SupportedFileTypes {
  cad: string[];
  export: string[];
  import: string[];
}

interface ThemeConfig {
  defaultTheme: string;
  availableThemes: string[];
  accentColors: string[];
}

interface CADDetectionResult {
  fusion360: boolean;
  autocad: boolean;
  solidworks: boolean;
  detected: boolean;
  message?: string;
}

interface WorkspaceInfo {
  path: string | null;
  files: string[];
  message?: string;
}

interface FolderSelectionResult {
  success: boolean;
  path?: string;
  error?: string;
}

// File change callback
type FileChangeCallback = (filePath: string, eventType: 'add' | 'change' | 'unlink') => void;

// Chat response interfaces
interface ChatResponse {
  success: boolean;
  message?: string;
  data?: any;
  error?: string;
}

type ChatResponseCallback = (response: ChatResponse) => void;

interface UserCredentials {
  email: string;
  password: string;
  [key: string]: any;
}

interface User {
  id: string;
  email: string;
  name: string;
  [key: string]: any;
}

interface AuthResult {
  success: boolean;
  user?: User;
  token?: string;
  error?: string;
}

interface AppSettings {
  alwaysOnTop: boolean;
  apiKey: string | null;
  theme: string;
  autoHide: boolean;
  notifications: boolean;
  [key: string]: any;
}

interface SettingsUpdateResult {
  success: boolean;
  error?: string;
}

interface ErrorData {
  message: string;
  stack?: string;
  timestamp: string;
  userAgent: string;
  [key: string]: any;
}

interface LogResult {
  logged: boolean;
  error?: string;
}

interface BugReport {
  title: string;
  description: string;
  steps?: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  userAgent?: string;
  timestamp?: string;
  url?: string;
  [key: string]: any;
}

interface BugReportResult {
  reported: boolean;
  ticketId?: string;
  error?: string;
}

interface AgentResponse {
  success: boolean;
  results?: any[];
  checkpoint?: Checkpoint;
  summary?: string;
  error?: string;
}

interface Checkpoint {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  conversationState?: any;
  fileState?: any;
}

interface CheckpointResult {
  success: boolean;
  checkpoint?: Checkpoint;
  error?: string;
}

interface ChatSession {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
  contextLength: number;
}

interface ChatMessage {
  id: string;
  type: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  metadata?: any;
}

interface DeleteResult {
  success: boolean;
  error?: string;
}

interface InstallationResult {
  success: boolean;
  message: string;
  version?: string;
  error?: string;
}

interface ConnectionStatus {
  connected: boolean;
  version?: string;
  workspace?: string;
  error?: string;
}

type FusionStatusCallback = (status: ConnectionStatus) => void;

declare global {
  interface Window {
    electronAPI: ElectronAPI;
    appConfig: AppConfig;
    utils: UtilityFunctions;
  }
}

export {
  ElectronAPI,
  AppConfig,
  UtilityFunctions,
  SystemInfo,
  CADDetectionResult,
  WorkspaceInfo,
  ChatResponse,
  User,
  AppSettings,
  BugReport,
  AgentResponse,
  Checkpoint,
  ChatSession,
  ChatMessage,
  InstallationResult,
  ConnectionStatus
}; 