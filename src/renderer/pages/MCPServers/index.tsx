import React, { useState, useEffect } from 'react';
import { Table, Button, Tag, Space, Modal, Form, Input, Select, message } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { MCPServer } from '../../types';
import { getMCPServers, addMCPServer, updateMCPServer, deleteMCPServer } from '../../services/mcpService';
import './index.css';

const { Option } = Select;

const MCPServers: React.FC = () => {
  const [servers, setServers] = useState<MCPServer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
  const [currentServer, setCurrentServer] = useState<MCPServer | null>(null);
  const [form] = Form.useForm();

  const fetchServers = async () => {
    setLoading(true);
    try {
      const data = await getMCPServers();
      setServers(data);
    } catch (error) {
      message.error('获取MCP服务器列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServers();
  }, []);

  const showModal = (server?: MCPServer) => {
    setCurrentServer(server || null);
    form.resetFields();
    if (server) {
      form.setFieldsValue(server);
    }
    setIsModalVisible(true);
  };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      if (currentServer) {
        await updateMCPServer(currentServer.id, values);
        message.success('更新MCP服务器成功');
      } else {
        await addMCPServer(values);
        message.success('添加MCP服务器成功');
      }
      setIsModalVisible(false);
      fetchServers();
    } catch (error) {
      message.error('操作失败，请检查表单数据');
    }
  };

  const handleDelete = async (id: string) => {
    Modal.confirm({
      title: '确定删除此MCP服务器?',
      content: '删除后将无法恢复',
      okText: '确定',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          await deleteMCPServer(id);
          message.success('删除成功');
          fetchServers();
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
      title: 'URL',
      dataIndex: 'url',
      key: 'url',
    },
    {
      title: '模式',
      dataIndex: 'mode',
      key: 'mode',
      render: (mode: string) => (
        <Tag color={mode === 'stdio' ? 'blue' : 'purple'}>
          {mode.toUpperCase()}
        </Tag>
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'online' ? 'green' : 'red'}>
          {status === 'online' ? '在线' : '离线'}
        </Tag>
      )
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: MCPServer) => (
        <Space size="middle">
          <Button 
            type="text" 
            icon={<EditOutlined />} 
            onClick={() => showModal(record)}
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
    <div className="mcp-servers-page">
      <div className="page-header">
        <h1>MCP Servers</h1>
        <Button 
          type="primary" 
          icon={<PlusOutlined />}
          onClick={() => showModal()}
        >
          添加服务器
        </Button>
      </div>
      
      <Table 
        columns={columns} 
        dataSource={servers} 
        rowKey="id"
        loading={loading}
      />

      <Modal
        title={currentServer ? '编辑MCP服务器' : '添加MCP服务器'}
        open={isModalVisible}
        onOk={handleOk}
        onCancel={() => setIsModalVisible(false)}
        okText={currentServer ? '更新' : '添加'}
        cancelText="取消"
      >
        <Form
          form={form}
          layout="vertical"
          name="serverForm"
        >
          <Form.Item
            name="name"
            label="名称"
            rules={[{ required: true, message: '请输入服务器名称' }]}
          >
            <Input placeholder="服务器名称" />
          </Form.Item>
          
          <Form.Item
            name="url"
            label="URL"
            rules={[{ required: true, message: '请输入服务器URL' }]}
          >
            <Input placeholder="服务器URL" />
          </Form.Item>
          
          <Form.Item
            name="mode"
            label="模式"
            rules={[{ required: true, message: '请选择服务器模式' }]}
          >
            <Select placeholder="选择模式">
              <Option value="stdio">STDIO</Option>
              <Option value="sse">SSE</Option>
            </Select>
          </Form.Item>
          
          <Form.Item
            name="status"
            label="状态"
            rules={[{ required: true, message: '请选择服务器状态' }]}
          >
            <Select placeholder="选择状态">
              <Option value="online">在线</Option>
              <Option value="offline">离线</Option>
            </Select>
          </Form.Item>
          
          <Form.Item
            name="description"
            label="描述"
          >
            <Input.TextArea placeholder="服务器描述" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default MCPServers;
