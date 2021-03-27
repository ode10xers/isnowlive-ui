import React from 'react';
import { Typography, Card, Row, Col } from 'antd';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();

  const columns = [
    {
      title: t('NAME'),
      dataIndex: 'name',
      key: 'name',
      width: '12%',
    },
    {
      title: t('REGISTERED_ON'),
      dataIndex: 'booking_time',
      key: 'booking_time',
      width: '12%',
      render: (text, record, index) => (
        <Text className={styles.textAlignLeft}>{record?.booking_time && toLongDateWithDay(record?.booking_time)}</Text>
      ),
    },
    {
      title: t('NET_PRICE'),
      dataIndex: 'net_price',
      key: 'net_price',
      width: '12%',
      render: (text, record, index) =>
        record.booking_type === paymentSource.PASS ? (
          'PASS'
        ) : (
          <Text className={styles.textAlignLeft}>
            {currency} {record?.net_price}
          </Text>
        ),
    },
    {
      title: t('STATUS'),
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
        {layout(t('NAME'), item?.name)}
        {layout(t('REGISTERED_ON'), item?.booking_time && toLongDate(item?.booking_time))}
        {layout(t('NET_PRICE'), `${currency.toUpperCase()} ${item?.net_price}`)}
        {layout(t('PLATFORM_FEES'), `${currency.toUpperCase()} ${item?.platform_fees}`)}
        {layout(t('STATUS'), getPaymentStatus(item?.status))}
      </Card>
    );
  };

  return (
    <div>
      <Title level={5}>
        {!isPast && t('CURRENT')} {t('REGISTRATIONS')}
      </Title>
      {isMobileDevice ? (
        participants?.map(renderParticipant)
      ) : (
        <Table columns={columns} data={participants} loading={false} />
      )}
    </div>
  );
};

export default ParticipantsList;
