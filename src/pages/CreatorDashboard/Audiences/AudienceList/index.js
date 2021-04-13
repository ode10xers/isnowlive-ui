import React, { useState, useCallback, useEffect } from 'react';

import { Row, Col, Button, Popconfirm, Tooltip, Typography, Card, Empty } from 'antd';
import { DeleteOutlined, MailOutlined } from '@ant-design/icons';

import Loader from 'components/Loader';
import Table from 'components/Table';
import { showErrorModal, showSuccessModal } from 'components/Modals/modals';

import apis from 'apis';

import { isAPISuccess } from 'utils/helper';
import { isMobileDevice } from 'utils/device';
import SendAudienceEmailModal from 'components/SendAudienceEmailModal';

const { Title, Text } = Typography;

// TODO: Implement Pagination when BE has implemented it
const AudienceList = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [audienceList, setAudienceList] = useState([]);
  const [selectedAudiences, setSelectedAudiences] = useState([]);
  const [sendEmailModalVisible, setSendEmailModalVisible] = useState(false);

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
    getAudienceList();
  }, [getAudienceList]);

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
    setSelectedAudiences(selectedRow);
  };

  const showSendEmailModal = () => {
    if (selectedAudiences.length > 0) {
      setSendEmailModalVisible(true);
    } else {
      setSendEmailModalVisible(false);
      showErrorModal('Please select some audiences first');
    }
  };

  const hideSendEmailModal = () => {
    setSendEmailModalVisible(false);
  };

  const audienceListColumns = [
    // {
    //   title: 'Email Address',
    //   dataIndex: 'email',
    //   key: 'email',
    //   width: '30%',
    // },
    {
      title: 'First Name',
      dataIndex: 'first_name',
      key: 'first_name',
      width: '42%',
    },
    {
      title: 'Last Name',
      dataIndex: 'last_name',
      key: 'last_name',
      width: '42%',
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
              <Button
                block
                type="link"
                icon={<MailOutlined />}
                onClick={() => {
                  setSelectedAudiences([record]);
                  showSendEmailModal();
                }}
              />
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
              <Button
                block
                type="link"
                icon={<MailOutlined />}
                onClick={() => {
                  setSelectedAudiences([audience]);
                  showSendEmailModal();
                }}
              />
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
        recipients={selectedAudiences}
      />
      <Row gutter={[16, 16]}>
        <Col xs={24}>
          <Button type="primary" disabled={selectedAudiences.length <= 0} onClick={() => showSendEmailModal()}>
            Send Email
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
          )}
        </Col>
      </Row>
    </div>
  );
};

export default AudienceList;
