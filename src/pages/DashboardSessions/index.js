import React, { useState, useEffect, useCallback } from 'react';
import { Row, Col, Typography, Popconfirm, Button, Card } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import { useHistory } from 'react-router-dom';

import apis from 'apis';
import dateUtil from 'utils/date';
import { isMobileDevice } from 'utils/device';
import Table from 'components/Table';
import Section from 'components/Section';
import Loader from 'components/Loader';

import styles from './styles.module.scss';

const {
  formatDate: { toLocaleTime, toLongDateWithDay },
} = dateUtil;
const { Text, Title } = Typography;

const DashboardSessions = ({ match }) => {
  const history = useHistory();
  const [isLoading, setIsLoading] = useState(true);
  const [sessions, setSessions] = useState([]);
  const [isPast, setIsPast] = useState(false);

  const getStaffSession = useCallback(async () => {
    const { data } = isPast ? await apis.session.getSessionForPast() : await apis.session.getSessionForUpcoming();
    if (data) {
      const sortedData = data.sort((a, b) => new Date(a.inventory.start_time) - new Date(b.inventory.start_time));
      setSessions(
        sortedData.map((i, index) => ({
          index,
          key: i.session.id,
          name: i.session.name,
          type: i.session.max_participants > 1 ? 'Group Session' : '1-on-1 Session',
          duration: `${i.session.duration} mins`,
          days: toLongDateWithDay(i.inventory.start_time),
          session_date: i.inventory.session_date,
          time: `${toLocaleTime(i.inventory.start_time)} - ${toLocaleTime(i.inventory.end_time)}`,
          start_time: i.inventory.start_time,
          end_time: i.inventory.end_time,
          participants:
            i.session.max_participants > 1 ? i.participants.length : i.participants.map((p) => p.name).join(' '),
          start_url: i.start_url,
          inventory_id: i.inventory.id,
          session_id: i.session.id,
          max_participants: i.session.max_participants,
        }))
      );
    }
    setIsLoading(false);
  }, [isPast]);

  useEffect(() => {
    if (match?.params?.session_type) {
      if (match?.params?.session_type === 'past') {
        setIsPast(true);
      } else {
        setIsPast(false);
      }
      getStaffSession();
    }
  }, [match.params.session_type, getStaffSession]);

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
    },
    {
      title: 'Day',
      key: 'days',
      dataIndex: 'days',
      width: '12%',
    },
    {
      title: 'Duration',
      dataIndex: 'duration',
      key: 'duration',
      width: '4%',
    },
    {
      title: 'Time',
      dataIndex: 'time',
      key: 'time',
      width: '15%',
    },
    {
      title: isPast ? 'Registrations' : 'Attendees',
      key: 'participants',
      dataIndex: 'participants',
      width: '2%',
      render: (text, record) => (
        <Text>
          {record.participants || 0} / {record.max_participants}
        </Text>
      ),
    },
    {
      title: 'Actions',
      width: isPast ? '4%' : '16%',
      render: (text, record) => {
        const isDisabled = record.participants > 0 || record.participants.length > 0;
        return isPast ? (
          <Row justify="start">
            <Col>
              <Button className={styles.detailsButton} type="link">
                Details
              </Button>
            </Col>
          </Row>
        ) : (
          <Row justify="start">
            <Col md={24} lg={24} xl={8}>
              <Button
                className={styles.detailsButton}
                onClick={() => history.push(`/dashboard/sessions/${record.session_id}/${record.inventory_id}/details`)}
                type="link"
              >
                Details
              </Button>
            </Col>
            <Col md={24} lg={24} xl={8}>
              <Popconfirm
                title="Cancel Session"
                icon={<DeleteOutlined className={styles.danger} />}
                okText="Cancel"
                cancelText="Back"
                disabled={isDisabled}
              >
                <Button type="text" disabled={isDisabled} danger>
                  Cancel
                </Button>
              </Popconfirm>
            </Col>

            {record.index === 0 && !isPast && (
              <Col md={24} lg={24} xl={8}>
                <Button type="link">Start</Button>
              </Col>
            )}
          </Row>
        );
      },
    },
  ];

  const renderSessionItem = (item) => {
    const isCancelDisabled = item.participants > 0 || item.participants.length > 0;

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
        title={
          <div onClick={() => history.push(`/dashboard/sessions/${item.session_id}/${item.inventory_id}/details`)}>
            <Text>{item.name}</Text>
          </div>
        }
        actions={[
          <Button
            className={styles.detailsButton}
            onClick={() => history.push(`/dashboard/sessions/${item.session_id}/${item.inventory_id}/details`)}
            type="link"
          >
            Details
          </Button>,
          <Popconfirm
            title="cancel_this_session"
            icon={<DeleteOutlined className={styles.danger} />}
            okText="cancel"
            cancelText={'back'}
            disabled={isCancelDisabled}
          >
            <Button type="text" disabled={isCancelDisabled}>
              Cancel
            </Button>
          </Popconfirm>,
          <>{item.index === 0 && !isPast && <Button type="link">Start</Button>}</>,
        ]}
      >
        {layout('Type', <Text>{item.type}</Text>)}
        {layout('Duration', <Text>{item.duration}</Text>)}
        {layout('Day', <Text>{item.days}</Text>)}
        {layout('Time', <Text>{item.time}</Text>)}
        {layout(
          isPast ? 'Registrations' : 'Attendees',
          <Text>
            {item.participants || 0} {'/'} {item.max_participants}
          </Text>
        )}
      </Card>
    );
  };

  return (
    <Section>
      <Title level={4}>{isPast ? 'Past' : 'Upcoming'} Sessions</Title>
      {isMobileDevice ? (
        <Loader loading={isLoading} size="large" text="Loading sessions">
          {sessions.length > 0 ? (
            sessions.map(renderSessionItem)
          ) : (
            <div className="text-empty">No {isPast ? 'Past' : 'Upcoming'} Session</div>
          )}
        </Loader>
      ) : (
        <Table columns={sessionColumns} data={sessions} loading={isLoading} />
      )}
    </Section>
  );
};

export default DashboardSessions;
