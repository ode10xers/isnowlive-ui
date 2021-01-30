import React, { useState } from 'react';
import MobileDetect from 'mobile-detect';
import classNames from 'classnames';

import { Row, Col, Typography, Button, Card, Tag, Space } from 'antd';
import { DownOutlined, UpOutlined } from '@ant-design/icons';

import Table from 'components/Table';
import SessionCards from 'components/SessionCards';
import PurchasePassModal from 'components/PurchasePassModal';

import { generateUrlFromUsername } from 'utils/helper';

import styles from './style.module.scss';

const { Text, Paragraph } = Typography;

const ClassPasses = ({ username, passes }) => {
  const md = new MobileDetect(window.navigator.userAgent);
  const isMobileDevice = Boolean(md.mobile());

  const [selectedPass, setSelectedPass] = useState(null);
  const [expandedRowKeys, setExpandedRowKeys] = useState([]);
  const [showPurchasePassModal, setShowPurchasePassModal] = useState(false);

  const showPurchaseModal = (passId) => {
    setSelectedPass(passes.filter((pass) => pass.id === passId)[0]);
    setShowPurchasePassModal(true);
  };

  const closePurchaseModal = () => {
    setSelectedPass(null);
    setShowPurchasePassModal(false);
  };

  const redirectToSessionsPage = (session) => {
    const baseUrl = generateUrlFromUsername(session.username || username || 'app');
    window.open(`${baseUrl}/s/${session.session_id}`);
  };

  const toggleExpandAll = () => {
    if (expandedRowKeys.length > 0) {
      setExpandedRowKeys([]);
    } else {
      setExpandedRowKeys(passes.map((pass) => pass.id));
    }
  };

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
      width: '10%',
      render: (text, record) => `${text} day${parseInt(text) > 1 ? 's' : ''}`,
    },
    {
      title: 'Price',
      dataIndex: 'price',
      key: 'price',
      align: 'left',
      sortOrder: 'descend',
      width: '10%',
      render: (text, record) => `${text} ${record.currency}`,
    },
    {
      title: (
        <Button shape="round" type="primary" onClick={() => toggleExpandAll()}>
          {expandedRowKeys.length > 0 ? 'Collapse' : 'Expand'} All
        </Button>
      ),
      align: 'right',
      render: (text, record) => (
        <Space size="small">
          <Button type="primary" onClick={() => showPurchaseModal(record.id)}>
            Buy Pass
          </Button>
          {expandedRowKeys.includes(record.id) ? (
            <Button type="link" onClick={() => collapseRow(record.id)} icon={<UpOutlined />}>
              Close
            </Button>
          ) : (
            <Button type="link" onClick={() => expandRow(record.id)} icon={<DownOutlined />}>
              More
            </Button>
          )}
        </Space>
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

  const renderPassItem = (pass) => {
    const layout = (label, value) => (
      <Row>
        <Col span={9}>
          <Text strong>{label}</Text>
        </Col>
        <Col span={15}>: {value}</Col>
      </Row>
    );

    return (
      <div>
        <Card
          className={styles.card}
          title={<Text>{pass.name}</Text>}
          actions={[
            <Button type="primary" onClick={() => showPurchaseModal(pass.id)}>
              Buy Pass
            </Button>,
            expandedRowKeys.includes(pass.id) ? (
              <Button type="link" onClick={() => collapseRow(pass.id)} icon={<UpOutlined />}>
                Close
              </Button>
            ) : (
              <Button type="link" onClick={() => expandRow(pass.id)} icon={<DownOutlined />}>
                More
              </Button>
            ),
          ]}
        >
          {layout('Pass Count', <Text>{pass.limited ? `${pass.class_count} Classes` : 'Unlimited Classes'}</Text>)}
          {layout('Validity', <Text>{`${pass.validity} day`}</Text>)}
          {layout('Price', <Text>{`${pass.price} ${pass.currency}`}</Text>)}
        </Card>
        {expandedRowKeys.includes(pass.id) && (
          <Row className={styles.cardExpansion}>
            <Col xs={24}>
              <Text className={styles.ml20}> Applicable to below class(es) </Text>
            </Col>
            <Col xs={24}>
              <div className={classNames(styles.ml20, styles.mt10)}>
                {pass.sessions.map((session) => (
                  <Tag color="blue" onClick={() => redirectToSessionsPage(session)}>
                    {' '}
                    {session.name}{' '}
                  </Tag>
                ))}
              </div>
            </Col>
          </Row>
        )}
      </div>
    );
  };

  return (
    <div className={styles.box}>
      <PurchasePassModal visible={showPurchasePassModal} pass={selectedPass} closeModal={closePurchaseModal} />
      <Row gutter={[16, 16]}>
        <Col xs={24}>
          <Paragraph>Passes are an easy way to frequently book the classes you love attending.</Paragraph>
          <Paragraph>
            Check out the passes below and the classes included in them. Once you have bought the pass you can use the
            class credits to pay for classes in 1 click it without needing to touch your wallet again. Class pass is
            valid from from the date you buy it until the validity period.
          </Paragraph>
        </Col>
        <Col xs={24}>
          {isMobileDevice ? (
            passes.length > 0 ? (
              passes.map(renderPassItem)
            ) : (
              <div className={styles.textAlignCenter}>
                {' '}
                <Text disabled> No Passes </Text>{' '}
              </div>
            )
          ) : (
            <Table
              sticky={true}
              columns={passesColumns}
              data={passes}
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

export default ClassPasses;
