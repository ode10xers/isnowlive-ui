import React, { useState, useEffect, useCallback } from 'react';

import { Row, Col, Typography, Button } from 'antd';
import { DownOutlined, UpOutlined, PlusCircleOutlined } from '@ant-design/icons';

import apis from 'apis';

import Table from 'components/Table';
import Loader from 'components/Loader';
import SessionCards from 'components/SessionCards';
import CreateClassPassModal from 'components/CreateClassPassModal';

import { showErrorModal, showSuccessModal } from 'utils/modals';
import { isMobileDevice } from 'utils/device';
import { isAPISuccess } from 'utils/helper';

import styles from './styles.module.scss';

const { Title, Text } = Typography;

const ClassPassList = () => {
  const [editPassId, setEditPassId] = useState(null);
  const [passes, setPasses] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedRowKeys, setExpandedRowKeys] = useState([]);
  const [createModalVisible, setCreateModalVisible] = useState(false);

  const showCreatePassesModal = () => {
    setCreateModalVisible(true);
  };

  const hideCreatePassesModal = (shouldRefresh = false) => {
    setCreateModalVisible(false);
    setEditPassId(null);

    if (shouldRefresh) {
      getPassesForCreator();
    }
  };

  const showEditPassesModal = (passId) => {
    setEditPassId(passId);
    showCreatePassesModal();
  };

  const publishPass = async (passId) => {
    setIsLoading(true);

    try {
      const { status } = await apis.passes.publishPass(passId);

      if (isAPISuccess(status)) {
        showSuccessModal('Class Pass Published');
        getPassesForCreator();
      }
    } catch (error) {
      showErrorModal('Something wrong happened', error.response?.data?.message);
    }

    setIsLoading(false);
  };

  const unpublishPass = async (passId) => {
    setIsLoading(true);

    try {
      const { status } = await apis.passes.unpublishPass(passId);

      if (isAPISuccess(status)) {
        showSuccessModal('Class Pass Unpublished');
        getPassesForCreator();
      }
    } catch (error) {
      showErrorModal('Something wrong happened', error.response?.data?.message);
    }

    setIsLoading(false);
  };

  const getPassesForCreator = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await apis.passes.getCreatorPasses();

      if (data) {
        setPasses(
          data.map((classPass, index) => ({
            index,
            key: classPass.id,
            id: classPass.id,
            name: classPass.name,
            price: classPass.price,
            limited: classPass.limited,
            currency: classPass.currency,
            validity: classPass.validity,
            class_count: classPass.class_count,
            is_published: classPass.is_published,
            sessions: classPass.sessions,
          }))
        );
      }
    } catch (error) {
      showErrorModal('Failed fetching Passes', error.response?.data?.message || 'Something went wrong');
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    getPassesForCreator();
    //eslint-disable-next-line
  }, []);

  const expandAllRow = () => setExpandedRowKeys(passes.map((pass) => pass.id));
  const collapseAllRow = () => setExpandedRowKeys([]);

  const expandRow = (rowKey) => {
    const tempExpandedRowsArray = expandedRowKeys;
    tempExpandedRowsArray.push(rowKey);
    setExpandedRowKeys([...new Set(tempExpandedRowsArray)]);
  };

  const collapseRow = (rowKey) => setExpandedRowKeys(expandedRowKeys.filter((key) => key !== rowKey));

  const passesColumns = [
    {
      title: 'Pass Name',
      dataIndex: 'name',
      key: 'name',
      width: '35%',
    },
    {
      title: 'Pass Count',
      dataIndex: 'class_count',
      key: 'class_count',
      align: 'right',
      width: '15%',
      render: (text, record) => (record.limited ? `${text} Classes` : 'Unlimited Classes'),
    },
    {
      title: 'Validity',
      dataIndex: 'validity',
      key: 'validity',
      align: 'center',
      width: '12%',
      render: (text, record) => `${text} day${parseInt(text) > 1 ? 's' : ''}`,
    },
    {
      title: 'Price',
      dataIndex: 'price',
      key: 'price',
      align: 'left',
      width: '10%',
      render: (text, record) => `${text} ${record.currency}`,
    },
    {
      title: '',
      align: 'right',
      render: (text, record) => (
        <Row gutter={8}>
          <Col xs={8}>
            <Button type="link" onClick={() => showEditPassesModal(record.id)}>
              Edit
            </Button>
          </Col>
          <Col xs={8}>
            {record.is_published ? (
              <Button type="link" danger onClick={() => unpublishPass(record.id)}>
                {' '}
                Unpublish{' '}
              </Button>
            ) : (
              <Button type="link" className={styles.successBtn} onClick={() => publishPass(record.id)}>
                {' '}
                Publish{' '}
              </Button>
            )}
          </Col>
          <Col xs={8}>
            {expandedRowKeys.includes(record.id) ? (
              <Button type="link" onClick={() => collapseRow(record.id)} icon={<UpOutlined />}>
                Close
              </Button>
            ) : (
              <Button type="link" onClick={() => expandRow(record.id)} icon={<DownOutlined />}>
                More
              </Button>
            )}
          </Col>
        </Row>
      ),
    },
  ];

  const renderClassesList = (record) => (
    <Row>
      <Col xs={24}>
        <Text className={styles.ml20}> Applicable to below class(es) </Text>
      </Col>
      <Col xs={24}>
        <SessionCards sessions={record.sessions} />
      </Col>
    </Row>
  );

  return (
    <div className={styles.box}>
      <CreateClassPassModal visible={createModalVisible} closeModal={hideCreatePassesModal} editPassId={editPassId} />
      <Row gutter={8}>
        <Col xs={12} md={10} lg={14}>
          <Title level={4}> Class Passes </Title>
        </Col>
        <Col xs={24} md={4} lg={3}>
          <Button block shape="round" type="primary" onClick={() => expandAllRow()}>
            Expand All
          </Button>
        </Col>
        <Col xs={24} md={4} lg={3}>
          <Button block shape="round" type="default" onClick={() => collapseAllRow()}>
            Collapse All
          </Button>
        </Col>
        <Col xs={12} md={6} lg={4}>
          <Button block type="primary" onClick={() => showCreatePassesModal()} icon={<PlusCircleOutlined />}>
            Create New Pass
          </Button>
        </Col>
        <Col xs={24}>
          {isMobileDevice ? (
            <Loader loading={isLoading} size="large" text="Loading Class Passes">
              Mobile Cards Here
            </Loader>
          ) : (
            <Table
              sticky={true}
              columns={passesColumns}
              data={passes}
              loading={isLoading}
              rowKey={(record) => record.id}
              expandable={{
                expandedRowRender: (record) => renderClassesList(record),
                expandRowByClick: true,
                expandIconColumnIndex: -1,
                expandedRowKeys: expandedRowKeys,
              }}
            />
          )}
        </Col>
      </Row>
    </div>
  );
};

export default ClassPassList;
