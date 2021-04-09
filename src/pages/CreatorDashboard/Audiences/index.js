import React, { useState, useEffect, useCallback } from 'react';
import parse from 'emailjs-addressparser';

import { Row, Col, Tabs, Button, Typography, Input, Form, Popconfirm, Upload, Tooltip, message } from 'antd';
import { CloseOutlined, DeleteOutlined, MailOutlined, UploadOutlined } from '@ant-design/icons';

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

const AudienceCSVFileUpload = ({ handleUploadSuccess }) => {
  const [isLoading, setIsLoading] = useState(false);

  const beforeUpload = (file) => {
    // Current file limit: 200MB
    const isValidFileSize = file.size / 1024 / 1024 < 200;

    if (!isValidFileSize) {
      message.error('The file you uploaded exceeds 200 MB!');
    }

    return isValidFileSize;
  };

  const handleAction = async (file) => {
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const { status, data } = await apis.audiences.uploadAudienceCSVFile(formData);

      if (isAPISuccess(status) && data) {
        handleUploadSuccess(data);
      }
    } catch (error) {
      showErrorModal('Failed to upload CSV email list', error?.response?.data?.message || 'Something went wrong.');
    }

    setIsLoading(false);
  };

  return (
    <Upload
      name="audienceCsv"
      accept=".csv"
      maxCount={1}
      action={handleAction}
      beforeUpload={beforeUpload}
      showUploadList={false}
    >
      <Button block type="primary" loading={isLoading} icon={<UploadOutlined />}>
        Upload a CSV email list
      </Button>
    </Upload>
  );
};

// TODO: Implement Pagination when BE has implemented it
const Audiences = () => {
  const [form] = Form.useForm();

  const [selectedTab, setSelectedTab] = useState('list');
  const [isLoading, setIsLoading] = useState(false);
  const [audienceList, setAudienceList] = useState([]);
  const [selectedAudienceKeys, setSelectedAudienceKeys] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
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
      setFeedbackText(null);
    }
  }, [selectedTab, getAudienceList]);

  const parseEmailInput = (value) => {
    setIsSubmitting(true);
    const alreadyExistsEmails = editableEmailList.map((emailData) => emailData.email);

    const parsedEmailList = parse(value)
      .filter((parsedEmailData) => parsedEmailData && !alreadyExistsEmails.includes(parsedEmailData.address))
      .map((emailData) => ({
        email: emailData.address,
        first_name: '',
        last_name: '',
      }));

    setEditableEmailList([...editableEmailList, ...new Set(parsedEmailList)].map((val, idx) => ({ ...val, idx })));

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
    setEditableEmailList(
      editableEmailList.filter((emailData) => emailData.email !== email).map((val, idx) => ({ ...val, idx }))
    );

  const saveAudiences = async (values) => {
    setIsSubmitting(true);
    const payload = {
      data: Object.entries(values).map(([idx, data]) => ({
        email: data.email,
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

        // We show the failed ones to the editable email list
        // That way the creator can make the changes and fix them
        // and save them once it's fixed
        setEditableEmailList(data.data.failed);
        generateFeedbackText(data.count);
      }
    } catch (error) {
      showErrorModal(error?.response?.data?.message || 'Something went wrong.');
    }
    setIsSubmitting(false);
  };

  const onCSVUploadSuccess = (audienceResponse) => {
    generateFeedbackText(audienceResponse.count);

    if (audienceResponse.count.failed > 0) {
      // In the case where any failed data exists
      // We show the failed ones to the editable email list
      // That way the creator can make the changes and fix them
      // and save them once it's fixed
      setEditableEmailList(audienceResponse.data.failed.map((val, idx) => ({ ...val, idx })));

      const modalContent = (
        <Paragraph>
          Some emails in the file you uploaded failed to be imported. You can see edit them in the table below and save
          them again. Make sure to fill out the <Text strong> First Name </Text> as it is required for a successful
          import. Emails that are already in your audience list will be skipped.
        </Paragraph>
      );

      showErrorModal('Some emails failed to be imported', modalContent);
    } else if (audienceResponse.count.success > 0) {
      // In the case where any successful data exists

      const modalContent =
        audienceResponse.count.skipped > 0
          ? 'Some emails might be skipped because they are already saved in your audience list'
          : '';

      showSuccessModal('Successfully imported email list', modalContent);
    } else if (audienceResponse.count.skip > 0) {
      // In the case where all emails are skipped
      message.info('All emails detected in the file are skipped');
    } else {
      // In the case where no emails are detected (all count = 0)
      message.error('No email detected in the file');
    }
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

  const onSelectAudienceRow = (selectedRowKeys, selectedRow) => {
    console.log(selectedRow);
    console.log(selectedRowKeys);
    setSelectedAudienceKeys(selectedRowKeys);
  };

  const sendEmailsToAudiences = (audienceKeys) => {
    console.log(audienceKeys);
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
        <Row gutter={[8, 8]}>
          <Col xs={4}>
            <Popconfirm
              arrowPointAtCenter
              icon={<DeleteOutlined />}
              title={<Text> Are you sure you want to delete this audience? </Text>}
              onConfirm={() => deleteAudience(record)}
              okText="Yes"
              cancelText="No"
            >
              <Button block type="text" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          </Col>
          <Col xs={4}>
            <Tooltip title="Send email to this audience" arrowPointAtCenter>
              <Button block type="link" icon={<MailOutlined />} onClick={() => sendEmailsToAudiences([record.id])} />
            </Tooltip>
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
      render: (text, record) => (
        <Form.Item
          noStyle
          name={[record.idx, 'email']}
          initialValue={record.email}
          rules={validationRules.requiredValidation}
        >
          <Input />
        </Form.Item>
      ),
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
        <Form.Item noStyle name={[record.idx, 'first_name']} rules={validationRules.requiredValidation}>
          <Input />
        </Form.Item>
      ),
    },
    {
      title: 'Last Name',
      key: 'last_name',
      width: isMobileDevice ? '120px' : '30%',
      render: (text, record) => (
        <Form.Item noStyle name={[record.idx, 'last_name']}>
          <Input />
        </Form.Item>
      ),
    },
  ];

  //TODO: Make Mobile UI for this

  // TODO: Prepare pagination for this
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
                <Button
                  type="primary"
                  disabled={selectedAudienceKeys.length <= 0}
                  onClick={() => sendEmailsToAudiences(selectedAudienceKeys)}
                >
                  Send Email
                </Button>
              </Col>
              <Col xs={24}>
                <Table
                  size="small"
                  loading={isLoading}
                  data={audienceList}
                  columns={audienceListColumns}
                  rowKey={(record) => record.email}
                  rowSelection={{
                    onChange: onSelectAudienceRow,
                  }}
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
                  <Row gutter={[8, 8]}>
                    <Col xs={12} md={6} lg={4}>
                      <Title level={5}> Input CSV Email List : </Title>
                    </Col>
                    <Col xs={12} md={6} lg={4}>
                      <AudienceCSVFileUpload handleUploadSuccess={onCSVUploadSuccess} />
                    </Col>
                  </Row>
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
                            size="small"
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
