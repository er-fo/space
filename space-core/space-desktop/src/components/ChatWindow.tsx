import React, { useState, useEffect, useRef } from 'react';

interface ChatWindowProps {
  user: any;
  cadSoftware: {
    fusion360: boolean;
    autocad: boolean;
    solidworks: boolean;
  };
  workspace: {
    path: string | null;
    files: string[];
  };
}

interface ChatMessage {
  id: string;
  type: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ 
  user, 
  cadSoftware, 
  workspace
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const welcomeMessage: ChatMessage = {
      id: 'welcome',
      type: 'system',
      content: `Welcome to Space, ${user?.name || 'User'}! I'm your CAD AI assistant.`,
      timestamp: new Date()
    };
    
    // Check if any CAD software is detected - add null safety
    const cadSoftwareValues = cadSoftware ? Object.values(cadSoftware) : [];
    const hasCAD = cadSoftwareValues.some(detected => detected === true);
    
    const statusMessage: ChatMessage = {
      id: 'status',
      type: 'system',
      content: `Status: ${hasCAD ? 'CAD software detected' : 'No CAD software detected'}. ${workspace?.path ? `Workspace: ${workspace.path}` : 'No workspace selected.'}`,
      timestamp: new Date()
    };
    
    setMessages([welcomeMessage, statusMessage]);
  }, [user, cadSoftware, workspace]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isProcessing) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsProcessing(true);

    try {
      // Placeholder response for Phase 1.3 - backend will be implemented in Phase 2
      setTimeout(() => {
        const assistantMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          type: 'assistant',
          content: `I received your message: "${inputMessage}". Full CAD generation will be available in Phase 2 when the Python backend is integrated. For now, I'm demonstrating the floating window functionality.`,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, assistantMessage]);
        setIsProcessing(false);
      }, 1000);
    } catch (error) {
      console.error('Failed to process message:', error);
      setIsProcessing(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSelectWorkspace = async () => {
    try {
      // This will be implemented in Phase 2
      const successMessage: ChatMessage = {
        id: Date.now().toString(),
        type: 'system',
        content: `Workspace selection will be available in Phase 2.`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, successMessage]);
    } catch (error) {
      console.error('Workspace selection error:', error);
    }
  };

  // Check if any CAD software is detected - add null safety
  const cadSoftwareValues = cadSoftware ? Object.values(cadSoftware) : [];
  const hasCAD = cadSoftwareValues.some(detected => detected === true);

  return (
    <div className="chat-window">
      <div className="chat-header">
        <div className="chat-status">
          <span className={`status-indicator ${hasCAD ? 'connected' : 'disconnected'}`}>●</span>
          <span className="status-text">
            {hasCAD ? 'CAD Connected' : 'No CAD Detected'}
          </span>
        </div>
        
        <div className="chat-actions">
          <button
            className="action-btn"
            onClick={handleSelectWorkspace}
            title="Select workspace folder"
          >
            📁
          </button>
        </div>
      </div>

      <div className="chat-messages">
        {messages.map((message) => (
          <div key={message.id} className={`message ${message.type}`}>
            <div className="message-content">{message.content}</div>
            <div className="message-timestamp">
              {message.timestamp.toLocaleTimeString()}
            </div>
          </div>
        ))}
        {isProcessing && (
          <div className="message assistant">
            <div className="message-content">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input">
        <div className="input-container">
          <textarea
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={
              workspace?.path 
                ? "Describe the 3D model you want to create..."
                : "Try: 'Create a 50mm cube with a 10mm hole'"
            }
            className="message-input"
            disabled={isProcessing}
            rows={2}
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isProcessing}
            className="send-button"
            title="Send message"
          >
            {isProcessing ? '⏳' : '▶'}
          </button>
        </div>
        
        <div className="input-hints">
          <span className="hint">Phase 1.3: Floating Window Demo</span>
          <span className="hint">Try dragging the header to reposition</span>
          <span className="hint">Ctrl+Shift+Space to toggle visibility</span>
        </div>
      </div>
    </div>
  );
};

export default ChatWindow; 