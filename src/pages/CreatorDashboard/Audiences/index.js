import React, { useState, useEffect, useCallback } from 'react';
import parse from 'emailjs-addressparser';

import { Row, Col, Tabs, Button, Typography, Input, Form, Popconfirm } from 'antd';
import { CloseOutlined } from '@ant-design/icons';

import Loader from 'components/Loader';
import Table from 'components/Table';
import { showErrorModal, showSuccessModal } from 'components/Modals/modals';

import validationRules from 'utils/validation';
import { isAPISuccess } from 'utils/helper';
import { isMobileDevice } from 'utils/device';

import styles from './styles.module.scss';

const { TabPane } = Tabs;
const { Title, Text, Paragraph } = Typography;

const Audiences = () => {
  const [form] = Form.useForm();

  const [selectedTab, setSelectedTab] = useState('list');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [audienceList, setAudienceList] = useState([]);
  const [emailListText, setEmailListText] = useState('');
  const [editableEmailList, setEditableEmailList] = useState([]);

  const getAudienceList = useCallback(() => {
    setIsLoading(true);
    try {
      // TODO: Implement API Here
      const { status, data } = {
        status: 200,
        data: [],
      };

      if (isAPISuccess(status) && data) {
        setAudienceList(data);
      }
    } catch (error) {
      showErrorModal(error?.response?.data?.message || 'Something went wrong.');
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (selectedTab === 'list') {
      // getAudienceList();
    } else if (selectedTab === 'import') {
      setIsSubmitting(false);
      setIsLoading(false);
      setEmailListText('');
    }
  }, [selectedTab, getAudienceList]);

  const audienceListColumns = [
    {
      title: 'Email Address',
      dataIndex: 'email',
      key: 'email',
      width: isMobileDevice ? '180px' : '35%',
    },
    {
      title: 'First Name',
      dataIndex: 'first_name',
      key: 'first_name',
      width: isMobileDevice ? '120px' : '33%',
    },
    {
      title: 'Last Name',
      dataIndex: 'last_name',
      key: 'last_name',
      width: isMobileDevice ? '120px' : '32%',
      render: (text, record) => record.last_name || '-',
    },
  ];

  const parseEmailInput = (value) => {
    setIsSubmitting(true);
    const alreadyExistsEmails = editableEmailList.map((emailData) => emailData.email);

    const parsedEmailList = parse(value)
      .filter((parsedEmailData) => !alreadyExistsEmails.includes(parsedEmailData.address))
      .map((emailData) => ({
        email: emailData.address,
        first_name: '',
        last_name: '',
      }));

    setEditableEmailList([...editableEmailList, ...new Set(parsedEmailList)]);

    setEmailListText('');

    setIsSubmitting(false);
  };

  const clearEmailList = () => {
    form.resetFields();
    setEditableEmailList([]);
  };

  const removeFromEditableEmailList = (email) =>
    setEditableEmailList(editableEmailList.filter((emailData) => emailData.email !== email));

  const editableEmailListColumns = [
    {
      title: 'Remove',
      width: '64px',
      render: (record) => (
        <Button danger type="link" onClick={() => removeFromEditableEmailList(record.email)} icon={<CloseOutlined />} />
      ),
    },
    {
      title: 'Email Address',
      dataIndex: 'email',
      key: 'email',
      width: isMobileDevice ? '180px' : '35%',
    },
    {
      title: (
        <>
          {' '}
          First Name<Text type="danger">*</Text>{' '}
        </>
      ),
      key: 'first_name',
      width: isMobileDevice ? '120px' : '30%',
      render: (text, record) => (
        <Form.Item name={[record.email, 'first_name']} rules={validationRules.requiredValidation}>
          <Input />
        </Form.Item>
      ),
    },
    {
      title: 'Last Name',
      key: 'last_name',
      width: isMobileDevice ? '120px' : '30%',
      render: (text, record) => (
        <Form.Item name={[record.email, 'last_name']}>
          <Input />
        </Form.Item>
      ),
    },
  ];

  const saveAudiences = (values) => {
    setIsSubmitting(true);
    const payload = Object.entries(values).map(([email, data]) => ({
      email: email,
      first_name: data.first_name,
      last_name: data.last_name || '',
    }));
    console.log(payload);

    try {
      const { status, data } = {
        status: 200,
        data: payload,
      };

      if (isAPISuccess(status) && data) {
        showSuccessModal('Successfully imported audiences');
        // temporary for showing UI
        setAudienceList(data);
      }
    } catch (error) {
      showErrorModal(error?.response?.data?.message || 'Something went wrong.');
    }
    setIsSubmitting(false);
  };

  return (
    <Row gutter={[16, 16]}>
      <Col xs={24}>
        <Title level={4}> Audiences </Title>
      </Col>
      <Col xs={24}>
        <Tabs size="large" activeKey={selectedTab} onChange={setSelectedTab}>
          <TabPane key="list" tab={<Title level={5}> Audience List </Title>}>
            <Row gutter={[16, 16]}>
              <Col xs={24}>
                <Button type="primary" disabled={audienceList.length <= 0}>
                  Send Email (not yet implemented)
                </Button>
              </Col>
              <Col xs={24}>
                <Table
                  loading={isLoading}
                  data={audienceList}
                  columns={audienceListColumns}
                  rowKey={(record) => record.email}
                />
              </Col>
            </Row>
          </TabPane>
          <TabPane className={styles.p50} key="import" tab={<Title level={5}> Import List </Title>}>
            <Loader loading={isSubmitting}>
              <Row gutter={[16, 16]}>
                <Col xs={24}>
                  <Title level={5}> Input CSV Email List : Upload button here </Title>
                </Col>
                <Col xs={24} className={styles.mt20}>
                  <Title level={5}> Input Email List Manually </Title>
                  <Paragraph>
                    You can input the list of emails manually here. You can input them one by one, or all of them at
                    once.
                  </Paragraph>
                  <Paragraph>
                    Each of them needs to be separated by a comma, so you can input it like{' '}
                    <Text strong>"abc@xyz.com, xyz@def.co"</Text>
                  </Paragraph>
                </Col>
                <Col xs={24}>
                  <Input.Search
                    placeholder="Input email list here (comma separated)"
                    className={styles.emailInput}
                    loading={isSubmitting}
                    value={emailListText}
                    onChange={(e) => setEmailListText(e.target.value)}
                    onSearch={parseEmailInput}
                    enterButton={<Button type="primary"> Submit </Button>}
                  />
                </Col>
                {editableEmailList.length > 0 && (
                  <Col xs={24}>
                    <Form form={form} onFinish={saveAudiences} scrollToFirstError={true}>
                      <Row gutter={[16, 16]} justify="center">
                        <Col xs={24}>
                          <Table
                            columns={editableEmailListColumns}
                            data={editableEmailList}
                            loading={isSubmitting}
                            rowKey={(record) => record.email}
                          />
                        </Col>
                        <Col xs={24}>
                          <Row gutter={[16, 16]} justify="center">
                            <Col xs={12} md={8} lg={6}>
                              <Popconfirm
                                arrowPointAtCenter
                                title={<Text>Do you want to remove all of the items above?</Text>}
                                onConfirm={() => clearEmailList()}
                                okText="Yes, clear them"
                                cancelText="No, keep them"
                              >
                                <Button disabled={editableEmailList.length <= 0}>Clear email list</Button>
                              </Popconfirm>
                            </Col>
                            <Col xs={12} md={8} lg={6}>
                              <Button type="primary" htmlType="submit" disabled={editableEmailList.length <= 0}>
                                Save Audiences
                              </Button>
                            </Col>
                          </Row>
                        </Col>
                      </Row>
                    </Form>
                  </Col>
                )}
              </Row>
            </Loader>
          </TabPane>
        </Tabs>
      </Col>
    </Row>
  );
};

export default Audiences;
