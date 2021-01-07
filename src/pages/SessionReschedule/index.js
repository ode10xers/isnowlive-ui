import React, { useCallback, useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Row, Col, Typography, Button, Image, Space, Popconfirm, Card, message } from 'antd';
import {
  GlobalOutlined,
  FacebookOutlined,
  InstagramOutlined,
  TwitterOutlined,
  LinkedinOutlined,
  UpCircleOutlined,
  DownCircleOutlined,
} from '@ant-design/icons';
import moment from 'moment';
import ReactHtmlParser from 'react-html-parser';

import apis from 'apis';

import Table from 'components/Table';
import Loader from 'components/Loader';
import Share from 'components/Share';
import DefaultImage from 'components/Icons/DefaultImage/index';

import { isMobileDevice } from 'utils/device';
import dateUtil from 'utils/date';
import { getDuration, generateUrlFromUsername } from 'utils/helper';
import { getLocalUserDetails } from 'utils/storage';

import styles from './styles.module.scss';

const { Title, Text } = Typography;

const {
  formatDate: { toLongDateWithDay, toLocaleTime, toLocaleDate, toLongDateWithLongDay },
  timezoneUtils: { getCurrentLongTimezone },
} = dateUtil;

const SessionReschedule = ({ username = null }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isSessionLoading, setIsSessionLoading] = useState(true);
  const [coverImage, setCoverImage] = useState(null);
  const [profileImage, setProfileImage] = useState(null);
  const [profile, setProfile] = useState({});
  const [availableSessions, setAvailableSessions] = useState([]);

  const { inventory_id } = useParams();

  const getProfileDetails = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = username ? await apis.user.getProfileByUsername(username) : await apis.user.getProfile();
      if (data) {
        setProfile(data);
        setCoverImage(data.cover_image_url);
        setProfileImage(data.profile_image_url);
        setIsLoading(false);
      }
    } catch (error) {
      message.error('Failed to load profile details');
      setIsLoading(false);
    }
  }, [username]);

  const getSessionDetails = useCallback(async () => {
    setIsSessionLoading(true);
    try {
      let profileUsername = '';
      if (username) {
        profileUsername = username;
      } else {
        profileUsername = getLocalUserDetails().username;
      }
      const { data } = await apis.user.getSessionsByUsername(profileUsername, 'upcoming');
      if (data) {
        const unfilteredSessions = data.map((i, index) => ({
          index,
          key: i.inventory_id,
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
          currency: i.currency || 'SGD',
          refund_amount: i.refund_amount || 0,
          is_refundable: i.is_refundable || false,
          refund_before_hours: i.refund_before_hours || 24,
        }));

        const isNotCurrentInventory = (session) => session.inventory_id !== inventory_id;
        const haveSlot = (session) => session.participants < session.max_participants;
        const isNotFinished = (session) => moment().isBefore(moment(session.end_time));

        let filterByDateSessions = [];
        unfilteredSessions
          .filter(isNotCurrentInventory)
          .filter(haveSlot)
          .filter(isNotFinished)
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

        console.log(filterByDateSessions);
        setAvailableSessions(filterByDateSessions);
        setIsSessionLoading(false);
      }
    } catch (error) {
      setIsSessionLoading(false);
      message.error('Failed to load user session details');
    }
  }, [username, inventory_id]);

  const handleSessionReschedule = (data) => {
    console.log(data);
    //TODO: Fire API here
  };

  useEffect(() => {
    getProfileDetails();
    getSessionDetails();
  }, [getProfileDetails, getSessionDetails]);

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
      width: '25%',
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
          return <Text className={styles.textAlignLeft}>{record.name}</Text>;
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
      width: '15%',
      render: (text, record) => renderSimpleTableCell(record.is_date, text),
    },
    {
      title: 'Time',
      dataIndex: 'time',
      key: 'time',
      width: '15%',
      render: (text, record) =>
        renderSimpleTableCell(
          record.is_date,
          <>
            <Text> {text} </Text>
            <Text type="secondary"> {getCurrentLongTimezone()} </Text>
          </>
        ),
    },
    {
      title: 'Available Slots',
      key: 'participants',
      dataIndex: 'participants',
      width: '10%',
      render: (text, record) =>
        renderSimpleTableCell(record.is_date, `${record.participants || 0} / ${record.max_participants}`),
    },
    {
      title: 'Actions',
      width: '25%',
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
                <Button type="link" className={styles.detailsButton} onClick={() => handleSessionReschedule(record)}>
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
        title={
          <div
          // onClick={() => openSessionInventoryDetails(item)}
          >
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
            <Button type="text">Reschedule</Button>
          </Popconfirm>,
        ]}
      >
        {layout('Type', <Text>{item.type}</Text>)}
        {layout('Duration', <Text>{item.duration}</Text>)}
        {layout('Time', <Text>{item.time}</Text>)}
        {layout(
          'Available Slots',
          <Text>
            {item.participants || 0} {'/'} {item.max_participants}
          </Text>
        )}
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
        <Col span={24}>
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
                  data={availableSessions}
                  loading={isLoading}
                  rowKey={(record) => record.start_time}
                  expandable={{
                    expandedRowRender: (record) => <> {record.children.map(renderSessionItem)} </>,
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
