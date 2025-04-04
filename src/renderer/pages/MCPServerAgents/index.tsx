import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Card, Descriptions, Modal, message } from 'antd';
import { PlusOutlined, EyeOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { MCPServerAgent, MCPServer } from '../../types';
import { getMCPServerAgents, deleteMCPServerAgent, getMCPServers } from '../../services/mcpService';
import './index.css';

const MCPServerAgents: React.FC = () => {
  const [agents, setAgents] = useState<MCPServerAgent[]>([]);
  const [servers, setServers] = useState<MCPServer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const navigate = useNavigate();

  const fetchData = async () => {
    setLoading(true);
    try {
      const [agentsData, serversData] = await Promise.all([
        getMCPServerAgents(),
        getMCPServers()
      ]);
      setAgents(agentsData);
      setServers(serversData);
    } catch (error) {
      message.error('获取数据失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getServerNames = (serverIds: string[]) => {
    return serverIds
      .map(id => servers.find(server => server.id === id)?.name || 'Unknown')
      .join(', ');
  };

  const handleDelete = async (id: string) => {
    Modal.confirm({
      title: '确定删除此MCP服务器代理?',
      content: '删除后将无法恢复',
      okText: '确定',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          await deleteMCPServerAgent(id);
          message.success('删除成功');
          fetchData();
        } catch (error) {
          message.error('删除失败');
        }
      }
    });
  };

  const columns = [
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: '服务器',
      key: 'servers',
      render: (record: MCPServerAgent) => (
        <span>{getServerNames(record.servers)}</span>
      )
    },
    {
      title: '暴露接口数',
      key: 'exposedEndpointsCount',
      render: (record: MCPServerAgent) => (
        <span>{record.exposedEndpoints.length}</span>
      )
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleString()
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: MCPServerAgent) => (
        <Space size="middle">
          <Button 
            type="text" 
            icon={<EyeOutlined />} 
            onClick={() => navigate(`/agents/${record.id}`)}
          />
          <Button 
            type="text" 
            icon={<EditOutlined />} 
            onClick={() => navigate(`/agents/${record.id}/edit`)}
          />
          <Button 
            type="text" 
            danger 
            icon={<DeleteOutlined />} 
            onClick={() => handleDelete(record.id)}
          />
        </Space>
      ),
    },
  ];

  return (
    <div className="mcp-agents-page">
      <div className="page-header">
        <h1>MCP Server Agents</h1>
        <Button 
          type="primary" 
          icon={<PlusOutlined />}
          onClick={() => navigate('/agents/create')}
        >
          添加代理
        </Button>
      </div>
      
      <Table 
        columns={columns} 
        dataSource={agents} 
        rowKey="id"
        loading={loading}
      />
    </div>
  );
};

export default MCPServerAgents;
