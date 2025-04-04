import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles.css';

// 创建React根元素并渲染App组件
const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
