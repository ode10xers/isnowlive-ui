import React, { useState, useEffect, useCallback } from 'react';
import { Row, Col, Typography, Button, Card, Popconfirm, Tooltip, Collapse } from 'antd';
import { DeleteOutlined, EditOutlined, CopyOutlined, EyeInvisibleOutlined } from '@ant-design/icons';
import { useHistory } from 'react-router-dom';

import Routes from 'routes';
import apis from 'apis';

import Table from 'components/Table';
import Loader from 'components/Loader';
import TagListPopup from 'components/TagListPopup';
import { showErrorModal, showSuccessModal } from 'components/Modals/modals';

import dateUtil from 'utils/date';
import { isMobileDevice } from 'utils/device';
import { getLocalUserDetails } from 'utils/storage';
import { generateUrlFromUsername, copyToClipboard, isAPISuccess } from 'utils/helper';

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
const { Panel } = Collapse;
const { creator } = mixPanelEventTags;

const ManageSessions = () => {
  const history = useHistory();
  const [isLoading, setIsLoading] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [creatorMemberTags, setCreatorMemberTags] = useState([]);

  const fetchCreatorMemberTags = useCallback(async () => {
    setIsLoading(true);
    try {
      const { status, data } = await apis.user.getCreatorUserPreferences();

      if (isAPISuccess(status) && data) {
        setCreatorMemberTags(data.tags);
      }
    } catch (error) {
      showErrorModal('Failed to fetch creator tags', error?.response?.data?.message || 'Something went wrong.');
    }
    setIsLoading(false);
  }, []);

  const getSessionsList = useCallback(async () => {
    setIsLoading(true);
    try {
      const { status, data } = await apis.session.getSession();

      if (isAPISuccess(status) && data) {
        setSessions(data);
      }
    } catch (error) {
      showErrorModal('Failed to fetch creator sessions', error?.response?.data?.message || 'Something went wrong.');
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
        showSuccessModal('Session published successfully!');
        getSessionsList();
      }
    } catch (error) {
      trackFailedEvent(eventTag, error, { session_id: sessionId });
      showErrorModal('Failed to publish session', error.response?.data?.message || 'Something went wrong.');
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
        showSuccessModal('Session is now unpublished!');
        getSessionsList();
      }
    } catch (error) {
      trackFailedEvent(eventTag, error, { session_id: sessionId });
      showErrorModal('Failed to unpublish session', error.response?.data?.message || 'Something went wrong.');
    }

    setIsLoading(false);
  };

  const deleteSession = async (sessionId) => {
    setIsLoading(true);
    const eventTag = creator.click.sessions.manage.deleteSession;

    try {
      await apis.session.deleteSession(sessionId);

      trackSuccessEvent(eventTag, { session_id: sessionId });
      showSuccessModal('Session deleted successfully!');
      getSessionsList();
    } catch (error) {
      trackFailedEvent(eventTag, error, { session_id: sessionId });
      showErrorModal('Failed to delete session', error.response?.data?.message || 'Something went wrong.');
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
    fetchCreatorMemberTags();
  }, [getSessionsList, fetchCreatorMemberTags]);

  const copySessionLink = (sessionId) => {
    const username = getLocalUserDetails().username;
    const pageLink = `${generateUrlFromUsername(username)}/s/${sessionId}`;

    copyToClipboard(pageLink);
  };

  const generateSessionColumns = useCallback(() => {
    const initialColumns = [
      {
        title: 'Session Name',
        key: 'name',
        render: (text, record) => {
          return {
            props: {
              style: {
                borderLeft: `6px solid ${record.color_code || '#fff'}`,
              },
            },
            children: (
              <>
                {' '}
                <Text className={styles.textAlignLeft}>{record.name}</Text>{' '}
                {record.is_active ? null : <EyeInvisibleOutlined />}{' '}
              </>
            ),
          };
        },
      },
      {
        title: 'Price',
        dataIndex: 'price',
        key: 'price',
        width: '100px',
        render: (text, record) => (record.price > 0 ? `${record.currency?.toUpperCase()} ${record.price}` : 'Free'),
      },
      {
        title: 'Type',
        dataIndex: 'type',
        key: 'type',
        width: '80px',
        render: (text, record) => <Text>{record.group ? 'Group' : '1-to-1'}</Text>,
      },
      {
        title: 'Session Date',
        dataIndex: 'session_date',
        key: 'session_date',
        width: '275px',
        render: (text, record) => (
          <>
            {record.recurring ? (
              <Text>
                {toLongDateWithDay(record.beginning)} - {toLongDateWithDay(record.expiry)}
              </Text>
            ) : (
              <Text>
                {record?.inventory && record.inventory[0] && toLongDateWithDay(record.inventory[0]?.start_time)}
              </Text>
            )}
          </>
        ),
      },
      {
        title: 'Actions',
        align: 'right',
        width: '200px',
        render: (text, record) => {
          return (
            <Row justify="end" gutter={8}>
              <Col xs={24} md={5}>
                <Tooltip title="Edit">
                  <Button
                    className={styles.detailsButton}
                    type="text"
                    onClick={() =>
                      trackAndNavigate(`${Routes.creatorDashboard.rootPath}/manage/session/${record.session_id}/edit`, {
                        beginning: record.beginning,
                        expiry: record.expiry,
                      })
                    }
                    icon={<EditOutlined />}
                  />
                </Tooltip>
              </Col>
              <Col xs={24} md={5}>
                <Tooltip title="Copy Session Link">
                  <Button
                    type="text"
                    className={styles.detailsButton}
                    onClick={() => copySessionLink(record.session_id)}
                    icon={<CopyOutlined />}
                  />
                </Tooltip>
              </Col>
              <Col xs={24} md={8}>
                <Tooltip title={`${record.is_active ? 'Hide' : 'Unhide'} Session`}>
                  {!record.is_active ? (
                    <Button
                      type="text"
                      className={styles.sucessButton}
                      onClick={() => publishSession(record.session_id)}
                    >
                      Show
                    </Button>
                  ) : (
                    <Button type="text" danger onClick={() => unpublishSession(record.session_id)}>
                      Hide
                    </Button>
                  )}
                </Tooltip>
              </Col>
              <Col xs={24} md={5}>
                <Tooltip title="Delete Session">
                  <Popconfirm
                    title="Do you want to delete session?"
                    icon={<DeleteOutlined className={styles.danger} />}
                    okText="Yes"
                    cancelText="No"
                    onConfirm={() => deleteSession(record.session_id)}
                  >
                    <Button danger type="text" icon={<DeleteOutlined />} />
                  </Popconfirm>
                </Tooltip>
              </Col>
            </Row>
          );
        },
      },
    ];

    if (creatorMemberTags.length > 0) {
      const tagColumnPosition = 1;
      const tagColumnObject = {
        title: 'Purchasable By',
        key: 'tags',
        dataIndex: 'tags',
        width: '130px',
        render: (text, record) => <TagListPopup tags={record.tags} />,
      };

      initialColumns.splice(tagColumnPosition, 0, tagColumnObject);
    }

    return initialColumns;
    //eslint-disable-next-line
  }, [creatorMemberTags]);

  const renderSessionItem = (item) => {
    const layout = (label, value) => (
      <Row>
        <Col span={9}>
          <Text>{label}</Text>
        </Col>
        <Col span={15}>: {value}</Col>
      </Row>
    );

    return (
      <Card
        key={item.session_id}
        className={styles.card}
        bodyStyle={{ padding: '24px 16px' }}
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
            <Text>{item.name}</Text> {item.is_active ? null : <EyeInvisibleOutlined />}
          </div>
        }
        actions={[
          <Button
            className={styles.detailsButton}
            type="text"
            onClick={() =>
              trackAndNavigate(`${Routes.creatorDashboard.rootPath}/manage/session/${item.session_id}/edit`, {
                beginning: item.beginning,
                expiry: item.expiry,
              })
            }
            icon={<EditOutlined />}
          />,
          <Button
            type="text"
            className={styles.detailsButton}
            onClick={() => copySessionLink(item.session_id)}
            icon={<CopyOutlined />}
          />,
          <>
            {!item.is_active ? (
              <Button type="text" className={styles.sucessButton} onClick={() => publishSession(item.session_id)}>
                Show
              </Button>
            ) : (
              <Button type="text" danger onClick={() => unpublishSession(item.session_id)}>
                Hide
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
            <Button danger type="text" icon={<DeleteOutlined />} />
          </Popconfirm>,
        ]}
      >
        {layout('Type', <Text>{item.group ? 'Group Session' : '1-to-1 Session'}</Text>)}
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
        {creatorMemberTags.length > 0 && <TagListPopup tags={item.tags} mobileView={true} />}
      </Card>
    );
  };

  return (
    <div className={styles.box}>
      <Title level={4}>Manage Sessions</Title>
      <Collapse defaultActiveKey="Normal">
        <Panel header={<Title level={5}> Normal Sessions </Title>} key="Normal">
          {isMobileDevice ? (
            <Loader loading={isLoading} size="large" text="Loading sessions">
              {sessions?.filter((session) => !session.is_course).length > 0 ? (
                sessions?.filter((session) => !session.is_course).map(renderSessionItem)
              ) : (
                <div className="text-empty"> No Normal Sessions Found </div>
              )}
            </Loader>
          ) : (
            <Table
              columns={generateSessionColumns()}
              data={sessions?.filter((session) => !session.is_course)}
              loading={isLoading}
            />
          )}
        </Panel>
        <Panel header={<Title level={5}> Course Sessions </Title>} key="Course">
          {isMobileDevice ? (
            <Loader loading={isLoading} size="large" text="Loading sessions">
              {sessions?.filter((session) => session.is_course).length > 0 ? (
                sessions?.filter((session) => session.is_course).map(renderSessionItem)
              ) : (
                <div className="text-empty"> No Course Sessions Found </div>
              )}
            </Loader>
          ) : (
            <Table
              columns={generateSessionColumns()}
              data={sessions?.filter((session) => session.is_course)}
              loading={isLoading}
            />
          )}
        </Panel>
      </Collapse>
    </div>
  );
};

export default ManageSessions;
