import React, { useState } from 'react';
import { Row, Col, Typography, Button } from 'antd';
import { DownOutlined, UpOutlined } from '@ant-design/icons';

import Table from 'components/Table';
import SessionCards from 'components/SessionCards';
import PurchasePassModal from 'components/PurchasePassModal';

import styles from './style.module.scss';

const { Text, Paragraph } = Typography;

const ClassPasses = ({ passes }) => {
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
        <>
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
        </>
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
      <PurchasePassModal visible={showPurchasePassModal} pass={selectedPass} closeModal={closePurchaseModal} />
      <Row gutter={[16, 16]}>
        <Col xs={20}>
          <Paragraph>Passes are an easy way to frequently book the classes you love attending.</Paragraph>
          <Paragraph>
            Check out the passes below and the classes included in them. Once you have bought the pass you can use the
            class credits to pay for classes in 1 click it wihout needing to touch your wallet again. Class pass is
            valid from from the date you buy it until the validity period.
          </Paragraph>
        </Col>
        <Col xs={4}></Col>
        <Col xs={24}>
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
        </Col>
      </Row>
    </div>
  );
};

export default ClassPasses;
