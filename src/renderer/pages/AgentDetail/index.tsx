import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Descriptions, Button, List, Tag, Divider, message, Spin } from 'antd';
import { EditOutlined, DeleteOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { MCPServerAgent, MCPServer } from '../../types';
import { getMCPServerAgentById, getMCPServers, deleteMCPServerAgent } from '../../services/mcpService';
import './index.css';

const AgentDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [agent, setAgent] = useState<MCPServerAgent | null>(null);
  const [servers, setServers] = useState<MCPServer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const [agentData, serversData] = await Promise.all([
          getMCPServerAgentById(id),
          getMCPServers()
        ]);
        
        if (!agentData) {
          message.error('代理不存在');
          navigate('/agents');
          return;
        }
        
        setAgent(agentData);
        setServers(serversData);
      } catch (error) {
        message.error('获取数据失败');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, navigate]);

  const handleDelete = async () => {
    if (!id) return;
    
    try {
      await deleteMCPServerAgent(id);
      message.success('删除成功');
      navigate('/agents');
    } catch (error) {
      message.error('删除失败');
    }
  };

  if (loading) {
    return (
      <div className="agent-detail-loading">
        <Spin size="large" />
      </div>
    );
  }

  if (!agent) {
    return null;
  }

  const agentServers = servers.filter(server => 
    agent.servers.includes(server.id)
  );

  return (
    <div className="agent-detail-page">
      <div className="page-header">
        <Button 
          icon={<ArrowLeftOutlined />} 
          onClick={() => navigate('/agents')}
        >
          返回列表
        </Button>
        <div>
          <Button 
            type="primary" 
            icon={<EditOutlined />}
            onClick={() => navigate(`/agents/${id}/edit`)}
            style={{ marginRight: 8 }}
          >
            编辑
          </Button>
          <Button 
            danger 
            icon={<DeleteOutlined />}
            onClick={handleDelete}
          >
            删除
          </Button>
        </div>
      </div>

      <Card title="代理详情" className="agent-card">
        <Descriptions bordered column={2}>
          <Descriptions.Item label="ID">{agent.id}</Descriptions.Item>
          <Descriptions.Item label="名称">{agent.name}</Descriptions.Item>
          <Descriptions.Item label="描述" span={2}>
            {agent.description || '无描述'}
          </Descriptions.Item>
          <Descriptions.Item label="创建时间">
            {new Date(agent.createdAt).toLocaleString()}
          </Descriptions.Item>
          <Descriptions.Item label="更新时间">
            {new Date(agent.updatedAt).toLocaleString()}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Divider orientation="left">包含的服务器</Divider>
      <List
        className="server-list"
        itemLayout="horizontal"
        dataSource={agentServers}
        renderItem={server => (
          <List.Item>
            <List.Item.Meta
              title={server.name}
              description={server.url}
            />
            <div>
              <Tag color={server.mode === 'stdio' ? 'blue' : 'purple'}>
                {server.mode.toUpperCase()}
              </Tag>
              <Tag color={server.status === 'online' ? 'green' : 'red'}>
                {server.status === 'online' ? '在线' : '离线'}
              </Tag>
            </div>
          </List.Item>
        )}
      />

      <Divider orientation="left">暴露的接口</Divider>
      <List
        className="endpoint-list"
        bordered
        dataSource={agent.exposedEndpoints}
        renderItem={endpoint => (
          <List.Item>
            <Tag color="blue">{endpoint}</Tag>
          </List.Item>
        )}
      />
    </div>
  );
};

export default AgentDetail;
