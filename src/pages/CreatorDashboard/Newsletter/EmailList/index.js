import React, { useState, useEffect, useCallback, useMemo } from 'react';

import { Row, Col, Button, Select, Typography, Tooltip, Popconfirm, Input, Form } from 'antd';

import { DeleteOutlined, FilterFilled } from '@ant-design/icons';

import apis from 'apis';

import Loader from 'components/Loader';
import { showErrorModal, showSuccessModal } from 'components/Modals/modals';

import AllAudienceModal from 'components/AllAudienceModal';
import Table from 'components/Table';
import { isAPISuccess } from 'utils/helper';
import validationRules from 'utils/validation';

import styles from './styles.module.scss';

const { Text } = Typography;

const defaultTemplateKey = 'blank';

const EmailList = () => {
  const [form] = Form.useForm();

  const [selectedAudiences, setSelectedAudiences] = useState([]);
  const [pageNumber, setPageNumber] = useState(1);
  const [canShowMore, setCanShowMore] = useState(false);
  const [audienceList, setAudienceList] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [creatorEmailTemplates, setCreatorEmailTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(defaultTemplateKey);
  const [sendEmailModalVisible, setSendEmailModalVisible] = useState(false);
  const totalItemsPerPage = 10;
  const isCreating = useMemo(() => selectedTemplate === defaultTemplateKey, [selectedTemplate]);

  const hideSendEmailModal = (flag) => {
    if (flag === true) {
      fetchEmailListDetails(selectedTemplate);
    }
    setSendEmailModalVisible(false);
  };

  const deleteAudience = async (audience) => {
    try {
      const payload = {
        audiences: [audience.id],
      };
      const { status } = await apis.newsletter.deleteEmailListAudience(selectedTemplate, payload);

      if (isAPISuccess(status)) {
        showSuccessModal('Successfully removed audience');
        setAudienceList(audienceList.filter((audienceData) => audienceData.id !== audience.id));
      }
    } catch (error) {
      showErrorModal(error?.response?.data?.message || 'Something went wrong.');
    }
  };

  const onSelectAudienceRow = (selectedRowKeys, selectedRow) => {
    setSelectedAudiences(selectedRow.map((row) => row.id));
  };

  const getAudienceList = useCallback(async (pageNumber, itemsPerPage) => {
    setIsLoading(true);
    try {
      const { status, data } = await apis.audiences.getCreatorAudiences(pageNumber, itemsPerPage);

      if (isAPISuccess(status) && data) {
        if (pageNumber === 1) {
          setAudienceList(data.data);
        } else {
          setAudienceList((audienceList) => [...audienceList, ...data.data]);
        }
        setCanShowMore(data.next_page);
      }
    } catch (error) {
      showErrorModal(error?.response?.data?.message || 'Something went wrong.');
    }
    setIsLoading(false);
  }, []);

  const audienceListColumns = [
    {
      title: 'First Name',
      dataIndex: 'first_name',
      key: 'first_name',
      width: '32%',
    },
    {
      title: 'Last Name',
      dataIndex: 'last_name',
      key: 'last_name',
      width: '32%',
      render: (text, record) => record.last_name || '-',
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (text, record) => `${record.type[0]}${record.type.slice(1).toLowerCase()}`,
      filterIcon: (filtered) => (
        <Tooltip defaultVisible={true} title="Click here to filter">
          {' '}
          <FilterFilled style={{ fontSize: 16, color: filtered ? '#1890ff' : '#00ffd7' }} />{' '}
        </Tooltip>
      ),
      filters: [
        {
          text: 'Audiences',
          value: 'AUDIENCE',
        },
        {
          text: 'Members',
          value: 'MEMBER',
        },
      ],
      onFilter: (value, record) => record.type === value,
    },
    {
      title: 'Actions',
      width: '15%',
      render: (record) => (
        <Row gutter={[8, 8]} hidden={isCreating}>
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
        </Row>
      ),
    },
  ];

  const fetchCreatorEmailList = useCallback(async () => {
    setIsLoading(true);

    try {
      const { status, data } = await apis.newsletter.getCreatorEmailList();

      if (isAPISuccess(status) && data) {
        setCreatorEmailTemplates(data.mailing_lists);
      }
    } catch (error) {
      showErrorModal(
        'Failed fetching creator email templates',
        error?.response?.data?.message || 'Something went wrong.'
      );
    }

    setIsLoading(false);
  }, []);

  const fetchEmailListDetails = useCallback(async (templateId) => {
    setIsLoading(true);

    try {
      const { status, data } = await apis.newsletter.getEmailListDetails(templateId);

      if (isAPISuccess(status) && data) {
        setAudienceList(data.audiences);
      }
    } catch (error) {
      showErrorModal(
        'Failed fetching creator email templates',
        error?.response?.data?.message || 'Something went wrong.'
      );
    }

    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchCreatorEmailList();
  }, [fetchCreatorEmailList]);

  useEffect(() => {
    getAudienceList(pageNumber, totalItemsPerPage);
  }, [getAudienceList, pageNumber, totalItemsPerPage]);

  useEffect(() => {
    if (!isCreating) {
      fetchEmailListDetails(selectedTemplate);
    }
  }, [selectedTemplate, fetchEmailListDetails, isCreating]);

  const handleChangeSelectedTemplate = (val) => {
    if (val === defaultTemplateKey) {
      setSelectedTemplate(val);
      setPageNumber(1);
      getAudienceList(1, totalItemsPerPage);
    }

    const selectedTemplateData = creatorEmailTemplates.find((template) => template.id === val);
    form.setFieldsValue({ ...form.getFieldsValue(), templateName: selectedTemplateData?.name || null });
    setSelectedTemplate(val);
  };

  const handleDeleteEmailTemplate = async () => {
    setIsLoading(true);

    if (isCreating) {
      showErrorModal('Please select a template to delete!');
      return;
    }

    try {
      const { status } = await apis.newsletter.deleteEmailList(selectedTemplate);

      if (isAPISuccess(status)) {
        showSuccessModal('Email template successfully deleted!');
        await fetchCreatorEmailList();
        setSelectedTemplate(defaultTemplateKey);
        form.setFieldsValue({ ...form.getFieldsValue(), templateName: null });
      }
    } catch (error) {
      showErrorModal('Failed to delete template', error?.response?.data?.message || 'Something went wrong.');
    }

    setIsLoading(false);
  };

  const handleFormFinish = async (values) => {
    setIsLoading(true);

    if (isCreating) {
      try {
        const payload = {
          name: values.templateName,
          audiences: selectedAudiences,
        };

        const { status, data } = await apis.newsletter.createEmailList(payload);

        if (isAPISuccess(status)) {
          showSuccessModal(`Email List successfully ${isCreating ? 'created' : 'updated'}`);
          setSelectedTemplate(data.id);
          fetchEmailListDetails(data.id);
          fetchCreatorEmailList();
          form.setFieldsValue({ ...form.getFieldsValue(), templateName: data?.name });
        }
      } catch (error) {
        showErrorModal(
          `Failed to ${isCreating ? 'create' : 'update'} email template`,
          error?.response?.data?.message || 'Something went wrong.'
        );
      }
    } else {
      setSendEmailModalVisible(true);
    }

    setIsLoading(false);
  };

  const templateOptions = useMemo(() => {
    return [
      {
        label: <Text strong> Create a new List </Text>,
        value: defaultTemplateKey,
      },
      ...creatorEmailTemplates.map((template) => ({
        label: template.name,
        value: template.id,
      })),
    ];
  }, [creatorEmailTemplates]);

  return (
    <div>
      <AllAudienceModal visible={sendEmailModalVisible} closeModal={hideSendEmailModal} listID={selectedTemplate} />
      <Row gutter={[8, 24]} className={styles.box}>
        {/* Dropdown section */}
        <Col xs={24}>
          <Row gutter={[8, 8]}>
            <Col className={styles.templatePickerLabel}>Select a List :</Col>
            <Col>
              <Select
                showArrow
                showSearch
                placeholder="Select an Email List"
                onChange={handleChangeSelectedTemplate}
                defaultValue={defaultTemplateKey}
                value={selectedTemplate}
                options={templateOptions}
              />
            </Col>
          </Row>
        </Col>
        {/* CTA Sections */}

        <Col xs={24}>
          <Loader loading={isLoading} size="large">
            <Form form={form} scrollToFirstError={true} onFinish={handleFormFinish}>
              <Row gutter={[8, 8]}>
                <Col xs={24} md={12} lg={10}>
                  <Form.Item label="List Name" name="templateName" rules={validationRules.requiredValidation}>
                    <Input placeholder="Input List name here" maxLength={50} />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12} lg={14}>
                  <Row gutter={[8, 8]} justify="end">
                    <Col xs={24} md={12} lg={8}>
                      <Form.Item hidden={isCreating}>
                        <Popconfirm
                          arrowPointAtCenter
                          icon={<DeleteOutlined className={styles.danger} />}
                          title="Are you sure you want to delete this email list?"
                          okText="Yes, delete this list"
                          cancelText="No"
                          okButtonProps={{ danger: true, type: 'primary' }}
                          onConfirm={handleDeleteEmailTemplate}
                        >
                          <Button danger block type="primary">
                            {' '}
                            Delete list{' '}
                          </Button>
                        </Popconfirm>
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12} lg={8}>
                      <Button block type="primary" htmlType="submit">
                        {isCreating ? 'Create' : 'Update'} list
                      </Button>
                    </Col>
                  </Row>
                </Col>
              </Row>
            </Form>
          </Loader>
        </Col>
        {/* Audience Section Section */}
        <Col xs={24}>
          <Row gutter={[8, 16]} justify="center">
            <Col xs={24}>
              <Table
                size="small"
                loading={isLoading}
                data={audienceList}
                columns={audienceListColumns}
                rowKey={(record) => record.id}
                rowSelection={{
                  onChange: onSelectAudienceRow,
                }}
              />
            </Col>
            <Col xs={8} hidden={!isCreating}>
              <Button
                block
                type="default"
                loading={isLoading}
                disabled={!canShowMore}
                onClick={() => setPageNumber(pageNumber + 1)}
              >
                Show more audience
              </Button>
            </Col>
          </Row>
        </Col>
      </Row>
    </div>
  );
};

export default EmailList;
