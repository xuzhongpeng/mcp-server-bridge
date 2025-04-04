import React from 'react';
import { Layout as AntLayout, Menu } from 'antd';
import { Link, useLocation } from 'react-router-dom';
import { DesktopOutlined, AppstoreOutlined } from '@ant-design/icons';
import './index.css';

const { Header, Sider, Content } = AntLayout;

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const selectedKey = location.pathname.split('/')[1] || 'servers';

  return (
    <AntLayout className="app-layout">
      <Header className="app-header">
        <div className="logo">MCP服务器管理工具</div>
      </Header>
      <AntLayout>
        <Sider width={200} className="app-sider">
          <Menu
            mode="inline"
            selectedKeys={[selectedKey]}
            style={{ height: '100%', borderRight: 0 }}
          >
            <Menu.Item key="servers" icon={<DesktopOutlined />}>
              <Link to="/servers">MCP Servers</Link>
            </Menu.Item>
            <Menu.Item key="agents" icon={<AppstoreOutlined />}>
              <Link to="/agents">MCP Server Agents</Link>
            </Menu.Item>
          </Menu>
        </Sider>
        <Content className="app-content">
          {children}
        </Content>
      </AntLayout>
    </AntLayout>
  );
};

export default Layout;
