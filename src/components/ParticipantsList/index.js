import React from 'react';
import { Typography, Card, Row, Col } from 'antd';

import Table from 'components/Table';
import { isMobileDevice } from '../../utils/device';
import dateUtil from 'utils/date';

import styles from './styles.module.scss';

const { Title, Text } = Typography;
const {
  formatDate: { toLongDate, toLongDateWithDay },
} = dateUtil;

const ParticipantsList = ({ participants, isPast, currency }) => {
  const participantsColumns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      width: '12%',
    },
    {
      title: 'Registered on',
      dataIndex: 'date_registered',
      key: 'date_registered',
      width: '12%',
      render: (record) => (
        <div>
          <Text className={styles.textAlignLeft}>{toLongDateWithDay(record.date_registered)}</Text>
        </div>
      ),
    },
    {
      title: 'Fee Paid',
      dataIndex: 'fee_paid',
      key: 'fee_paid',
      width: '12%',
      render: (record) => (
        <div>
          <Text className={styles.textAlignLeft}>
            {currency} {record.fee_paid}
          </Text>
        </div>
      ),
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
      <Card key={item.id}>
        {layout('Name', item.name)}
        {layout('Registered on', toLongDate(item.date_registered))}
        {layout('Fee Paid', `${currency} ${item.fee_paid}`)}
      </Card>
    );
  };

  return (
    <div>
      <Title level={5}>{!isPast && 'Current'} Registrations</Title>
      {isMobileDevice ? (
        participants?.map(renderParticipant)
      ) : (
        <Table columns={participantsColumns} data={participants} loading={false} />
      )}
    </div>
  );
};

export default ParticipantsList;
