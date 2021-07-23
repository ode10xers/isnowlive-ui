import React, { useState, useCallback, useEffect } from 'react';
import moment from 'moment';

import { Row, Col, Typography, Spin, Image, Empty, Space, Button, Modal, Popover, Popconfirm, message } from 'antd';
import { BookTwoTone } from '@ant-design/icons';

import apis from 'apis';
import Routes from 'routes';

import Table from 'components/Table';
import { showErrorModal } from 'components/Modals/modals';
import AddToCalendarButton from 'components/AddToCalendarButton';

import dateUtil from 'utils/date';
import { isInIframeWidget } from 'utils/widgets';
import { redirectToInventoryPage } from 'utils/redirect';
import {
  getDuration,
  isAPISuccess,
  isUnapprovedUserError,
  generateQueryString,
  preventDefaults,
  generateUrlFromUsername,
} from 'utils/helper';

import styles from './styles.module.scss';

const {
  formatDate: { toLocaleTime, toLongDateWithDay, toLongDateWithDayTime },
  timeCalculation: { isBeforeDate, isBeforeLimitHours },
} = dateUtil;

const { Text, Title } = Typography;

const whiteColor = '#ffffff';

const DashboardPage = ({ match, history }) => {
  const [isSessionLoading, setIsSessionLoading] = useState(false);
  const [upcomingSessions, setUpcomingSessions] = useState([]);

  const [isVideoLoading, setIsVideoLoading] = useState(false);
  const [videos, setVideos] = useState([]);

  //#region Start of API Calls

  const fetchAttendeeUpcomingSessions = useCallback(async () => {
    setIsSessionLoading(true);

    const sessionItemCount = 2;

    try {
      const { status, data } = await apis.session.getAttendeeUpcomingSession();

      if (isAPISuccess(status) && data) {
        setUpcomingSessions(data.slice(0, sessionItemCount));
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

  const openSessionInventoryDetails = (item) => {
    redirectToInventoryPage(item);
  };

  const cancelOrderForSession = async (orderId) => {
    try {
      await apis.session.cancelCustomerOrder(orderId, { reason: 'requested_by_customer' });
      Modal.success({
        closable: true,
        maskClosable: true,
        title: 'Refund Successful',
      });
      fetchAttendeeUpcomingSessions();
    } catch (error) {
      if (!isUnapprovedUserError(error.response)) {
        showErrorModal('Failed to cancel order', error?.response?.data?.message || 'Something went wrong');
      }
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
            <Button block size="small" type="text" danger>
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
            <Button block size="small" type="text" danger>
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
          <Button block size="small" type="text" danger>
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

    window.open(
      `${generateUrlFromUsername(data.username)}/reschedule?${generateQueryString(passedData)}`,
      isInIframeWidget() ? '_self' : '_blank'
    );
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
            <Text>{record.name}</Text> {record.is_course ? <BookTwoTone twoToneColor="#1890ff" /> : null}
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
    {
      title: 'Actions',
      // width: isPast ? '56px' : '360px',
      render: (text, record) => {
        return (
          <Row justify="space-around">
            <Col md={24} xl={6}>
              <AddToCalendarButton
                buttonText="Add to Cal"
                eventData={{
                  ...record,
                  page_url: `${generateUrlFromUsername(record?.username)}/e/${record.inventory_id}`,
                }}
              />
            </Col>

            <Col md={24} lg={24} xl={4}>
              {record.is_offline ? (
                <Popover
                  arrowPointAtCenter
                  placement="topRight"
                  trigger="click"
                  title="Event Address"
                  content={record.offline_event_address}
                >
                  <Button block size="small" type="text" className={styles.success}>
                    In person
                  </Button>
                </Popover>
              ) : (
                <Button
                  type="text"
                  size="small"
                  block
                  className={
                    !record.join_url || isBeforeDate(moment(record.start_time).subtract(15, 'minutes'))
                      ? styles.disabledSuccess
                      : styles.success
                  }
                  disabled={!record.join_url || isBeforeDate(moment(record.start_time).subtract(15, 'minutes'))}
                  onClick={() => window.open(record.join_url)}
                >
                  Join
                </Button>
              )}
            </Col>
            <Col md={24} lg={24} xl={4}>
              {renderRefundPopup(record)}
            </Col>
            <Col md={24} lg={24} xl={4}>
              <Button block size="small" type="link" onClick={() => openSessionInventoryDetails(record)}>
                Details
              </Button>
            </Col>

            <Col md={24} lg={24} xl={6}>
              <Button
                block
                size="small"
                type="text"
                className={styles.warning}
                onClick={() => rescheduleSession(record)}
              >
                Reschedule
              </Button>
            </Col>
          </Row>
        );
      },
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
            <Title level={4}> Your Purchased Sessions </Title>
            <div className={styles.sessionsContainer}>
              <Table
                columns={sessionTableColumns}
                data={upcomingSessions}
                loading={isSessionLoading}
                rowKey={(record) => record.inventory_external_id}
              />
            </div>
            <div className={styles.moreButtonContainer}>
              <Button type="primary" onClick={redirectToSessionsPage}>
                See More Sessions Purchased By You
              </Button>
            </div>
          </Space>
        </Col>
        {/* Videos Section */}
        <Col xs={24}>
          <Space direction="vertical">
            <Title level={4}> Your Purchased Videos </Title>
            <div className={styles.videosContainer}>
              <Spin spinning={isVideoLoading} tip="Fetching video orders">
                {videos.length > 0 ? (
                  <Row gutter={[12, 12]} align="middle">
                    {videos.map(renderVideoItems)}
                    <Col xs={24}>
                      <Row justify="center">
                        <Col>
                          <Button type="primary" onClick={redirectToVideosPage}>
                            See More Videos Purchased By You
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
