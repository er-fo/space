# Space Desktop App - Core Features Outline

## Desktop Application Architecture
- Electron-based cross-platform desktop application with React frontend
- Embedded Python backend with FastAPI server running as child process
- Always-on-top floating chat window for seamless CAD integration
- System tray integration with auto-launch capabilities
- Secure IPC communication between Electron processes with preload.js security bridge

## AI-Powered CAD Generation
- Natural language to 3D model conversion using Anthropic Claude 4 with reasoning
- Build123d-based CAD engine for precise geometric modeling
- Real-time STEP file generation and updates
- Conversation context memory for iterative design modifications
- Professional CAD engineering system prompts with domain expertise

## Enhanced Agent System
- Intent parser extracts goals and context from user prompts
- Decision agent decomposes complex tasks into sequential steps
- Task execution loop with automatic verification and retry logic
- Checkpoint system with revert capabilities and concise descriptions
- Memory management for conversation context and project state

## Multi-Chat Session Management
- New chat creation with fresh memory context for better AI responses
- Chat session switching and restoration across app restarts
- Context overflow detection with 95% token limit warnings
- Smart conversation truncation preserving recent content and checkpoints
- Cross-chat checkpoint sharing and import functionality

## Existing STEP File Integration
- Hybrid reverse engineering workflow for external CAD files without Python code
- Four-phase process: geometric analysis, context gathering, smart questionnaire, LLM synthesis
- Automatic feature detection (holes, fillets, chamfers, bosses, pockets)
- Interactive user context gathering with visual previews
- Intelligent MCQs based on detected geometry for parametric conversion
- LLM synthesis creates editable parametric Python code from static STEP files

## Universal CAD Integration
- File-based communication that works with any CAD software
- Auto-detection of Fusion 360 installation and workspace
- Automatic add-in deployment via registry detection
- Real-time model updates without manual file reloading
- Cross-platform CAD software compatibility (Windows, macOS, Linux)

## Fusion 360 Specific Features
- Python API-based add-in for seamless integration
- WebSocket communication for instant model updates
- Automatic model import and view refresh
- Connection monitoring with automatic reconnection
- Auto-installation system with fallback to manual installation guide

## Workspace Management
- Automatic CAD software process detection (5-second polling)
- Active workspace and project file discovery
- Real-time file change monitoring with Python Watchdog
- Cross-platform file path normalization and compatibility
- Debounced file change processing to prevent rapid update conflicts

## Authentication & Security
- AWS Cognito integration with OAuth and magic link support
- Local API key storage with encryption
- User-provided Anthropic API keys (no charging, user owns their usage)
- Process isolation and restricted file system access
- Secure context isolation between main and renderer processes

## User Interface Features
- Drag-to-reposition floating window functionality
- Auto-hide when CAD software gains focus
- Real-time status indicators and progress feedback
- Settings panel for API key and preference management
- File selector with workspace preview and detection
- Responsive design with modern UI/UX best practices

## Error Handling & Recovery
- Comprehensive diagnostic mode with automatic log collection
- Graceful degradation when CAD software not detected
- Exponential backoff for connection retries with clear error messages
- User-friendly error messages with suggested solutions
- One-click bug report generation with privacy controls
- Robust error classification (invalid input, code generation, model creation, file export)

## Performance & Monitoring
- Structured JSON logging with rotation and encryption
- Privacy-first analytics with opt-in data collection
- Real-time performance monitoring and health dashboards
- Memory usage optimization (target: <200MB footprint)
- Sub-2-second response times for simple modifications
- Automatic performance regression testing in CI/CD

## Cross-Platform Support
- Windows (primary), macOS, and Linux compatibility
- Platform-specific installation and registry handling
- NSIS installer for Windows with dependency management
- DMG package for macOS with proper code signing
- AppImage distribution for Linux broad compatibility
- Auto-updater system with code signing verification

## Development & Distribution
- Continuous integration with automated testing
- GDPR-compliant data handling with granular consent controls
- Automatic dependency installation and setup
- Hot-reload development environment
- Comprehensive error reporting and crash analytics
- Performance baselines and monitoring

## Advanced Capabilities
- Conversation memory persistence across sessions
- Task planning with geometric constraint validation
- Manufacturing consideration integration (3D printing, CNC machining)
- Progressive timeout handling for network operations
- Parametric history tracking for design versioning
- Format conversion support (STEP to OBJ for broader compatibility)

## Core User Workflow
- User opens CAD software with existing project
- Space auto-detects workspace and displays floating chat
- User types natural language commands (e.g., "Create a 50mm cube with 10mm hole")
- Space generates/updates STEP file in workspace directory
- CAD software auto-reloads updated file via add-in integration
- User continues iterative design with natural language modifications
- Checkpoint system maintains design history for easy rollback

