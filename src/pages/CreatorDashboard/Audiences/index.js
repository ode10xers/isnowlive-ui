import React, { useState, useEffect, useCallback } from 'react';
import parse from 'emailjs-addressparser';

import { Row, Col, Tabs, Button, Typography, Input, Form, Popconfirm, Tooltip } from 'antd';
import { CloseOutlined, DeleteOutlined } from '@ant-design/icons';

import Loader from 'components/Loader';
import Table from 'components/Table';
import { showErrorModal, showSuccessModal } from 'components/Modals/modals';

import apis from 'apis';

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
  const [feedbackText, setFeedbackText] = useState(null);

  const getAudienceList = useCallback(async () => {
    setIsLoading(true);
    try {
      const { status, data } = await apis.audiences.getCreatorAudiences();

      if (isAPISuccess(status) && data) {
        setAudienceList(data.audiences);
      }
    } catch (error) {
      showErrorModal(error?.response?.data?.message || 'Something went wrong.');
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (selectedTab === 'list') {
      getAudienceList();
    } else if (selectedTab === 'import') {
      setIsSubmitting(false);
      setIsLoading(false);
      setEmailListText('');
    }
  }, [selectedTab, getAudienceList]);

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

  const generateFeedbackText = (count) => {
    const successText = `${count.success} successful`;
    const failedText = `${count.failed} failed`;
    const skippedText = `${count.skip} skipped`;

    setFeedbackText(`${successText}, ${failedText}, ${skippedText}`);
  };

  const removeFromEditableEmailList = (email) =>
    setEditableEmailList(editableEmailList.filter((emailData) => emailData.email !== email));

  // TODO: add the failed ones back to the editable email list
  // Also show feedback on how many emails successfully imported and stuff
  const saveAudiences = async (values) => {
    setIsSubmitting(true);
    const payload = {
      data: Object.entries(values).map(([email, data]) => ({
        email: email,
        first_name: data.first_name,
        last_name: data.last_name || '',
      })),
    };

    try {
      const { status, data } = await apis.audiences.addAudienceList(payload);

      if (isAPISuccess(status) && data) {
        if (data.count.success > 0) {
          showSuccessModal('Successfully imported audiences');
        }

        // TODO: Confirm where to show other modal if it's skipped or smth

        setEditableEmailList(data.data.failed);
        generateFeedbackText(data.count);
      }
    } catch (error) {
      showErrorModal(error?.response?.data?.message || 'Something went wrong.');
    }
    setIsSubmitting(false);
  };

  const deleteAudience = async (audience) => {
    try {
      const { status } = await apis.audiences.deleteAudienceFromList({
        id: [audience.id],
      });

      if (isAPISuccess(status)) {
        showSuccessModal('Successfully removed audience');
        getAudienceList();
      }
    } catch (error) {
      showErrorModal(error?.response?.data?.message || 'Something went wrong.');
    }
  };

  const audienceListColumns = [
    {
      title: 'Email Address',
      dataIndex: 'email',
      key: 'email',
      width: '30%',
    },
    {
      title: 'First Name',
      dataIndex: 'first_name',
      key: 'first_name',
      width: '25%',
    },
    {
      title: 'Last Name',
      dataIndex: 'last_name',
      key: 'last_name',
      width: '25%',
      render: (text, record) => record.last_name || '-',
    },
    {
      title: 'Actions',
      width: '15%',
      render: (record) => (
        <Row gutter={[8, 8]} justify="end">
          <Col xs={4}>
            <Popconfirm
              arrowPointAtCenter
              icon={<DeleteOutlined />}
              title={<Text> Are you sure you want to delete this audience? </Text>}
              onConfirm={() => deleteAudience(record)}
              okText="Yes"
              cancelText="No"
            >
              <Tooltip title="Delete Audience">
                <Button type="text" danger icon={<DeleteOutlined />} />
              </Tooltip>
            </Popconfirm>
          </Col>
        </Row>
      ),
    },
  ];

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

  //TODO: Make Mobile UI for this

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
                {feedbackText && (
                  <Col xs={24}>
                    <Text strong> {feedbackText} </Text>
                  </Col>
                )}
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
                  <Paragraph>
                    An email may be skipped because it is already saved as an audience. An email might be failed to save
                    because it is missing some data <Text strong> (first name is required) </Text>
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
