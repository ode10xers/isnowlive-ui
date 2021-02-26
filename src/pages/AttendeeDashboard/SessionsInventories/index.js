import React, { useState, useEffect, useCallback } from 'react';
import { Row, Col, Typography, Button, Card, Popconfirm, message, Modal, Popover, Radio, Empty } from 'antd';
import { BookTwoTone } from '@ant-design/icons';

import apis from 'apis';

import Table from 'components/Table';
import Loader from 'components/Loader';
import CalendarView from 'components/CalendarView';
import AddToCalendarButton from 'components/AddToCalendarButton';

import dateUtil from 'utils/date';
import { isMobileDevice } from 'utils/device';
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
            key: i?.session_id,
            name: i?.name,
            type: i?.max_participants > 1 ? 'Group' : '1-on-1',
            duration: getDuration(i?.start_time, i?.end_time),
            days: i?.start_time ? toLongDateWithDay(i?.start_time) : null,
            session_date: i?.session_date,
            time: i?.start_time && i?.end_time ? `${toLocaleTime(i?.start_time)} - ${toLocaleTime(i?.end_time)}` : null,
            start_time: i?.start_time,
            end_time: i?.end_time,
            participants: i?.num_participants,
            join_url: i?.join_url,
            inventory_id: i?.inventory_id,
            session_id: i?.session_id,
            order_id: i?.order_id,
            max_participants: i?.max_participants,
            username: i?.creator_username,
            price: i?.price,
            currency: i?.currency.toUpperCase() || 'SGD',
            refund_amount: i?.refund_amount || 0,
            is_refundable: i?.is_refundable || false,
            refund_before_hours: i?.refund_before_hours || 24,
            is_course: i?.is_course,
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
      Modal.success({
        closable: true,
        maskClosable: true,
        title: 'Refund Successful',
      });
      getStaffSession(match?.params?.session_type);
    } catch (error) {
      trackFailedEvent(attendee.click.sessions.cancelOrder, error, { order_id: orderId });
      Modal.error({
        closable: true,
        maskClosable: true,
        title: 'An Error Occured',
        content: error.response?.data?.message || 'Something went wrong.',
      });
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
                You will get <strong>{` ${data.currency.toUpperCase()} ${data.refund_amount} `}</strong>
                back.
              </Text>
            }
            onConfirm={() => cancelOrderForSession(data.order_id)}
            okText="Yes, Refund Session"
            cancelText="No"
          >
            <Button type="text" danger>
              Cancel
            </Button>
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
                  it can only be cancelled <br />
                  {data.refund_before_hours} hours
                </strong>
                before the session starts.
              </Text>
            }
          >
            <Button type="text" danger>
              Cancel
            </Button>
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
          <Button type="text" danger>
            Cancel
          </Button>
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

    window.open(`${generateUrlFromUsername(data.username)}/reschedule?${generateQueryString(passedData)}`);
  };

  let sessionColumns = [
    {
      title: 'Session Name',
      key: 'name',
      render: (record) => (
        <>
          <Text className={styles.textAlignLeft}>{record.name}</Text>
          {record.is_course ? <BookTwoTone twoToneColor="#1890ff" /> : null}
        </>
      ),
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      width: '72px',
    },
    {
      title: 'Day',
      key: 'days',
      dataIndex: 'days',
      width: '150px',
    },
    {
      title: 'Duration',
      dataIndex: 'duration',
      key: 'duration',
      width: '90px',
    },
    {
      title: 'Time',
      dataIndex: 'time',
      key: 'time',
      width: '160px',
    },
    {
      title: 'Actions',
      width: isPast ? '56px' : '320px',
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
          <Row justify="space-around">
            {!isPast && (
              <Col md={24} xl={2}>
                <AddToCalendarButton
                  iconOnly={true}
                  eventData={{
                    ...record,
                    page_url: `${generateUrlFromUsername(record?.username)}/e/${record.inventory_id}`,
                  }}
                />
              </Col>
            )}

            {!isPast && (
              <>
                <Col md={24} lg={24} xl={4}>
                  <Button
                    type="text"
                    className={styles.success}
                    disabled={!record.join_url}
                    onClick={() => trackAndJoinSession(record)}
                  >
                    Join
                  </Button>
                </Col>
                <Col md={24} lg={24} xl={4}>
                  {renderRefundPopup(record)}
                </Col>
              </>
            )}
            <Col md={24} lg={24} xl={5}>
              <Button type="link" onClick={() => openSessionInventoryDetails(record)}>
                Details
              </Button>
            </Col>

            {!isPast && (
              <Col md={24} lg={24} xl={6}>
                <Button type="text" className={styles.warning} onClick={() => rescheduleSession(record)}>
                  Reschedule
                </Button>
              </Col>
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
        key={item.inventory_id}
        title={
          <div onClick={() => openSessionInventoryDetails(item)}>
            <Text>{item.name}</Text>
            {'  '}
            {item.is_course ? <BookTwoTone twoToneColor="#1890ff" /> : null}
          </div>
        }
        actions={
          isPast
            ? [
                <Button type="link" className={styles.detailsButton} onClick={() => openSessionInventoryDetails(item)}>
                  Details
                </Button>,
              ]
            : [
                <AddToCalendarButton
                  iconOnly={true}
                  eventData={{
                    ...item,
                    page_url: `${generateUrlFromUsername(item?.username)}/e/${item.inventory_id}`,
                  }}
                />,
                <Button
                  type="text"
                  disabled={!item.join_url}
                  onClick={() => trackAndJoinSession(item)}
                  className={styles.success}
                >
                  Join
                </Button>,
                renderRefundPopup(item),
                <Button className={styles.warning} type="text" onClick={() => rescheduleSession(item)}>
                  Reschedule
                </Button>,
              ]
        }
      >
        <div onClick={() => openSessionInventoryDetails(item)}>
          {layout('Type', <Text>{item.type}</Text>)}
          {layout('Duration', <Text>{item.duration}</Text>)}
          {layout('Day', <Text>{item.days}</Text>)}
          {layout('Time', <Text>{item.time}</Text>)}
        </div>
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
                Click on the card to show session details
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
            <Table
              columns={sessionColumns}
              data={sessions}
              loading={isLoading}
              rowKey={(record) => record.inventory_id}
            />
          )}
        </>
      )}
    </div>
  );
};

export default SessionsInventories;
