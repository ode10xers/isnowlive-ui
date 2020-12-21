import React, { useState, useEffect, useCallback } from 'react';
import { Row, Col, Typography, Button, Card, message } from 'antd';
import { useHistory } from 'react-router-dom';

import Routes from 'routes';
import apis from 'apis';
import dateUtil from 'utils/date';
import { isMobileDevice } from 'utils/device';
import Table from 'components/Table';
import Loader from 'components/Loader';

import { trackEventInMixPanel, mixPanelEventTags } from 'services/integrations/mixpanel';

import styles from './styles.module.scss';

const {
  formatDate: { toLongDateWithDay },
} = dateUtil;
const { Text, Title } = Typography;

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

    try {
      const { data } = await apis.session.publishSession(sessionId);

      if (data) {
        message.success('Session published successfully!');
        getSessionsList();
      }
    } catch (error) {
      message.error(error.response?.data?.message || 'Something went wrong.');
    }

    setIsLoading(false);
  };

  const unpublishSession = async (sessionId) => {
    setIsLoading(true);

    try {
      const { data } = await apis.session.unpublishSession(sessionId);

      if (data) {
        message.success('Session is now unpublished!');
        getSessionsList();
      }
    } catch (error) {
      message.error(error.response?.data?.message || 'Something went wrong.');
    }

    setIsLoading(false);
  };

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
      render: (text, record) => <Text>{record.group ? 'Group' : '1-to-1'}</Text>,
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
                onClick={() => {
                  trackEventInMixPanel(mixPanelEventTags.creator.click.sessions.manage.edit, {
                    session_id: record.session_id,
                  });
                  history.push(`${Routes.creatorDashboard.rootPath}/manage/session/${record.session_id}/edit`);
                }}
                type="link"
              >
                Edit
              </Button>
            </Col>
            <Col md={24} lg={24} xl={8}>
              {!record.is_active ? (
                <Button
                  type="text"
                  className={styles.sucessButton}
                  onClick={() => {
                    trackEventInMixPanel(mixPanelEventTags.creator.click.sessions.manage.publish, {
                      session_id: record.session_id,
                    });
                    publishSession(record.session_id);
                  }}
                >
                  Publish
                </Button>
              ) : (
                <Button
                  type="text"
                  danger
                  onClick={() => {
                    trackEventInMixPanel(mixPanelEventTags.creator.click.sessions.manage.unpublish, {
                      session_id: record.session_id,
                    });
                    unpublishSession(record.session_id);
                  }}
                >
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
          <div
            onClick={() => history.push(`${Routes.creatorDashboard.rootPath}/manage/session/${item.session_id}/edit`)}
          >
            <Text>{item.name}</Text>
          </div>
        }
        actions={[
          <Button
            type="link"
            className={styles.detailsButton}
            onClick={() => {
              trackEventInMixPanel(mixPanelEventTags.creator.click.sessions.manage.edit, {
                session_id: item.session_id,
              });
              history.push(`${Routes.creatorDashboard.rootPath}/manage/session/${item.session_id}/edit`);
            }}
          >
            Edit
          </Button>,
          <>
            {!item.is_active ? (
              <Button
                type="text"
                className={styles.sucessButton}
                onClick={() => {
                  trackEventInMixPanel(mixPanelEventTags.creator.click.sessions.manage.publish, {
                    session_id: item.session_id,
                  });
                  publishSession(item.session_id);
                }}
              >
                Publish
              </Button>
            ) : (
              <Button
                type="text"
                danger
                onClick={() => {
                  trackEventInMixPanel(mixPanelEventTags.creator.click.sessions.manage.unpublish, {
                    session_id: item.session_id,
                  });
                  unpublishSession(item.session_id);
                }}
              >
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
