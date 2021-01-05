import React, { useState, useEffect, useCallback } from 'react';
import { Row, Col, Typography, Popconfirm, Button, Card, message, Radio, Empty } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import { useHistory } from 'react-router-dom';

import apis from 'apis';
import Routes from 'routes';
import dateUtil from 'utils/date';
import { isMobileDevice } from 'utils/device';
import Table from 'components/Table';
import Loader from 'components/Loader';
import CalendarView from 'components/CalendarView';
import { isAPISuccess, getDuration } from 'utils/helper';

import {
  mixPanelEventTags,
  trackSimpleEvent,
  trackSuccessEvent,
  trackFailedEvent,
} from 'services/integrations/mixpanel';

import styles from './styles.module.scss';

const {
  formatDate: { toLocaleTime, toLongDateWithDay },
} = dateUtil;
const { Text, Title } = Typography;
const { creator } = mixPanelEventTags;

const SessionsInventories = ({ match }) => {
  const history = useHistory();
  const [isLoading, setIsLoading] = useState(true);
  const [sessions, setSessions] = useState([]);
  const [isPast, setIsPast] = useState(false);
  const [view, setView] = useState('calendar');
  const [calendarView, setCalendarView] = useState(isMobileDevice ? 'day' : 'month');

  const getStaffSession = useCallback(async (sessionType) => {
    try {
      const { data } =
        sessionType === 'past' ? await apis.session.getPastSession() : await apis.session.getUpcomingSession();
      if (data) {
        setSessions(
          data.map((i, index) => ({
            index,
            key: i.session_id,
            name: i.name,
            type: i.max_participants > 1 ? 'Group' : '1-on-1',
            duration: getDuration(i.start_time, i.end_time),
            days: i?.start_time ? toLongDateWithDay(i.start_time) : null,
            session_date: i?.session_date,
            time: i?.start_time && i.end_time ? `${toLocaleTime(i.start_time)} - ${toLocaleTime(i.end_time)}` : null,
            start_time: i?.start_time,
            end_time: i?.end_time,
            participants: i.num_participants,
            start_url: i.start_url,
            inventory_id: i?.inventory_id,
            session_id: i.session_id,
            max_participants: i.max_participants,
          }))
        );
      }
      setIsLoading(false);
    } catch (error) {
      message.error(error.response?.data?.message || 'Something went wrong.');
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (match?.params?.session_type) {
      setSessions([]);
      setIsLoading(true);
      if (match?.params?.session_type === 'past') {
        setIsPast(true);
      } else {
        setIsPast(false);
      }
      getStaffSession(match?.params?.session_type);
    }
  }, [match.params.session_type, getStaffSession]);

  const trackAndStartSession = (data) => {
    const eventTag = isMobileDevice
      ? creator.click.sessions.list.mobile.startSession
      : creator.click.sessions.list.startSession;

    trackSimpleEvent(eventTag, { session_data: data });
    window.open(data.start_url);
  };

  const openSessionInventoryDetails = (item) => {
    const eventTag = isMobileDevice
      ? creator.click.sessions.list.mobile.sessionDetails
      : isPast
      ? creator.click.sessions.list.pastSessionsDetails
      : creator.click.sessions.list.upcomingSessionsDetails;

    trackSimpleEvent(eventTag, { session_data: item });

    if (item.inventory_id) {
      history.push(`${Routes.creatorDashboard.rootPath}/sessions/e/${item.inventory_id}/details`);
    }
  };

  const deleteInventory = async (inventory_id) => {
    const eventTag = creator.click.sessions.list.cancelSession;

    try {
      const { status } = await apis.session.delete(JSON.stringify([inventory_id]));
      if (isAPISuccess(status)) {
        trackSuccessEvent(eventTag, { inventory_id: inventory_id });
        getStaffSession(match?.params?.session_type);
      }
    } catch (error) {
      trackFailedEvent(eventTag, error, { inventory_id: inventory_id });
      message.error(error.response?.data?.message || 'Something went wrong.');
    }
  };

  let sessionColumns = [
    {
      title: 'Session Name',
      key: 'name',
      width: '12%',
      render: (record) => {
        return {
          props: {
            style: {
              borderLeft: `6px solid ${record.color_code || '#fff'}`,
            },
          },
          children: <Text className={styles.textAlignLeft}>{record.name}</Text>,
        };
      },
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      width: '4%',
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
      width: isPast ? '4%' : '20%',
      render: (text, record) => {
        const isDisabled = record.participants > 0;
        return isPast ? (
          <Row justify="start">
            <Col>
              <Button type="link" className={styles.detailsButton} onClick={() => openSessionInventoryDetails(record)}>
                Details
              </Button>
            </Col>
          </Row>
        ) : (
          <Row justify="start">
            <Col md={24} lg={24} xl={8}>
              <Button type="link" className={styles.detailsButton} onClick={() => openSessionInventoryDetails(record)}>
                Details
              </Button>
            </Col>
            <Col md={24} lg={24} xl={8}>
              {isDisabled ? (
                <Button type="text" disabled={isDisabled}>
                  Cancel
                </Button>
              ) : (
                <Popconfirm
                  title="Do you want to cancel session?"
                  icon={<DeleteOutlined className={styles.danger} />}
                  okText="Yes"
                  cancelText="No"
                  onConfirm={() => deleteInventory(record.inventory_id)}
                >
                  <Button type="text" danger>
                    Cancel
                  </Button>
                </Popconfirm>
              )}
            </Col>

            <Col md={24} lg={24} xl={8}>
              {!isPast && (
                <Button type="link" disabled={!record.start_url} onClick={() => trackAndStartSession(record)}>
                  Start
                </Button>
              )}
            </Col>
          </Row>
        );
      },
    },
  ];

  const renderSessionItem = (item) => {
    const isCancelDisabled = item.participants > 0;

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
          <div
            style={{ borderTop: `4px solid ${item.color_code || '#FFF'}` }}
            onClick={() => openSessionInventoryDetails(item)}
          >
            <Text>{item.name}</Text>
          </div>
        }
        actions={[
          <Button className={styles.detailsButton} onClick={() => openSessionInventoryDetails(item)} type="link">
            Details
          </Button>,
          isCancelDisabled ? (
            <Button type="text" disabled={true}>
              Cancel
            </Button>
          ) : (
            <Popconfirm
              title="Do you want to cancel session?"
              icon={<DeleteOutlined className={styles.danger} />}
              okText="Yes"
              cancelText={'No'}
              onConfirm={() => deleteInventory(item.inventory_id)}
            >
              <Button type="text" danger>
                Cancel
              </Button>
            </Popconfirm>
          ),
          <>
            {!isPast && (
              <Button type="link" disabled={!item.start_url} onClick={() => trackAndStartSession(item)}>
                Start
              </Button>
            )}
          </>,
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

  const handleViewChange = (e) => {
    setView(e.target.value);
  };

  const onViewChange = (e) => {
    setCalendarView(e);
  };

  return (
    <div className={styles.box}>
      <Title level={4}>{isPast ? 'Past' : 'Upcoming'} Sessions</Title>
      <Radio.Group value={view} onChange={handleViewChange}>
        <Radio.Button value="calendar">Calendar View</Radio.Button>
        <Radio.Button value="list">List View</Radio.Button>
      </Radio.Group>
      {view === 'calendar' ? (
        <Loader loading={isLoading} size="large" text="Loading sessions">
          {sessions.length > 0 ? (
            <CalendarView
              inventories={sessions}
              onSelectInventory={openSessionInventoryDetails}
              onViewChange={onViewChange}
              calendarView={calendarView}
            />
          ) : (
            <Empty />
          )}
        </Loader>
      ) : (
        <>
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
        </>
      )}
    </div>
  );
};

export default SessionsInventories;
