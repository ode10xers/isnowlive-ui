import React, { useState, useEffect, useCallback, useMemo } from 'react';

import { Row, Col, Button, Select, Typography, Tooltip, Popconfirm, Input, Form, message } from 'antd';

import { DeleteOutlined, FilterFilled, MailOutlined } from '@ant-design/icons';

import apis from 'apis';

import Table from 'components/Table';
import Loader from 'components/Loader';
import AllAudienceModal from 'components/AllAudienceModal';
import SendAudienceEmailModal from 'components/SendAudienceEmailModal';
import { showErrorModal, showSuccessModal } from 'components/Modals/modals';

import { isAPISuccess } from 'utils/helper';
import validationRules from 'utils/validation';

import { emailListFormLayout } from 'layouts/FormLayouts';

import styles from './styles.module.scss';

const { Text } = Typography;

const defaultEmailListKey = 'blank';

const totalItemsPerPage = 10;

const EmailList = () => {
  const [form] = Form.useForm();

  const [isLoading, setIsLoading] = useState(false);
  const [pageNumber, setPageNumber] = useState(1);
  const [canShowMore, setCanShowMore] = useState(false);

  const [audienceList, setAudienceList] = useState([]);
  const [selectedAudiences, setSelectedAudiences] = useState([]);
  const [audienceEmailRecipients, setAudienceEmailRecipients] = useState([]);
  const [sendAudienceEmailModalVisible, setSendAudienceEmailModalVisible] = useState(false);

  const [creatorEmailLists, setCreatorEmailLists] = useState([]);
  const [selectedEmailList, setSelectedEmailList] = useState(defaultEmailListKey);
  const [allAudienceModalVisible, setAllAudienceModalVisible] = useState(false);

  const isCreating = useMemo(() => selectedEmailList === defaultEmailListKey, [selectedEmailList]);

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

  const fetchCreatorEmailList = useCallback(async () => {
    setIsLoading(true);

    try {
      const { status, data } = await apis.newsletter.getCreatorEmailList();

      if (isAPISuccess(status) && data) {
        setCreatorEmailLists(data.mailing_lists);
      }
    } catch (error) {
      showErrorModal('Failed fetching creator email list', error?.response?.data?.message || 'Something went wrong.');
    }

    setIsLoading(false);
  }, []);

  const fetchEmailListDetails = useCallback(async (emailListId, pageNumber, itemsPerPage) => {
    setIsLoading(true);

    try {
      const { status, data } = await apis.newsletter.getEmailListDetails(emailListId, pageNumber, itemsPerPage);

      if (isAPISuccess(status) && data) {
        if (pageNumber === 1) {
          setAudienceList(data.audiences);
        } else {
          setAudienceList((audienceList) => [...audienceList, ...data.audiences]);
        }

        setCanShowMore(data.next_page);
      }
    } catch (error) {
      showErrorModal('Failed fetching creator email list', error?.response?.data?.message || 'Something went wrong.');
    }

    setIsLoading(false);
  }, []);

  //#region Start of Use Effects

  useEffect(() => {
    fetchCreatorEmailList();
  }, [fetchCreatorEmailList]);

  useEffect(() => {
    if (isCreating) {
      getAudienceList(pageNumber, totalItemsPerPage);
    } else {
      fetchEmailListDetails(selectedEmailList, pageNumber, totalItemsPerPage);
    }
  }, [getAudienceList, fetchEmailListDetails, pageNumber, selectedEmailList, isCreating]);

  //#endregion End of Use Effects

  //#region Start of Business Logic Handlers

  const deleteAudience = async (audience) => {
    try {
      const { status } = await apis.audiences.deleteAudienceFromList({
        id: [audience.id],
      });

      if (isAPISuccess(status)) {
        showSuccessModal('Successfully removed audience');
        setAudienceList(audienceList.filter((audienceData) => audienceData.id !== audience.id));
      }
    } catch (error) {
      showErrorModal(error?.response?.data?.message || 'Something went wrong.');
    }
  };

  const handleChangeSelectedEmailList = (val) => {
    setPageNumber(1);
    if (val === defaultEmailListKey) {
      setSelectedEmailList(val);
    }

    const selectedEmailListData = creatorEmailLists.find((emailList) => emailList.id === val);
    form.setFieldsValue({ ...form.getFieldsValue(), emailListName: selectedEmailListData?.name || null });
    setSelectedEmailList(val);
  };

  const handleDeleteEmailList = async () => {
    setIsLoading(true);

    if (isCreating) {
      showErrorModal('Please select an email list to delete!');
      return;
    }

    try {
      const { status } = await apis.newsletter.deleteEmailList(selectedEmailList);

      if (isAPISuccess(status)) {
        showSuccessModal('Email list successfully deleted!');
        await fetchCreatorEmailList();
        setSelectedEmailList(defaultEmailListKey);
        form.setFieldsValue({ ...form.getFieldsValue(), emailListName: null });
      }
    } catch (error) {
      showErrorModal('Failed to delete email list', error?.response?.data?.message || 'Something went wrong.');
    }

    setIsLoading(false);
  };

  const removeAudienceFromEmailList = async (audience) => {
    try {
      const payload = {
        audiences: [audience.id],
      };
      const { status } = await apis.newsletter.deleteEmailListAudience(selectedEmailList, payload);

      if (isAPISuccess(status)) {
        showSuccessModal('Successfully removed audience from email list');
        setAudienceList(audienceList.filter((audienceData) => audienceData.id !== audience.id));
      }
    } catch (error) {
      showErrorModal(error?.response?.data?.message || 'Something went wrong.');
    }
  };

  const handleFormFinish = async (values) => {
    if (isCreating) {
      if (!selectedAudiences.length) {
        message.error('Please select some audience first!');
        return;
      }

      setIsLoading(true);

      try {
        const payload = {
          name: values.emailListName,
          audiences: selectedAudiences.map((audience) => audience.id),
        };

        const { status, data } = await apis.newsletter.createEmailList(payload);

        if (isAPISuccess(status) && data) {
          showSuccessModal(`Email list successfully ${isCreating ? 'created' : 'updated'}`);
          fetchCreatorEmailList();
          handleChangeSelectedEmailList(data.id);
        }
      } catch (error) {
        showErrorModal(
          `Failed to ${isCreating ? 'create' : 'update'} email list`,
          error?.response?.data?.message || 'Something went wrong.'
        );
      }

      setIsLoading(false);
    } else {
      setAllAudienceModalVisible(true);
    }
  };

  const onSelectAudienceRow = (selectedRowKeys, selectedRows) => {
    setSelectedAudiences(selectedRows);
  };

  //#endregion End of Business Logic Handlers

  //#region Start of Modal Handlers

  const sendEmailToIndividualAudience = (audience) => {
    setAudienceEmailRecipients(audience);
    setSendAudienceEmailModalVisible(true);
  };

  const showSendAudienceEmailModal = () => {
    if (isCreating) {
      if (selectedAudiences.length) {
        setAudienceEmailRecipients(selectedAudiences);
        setSendAudienceEmailModalVisible(true);
      } else {
        message.error('Please select some audience or an email list first!');
      }
    } else {
      setAudienceEmailRecipients(audienceList);
      setSendAudienceEmailModalVisible(true);
    }
  };

  const hideSendAudienceEmailModal = () => {
    setAudienceEmailRecipients([]);
    setSendAudienceEmailModalVisible(false);
  };

  const hideAllAudienceModal = (shouldRefresh = false) => {
    if (shouldRefresh) {
      setPageNumber(1);
      fetchEmailListDetails(selectedEmailList, 1, totalItemsPerPage);
    }
    setAllAudienceModalVisible(false);
  };

  //#endregion End of Modal Handlers

  //#region Start of Constants

  const emailListOptions = useMemo(() => {
    return [
      {
        label: <Text strong> Create a new list </Text>,
        value: defaultEmailListKey,
      },
      ...creatorEmailLists.map((emailList) => ({
        label: emailList.name,
        value: emailList.id,
      })),
    ];
  }, [creatorEmailLists]);

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
        <Row gutter={[8, 8]}>
          <Col xs={4}>
            <Popconfirm
              arrowPointAtCenter
              icon={<DeleteOutlined className={styles.redText} />}
              title={
                <Text>
                  Are you sure you want to delete <br />
                  this audience{isCreating ? '' : ' from this email list'}?
                </Text>
              }
              onConfirm={() => (isCreating ? deleteAudience(record) : removeAudienceFromEmailList(record))}
              okText="Yes"
              cancelText="No"
            >
              <Button block type="text" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          </Col>
          <Col xs={4}>
            <Tooltip title="Send email to this audience" arrowPointAtCenter>
              <Button
                block
                type="link"
                icon={<MailOutlined />}
                onClick={() => sendEmailToIndividualAudience([record])}
              />
            </Tooltip>
          </Col>
        </Row>
      ),
    },
  ];

  //#endregion End of Constants

  return (
    <div>
      <SendAudienceEmailModal
        visible={sendAudienceEmailModalVisible}
        closeModal={hideSendAudienceEmailModal}
        recipients={audienceEmailRecipients}
      />
      <AllAudienceModal
        visible={allAudienceModalVisible}
        closeModal={hideAllAudienceModal}
        listID={selectedEmailList}
      />
      <Row gutter={[8, 24]} className={styles.p20}>
        <Col xs={24}>
          <Form
            {...emailListFormLayout}
            labelAlign="left"
            form={form}
            scrollToFirstError={true}
            onFinish={handleFormFinish}
          >
            <Loader loading={isLoading} size="large">
              <Row gutter={[8, 16]}>
                {/* Dropdown section */}
                <Col xs={24} md={12} lg={10}>
                  <Row gutter={[8, 8]}>
                    <Col xs={24}>
                      <Form.Item label="Select email list" className={styles.compactFormItem}>
                        <Select
                          showArrow
                          showSearch
                          placeholder="Select an email List"
                          onChange={handleChangeSelectedEmailList}
                          defaultValue={defaultEmailListKey}
                          value={selectedEmailList}
                          options={emailListOptions}
                        />
                      </Form.Item>
                    </Col>
                    <Col xs={24}>
                      <Form.Item
                        label="List Name"
                        name="emailListName"
                        className={styles.compactFormItem}
                        rules={validationRules.requiredValidation}
                      >
                        <Input placeholder="Input list name here" maxLength={50} />
                      </Form.Item>
                    </Col>
                  </Row>
                </Col>

                {/* CTA Sections */}
                <Col xs={24} md={12} lg={14}>
                  <Row gutter={[8, 8]} justify="end">
                    <Col xs={24} md={12} lg={{ span: 10, offset: 14 }}>
                      <Button block type="primary" onClick={() => showSendAudienceEmailModal()}>
                        Send Email to {isCreating ? 'selected audiences' : 'this email list'}
                      </Button>
                    </Col>
                    <Col xs={24} md={12} lg={10}>
                      <Form.Item noStyle hidden={isCreating} wrapperCol={24}>
                        <Popconfirm
                          arrowPointAtCenter
                          icon={<DeleteOutlined className={styles.danger} />}
                          title="Are you sure you want to delete this email list?"
                          okText="Yes, delete this list"
                          cancelText="No"
                          okButtonProps={{ danger: true, type: 'primary' }}
                          onConfirm={handleDeleteEmailList}
                        >
                          <Button danger block type="primary">
                            Delete this list
                          </Button>
                        </Popconfirm>
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12} lg={10}>
                      <Button block type="primary" className={styles.greenBtn} htmlType="submit">
                        {isCreating ? 'Create new email' : 'Add more audience to'} list
                      </Button>
                    </Col>
                  </Row>
                </Col>
              </Row>
            </Loader>
          </Form>
        </Col>

        {/* Audience Section */}
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
            <Col xs={8}>
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
