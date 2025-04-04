import React, { useState, useEffect } from 'react';
const { ipcRenderer } = window.electron || {};

function App() {
  const [servers, setServers] = useState([]);
  const [selectedServer, setSelectedServer] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // 模拟加载服务器列表
  useEffect(() => {
    // 这里将来会从配置文件或其他来源加载真实的MCP服务器列表
    const mockServers = [
      { id: 1, name: '示例服务器1', status: 'stopped', path: '/path/to/server1' },
      { id: 2, name: '示例服务器2', status: 'running', path: '/path/to/server2' }
    ];
    
    setServers(mockServers);
  }, []);

  // 处理服务器操作
  const handleServerAction = (action, server) => {
    setIsLoading(true);
    
    // 发送操作到主进程
    ipcRenderer.send('mcp-server-action', action, server);
    
    // 监听操作结果
    ipcRenderer.once('mcp-server-action-reply', (event, success, data) => {
      setIsLoading(false);
      
      if (success) {
        // 更新服务器状态
        if (action === 'start') {
          updateServerStatus(server.id, 'running');
        } else if (action === 'stop') {
          updateServerStatus(server.id, 'stopped');
        }
      } else {
        alert(`操作失败: ${data.message}`);
      }
    });
  };

  // 更新服务器状态
  const updateServerStatus = (serverId, status) => {
    setServers(servers.map(server => 
      server.id === serverId ? { ...server, status } : server
    ));
  };

  // 选择服务器
  const handleSelectServer = (server) => {
    setSelectedServer(server);
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>MCP服务器管理工具</h1>
      </header>
      
      <div className="main-content">
        <div className="server-list">
          <h2>服务器列表</h2>
          {servers.length === 0 ? (
            <p>没有可用的服务器</p>
          ) : (
            <ul>
              {servers.map(server => (
                <li 
                  key={server.id} 
                  className={`server-item ${selectedServer?.id === server.id ? 'selected' : ''}`}
                  onClick={() => handleSelectServer(server)}
                >
                  <div className="server-name">{server.name}</div>
                  <div className={`server-status ${server.status}`}>
                    {server.status === 'running' ? '运行中' : '已停止'}
                  </div>
                </li>
              ))}
            </ul>
          )}
          
          <div className="server-actions">
            <button className="add-server-btn">添加服务器</button>
          </div>
        </div>
        
        {selectedServer && (
          <div className="server-details">
            <h2>服务器详情</h2>
            <div className="detail-item">
              <span className="label">名称:</span>
              <span>{selectedServer.name}</span>
            </div>
            <div className="detail-item">
              <span className="label">路径:</span>
              <span>{selectedServer.path}</span>
            </div>
            <div className="detail-item">
              <span className="label">状态:</span>
              <span className={selectedServer.status}>
                {selectedServer.status === 'running' ? '运行中' : '已停止'}
              </span>
            </div>
            
            <div className="server-controls">
              {selectedServer.status === 'stopped' ? (
                <button 
                  className="control-btn start"
                  onClick={() => handleServerAction('start', selectedServer)}
                  disabled={isLoading}
                >
                  启动服务器
                </button>
              ) : (
                <button 
                  className="control-btn stop"
                  onClick={() => handleServerAction('stop', selectedServer)}
                  disabled={isLoading}
                >
                  停止服务器
                </button>
              )}
              <button 
                className="control-btn edit"
                onClick={() => handleServerAction('edit', selectedServer)}
                disabled={isLoading}
              >
                编辑配置
              </button>
              <button 
                className="control-btn delete"
                onClick={() => handleServerAction('delete', selectedServer)}
                disabled={isLoading}
              >
                删除服务器
              </button>
            </div>
          </div>
        )}
      </div>
      
      {isLoading && <div className="loading-overlay">处理中...</div>}
    </div>
  );
}

export default App;
