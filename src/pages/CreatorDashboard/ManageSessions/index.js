import React, { useState, useEffect, useCallback } from 'react';
import { Row, Col, Typography, Button, Card, Popconfirm, Tooltip, message, Collapse } from 'antd';
import { DeleteOutlined, EditOutlined, CopyOutlined, EyeInvisibleOutlined } from '@ant-design/icons';
import { useHistory } from 'react-router-dom';

import Routes from 'routes';
import apis from 'apis';
import dateUtil from 'utils/date';
import { isMobileDevice } from 'utils/device';
import { getLocalUserDetails } from 'utils/storage';
import Table from 'components/Table';
import Loader from 'components/Loader';

import {
  mixPanelEventTags,
  trackSimpleEvent,
  trackSuccessEvent,
  trackFailedEvent,
} from 'services/integrations/mixpanel';
import { generateUrlFromUsername, copyPageLinkToClipboard } from 'utils/helper';

import styles from './styles.module.scss';
import { useTranslation } from 'react-i18next';

const {
  formatDate: { toLongDateWithDay },
} = dateUtil;
const { Text, Title } = Typography;
const { Panel } = Collapse;
const { creator } = mixPanelEventTags;

const ManageSessions = () => {
  const { t: translate } = useTranslation();
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
        message.success(translate('SESSION_PUBLISHED_SUCCESS'));
        getSessionsList();
      }
    } catch (error) {
      trackFailedEvent(eventTag, error, { session_id: sessionId });
      message.error(error.response?.data?.message || translate('SOMETHING_WENT_WRONG'));
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
        message.success(translate('SESSION_UNPUBLISHED_SUCCESS'));
        getSessionsList();
      }
    } catch (error) {
      trackFailedEvent(eventTag, error, { session_id: sessionId });
      message.error(error.response?.data?.message || translate('SOMETHING_WENT_WRONG'));
    }

    setIsLoading(false);
  };

  const deleteSession = async (sessionId) => {
    setIsLoading(true);
    const eventTag = creator.click.sessions.manage.deleteSession;

    try {
      await apis.session.deleteSession(sessionId);

      trackSuccessEvent(eventTag, { session_id: sessionId });
      message.success(translate('SESSION_DELETE_SUCCESS'));
      getSessionsList();
    } catch (error) {
      trackFailedEvent(eventTag, error, { session_id: sessionId });
      message.error(error.response?.data?.message || translate('SOMETHING_WENT_WRONG'));
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

  const copySessionLink = (sessionId) => {
    const username = getLocalUserDetails().username;
    const pageLink = `${generateUrlFromUsername(username)}/s/${sessionId}`;

    copyPageLinkToClipboard(pageLink);
  };

  let sessionColumns = [
    {
      title: translate('SESSION_NAME'),
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
      title: translate('PRICE'),
      dataIndex: 'price',
      key: 'price',
      width: '85px',
      render: (text, record) => `${record.currency?.toUpperCase()} ${record.price}`,
    },
    {
      title: translate('TYPE'),
      dataIndex: 'type',
      key: 'type',
      width: '80px',
      render: (text, record) => <Text>{record.group ? translate('GROUP') : translate('1_TO_1')}</Text>,
    },
    {
      title: translate('SESSION_DATE'),
      dataIndex: 'session_date',
      key: 'session_date',
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
      title: translate('ACTIONS'),
      align: 'right',
      width: '200px',
      render: (text, record) => {
        return (
          <Row justify="end" gutter={8}>
            <Col xs={24} md={5}>
              <Tooltip title={translate('EDIT')}>
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
              <Tooltip title={translate('COPY_SESSION_LINK')}>
                <Button
                  type="text"
                  className={styles.detailsButton}
                  onClick={() => copySessionLink(record.session_id)}
                  icon={<CopyOutlined />}
                />
              </Tooltip>
            </Col>
            <Col xs={24} md={8}>
              <Tooltip title={`${record.is_active ? translate('HIDE') : translate('SHOW')} ${translate('SESSION')}`}>
                {!record.is_active ? (
                  <Button type="text" className={styles.sucessButton} onClick={() => publishSession(record.session_id)}>
                    {translate('SHOW')}
                  </Button>
                ) : (
                  <Button type="text" danger onClick={() => unpublishSession(record.session_id)}>
                    {translate('HIDE')}
                  </Button>
                )}
              </Tooltip>
            </Col>
            <Col xs={24} md={5}>
              <Tooltip title={translate('DELETE_SESSION')}>
                <Popconfirm
                  title={translate('DELETE_SESSION_QUESTION')}
                  icon={<DeleteOutlined className={styles.danger} />}
                  okText={translate('YES')}
                  cancelText={translate('NO')}
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
        key={item.session_id}
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
                {translate('SHOW')}
              </Button>
            ) : (
              <Button type="text" danger onClick={() => unpublishSession(item.session_id)}>
                {translate('HIDE')}
              </Button>
            )}
          </>,
          <Popconfirm
            title={translate('DELETE_SESSION_QUESTION')}
            icon={<DeleteOutlined className={styles.danger} />}
            okText={translate('YES')}
            cancelText={translate('NO')}
            onConfirm={() => deleteSession(item.session_id)}
          >
            <Button danger type="text" icon={<DeleteOutlined />} />
          </Popconfirm>,
        ]}
      >
        {layout(
          translate('TYPE'),
          <Text>{item.group ? translate('GROUP_SESSION') : translate('1_TO_1_SESSION')}</Text>
        )}
        {layout(
          translate('DATE'),
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
          translate('ATTENDEE'),
          <Text>
            {item.total_bookings || 0} {'/'} {item.max_participants}
          </Text>
        )}
      </Card>
    );
  };

  return (
    <div className={styles.box}>
      <Title level={4}>{translate('MANAGE_SESSIONS')}</Title>
      <Collapse>
        <Panel header={<Title level={5}> {translate('NORMAL_SESSIONS')} </Title>} key="Normal">
          {isMobileDevice ? (
            <Loader loading={isLoading} size="large" text={translate('LOADING_SESSIONS')}>
              {sessions?.filter((session) => !session.is_course).length > 0 ? (
                sessions?.filter((session) => !session.is_course).map(renderSessionItem)
              ) : (
                <div className="text-empty"> {translate('NO_NORMAL_SESSIONS_FOUND')} </div>
              )}
            </Loader>
          ) : (
            <Table
              columns={sessionColumns}
              data={sessions?.filter((session) => !session.is_course)}
              loading={isLoading}
            />
          )}
        </Panel>
        <Panel header={<Title level={5}> {translate('COURSE_SESSIONS')} </Title>} key="Course">
          {isMobileDevice ? (
            <Loader loading={isLoading} size="large" text={translate('LOADING_SESSIONS')}>
              {sessions?.filter((session) => session.is_course).length > 0 ? (
                sessions?.filter((session) => session.is_course).map(renderSessionItem)
              ) : (
                <div className="text-empty"> {translate('NO_COURSE_SESSIONS_FOUND')} </div>
              )}
            </Loader>
          ) : (
            <Table
              columns={sessionColumns}
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
