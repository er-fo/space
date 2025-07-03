import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles/globals.css';

console.log('React index.tsx is loading...');

const container = document.getElementById('root');
console.log('Container element:', container);

if (!container) {
  console.error('Root container not found!');
} else {
  console.log('Creating React root...');
  const root = createRoot(container);

  console.log('Rendering App component...');
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
  console.log('App component rendered!');
} 