# 🚀 Space - Universal CAD AI Assistant

**Desktop Application for Natural Language CAD Editing**

Space is a universal CAD AI assistant that integrates seamlessly with existing CAD software through a floating chat interface. Users can modify their 3D models using natural language while working in their preferred CAD environment.

## 🎯 Current Status

**Ready for Implementation** - Complete specification and architecture designed.

## 📋 Key Features

- **Natural Language CAD Editing**: Type requests like "make the hole 15mm instead"
- **Real-time Model Updates**: CAD software automatically refreshes to show changes
- **Universal CAD Integration**: Works with Fusion 360, AutoCAD, SolidWorks, etc.
- **Floating Chat Interface**: Always-on-top chat window for seamless workflow
- **File-based Communication**: Edits existing files rather than creating new ones
- **Conversation Memory**: Maintains context throughout editing sessions

## 🏗️ Architecture

- **Frontend**: Electron + React desktop application
- **Backend**: Embedded FastAPI Python server
- **CAD Engine**: Build123d for 3D model generation
- **AI**: Anthropic Claude 4 with reasoning
- **Integration**: Fusion 360 Python API add-in

## 📁 Project Structure

```
space/
├── SPACE_DESKTOP_APP_SPEC.md      # Complete implementation specification
├── SPACE_FEATURES_OUTLINE.md      # Feature overview and roadmap
├── cad_ai_generator_build123d.py  # Current CAD generator (ready to integrate)
├── requirements.txt               # Python dependencies
├── .gitignore                    # Git ignore patterns
└── legacy/                       # Previous prototypes and documentation
```

## 🚀 Next Steps

1. **Phase 1**: Foundation Setup - Initialize Electron project with React
2. **Phase 2**: Backend Integration - Embed FastAPI server and CAD generator
3. **Phase 3**: Fusion 360 Integration - Add-in development and auto-installation
4. **Phase 4**: Advanced Features - Conversation memory and error recovery
5. **Phase 5**: Testing and Polish - Integration testing and UX refinement

## 📖 Documentation

- **[Complete Specification](SPACE_DESKTOP_APP_SPEC.md)** - Detailed implementation plan
- **[Features Outline](SPACE_FEATURES_OUTLINE.md)** - Feature overview and user stories
- **[Legacy Documentation](legacy/)** - Previous prototypes and documentation

## 🛠️ Development

The project is ready for implementation following the comprehensive specification in `SPACE_DESKTOP_APP_SPEC.md`.

---

**Built for engineers, designers, and makers who want to iterate faster with natural language CAD editing.** 