import React, { useState, useEffect, useCallback } from 'react';
import { Row, Col, Typography, Button, Card } from 'antd';
import { useHistory } from 'react-router-dom';

import apis from 'apis';
import dateUtil from 'utils/date';
import { isMobileDevice } from 'utils/device';
import Table from 'components/Table';
import Section from 'components/Section';
import Loader from 'components/Loader';

import styles from './styles.module.scss';

const {
  formatDate: { toLongDateWithDay },
} = dateUtil;
const { Text, Title } = Typography;

const DashboardManageSessions = () => {
  const history = useHistory();
  const [isLoading, setIsLoading] = useState(true);
  const [sessions, setSessions] = useState([]);

  const getSessionsList = useCallback(async () => {
    const { data } = await apis.session.getSession();
    if (data) {
      setSessions(data);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    getSessionsList();
  }, [getSessionsList]);

  let sessionColumns = [
    {
      title: 'Session Name',
      key: 'name',
      width: '12%',
      render: (record) => <Text className={styles.textAlignLeft}>{record.name}</Text>,
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      width: '5%',
      render: (text, record) => <Text>{record.group ? 'Group Session' : '1-to-1 Session'}</Text>,
    },
    {
      title: 'Session Date',
      dataIndex: 'session_date',
      key: 'session_date',
      width: '15%',
      render: (text, record) => (
        <>
          {record.recurring ? (
            <Text>
              {toLongDateWithDay(record.beginning)} - {toLongDateWithDay(record.expiry)}
            </Text>
          ) : (
            <Text>
              {record?.inventory && record.inventory[0] && toLongDateWithDay(record.inventory[0]?.session_date)}
            </Text>
          )}
        </>
      ),
    },
    {
      title: 'Registrations',
      key: 'participants',
      dataIndex: 'participants',
      width: '2%',
      render: (text, record) => (
        <Text>
          {record.total_bookings || 0} / {record.max_participants}
        </Text>
      ),
    },
    {
      title: 'Actions',
      width: '4%',
      render: (text, record) => {
        return (
          <Row justify="start">
            <Col md={24} lg={24} xl={8}>
              <Button
                className={styles.detailsButton}
                onClick={() => history.push(`/dashboard/manage/session/${record.session_id}/edit`)}
                type="link"
              >
                Details
              </Button>
            </Col>
            <Col md={24} lg={24} xl={8}>
              {record.is_active ? (
                <Button type="text" className={styles.sucessButton}>
                  Publish
                </Button>
              ) : (
                <Button type="text" danger>
                  Unpublish
                </Button>
              )}
            </Col>
          </Row>
        );
      },
    },
  ];

  const renderSessionItem = (item) => {
    const layout = (label, value) => (
      <Row>
        <Col span={9}>
          <Text strong>{label}</Text>
        </Col>
        <Col span={15}>: {value}</Col>
      </Row>
    );

    return (
      <Card
        className={styles.card}
        title={
          <div onClick={() => history.push(`/dashboard/manage/session/${item.session_id}/edit`)}>
            <Text>{item.name}</Text>
          </div>
        }
        actions={[
          <Button
            className={styles.detailsButton}
            onClick={() => history.push(`/dashboard/manage/session/${item.session_id}/edit`)}
            type="link"
          >
            Details
          </Button>,
          <>
            {item.is_active ? (
              <Button type="text" className={styles.sucessButton}>
                Publish
              </Button>
            ) : (
              <Button type="text" danger>
                Unpublish
              </Button>
            )}
          </>,
        ]}
      >
        {layout('Type', <Text>{item.group ? 'Group Session' : '1-to-1 Session'}</Text>)}
        {layout('Duration', <Text>{item.duration}</Text>)}
        {layout(
          'Date',
          <>
            {item.recurring ? (
              <Text>
                {toLongDateWithDay(item.beginning)} - {toLongDateWithDay(item.expiry)}
              </Text>
            ) : (
              <Text>{item?.inventory && item.inventory[0] && toLongDateWithDay(item.inventory[0]?.session_date)}</Text>
            )}
          </>
        )}
        {layout(
          'Attendee',
          <Text>
            {item.total_bookings || 0} {'/'} {item.max_participants}
          </Text>
        )}
      </Card>
    );
  };

  return (
    <Section>
      <Title level={4}>Manage Sessions</Title>
      {isMobileDevice ? (
        <Loader loading={isLoading} size="large" text="Loading sessions">
          {sessions.length > 0 ? sessions.map(renderSessionItem) : <div className="text-empty">No Sessions </div>}
        </Loader>
      ) : (
        <Table columns={sessionColumns} data={sessions} loading={isLoading} />
      )}
    </Section>
  );
};

export default DashboardManageSessions;
