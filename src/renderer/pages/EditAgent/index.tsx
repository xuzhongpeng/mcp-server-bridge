import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Form, Input, Button, Transfer, Card, message, Spin } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { MCPServer, MCPServerAgent } from '../../types';
import { getMCPServers, getMCPServerAgentById, updateMCPServerAgent } from '../../services/mcpService';
import './index.css';

interface TransferItem {
  key: string;
  title: string;
  description: string;
  disabled: boolean;
}

const EditAgent: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [servers, setServers] = useState<MCPServer[]>([]);
  const [agent, setAgent] = useState<MCPServerAgent | null>(null);
  const [selectedServerIds, setSelectedServerIds] = useState<string[]>([]);
  const [endpoints, setEndpoints] = useState<string[]>([]);
  const [currentEndpoint, setCurrentEndpoint] = useState<string>('');

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
        setSelectedServerIds(agentData.servers);
        setEndpoints(agentData.exposedEndpoints);
        
        form.setFieldsValue({
          name: agentData.name,
          description: agentData.description
        });
      } catch (error) {
        message.error('获取数据失败');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, navigate, form]);

  const serverItems: TransferItem[] = servers.map(server => ({
    key: server.id,
    title: server.name,
    description: `${server.url} (${server.mode.toUpperCase()})`,
    disabled: server.status === 'offline',
  }));

  const handleSubmit = async (values: any) => {
    if (!id || !agent) return;
    
    if (selectedServerIds.length === 0) {
      message.error('请选择至少一个服务器');
      return;
    }

    if (endpoints.length === 0) {
      message.error('请添加至少一个暴露接口');
      return;
    }

    setSubmitting(true);
    try {
      await updateMCPServerAgent(id, {
        name: values.name,
        description: values.description,
        servers: selectedServerIds,
        exposedEndpoints: endpoints,
      });
      message.success('更新代理成功');
      navigate('/agents');
    } catch (error) {
      message.error('更新代理失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddEndpoint = () => {
    if (!currentEndpoint.trim()) {
      message.error('请输入有效的接口路径');
      return;
    }

    // 确保接口路径以 / 开头
    const formattedEndpoint = currentEndpoint.startsWith('/') 
      ? currentEndpoint 
      : `/${currentEndpoint}`;

    if (endpoints.includes(formattedEndpoint)) {
      message.error('该接口已添加');
      return;
    }

    setEndpoints([...endpoints, formattedEndpoint]);
    setCurrentEndpoint('');
  };

  const handleRemoveEndpoint = (endpoint: string) => {
    setEndpoints(endpoints.filter(item => item !== endpoint));
  };

  if (loading) {
    return (
      <div className="edit-agent-loading">
        <Spin size="large" />
      </div>
    );
  }

  if (!agent) {
    return null;
  }

  return (
    <div className="edit-agent-page">
      <div className="page-header">
        <Button 
          icon={<ArrowLeftOutlined />} 
          onClick={() => navigate(`/agents/${id}`)}
        >
          返回详情
        </Button>
        <h1>编辑MCP服务器代理</h1>
      </div>

      <Card>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            name="name"
            label="代理名称"
            rules={[{ required: true, message: '请输入代理名称' }]}
          >
            <Input placeholder="输入代理名称" />
          </Form.Item>

          <Form.Item
            name="description"
            label="描述"
          >
            <Input.TextArea placeholder="输入代理描述" rows={4} />
          </Form.Item>

          <Form.Item
            label="选择服务器"
            required
          >
            <Transfer
              dataSource={serverItems}
              titles={['可用服务器', '已选服务器']}
              targetKeys={selectedServerIds}
              onChange={setSelectedServerIds}
              render={item => item.title}
              listStyle={{ width: '45%', height: 300 }}
            />
          </Form.Item>

          <Form.Item
            label="暴露接口"
            required
          >
            <div className="endpoint-input">
              <Input
                value={currentEndpoint}
                onChange={e => setCurrentEndpoint(e.target.value)}
                placeholder="输入接口路径，例如 /api/v1/query"
                onPressEnter={handleAddEndpoint}
              />
              <Button type="primary" onClick={handleAddEndpoint}>添加</Button>
            </div>

            <div className="endpoint-list">
              {endpoints.map(endpoint => (
                <div key={endpoint} className="endpoint-item">
                  <span>{endpoint}</span>
                  <Button 
                    type="text" 
                    danger 
                    onClick={() => handleRemoveEndpoint(endpoint)}
                  >
                    删除
                  </Button>
                </div>
              ))}
              {endpoints.length === 0 && (
                <div className="no-endpoints">暂无暴露接口</div>
              )}
            </div>
          </Form.Item>

          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={submitting}
              className="submit-button"
            >
              更新代理
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default EditAgent;
