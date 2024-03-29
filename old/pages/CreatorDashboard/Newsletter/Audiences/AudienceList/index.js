import React, { useState, useCallback, useEffect } from 'react';

import { Row, Col, Button, Popconfirm, Tooltip, Typography, Card, Empty } from 'antd';
import { DeleteOutlined, MailOutlined, FilterFilled } from '@ant-design/icons';

import Loader from 'components/Loader';
import Table from 'components/Table';
import { showErrorModal, showSuccessModal } from 'components/Modals/modals';

import apis from 'apis';

import { isAPISuccess } from 'utils/helper';
import { isMobileDevice } from 'utils/device';
import SendAudienceEmailModal from 'components/SendAudienceEmailModal';

const { Title, Text } = Typography;

// NOTE: Cyrrently this is not used and the logic is combined in EmailList
/** @deprecated */
const AudienceList = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [audienceList, setAudienceList] = useState([]);
  const [selectedAudiences, setSelectedAudiences] = useState([]);
  const [emailRecipients, setEmailRecipients] = useState([]);
  const [sendEmailModalVisible, setSendEmailModalVisible] = useState(false);

  const [pageNumber, setPageNumber] = useState(1);
  const [canShowMore, setCanShowMore] = useState(false);
  const totalItemsPerPage = 10;

  const getAudienceList = useCallback(async (pageNumber, itemsPerPage) => {
    setIsLoading(true);
    try {
      const { status, data } = await apis.audiences.getCreatorAudiences(pageNumber, itemsPerPage);

      if (isAPISuccess(status) && data) {
        setAudienceList((audienceList) => [...audienceList, ...data.data]);
        setCanShowMore(data.next_page);
      }
    } catch (error) {
      showErrorModal(error?.response?.data?.message || 'Something went wrong.');
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    getAudienceList(pageNumber, totalItemsPerPage);
  }, [getAudienceList, pageNumber, totalItemsPerPage]);

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

  const onSelectAudienceRow = (selectedRowKeys, selectedRow) => {
    setSelectedAudiences(selectedRow);
  };

  const showSendEmailModal = (recipients) => {
    setEmailRecipients(recipients);
    setSendEmailModalVisible(true);
  };

  const hideSendEmailModal = () => {
    setEmailRecipients([]);
    setSendEmailModalVisible(false);
  };

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
              <Button block type="link" icon={<MailOutlined />} onClick={() => showSendEmailModal([record])} />
            </Tooltip>
          </Col>
        </Row>
      ),
    },
  ];

  const renderMobileAudienceCards = (audience) => {
    return (
      <Col xs={24} key={audience.id}>
        <Card
          title={
            <Title level={5}>
              {audience.first_name} {audience.last_name || ''}
            </Title>
          }
          bodyStyle={{ padding: 0 }}
          actions={[
            <Popconfirm
              arrowPointAtCenter
              icon={<DeleteOutlined />}
              title={<Text> Are you sure you want to delete this audience? </Text>}
              onConfirm={() => deleteAudience(audience)}
              okText="Yes"
              cancelText="No"
            >
              <Button block type="text" danger icon={<DeleteOutlined />} />
            </Popconfirm>,
            <Tooltip title="Send email to this audience" arrowPointAtCenter>
              <Button block type="link" icon={<MailOutlined />} onClick={() => showSendEmailModal([audience])} />
            </Tooltip>,
          ]}
        />
      </Col>
    );
  };

  return (
    <div>
      <SendAudienceEmailModal
        visible={sendEmailModalVisible}
        closeModal={hideSendEmailModal}
        recipients={emailRecipients}
      />
      <Row gutter={[16, 16]}>
        <Col xs={24}>
          <Button
            type="primary"
            disabled={selectedAudiences.length <= 0}
            onClick={() => showSendEmailModal(selectedAudiences)}
          >
            Send Email to recipients
          </Button>
        </Col>
        <Col xs={24}>
          {isMobileDevice ? (
            <Loader loading={isLoading} size="large" text="Fetching audiences...">
              {audienceList.length > 0 ? (
                <Row gutter={[8, 8]} justify="center">
                  {audienceList.map(renderMobileAudienceCards)}
                </Row>
              ) : (
                <Empty description="No audience found" />
              )}
            </Loader>
          ) : (
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
          )}
        </Col>
      </Row>
    </div>
  );
};

export default AudienceList;
