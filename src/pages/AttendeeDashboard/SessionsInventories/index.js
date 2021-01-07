import React, { useState, useEffect, useCallback } from 'react';
import { Row, Col, Typography, Button, Card, Popconfirm, message, Popover, Radio, Empty } from 'antd';

import apis from 'apis';
import dateUtil from 'utils/date';
import { isMobileDevice } from 'utils/device';
import Table from 'components/Table';
import Loader from 'components/Loader';
import CalendarView from 'components/CalendarView';
import { getDuration, generateUrlFromUsername, generateQueryString } from 'utils/helper';
import {
  mixPanelEventTags,
  trackSimpleEvent,
  trackSuccessEvent,
  trackFailedEvent,
} from 'services/integrations/mixpanel';

import styles from './styles.module.scss';

const {
  formatDate: { toLocaleTime, toLongDateWithDay },
  timeCalculation: { isBeforeLimitHours },
} = dateUtil;
const { Text, Title } = Typography;
const { attendee } = mixPanelEventTags;

const SessionsInventories = ({ match }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [sessions, setSessions] = useState([]);
  const [isPast, setIsPast] = useState(false);
  const [view, setView] = useState('list');
  const [calendarView, setCalendarView] = useState(isMobileDevice ? 'day' : 'month');

  const getStaffSession = useCallback(async (sessionType) => {
    try {
      const { data } =
        sessionType === 'past'
          ? await apis.session.getAttendeePastSession()
          : await apis.session.getAttendeeUpcomingSession();
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
            join_url: i.join_url,
            inventory_id: i?.inventory_id,
            session_id: i.session_id,
            order_id: i.order_id,
            max_participants: i.max_participants,
            username: i.creator_username,
            price: i.price,
            currency: i.currency || 'SGD',
            refund_amount: i.refund_amount || 0,
            is_refundable: i.is_refundable || false,
            refund_before_hours: i.refund_before_hours || 24,
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

      let monitorRefundPolling = null;

      if (match?.params?.session_type === 'past') {
        setIsPast(true);
      } else {
        setIsPast(false);

        //Set polling to dynamically adjust Refund/Cancel Popup
        monitorRefundPolling = setInterval(() => {
          getStaffSession(match?.params?.session_type);
        }, 5000);
      }
      getStaffSession(match?.params?.session_type);

      if (monitorRefundPolling) {
        return () => {
          clearInterval(monitorRefundPolling);
        };
      }
    }
  }, [match.params.session_type, getStaffSession]);

  const trackAndJoinSession = (data) => {
    const eventTag = isMobileDevice ? attendee.click.sessions.mobile.joinSession : attendee.click.sessions.joinSession;

    trackSimpleEvent(eventTag, { session_data: data });
    window.open(data.join_url);
  };

  const openSessionInventoryDetails = (item) => {
    const eventTag = isMobileDevice
      ? attendee.click.sessions.mobile.sessionDetails
      : isPast
      ? attendee.click.sessions.pastSessionDetails
      : attendee.click.sessions.upcomingSessionDetails;

    trackSimpleEvent(eventTag, {
      creator: item.username,
      session_data: item,
    });

    if (item.username && item.inventory_id) {
      window.open(`${generateUrlFromUsername(item.username)}/e/${item.inventory_id}`);
    }
  };

  const cancelOrderForSession = async (orderId) => {
    try {
      await apis.session.cancelCustomerOrder(orderId, { reason: 'requested_by_customer' });
      trackSuccessEvent(attendee.click.sessions.cancelOrder, { order_id: orderId });
      message.success('Refund Successful');
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      trackFailedEvent(attendee.click.sessions.cancelOrder, error, { order_id: orderId });
      message.error(error.response?.data?.message || 'Something went wrong.');
    }
  };

  const renderRefundPopup = (data) => {
    if (data.is_refundable) {
      if (isBeforeLimitHours(data.start_time, data.refund_before_hours)) {
        return (
          <Popconfirm
            arrowPointAtCenter
            placement="topRight"
            title={
              <Text>
                Do you want to refund this session? <br />
                You will get <strong>{` ${data.currency} ${data.refund_amount} `}</strong>
                back.
              </Text>
            }
            onConfirm={() => cancelOrderForSession(data.order_id)}
            okText="Yes, Refund Session"
            cancelText="No"
          >
            <Button type="link"> Cancel </Button>
          </Popconfirm>
        );
      } else {
        return (
          <Popover
            arrowPointAtCenter
            placement="topRight"
            trigger="click"
            title="Refund Time Limit Reached"
            content={
              <Text>
                Sorry, as per the cancellation policy of <br />
                this session,
                <strong>
                  {' '}
                  it can only be cancelled <br />
                  {data.refund_before_hours} hours{' '}
                </strong>
                before the session starts.
              </Text>
            }
          >
            <Button type="link"> Cancel </Button>
          </Popover>
        );
      }
    } else {
      return (
        <Popover
          arrowPointAtCenter
          placement="topRight"
          trigger="click"
          title="Session Cannot be Refunded"
          content={
            <Text>
              Sorry, this session is not refundable based <br />
              on the creator's settings
            </Text>
          }
        >
          <Button type="link"> Cancel </Button>
        </Popover>
      );
    }
  };

  const rescheduleSession = (data) => {
    const passedData = {
      inventory_id: data.inventory_id,
      order_id: data.order_id,
      price: data.price,
    };

    console.log(data);
    console.log(passedData);

    window.open(`${generateUrlFromUsername(data.username)}/reschedule?${generateQueryString(passedData)}`);
  };

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
      title: 'Actions',
      width: isPast ? '4%' : '20%',
      render: (text, record) => {
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
            <Col md={24} lg={24} xl={5}>
              <Button type="link" className={styles.detailsButton} onClick={() => openSessionInventoryDetails(record)}>
                Details
              </Button>
            </Col>

            {!isPast && (
              <>
                <Col md={24} lg={24} xl={5}>
                  <Button type="link" disabled={!record.join_url} onClick={() => trackAndJoinSession(record)}>
                    Join
                  </Button>
                </Col>
                <Col md={24} lg={24} xl={5}>
                  {renderRefundPopup(record)}
                </Col>
                <Col md={24} lg={24} xl={5}>
                  <Button type="link" onClick={() => rescheduleSession(record)}>
                    Reschedule
                  </Button>
                </Col>
              </>
            )}
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
        title={
          <div onClick={() => openSessionInventoryDetails(item)}>
            <Text>{item.name}</Text>
          </div>
        }
        actions={[
          <>
            {!isPast && (
              <Button type="link" disabled={!item.join_url} onClick={() => trackAndJoinSession(item)}>
                Join
              </Button>
            )}
          </>,
          <>{!isPast && renderRefundPopup(item)}</>,
          <Button type="link" onClick={() => rescheduleSession(item)}>
            Reschedule
          </Button>,
        ]}
      >
        {layout('Type', <Text>{item.type}</Text>)}
        {layout('Duration', <Text>{item.duration}</Text>)}
        {layout('Day', <Text>{item.days}</Text>)}
        {layout('Time', <Text>{item.time}</Text>)}
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
        <Radio.Button value="list">List</Radio.Button>
        <Radio.Button value="calendar">Calendar</Radio.Button>
      </Radio.Group>
      {view === 'calendar' ? (
        <Loader loading={isLoading} size="large" text="Loading sessions">
          {' '}
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
            <>
              <Text className={`${styles.helperText} ${styles.mt10} ${styles.mb10}`}>
                {' '}
                Click on the card to show session details{' '}
              </Text>
              <Loader loading={isLoading} size="large" text="Loading sessions">
                {sessions.length > 0 ? (
                  sessions.map(renderSessionItem)
                ) : (
                  <div className="text-empty">No {isPast ? 'Past' : 'Upcoming'} Session</div>
                )}
              </Loader>
            </>
          ) : (
            <Table columns={sessionColumns} data={sessions} loading={isLoading} />
          )}
        </>
      )}
    </div>
  );
};

export default SessionsInventories;
