import React, { useState, useEffect, useCallback } from 'react';
import { useHistory } from 'react-router-dom';

import { Row, Col, Table, Typography, Button } from 'antd';
import { DownCircleTwoTone, UpCircleTwoTone, PlusCircleOutlined } from '@ant-design/icons';

import apis from 'apis';
import Routes from 'routes';

import Loader from 'components/Loader';
import CreateClassPassModal from './CreateClassPassModal';

import dateUtil from 'utils/date';
import { isAPISuccess } from 'utils/helper';
import { showErrorModal } from 'utils/modals';

import styles from './styles.module.scss';

const { Title, Paragraph } = Typography;

const ClassPassList = () => {
  const history = useHistory();

  const [passes, setPasses] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedRowKeys, setExpandedRowKeys] = useState([]);
  const [createModalVisible, setCreateModalVisible] = useState(false);

  const showCreatePassesModal = () => setCreateModalVisible(true);
  const hideCreatePassesModal = () => setCreateModalVisible(false);

  const getPassesForCreator = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await apis.passes.getCreatorPasses();

      if (data) {
        setPasses(data);
      }
    } catch (error) {
      showErrorModal('Failed fetching Passes', error.response?.data?.message || 'Something went wrong');
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    getPassesForCreator();
  }, [getPassesForCreator]);

  const expandRow = (rowKey) => {
    const tempExpandedRowsArray = expandedRowKeys;
    tempExpandedRowsArray.push(rowKey);
    setExpandedRowKeys([...new Set(tempExpandedRowsArray)]);
  };

  const collapseRow = (rowKey) => setExpandedRowKeys(expandedRowKeys.filter((key) => key !== rowKey));

  const passesColumns = [
    {
      title: 'Pass Name',
      dataIndex: '',
      key: '',
    },
    {
      title: 'Pass Count',
      dataIndex: '',
      key: '',
    },
    {
      title: 'Validity',
      dataIndex: '',
      key: '',
    },
    {
      title: 'Expires On',
      dataIndex: '',
      key: '',
    },
    {
      title: 'Price',
      dataIndex: '',
      key: '',
    },
    {
      title: '',
      render: (text, record) => {
        return expandedRowKeys.includes(record.id) ? (
          <Button type="link" onClick={() => collapseRow(record.id)}>
            {' '}
            Close{' '}
          </Button>
        ) : (
          <Button type="link" onClick={() => expandRow(record.id)}>
            {' '}
            More{' '}
          </Button>
        );
      },
    },
  ];

  const renderClassesList = () => {};

  return (
    <div className={styles.box}>
      <CreateClassPassModal visible={createModalVisible} closeModal={hideCreatePassesModal} />
      <Row>
        <Col xs={12} md={18} lg={20}>
          <Title level={4}> Class Passes </Title>
        </Col>
        <Col xs={12} md={6} lg={4}>
          <Button type="primary" onClick={() => showCreatePassesModal()} icon={<PlusCircleOutlined />}>
            Create New Pass
          </Button>
        </Col>
        <Col xs={24}>
          <Loader loading={isLoading} size="large" text="Loading Class Passes">
            {passes.length > 0 ? (
              <Table
                columns={passesColumns}
                data={passes}
                loading={isLoading}
                rowKey={(record) => record.id}
                expandable={{
                  expandedRowRender: (record) => renderClassesList(record),
                  expandRowByClick: true,
                  expandIconColumnIndex: 6,
                  expandedRowKeys: expandedRowKeys,
                  expandIcon: ({ expanded, onExpand, record }) =>
                    expanded ? (
                      <UpCircleTwoTone style={{ fontSize: 20 }} onClick={(e) => onExpand(record, e)} />
                    ) : (
                      <DownCircleTwoTone style={{ fontSize: 20 }} onClick={(e) => onExpand(record, e)} />
                    ),
                }}
              />
            ) : (
              <div className="text-empty"> No Class Passes </div>
            )}
          </Loader>
        </Col>
      </Row>
    </div>
  );
};

export default ClassPassList;
