import React, { useState, useCallback, useEffect } from 'react';

import { Row, Col, Typography, Spin, Image, Empty, Space, Button, message } from 'antd';
import { BookTwoTone } from '@ant-design/icons';

import apis from 'apis';
import Routes from 'routes';

import dateUtil from 'utils/date';

import Table from 'components/Table';
import { showErrorModal } from 'components/Modals/modals';

import { getDuration, isAPISuccess, isUnapprovedUserError, preventDefaults } from 'utils/helper';

import styles from './styles.module.scss';

const {
  formatDate: { toLocaleTime, toLongDateWithDay, toLocaleDate, toLongDateWithDayTime },
} = dateUtil;

const { Text, Title } = Typography;

const whiteColor = '#ffffff';

const DashboardPage = ({ match, history }) => {
  const [isSessionLoading, setIsSessionLoading] = useState(false);
  const [upcomingSessions, setUpcomingSessions] = useState([]);
  const [filteredByDateSessions, setFilteredByDateSessions] = useState([]);

  const [isVideoLoading, setIsVideoLoading] = useState(false);
  const [videos, setVideos] = useState([]);

  //#region Start of API Calls

  const fetchAttendeeUpcomingSessions = useCallback(async () => {
    setIsSessionLoading(true);

    try {
      const { status, data } = await apis.session.getAttendeeUpcomingSession();

      if (isAPISuccess(status) && data) {
        console.log('Session Data');
        console.log(data.slice(0, 2));

        let filterByDateSessions = [];
        // NOTE: How much date to show in the UI
        const dayLimit = 4;

        data.forEach((session) => {
          if (filterByDateSessions.length >= dayLimit) {
            return;
          }

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

        setUpcomingSessions(data);
        setFilteredByDateSessions(filterByDateSessions);

        // if (filterByDateSessions.length > 0) {
        //   setExpandedRowKeys([filterByDateSessions[0].start_time]);
        // }
      }
    } catch (error) {
      if (!isUnapprovedUserError(error.response)) {
        message.error(error.response?.data?.message || 'Something went wrong.');
      }
    }

    setIsSessionLoading(false);
  }, []);

  const getVideosForCreator = useCallback(async () => {
    setIsVideoLoading(true);
    try {
      const { data } = await apis.videos.getAttendeeVideos();

      if (data) {
        setVideos(data.active.sort((a, b) => new Date(a.expiry) - new Date(b.expiry)).slice(0, 2));
      }
    } catch (error) {
      if (!isUnapprovedUserError(error.response)) {
        showErrorModal('Failed fetching videos', error.response?.data?.message || 'Something went wrong');
      }
    }
    setIsVideoLoading(false);
  }, []);

  //#endregion End of API Calls

  //#region Start of Use Effects

  useEffect(() => {
    fetchAttendeeUpcomingSessions();
    getVideosForCreator();
  }, [fetchAttendeeUpcomingSessions, getVideosForCreator]);

  //#endregion End of Use Effects

  //#region Start of Business Logics

  const redirectToSessionsPage = (e) => {
    preventDefaults(e);
    history.push(Routes.attendeeDashboard.rootPath + '/sessions/upcoming');
  };

  const redirectToVideosPage = (e) => {
    preventDefaults(e);
    history.push(Routes.attendeeDashboard.rootPath + Routes.attendeeDashboard.videos);
  };

  //#endregion End of Business Logics

  //#region Start of Table Columns

  const sessionTableColumns = [
    {
      title: 'Session Name',
      dataIndex: 'name',
      key: 'name',
      width: '220px',
      render: (text, record) => ({
        props: {
          style: {
            borderLeft: `6px solid ${record.color_code || whiteColor}`,
          },
        },
        children: (
          <>
            <Text className={styles.sessionNameWrapper}>{record.name}</Text>{' '}
            {record.is_course ? <BookTwoTone twoToneColor="#1890ff" /> : null}
          </>
        ),
      }),
    },
    {
      title: 'Type',
      dataIndex: 'max_participants',
      key: 'max_participants',
      width: '72px',
      render: (text, record) => (record?.max_participants > 1 ? 'Group' : '1-on-1'),
    },
    {
      title: 'Day',
      dataIndex: 'inventory_external_id',
      key: 'inventory_external_id',
      width: '100px',
      render: (text, record) => (record?.start_time ? toLongDateWithDay(record?.start_time) : '-'),
    },
    {
      title: 'Duration',
      dataIndex: 'start_time',
      key: 'start_time',
      width: '90px',
      render: (text, record) =>
        record?.start_time && record?.end_time ? getDuration(record?.start_time, record?.end_time) : '-',
    },
    {
      title: 'Time',
      dataIndex: 'end_time',
      key: 'end_time',
      width: '165px',
      render: (text, record) =>
        record?.start_time && record?.end_time
          ? `${toLocaleTime(record?.start_time)} - ${toLocaleTime(record?.end_time)}`
          : '-',
    },
  ];
  //#endregion End of Table Columns

  //#region Start of Render Methods

  const renderVideoItems = (video) => (
    <Col
      key={video.video_order_id}
      xs={24}
      lg={12}
      className={styles.videoItem}
      onClick={() =>
        history.push(
          Routes.attendeeDashboard.rootPath +
            Routes.attendeeDashboard.videos +
            `/${video.video_id}/${video.video_order_id}`
        )
      }
    >
      <Row gutter={[12, 12]}>
        <Col xs={24} md={10} lg={14} xl={12}>
          <Image className={styles.coverImage} src={video.thumbnail_url} preview={false} />
        </Col>
        <Col xs={24} md={14} lg={10} xl={12}>
          <Row>
            <Col xs={24}>
              <Title level={5} className={styles.videoTitle}>
                {video.title}
              </Title>
            </Col>
            <Col xs={24}>
              {video.price === 0 ? (
                <Text type="secondary">Free video</Text>
              ) : (
                <Text type="secondary">
                  {video.currency.toUpperCase()} {video.price}
                </Text>
              )}
            </Col>
            <Col xs={24}>
              <Text type="secondary" className={styles.expiryText}>
                Available from :
              </Text>
            </Col>
            <Col xs={24}>
              <Text type="secondary" className={styles.expiryText}>
                {toLongDateWithDayTime(video.beginning)} - {toLongDateWithDayTime(video.expiry)}
              </Text>
            </Col>
          </Row>
        </Col>
      </Row>
    </Col>
  );

  //#endregion End of Render Methods

  //#region Start of Mobile UI Handlers

  //#endregion End of Mobile UI Handlers

  return (
    <div className={styles.dashboardContainer}>
      <Row gutter={[12, 12]} justify="center" align="middle">
        {/* Sessions Section */}
        <Col xs={24}>
          <Space direction="vertical" align="middle" className={styles.w100}>
            <Title level={4}> Purchased Sessions </Title>
            <div className={styles.sessionsContainer}>
              <Table
                columns={sessionTableColumns}
                data={upcomingSessions.slice(0, 4)}
                loading={isSessionLoading}
                rowKey={(record) => record.inventory_external_id}
              />
            </div>
            <div className={styles.moreButtonContainer}>
              <Button type="primary" onClick={redirectToSessionsPage}>
                More Sessions
              </Button>
            </div>
          </Space>
        </Col>
        {/* Videos Section */}
        <Col xs={24}>
          <Space direction="vertical">
            <Title level={4}> Purchased Videos </Title>
            <div className={styles.videosContainer}>
              <Spin spinning={isVideoLoading} tip="Fetching video orders">
                {videos.length > 0 ? (
                  <Row gutter={[12, 12]} align="middle">
                    {videos.map(renderVideoItems)}
                    <Col xs={24}>
                      <Row justify="center">
                        <Col>
                          <Button type="primary" onClick={redirectToVideosPage}>
                            More Videos
                          </Button>
                        </Col>
                      </Row>
                    </Col>
                  </Row>
                ) : (
                  <Empty description="No video purchased" />
                )}
              </Spin>
            </div>
          </Space>
        </Col>
        {/* Courses Section */}
        <Col xs={24}></Col>
      </Row>
    </div>
  );
};

export default DashboardPage;
