import React, { useState, useEffect, useCallback, useMemo } from 'react';

import {
  Row,
  Col,
  Button,
  Select,
  Space,
  Radio,
  Typography,
  Grid,
  Tooltip,
  Popconfirm,
  Input,
  Form,
  message,
} from 'antd';

import { DeleteOutlined, MailOutlined } from '@ant-design/icons';

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
const { useBreakpoint } = Grid;

const defaultEmailListKey = 'blank';

const totalItemsPerPage = 20;

const audienceView = {
  ALL: 'ALL',
  MEMBER: 'MEMBER',
  AUDIENCE: 'AUDIENCE',
};

const EmailList = () => {
  const { xs } = useBreakpoint();

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

  const [audienceViewFilter, setAudienceViewFilter] = useState(audienceView.ALL);

  const isCreating = useMemo(() => selectedEmailList === defaultEmailListKey, [selectedEmailList]);

  //#region Start of Data Fetch

  const getAudienceList = useCallback(async (pageNumber, itemsPerPage, userType = null) => {
    setIsLoading(true);
    try {
      const { status, data } = await apis.audiences.getCreatorAudiences(pageNumber, itemsPerPage, userType);

      if (isAPISuccess(status) && data) {
        console.log(pageNumber);
        if (pageNumber === 1) {
          setAudienceList(data.data ?? []);
        } else {
          setAudienceList((audienceList) => [...audienceList, ...(data.data ?? [])]);
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

  // TODO: Also add logic similar to getAudienceList
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

  //#endregion End of Data Fetch

  //#region Start of Use Effects

  useEffect(() => {
    fetchCreatorEmailList();
  }, [fetchCreatorEmailList]);

  useEffect(() => {
    if (isCreating) {
      getAudienceList(
        pageNumber,
        totalItemsPerPage,
        audienceViewFilter === audienceView.ALL ? null : audienceViewFilter
      );
    } else {
      fetchEmailListDetails(selectedEmailList, pageNumber, totalItemsPerPage);
    }
  }, [getAudienceList, fetchEmailListDetails, pageNumber, selectedEmailList, isCreating, audienceViewFilter]);

  //#endregion End of Use Effects

  //#region Start of Business Logic Handlers

  const deleteAudience = async (audience) => {
    try {
      const { status } = await apis.audiences.deleteAudienceFromList({
        external_ids: [audience.id],
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
          await fetchCreatorEmailList();
          setPageNumber(1);
          form.setFieldsValue({ ...form.getFieldsValue(), emailListName: data.name || null });
          setSelectedEmailList(data.id);
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
      setAudienceEmailRecipients([]);
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

  const handleAudienceViewFilterChanged = (e) => {
    setAudienceViewFilter(e.target.value);
    setPageNumber(1);
  };

  //#endregion End of Modal Handlers

  //#region Start of Constants

  const emailListOptions = useMemo(() => {
    return [
      {
        label: <Text strong> All Audiences/Members </Text>,
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
      width: '150px',
    },
    {
      title: 'Last Name',
      dataIndex: 'last_name',
      key: 'last_name',
      width: '150px',
      render: (text, record) => record.last_name || '-',
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      width: '170px',
      ellipsis: true,
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      width: '100px',
      render: (text, record) => `${record.type[0]}${record.type.slice(1).toLowerCase()}`,
      // filterIcon: (filtered) => (
      //   <Tooltip defaultVisible={true} title="Click here to filter">
      //     <FilterFilled style={{ fontSize: 16, color: filtered ? '#1890ff' : '#00ffd7' }} />{' '}
      //   </Tooltip>
      // ),
      // filters: [
      //   {
      //     text: 'Audiences',
      //     value: 'AUDIENCE',
      //   },
      //   {
      //     text: 'Members',
      //     value: 'MEMBER',
      //   },
      // ],
      // onFilter: (value, record) => {
      //   console.log(value);
      //   return record.type === value;
      // }
    },
    {
      title: 'Actions',
      width: '80px',
      render: (record) => (
        <Row gutter={[8, 8]}>
          <Col xs={12}>
            <Popconfirm
              arrowPointAtCenter
              icon={<DeleteOutlined className={styles.redText} />}
              title={
                <Text>
                  Are you sure you want to delete <br />
                  this audience/member{isCreating ? '' : ' from this email list'}?
                </Text>
              }
              onConfirm={() => (isCreating ? deleteAudience(record) : removeAudienceFromEmailList(record))}
              okText="Yes"
              cancelText="No"
            >
              <Button block type="text" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          </Col>
          <Col xs={12}>
            <Tooltip title="Send email to this audience/member" arrowPointAtCenter>
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
        targetEmailList={selectedEmailList === defaultEmailListKey ? null : selectedEmailList}
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
                        Send Email to {isCreating ? 'selected audiences/members' : 'this email list'}
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
                        {isCreating ? 'Create new email' : 'Add more audience/member to'} list
                      </Button>
                    </Col>
                  </Row>
                </Col>
              </Row>
            </Loader>
          </Form>
        </Col>

        {/* Filters */}
        <Col xs={24}>
          <Space direction={xs ? 'vertical' : 'horizontal'} align={xs ? 'start' : 'center'}>
            <Text> Only show : </Text>
            <Radio.Group buttonStyle="solid" value={audienceViewFilter} onChange={handleAudienceViewFilterChanged}>
              <Radio.Button value={audienceView.ALL}> Show all </Radio.Button>
              <Radio.Button value={audienceView.MEMBER}> Members </Radio.Button>
              <Radio.Button value={audienceView.AUDIENCE}> Audiences </Radio.Button>
            </Radio.Group>
          </Space>
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
                rowSelection={
                  selectedEmailList !== defaultEmailListKey
                    ? null
                    : {
                        onChange: onSelectAudienceRow,
                      }
                }
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
                Show more
              </Button>
            </Col>
          </Row>
        </Col>
      </Row>
    </div>
  );
};

export default EmailList;
