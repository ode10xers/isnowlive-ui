import React, { useState, useEffect, useCallback } from 'react';
import { Row, Col, Typography, Button, Card, Popconfirm, message } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import { useHistory } from 'react-router-dom';

import Routes from 'routes';
import apis from 'apis';
import dateUtil from 'utils/date';
import { isMobileDevice } from 'utils/device';
import Table from 'components/Table';
import Loader from 'components/Loader';

import {
  mixPanelEventTags,
  trackSimpleEvent,
  trackSuccessEvent,
  trackFailedEvent,
} from 'services/integrations/mixpanel';

import styles from './styles.module.scss';

const {
  formatDate: { toLongDateWithDay },
} = dateUtil;
const { Text, Title } = Typography;
const { creator } = mixPanelEventTags;

const ManageSessions = () => {
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

  const publishSession = async (sessionId) => {
    setIsLoading(true);
    const eventTag = creator.click.sessions.manage.publishSession;

    try {
      const { data } = await apis.session.publishSession(sessionId);

      if (data) {
        trackSuccessEvent(eventTag, { session_id: sessionId });
        message.success('Session published successfully!');
        getSessionsList();
      }
    } catch (error) {
      trackFailedEvent(eventTag, error, { session_id: sessionId });
      message.error(error.response?.data?.message || 'Something went wrong.');
    }

    setIsLoading(false);
  };

  const unpublishSession = async (sessionId) => {
    setIsLoading(true);
    const eventTag = creator.click.sessions.manage.unpublishSession;

    try {
      const { data } = await apis.session.unpublishSession(sessionId);

      if (data) {
        trackSuccessEvent(eventTag, { session_id: sessionId });
        message.success('Session is now unpublished!');
        getSessionsList();
      }
    } catch (error) {
      trackFailedEvent(eventTag, error, { session_id: sessionId });
      message.error(error.response?.data?.message || 'Something went wrong.');
    }

    setIsLoading(false);
  };

  const deleteSession = async (sessionId) => {
    setIsLoading(true);
    const eventTag = creator.click.sessions.manage.deleteSession;

    try {
      await apis.session.deleteSession(sessionId);

      trackSuccessEvent(eventTag, { session_id: sessionId });
      message.success('Session deleted successfully!');
      getSessionsList();
    } catch (error) {
      trackFailedEvent(eventTag, error, { session_id: sessionId });
      message.error(error.response?.data?.message || 'Something went wrong.');
    }

    setIsLoading(false);
  };

  const trackAndNavigate = (destination, data = null) => {
    trackSimpleEvent(creator.click.sessions.manage.editSession);
    if (data) {
      history.push(destination, { ...data });
    } else {
      history.push(destination);
    }
  };

  useEffect(() => {
    getSessionsList();
  }, [getSessionsList]);

  let sessionColumns = [
    {
      title: 'Session Name',
      key: 'name',
      width: '20%',
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
      title: 'Price',
      dataIndex: 'price',
      key: 'price',
      width: '10%',
      render: (text, record) => (
        <Text>
          {' '}
          {record.price} {record.currency}{' '}
        </Text>
      ),
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      width: '10%',
      render: (text, record) => <Text>{record.group ? 'Group' : '1-to-1'}</Text>,
    },
    {
      title: 'Session Date',
      dataIndex: 'session_date',
      key: 'session_date',
      width: '20%',
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
      title: 'Actions',
      width: '15%',
      render: (text, record) => {
        return (
          <Row justify="start">
            <Col md={24} lg={24} xl={6}>
              <Button
                className={styles.detailsButton}
                onClick={() =>
                  trackAndNavigate(`${Routes.creatorDashboard.rootPath}/manage/session/${record.session_id}/edit`, {
                    beginning: record.beginning,
                    expiry: record.expiry,
                  })
                }
                type="link"
              >
                Edit
              </Button>
            </Col>
            <Col md={24} lg={24} xl={14}>
              {!record.is_active ? (
                <Button type="text" className={styles.sucessButton} onClick={() => publishSession(record.session_id)}>
                  Publish
                </Button>
              ) : (
                <Button type="text" danger onClick={() => unpublishSession(record.session_id)}>
                  Unpublish
                </Button>
              )}
            </Col>
            <Col md={24} lg={24} xl={4}>
              <Popconfirm
                title="Do you want to delete session?"
                icon={<DeleteOutlined className={styles.danger} />}
                okText="Yes"
                cancelText="No"
                onConfirm={() => deleteSession(record.session_id)}
              >
                <Button danger type="text" icon={<DeleteOutlined />} />
              </Popconfirm>
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
          <div
            style={{ paddingTop: 12, borderTop: `6px solid ${item.color_code || '#FFF'}` }}
            onClick={() =>
              trackAndNavigate(`${Routes.creatorDashboard.rootPath}/manage/session/${item.session_id}/edit`, {
                beginning: item.beginning,
                expiry: item.expiry,
              })
            }
          >
            <Text>{item.name}</Text>
          </div>
        }
        actions={[
          <Button
            type="link"
            className={styles.detailsButton}
            onClick={() =>
              trackAndNavigate(`${Routes.creatorDashboard.rootPath}/manage/session/${item.session_id}/edit`, {
                beginning: item.beginning,
                expiry: item.expiry,
              })
            }
          >
            Edit
          </Button>,
          <>
            {!item.is_active ? (
              <Button type="text" className={styles.sucessButton} onClick={() => publishSession(item.session_id)}>
                Publish
              </Button>
            ) : (
              <Button type="text" danger onClick={() => unpublishSession(item.session_id)}>
                Unpublish
              </Button>
            )}
          </>,
          <Popconfirm
            title="Do you want to delete session?"
            icon={<DeleteOutlined className={styles.danger} />}
            okText="Yes"
            cancelText="No"
            onConfirm={() => deleteSession(item.session_id)}
          >
            <Button danger type="text">
              Delete
            </Button>
          </Popconfirm>,
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
    <div className={styles.box}>
      <Title level={4}>Manage Sessions</Title>
      {isMobileDevice ? (
        <Loader loading={isLoading} size="large" text="Loading sessions">
          {sessions.length > 0 ? sessions.map(renderSessionItem) : <div className="text-empty">No Sessions </div>}
        </Loader>
      ) : (
        <Table columns={sessionColumns} data={sessions} loading={isLoading} />
      )}
    </div>
  );
};

export default ManageSessions;
