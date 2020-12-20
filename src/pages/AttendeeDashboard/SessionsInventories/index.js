import React, { useState, useEffect, useCallback } from 'react';
import { Row, Col, Typography, Button, Card, Popconfirm, message, Popover } from 'antd';
import { useHistory } from 'react-router-dom';

import apis from 'apis';
import dateUtil from 'utils/date';
import { isMobileDevice } from 'utils/device';
import Table from 'components/Table';
import Loader from 'components/Loader';
import { getDuration, generateUrlFromUsername } from 'utils/helper';

import styles from './styles.module.scss';

const {
  formatDate: { toLocaleTime, toLongDateWithDay },
  timeCalculation: { isBeforeLimitHours },
} = dateUtil;
const { Text, Title } = Typography;

const SessionsInventories = ({ match }) => {
  const history = useHistory();
  const [isLoading, setIsLoading] = useState(true);
  const [sessions, setSessions] = useState([]);
  const [isPast, setIsPast] = useState(false);

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
            currency: i.currency || 'SGD',
            refund_amount: i.refund_amount || 0,
            is_refundable: i.is_refundable || false,
            refund_before_hours: i.refund_before_hours || 24,
            username: i.username,
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

  const openSessionInventoryDetails = (item) => {
    if (item.username && item.inventory_id) {
      history.push(`${generateUrlFromUsername(item.username)}/e/${item.inventory_id}`);
    }
  };

  const cancelOrderForSession = async (orderId) => {
    try {
      await apis.session.cancel(orderId, { reason: 'requested_by_customer' });
      message.success('Refund Successful');
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
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
                You will get
                <b>
                  {data.currency} {data.refund_amount}
                </b>
                back.
              </Text>
            }
            onConfirm={() => cancelOrderForSession(data.order_id)}
            okText="Cancel"
            cancelText="Don't Cancel"
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
                <b>
                  it can only be cancelled <br />
                  {data.refund_before_hours} hours
                </b>
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
              <Button className={styles.detailsButton} onClick={() => openSessionInventoryDetails(record)} type="link">
                Details
              </Button>
            </Col>
          </Row>
        ) : (
          <Row justify="start">
            <Col md={24} lg={24} xl={8}>
              <Button className={styles.detailsButton} onClick={() => openSessionInventoryDetails(record)} type="link">
                Details
              </Button>
            </Col>

            {!isPast && (
              <>
                <Col md={24} lg={24} xl={8}>
                  <Button type="link" disabled={!record.join_url} onClick={() => window.open(record.join_url)}>
                    Join
                  </Button>
                </Col>
                <Col md={24} lg={24} xl={8}>
                  {renderRefundPopup(record)}
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
          <Button className={styles.detailsButton} onClick={() => openSessionInventoryDetails(item)} type="link">
            Details
          </Button>,
          <>
            {!isPast && (
              <Button type="link" disabled={!item.join_url} onClick={() => window.open(item.join_url)}>
                Join
              </Button>
            )}
          </>,
          <>{!isPast && renderRefundPopup(item)}</>,
        ]}
      >
        {layout('Type', <Text>{item.type}</Text>)}
        {layout('Duration', <Text>{item.duration}</Text>)}
        {layout('Day', <Text>{item.days}</Text>)}
        {layout('Time', <Text>{item.time}</Text>)}
      </Card>
    );
  };

  return (
    <div className={styles.box}>
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
    </div>
  );
};

export default SessionsInventories;
