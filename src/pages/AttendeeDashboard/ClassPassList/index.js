import React, { useState, useEffect, useCallback } from 'react';
import { Row, Col, Button, Typography, Collapse } from 'antd';
import { DownOutlined, UpOutlined } from '@ant-design/icons';

import apis from 'apis';

import Table from 'components/Table';
import Loader from 'components/Loader';
import SessionCards from 'components/SessionCards';
import { showErrorModal } from 'components/Modals/modals';

import dateUtil from 'utils/date';
import { isMobileDevice } from 'utils/device';

import styles from './styles.module.scss';

const { Title, Text } = Typography;
const { Panel } = Collapse;

const {
  formatDate: { toShortDate },
} = dateUtil;

const ClassPassList = () => {
  const [passes, setPasses] = useState([]);
  const [expiredPasses, setExpiredPasses] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedActiveRowKeys, setExpandedActiveRowKeys] = useState([]);
  const [expandedExpiredRowKeys, setExpandedExpiredRowKeys] = useState([]);

  const getPassesForAttendee = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await apis.passes.getAttendeePasses();

      if (data) {
        setPasses(
          data.active.map((pass, index) => ({
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
            sessions:
              pass.session?.map((session) => ({
                ...session,
                key: `${pass.pass_order_id}_${session.session_id}`,
                username: pass.creator_username,
              })) || [],
            expired: false,
          }))
        );
        setExpiredPasses(
          data.expired.map((pass, index) => ({
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
            sessions:
              pass.session?.map((session) => ({
                ...session,
                key: `${pass.pass_order_id}_${session.session_id}`,
                username: pass.creator_username,
              })) || [],
            expired: true,
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

  const toggleExpandAllActivePasses = () => {
    if (expandedActiveRowKeys.length > 0) {
      setExpandedActiveRowKeys([]);
    } else {
      setExpandedActiveRowKeys(passes.map((pass) => pass.pass_order_id));
    }
  };

  const toggleExpandAllExpiredPasses = () => {
    if (expandedExpiredRowKeys.length > 0) {
      setExpandedExpiredRowKeys([]);
    } else {
      setExpandedExpiredRowKeys(expiredPasses.map((pass) => pass.pass_order_id));
    }
  };

  const expandActiveRow = (rowKey) => {
    const tempExpandedRowsArray = expandedActiveRowKeys;
    tempExpandedRowsArray.push(rowKey);
    setExpandedActiveRowKeys([...new Set(tempExpandedRowsArray)]);
  };

  const collapseActiveRow = (rowKey) => setExpandedActiveRowKeys(expandedActiveRowKeys.filter((key) => key !== rowKey));

  const expandExpiredRow = (rowKey) => {
    const tempExpandedRowsArray = expandedExpiredRowKeys;
    tempExpandedRowsArray.push(rowKey);
    setExpandedExpiredRowKeys([...new Set(tempExpandedRowsArray)]);
  };

  const collapseExpiredRow = (rowKey) =>
    setExpandedExpiredRowKeys(expandedExpiredRowKeys.filter((key) => key !== rowKey));

  const passesColumns = [
    {
      title: 'Pass Name',
      dataIndex: 'name',
      key: 'name',
      width: '35%',
    },
    {
      title: 'Classes Left',
      dataIndex: 'class_count',
      key: 'class_count',
      align: 'right',
      width: '15%',
      render: (text, record) =>
        record.limited ? `${record.classes_remaining}/${record.class_count} Classes` : 'Unlimited Classes',
    },
    {
      title: 'Expires On',
      dataIndex: 'expiry',
      key: 'expiry',
      align: 'center',
      width: '18%',
      render: (text, record) => toShortDate(text),
    },
    {
      title: 'Price',
      dataIndex: 'price',
      key: 'price',
      align: 'left',
      width: '18%',
      render: (text, record) => `${text} ${record.currency}`,
    },
    {
      title: '',
      align: 'right',
      render: (text, record) =>
        record.expired ? (
          expandedExpiredRowKeys.includes(record.pass_order_id) ? (
            <Button type="link" onClick={() => collapseExpiredRow(record.pass_order_id)} icon={<UpOutlined />}>
              Close
            </Button>
          ) : (
            <Button type="link" onClick={() => expandExpiredRow(record.pass_order_id)} icon={<DownOutlined />}>
              More
            </Button>
          )
        ) : expandedActiveRowKeys.includes(record.pass_order_id) ? (
          <Button type="link" onClick={() => collapseActiveRow(record.pass_order_id)} icon={<UpOutlined />}>
            Close
          </Button>
        ) : (
          <Button type="link" onClick={() => expandActiveRow(record.pass_order_id)} icon={<DownOutlined />}>
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
        <Col xs={24}>
          <Title level={4}> Class Passes </Title>
        </Col>
        <Col xs={24}>
          <Collapse>
            <Panel header={<Title level={5}> Active Passes </Title>} key="Active">
              <Row gutter={8}>
                <Col xs={24} md={14} lg={21}></Col>
                <Col xs={24} md={4} lg={3}>
                  <Button block shape="round" type="primary" onClick={() => toggleExpandAllActivePasses()}>
                    {expandedActiveRowKeys.length > 0 ? 'Collapse' : 'Expand'} All
                  </Button>
                </Col>
                <Col xs={24}>
                  {isMobileDevice ? (
                    <Loader loading={isLoading} size="large" text="Loading Active Class Passes">
                      Mobile Cards Here
                    </Loader>
                  ) : (
                    <Table
                      sticky={true}
                      columns={passesColumns}
                      data={passes}
                      loading={isLoading}
                      rowKey={(record) => record.pass_order_id}
                      expandable={{
                        expandedRowRender: (record) => renderClassesList(record),
                        expandRowByClick: true,
                        expandIconColumnIndex: -1,
                        expandedRowKeys: expandedActiveRowKeys,
                      }}
                    />
                  )}
                </Col>
              </Row>
            </Panel>
            <Panel header={<Title level={5}> Expired Passes </Title>} key="Expired">
              <Row gutter={8}>
                <Col xs={24} md={14} lg={21}></Col>
                <Col xs={24} md={4} lg={3}>
                  <Button block shape="round" type="primary" onClick={() => toggleExpandAllExpiredPasses()}>
                    {expandedExpiredRowKeys.length > 0 ? 'Collapse' : 'Expand'} All
                  </Button>
                </Col>
                <Col xs={24}>
                  {isMobileDevice ? (
                    <Loader loading={isLoading} size="large" text="Loading Expired Class Passes">
                      Mobile Cards Here
                    </Loader>
                  ) : (
                    <Table
                      sticky={true}
                      columns={passesColumns}
                      data={expiredPasses}
                      loading={isLoading}
                      rowKey={(record) => record.pass_order_id}
                      expandable={{
                        expandedRowRender: (record) => renderClassesList(record),
                        expandRowByClick: true,
                        expandIconColumnIndex: -1,
                        expandedRowKeys: expandedExpiredRowKeys,
                      }}
                    />
                  )}
                </Col>
              </Row>
            </Panel>
          </Collapse>
        </Col>
      </Row>
    </div>
  );
};

export default ClassPassList;
