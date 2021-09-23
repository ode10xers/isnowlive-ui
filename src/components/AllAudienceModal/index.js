import React, { useState, useEffect, useCallback } from 'react';
import { Row, Col, Button, Tooltip, Typography, Modal } from 'antd';
import { FilterFilled } from '@ant-design/icons';
import apis from 'apis';

import Table from 'components/Table';
import Loader from 'components/Loader';
import { showErrorModal, resetBodyStyle, showSuccessModal } from 'components/Modals/modals';

import { isAPISuccess } from 'utils/helper';

const { Title } = Typography;

const AllAudienceModal = ({ visible, closeModal, listID }) => {
  const totalItemsPerPage = 10;
  const [isLoading, setIsLoading] = useState(false);
  const [pageNumber, setPageNumber] = useState(1);
  const [canShowMore, setCanShowMore] = useState(false);

  const [audienceList, setAudienceList] = useState([]);
  const [selectedAudiences, setSelectedAudiences] = useState([]);

  // TODO: Filter audiences/members which is already included in the email list here
  // So it doesn't show up and confuses the user (the problem is it's currently paginated)
  const getAudienceList = useCallback(async (pageNumber, itemsPerPage) => {
    setIsLoading(true);
    try {
      const { status, data } = await apis.audiences.getCreatorAudiences(pageNumber, itemsPerPage);

      if (isAPISuccess(status) && data) {
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

  useEffect(() => {
    if (visible) {
      getAudienceList(pageNumber, totalItemsPerPage);
    } else {
      setPageNumber(1);
      setCanShowMore(false);
      setIsLoading(false);
      setAudienceList([]);
      setSelectedAudiences([]);
    }
  }, [getAudienceList, pageNumber, totalItemsPerPage, visible]);

  const addAudiencesToEmailList = async () => {
    setIsLoading(true);

    try {
      const payload = {
        audiences: selectedAudiences.map((audiences) => audiences.id),
      };

      const { status } = await apis.newsletter.updateEmailList(listID, payload);

      if (isAPISuccess(status)) {
        setSelectedAudiences([]);
        showSuccessModal(`Email List successfully updated with new audiences`);
        closeModal(true);
      }
    } catch (error) {
      showErrorModal(
        `Failed to add audiences to email list`,
        error?.response?.data?.message || 'Something went wrong.'
      );
    }

    setIsLoading(false);
  };

  const onSelectAudienceRow = (selectedRowKeys, selectedRows) => {
    setSelectedAudiences(selectedRows);
  };

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
      render: (text, record) => `${record.type[0]}${record.type.slice(1).toLowerCase()}`,
      filterIcon: (filtered) => (
        <Tooltip defaultVisible={true} title="Click here to filter">
          <FilterFilled style={{ fontSize: 16, color: filtered ? '#1890ff' : '#00ffd7' }} />
        </Tooltip>
      ),
    },
  ];

  return (
    <Modal
      title={<Title level={5}> Add audiences to email list </Title>}
      visible={visible}
      centered={true}
      onCancel={() => closeModal(false)}
      footer={null}
      width={1080}
      afterClose={resetBodyStyle}
    >
      <Row gutter={[8, 16]}>
        <Col xs={24}>
          <Loader loading={isLoading} size="large">
            <Row gutter={[8, 8]}>
              <Col xs={16}>Select audiences to add</Col>
              <Col xs={8}>
                <Button block type="primary" onClick={addAudiencesToEmailList}>
                  Add audiences to this email list
                </Button>
              </Col>
            </Row>
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
    </Modal>
  );
};

export default AllAudienceModal;
