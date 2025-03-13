import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import './styles/index.css';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Initialize dark mode from local storage
const darkMode = localStorage.getItem('darkMode') === 'true' || 
  window.matchMedia('(prefers-color-scheme: dark)').matches;

// Apply class to document
if (darkMode) {
  document.documentElement.classList.add('dark');
}

ReactDOM.render(
  <React.StrictMode>
    <App />
    <ToastContainer
      position="top-right"
      autoClose={4000}
      hideProgressBar={false}
      newestOnTop
      closeOnClick
      rtl={false}
      pauseOnFocusLoss
      draggable
      pauseOnHover
      theme={darkMode ? 'dark' : 'light'}
    />
  </React.StrictMode>,
  document.getElementById('root')
);