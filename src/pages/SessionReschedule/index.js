import React, { useCallback, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Row, Col, Typography, Button, Image, Space, Popconfirm, Card, Modal, message } from 'antd';
import {
  GlobalOutlined,
  FacebookOutlined,
  InstagramOutlined,
  TwitterOutlined,
  LinkedinOutlined,
  UpCircleOutlined,
  DownCircleOutlined,
} from '@ant-design/icons';
import ReactHtmlParser from 'react-html-parser';

import apis from 'apis';
import Routes from 'routes';

import Table from 'components/Table';
import Loader from 'components/Loader';
import Share from 'components/Share';
import DefaultImage from 'components/Icons/DefaultImage';

import { isMobileDevice } from 'utils/device';
import dateUtil from 'utils/date';
import { getDuration, generateUrlFromUsername } from 'utils/helper';
import parseQueryString from 'utils/parseQueryString';

import styles from './styles.module.scss';

const { Title, Text } = Typography;

const {
  formatDate: { toLongDateWithDay, toLocaleTime, toLocaleDate, toLongDateWithLongDay, getTimeDiff },
  timezoneUtils: { getCurrentLongTimezone },
} = dateUtil;

const whiteColor = '#FFFFFF';
//TODO: Add MixPanel Tracking later
const SessionReschedule = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isSessionLoading, setIsSessionLoading] = useState(true);
  const [coverImage, setCoverImage] = useState(null);
  const [profileImage, setProfileImage] = useState(null);
  const [profile, setProfile] = useState({});
  const [availableSessions, setAvailableSessions] = useState([]);

  const location = useLocation();
  const { inventory_id = null, order_id = null, price = -1 } = parseQueryString(location.search);
  const username = window.location.hostname.split('.')[0];

  const openSessionInventoryDetails = (item) => {
    if (item.username && item.inventory_id) {
      window.open(`${generateUrlFromUsername(item.username)}/e/${item.inventory_id}`);
    }
  };

  const getProfileDetails = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await apis.user.getProfileByUsername(username);
      if (data) {
        setProfile(data);
        setCoverImage(data.cover_image_url);
        setProfileImage(data.profile_image_url);
        setIsLoading(false);
      }
    } catch (error) {
      message.error(error.message || 'Failed to load profile details');
      setIsLoading(false);
    }
  }, [username]);

  const getAvailableSessions = useCallback(async () => {
    setIsSessionLoading(true);
    try {
      const { data } = await apis.session.getRescheduleableSessionsByPrice(username, parseInt(price));
      if (data) {
        const unfilteredSessions = data.map((i, index) => ({
          index,
          key: i.inventory_id,
          name: i.name,
          type: i.group ? 'Group' : '1-on-1',
          duration: getDuration(i.start_time, i.end_time),
          days: i?.start_time ? toLongDateWithDay(i.start_time) : null,
          session_date: i?.session_date,
          time: i?.start_time && i.end_time ? `${toLocaleTime(i.start_time)} - ${toLocaleTime(i.end_time)}` : null,
          start_time: i?.start_time,
          end_time: i?.end_time,
          participants: i.total_bookings,
          inventory_id: i.inventory_id,
          session_id: i.session_id,
          max_participants: i.max_participants,
          currency: i.currency || 'SGD',
        }));

        const isNotCurrentInventory = (session) => parseInt(session.inventory_id) !== parseInt(inventory_id);
        const isNotFull = (session) => session.participants < session.max_participants;

        let filterByDateSessions = [];
        unfilteredSessions
          .filter(isNotCurrentInventory) // Filter out current session
          .filter(isNotFull)
          .forEach((session) => {
            const foundIndex = filterByDateSessions.findIndex(
              (val) => val.start_time === toLocaleDate(session.start_time)
            );

            if (foundIndex >= 0) {
              filterByDateSessions[foundIndex].children.push(session);
            } else {
              filterByDateSessions.push({
                start_time: toLocaleDate(session.start_time),
                name: session.start_time,
                is_date: true,
                children: [session],
              });
            }
          });

        filterByDateSessions.sort((a, b) => getTimeDiff(a.name, b.name, 'seconds'));
        setAvailableSessions(filterByDateSessions);
        setIsSessionLoading(false);
      }
    } catch (error) {
      setIsSessionLoading(false);
      message.error(error.message || 'Failed to load user session details');
    }
  }, [inventory_id, username, price]);

  const handleSessionReschedule = async (newInventory) => {
    setIsLoading(true);

    const payload = {
      inventory_id: newInventory.inventory_id,
    };

    try {
      const { data } = await apis.session.rescheduleSession(order_id, payload);

      if (data) {
        Modal.success({
          centered: true,
          closable: true,
          maskClosable: true,
          title: 'Session Successfully Rescheduled',
          onOk: () => {
            window.location.href = `${generateUrlFromUsername('app')}${Routes.attendeeDashboard.rootPath}`;
          },
        });
      }
    } catch (error) {
      message.error(error.message || 'Failed to reschedule session');
    }

    setIsLoading(false);
  };

  useEffect(() => {
    if (!inventory_id || !order_id || price < 0) {
      message.error('Invalid Search Params');
    } else {
      getProfileDetails();
      getAvailableSessions();
    }
  }, [getProfileDetails, getAvailableSessions, inventory_id, order_id, price]);

  const emptyTableCell = {
    props: {
      colSpan: 0,
      rowSpan: 0,
    },
  };

  const renderSimpleTableCell = (shouldNotRender, text) => (shouldNotRender ? emptyTableCell : <Text> {text} </Text>);

  let dateColumns = [
    {
      title: 'Session Name',
      dataIndex: 'name',
      key: 'name',
      width: '30%',
      render: (text, record) => {
        if (record.is_date) {
          return {
            props: {
              colSpan: 6,
            },
            children: (
              <Text strong className={styles.textAlignLeft}>
                {toLongDateWithLongDay(text)}
              </Text>
            ),
          };
        } else {
          return {
            props: {
              style: {
                borderLeft: `6px solid ${record.color_code || whiteColor}`,
              },
            },
            children: <Text className={styles.textAlignLeft}>{record.name}</Text>,
          };
        }
      },
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      width: '10%',
      render: (text, record) => renderSimpleTableCell(record.is_date, text),
    },
    {
      title: 'Duration',
      dataIndex: 'duration',
      key: 'duration',
      width: '10%',
      render: (text, record) => renderSimpleTableCell(record.is_date, text),
    },
    {
      title: 'Time',
      dataIndex: 'time',
      key: 'time',
      width: '25%',
      render: (text, record) =>
        renderSimpleTableCell(
          record.is_date,
          <>
            <Text className={styles.timeText}> {text} </Text>
            <Text type="secondary"> {getCurrentLongTimezone()} </Text>
          </>
        ),
    },
    {
      title: 'Actions',
      width: '13%',
      render: (text, record) => {
        if (record.is_date) {
          return emptyTableCell;
        }

        return (
          <Row justify="start">
            <Col md={24} lg={24} xl={8}>
              <Popconfirm
                title="Do you want to reschedule to this session?"
                okText="Yes"
                cancelText="No"
                onConfirm={() => handleSessionReschedule(record)}
              >
                <Button type="link" className={styles.detailsButton}>
                  Reschedule
                </Button>
              </Popconfirm>
            </Col>
          </Row>
        );
      },
    },
  ];

  let mobileTableColumns = [
    {
      title: '',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <Text strong className={styles.textAlignLeft}>
          {toLongDateWithLongDay(text)}
        </Text>
      ),
    },
  ];

  const renderSessionItem = (item) => {
    const layout = (label, value) => (
      <Row>
        <Col span={8}>
          <Text strong>{label}</Text>
        </Col>
        <Col span={16}>: {value}</Col>
      </Row>
    );

    return (
      <Card
        className={styles.card}
        onClick={() => openSessionInventoryDetails(item)}
        title={
          <div style={{ paddingTop: 12, borderTop: `6px solid ${item.color_code || whiteColor}` }}>
            <Text>{item.name}</Text>
          </div>
        }
        actions={[
          <Popconfirm
            title="Do you want to reschedule to this session?"
            okText="Yes"
            cancelText="No"
            onConfirm={() => handleSessionReschedule(item)}
          >
            <Button type="link">Reschedule</Button>
          </Popconfirm>,
        ]}
      >
        {layout('Type', <Text>{item.type}</Text>)}
        {layout('Duration', <Text>{item.duration}</Text>)}
        {layout('Time', <Text>{item.time}</Text>)}
      </Card>
    );
  };

  return (
    <Loader loading={isLoading} size="large" text="Loading available sessions">
      <div>
        <div className={styles.imageWrapper}>
          <div className={styles.coverImageWrapper}>
            <Image
              preview={false}
              width={coverImage ? '100%' : 200}
              className={styles.coverImage}
              src={coverImage ? coverImage : 'error'}
              fallback={DefaultImage()}
            />
          </div>
          <div className={styles.profileImage}>
            <Image
              preview={false}
              width={'100%'}
              src={profileImage ? profileImage : 'error'}
              fallback={DefaultImage()}
            />
            <div className={styles.userName}>
              <Title level={isMobileDevice ? 4 : 2}>
                {profile?.first_name} {profile?.last_name}
              </Title>
            </div>
            <div className={styles.shareButton}>
              <Share
                label="Share"
                shareUrl={generateUrlFromUsername(profile.username)}
                title={`${profile.first_name} ${profile.last_name}`}
              />
            </div>
          </div>
        </div>
        <Row justify="space-between" align="middle">
          <Col xs={24} md={{ span: 22, offset: 1 }}>
            <Text type="secondary">{ReactHtmlParser(profile?.profile?.bio)}</Text>
          </Col>
          <Col xs={24} md={{ span: 22, offset: 1 }}>
            {profile?.profile?.social_media_links && (
              <Space size={'middle'}>
                {profile.profile.social_media_links.website && (
                  <a href={profile.profile.social_media_links.website} target="_blank" rel="noopener noreferrer">
                    <GlobalOutlined className={styles.socialIcon} />
                  </a>
                )}
                {profile.profile.social_media_links.facebook_link && (
                  <a href={profile.profile.social_media_links.facebook_link} target="_blank" rel="noopener noreferrer">
                    <FacebookOutlined className={styles.socialIcon} />
                  </a>
                )}
                {profile.profile.social_media_links.twitter_link && (
                  <a href={profile.profile.social_media_links.twitter_link} target="_blank" rel="noopener noreferrer">
                    <TwitterOutlined className={styles.socialIcon} />
                  </a>
                )}
                {profile.profile.social_media_links.instagram_link && (
                  <a href={profile.profile.social_media_links.instagram_link} target="_blank" rel="noopener noreferrer">
                    <InstagramOutlined className={styles.socialIcon} />
                  </a>
                )}
                {profile.profile.social_media_links.linkedin_link && (
                  <a href={profile.profile.social_media_links.linkedin_link} target="_blank" rel="noopener noreferrer">
                    <LinkedinOutlined className={styles.socialIcon} />
                  </a>
                )}
              </Space>
            )}
          </Col>
        </Row>
      </div>

      <Row className={styles.mt50}>
        <Col span={24} className={styles.mb20}>
          <Title level={isMobileDevice ? 4 : 2}>Available Sessions</Title>
          <Text type="primary" strong>
            All event times shown below are in your local time zone ({getCurrentLongTimezone()})
          </Text>
        </Col>
        <Col span={24}>
          {isMobileDevice ? (
            <Loader loading={isSessionLoading} size="large" text="Loading sessions">
              {availableSessions.length > 0 ? (
                <Table
                  columns={mobileTableColumns}
                  data={availableSessions.map((session) => ({
                    session_id: session.session_id,
                    start_time: session.start_time,
                    name: session.name,
                    is_date: session.is_date,
                    sessions: session.children,
                  }))}
                  loading={isLoading}
                  rowKey={(record) =>
                    record.is_date ? record.start_time : `${record.session_id}_${record.start_time}`
                  }
                  expandable={{
                    expandedRowRender: (record) => record.children.map(renderSessionItem),
                    expandRowByClick: true,
                    expandIcon: ({ expanded, onExpand, record }) =>
                      expanded ? (
                        <UpCircleOutlined style={{ fontSize: 20 }} onClick={(e) => onExpand(record, e)} />
                      ) : (
                        <DownCircleOutlined style={{ fontSize: 20 }} onClick={(e) => onExpand(record, e)} />
                      ),
                  }}
                />
              ) : (
                <div className="text-empty"> No Available Session to Reschedule </div>
              )}
            </Loader>
          ) : (
            <Table
              sticky={true}
              columns={dateColumns}
              data={availableSessions}
              loading={isLoading}
              rowKey={(record) => record.start_time}
            />
          )}
        </Col>
      </Row>
    </Loader>
  );
};

export default SessionReschedule;
