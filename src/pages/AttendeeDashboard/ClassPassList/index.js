import React, { useState, useEffect, useCallback } from 'react';
import { Row, Col, Button, Typography } from 'antd';
import { DownOutlined, UpOutlined } from '@ant-design/icons';

import apis from 'apis';

import Table from 'components/Table';
import Loader from 'components/Loader';
import SessionCards from 'components/SessionCards';
import { showErrorModal } from 'components/modals';

import dateUtil from 'utils/date';
import { isMobileDevice } from 'utils/device';

import styles from './styles.module.scss';

const { Title, Text } = Typography;

const {
  formatDate: { toShortDate },
} = dateUtil;

const ClassPassList = () => {
  const [passes, setPasses] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedRowKeys, setExpandedRowKeys] = useState([]);

  const getPassesForAttendee = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await apis.passes.getAttendeePasses();

      if (data) {
        setPasses(
          data.map((pass, index) => ({
            index,
            key: pass.pass_order_id,
            pass_id: pass.pass_id,
            pass_order_id: pass.pass_order_id,
            name: pass.pass_name,
            price: pass.price,
            limited: pass.limited,
            currency: pass.currency,
            validity: pass.validity,
            class_count: pass.class_count,
            classes_remaining: pass.classes_remaining,
            sessions: pass.session,
          }))
        );
      }
    } catch (error) {
      showErrorModal('Something wrong happened', error.response?.data?.message);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    getPassesForAttendee();
  }, [getPassesForAttendee]);

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
      width: '40%',
    },
    {
      title: 'Pass Count',
      dataIndex: 'class_count',
      key: 'class_count',
      align: 'right',
      width: '15%',
      render: (text, record) =>
        record.limited ? `${record.class_count}/${record.classes_remaining} Classes` : 'Unlimited Classes',
    },
    {
      title: 'Expires On',
      dataIndex: 'expiry',
      key: 'expiry',
      align: 'center',
      width: '10%',
      render: (text, record) => toShortDate(text),
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
      render: (text, record) =>
        expandedRowKeys.includes(record.id) ? (
          <Button type="link" onClick={() => collapseRow(record.id)} icon={<UpOutlined />}>
            Close
          </Button>
        ) : (
          <Button type="link" onClick={() => expandRow(record.id)} icon={<DownOutlined />}>
            More
          </Button>
        ),
    },
  ];

  const renderClassesList = (record) => (
    <Row>
      <Col xs={24}>
        <Text className={styles.ml20}> Usable for below class(es) </Text>
      </Col>
      <Col xs={24}>
        <SessionCards sessions={record.sessions} />
      </Col>
    </Row>
  );

  return (
    <div className={styles.box}>
      <Row gutter={8}>
        <Col xs={24} md={10} lg={18}>
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
