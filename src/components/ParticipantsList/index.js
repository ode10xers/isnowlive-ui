import React from 'react';
import { Typography, Card, Row, Col } from 'antd';

import Table from 'components/Table';
import { isMobileDevice } from 'utils/device';
import dateUtil from 'utils/date';
import { getPaymentStatus, paymentSource } from 'utils/helper';

import styles from './styles.module.scss';

const { Title, Text } = Typography;
const {
  formatDate: { toLongDate, toLongDateWithDay },
} = dateUtil;

const ParticipantsList = ({ participants, isPast, currency }) => {
  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      width: '12%',
    },
    {
      title: 'Registered on',
      dataIndex: 'booking_time',
      key: 'booking_time',
      width: '12%',
      render: (text, record, index) => (
        <Text className={styles.textAlignLeft}>{record?.booking_time && toLongDateWithDay(record?.booking_time)}</Text>
      ),
    },
    {
      title: 'Net Price',
      dataIndex: 'net_price',
      key: 'net_price',
      width: '12%',
      render: (text, record, index) =>
        record.booking_type === paymentSource.CLASS_PASS ? (
          'PASS'
        ) : (
          <Text className={styles.textAlignLeft}>
            {currency} {record?.net_price}
          </Text>
        ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: '12%',
      render: (text, record, index) =>
        record?.status && <Text className={styles.textAlignLeft}>{getPaymentStatus(record?.status)}</Text>,
    },
  ];

  const renderParticipant = (item) => {
    const layout = (label, value) => (
      <Row>
        <Col span={9}>
          <Text strong>{label}</Text>
        </Col>
        <Col span={15}>: {value}</Col>
      </Row>
    );
    return (
      <Card className={styles.card} key={item?.id}>
        {layout('Name', item?.name)}
        {layout('Registered on', item?.booking_time && toLongDate(item?.booking_time))}
        {layout('Total Fee Paid', `${currency} ${item?.total_price}`)}
        {layout('Net Price', `${currency} ${item?.net_price}`)}
        {layout('Platform Fees', `${currency} ${item?.platform_fees}`)}
        {layout('Status', getPaymentStatus(item?.status))}
      </Card>
    );
  };

  return (
    <div>
      <Title level={5}>{!isPast && 'Current'} Registrations</Title>
      {isMobileDevice ? (
        participants?.map(renderParticipant)
      ) : (
        <Table columns={columns} data={participants} loading={false} />
      )}
    </div>
  );
};

export default ParticipantsList;
