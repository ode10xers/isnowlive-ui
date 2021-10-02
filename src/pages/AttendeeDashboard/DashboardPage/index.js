import React, { useState, useCallback, useEffect } from 'react';
import { generatePath } from 'react-router-dom';
import moment from 'moment';

import {
  Row,
  Col,
  Typography,
  Spin,
  Image,
  Empty,
  Space,
  Tag,
  Divider,
  Card,
  Button,
  Modal,
  Popover,
  Popconfirm,
  Grid,
  message,
} from 'antd';
import { BookTwoTone } from '@ant-design/icons';

import apis from 'apis';
import Routes from 'routes';

import Table from 'components/Table';
import DefaultImage from 'components/Icons/DefaultImage';
import { showErrorModal } from 'components/Modals/modals';
import AddToCalendarButton from 'components/AddToCalendarButton';

import dateUtil from 'utils/date';
import { isMobileDevice } from 'utils/device';
import { isInIframeWidget } from 'utils/widgets';
import { redirectToInventoryPage } from 'utils/redirect';
import {
  getCourseDocumentContentCount,
  getCourseOrderSessionContentCount,
  getCourseOrderVideoContentCount,
} from 'utils/course';
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
const { useBreakpoint } = Grid;

const whiteColor = '#ffffff';

const DashboardPage = ({ history }) => {
  const { md } = useBreakpoint();

  const [isSessionLoading, setIsSessionLoading] = useState(false);
  const [upcomingSessions, setUpcomingSessions] = useState([]);

  const [isVideoLoading, setIsVideoLoading] = useState(false);
  const [videos, setVideos] = useState([]);

  const [isCourseLoading, setIsCourseLoading] = useState(false);
  const [courses, setCourses] = useState([]);

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

  const fetchAttendeeVideoOrders = useCallback(async () => {
    setIsVideoLoading(true);

    const videosItemCount = 2;

    try {
      const { status, data } = await apis.videos.getAttendeeVideos();

      if (isAPISuccess(status) && data) {
        setVideos(data.active.sort((a, b) => new Date(a.expiry) - new Date(b.expiry)).slice(0, videosItemCount));
      }
    } catch (error) {
      if (!isUnapprovedUserError(error.response)) {
        showErrorModal('Failed fetching videos', error.response?.data?.message || 'Something went wrong');
      }
    }
    setIsVideoLoading(false);
  }, []);

  const fetchAttendeeCourseOrders = useCallback(async () => {
    setIsCourseLoading(true);

    const courseItemCount = 1;

    try {
      const { status, data } = await apis.courses.getAttendeeCourses();

      if (isAPISuccess(status) && data) {
        setCourses(data.active.length > 0 ? data.active.slice(0, courseItemCount) : []);
      }
    } catch (error) {
      if (!isUnapprovedUserError(error.response)) {
        showErrorModal('Something wrong happened', error?.response?.data?.message || 'Failed to fetch course orders');
      }
    }

    setIsCourseLoading(false);
  }, []);

  //#endregion End of API Calls

  //#region Start of Use Effects

  useEffect(() => {
    fetchAttendeeUpcomingSessions();
    fetchAttendeeVideoOrders();
    fetchAttendeeCourseOrders();
  }, [fetchAttendeeUpcomingSessions, fetchAttendeeVideoOrders, fetchAttendeeCourseOrders]);

  //#endregion End of Use Effects

  //#region Start of Business Logics

  const redirectToSessionsPage = (e) => {
    preventDefaults(e);
    history.push(Routes.attendeeDashboard.rootPath + '/sessions/upcoming');
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
            trigger="click"
            title="Refund Time Limit Reached"
            content={
              <Text>
                Sorry, as per the cancellation policy of <br />
                this session,{' '}
                <strong>
                  it can only be cancelled <br />
                  {data.refund_before_hours} hours
                </strong>{' '}
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
      `${generateUrlFromUsername(data.creator_username)}/reschedule?${generateQueryString(passedData)}`,
      isInIframeWidget() ? '_self' : '_blank'
    );
  };

  const redirectToVideosPage = (e) => {
    preventDefaults(e);
    history.push(Routes.attendeeDashboard.rootPath + Routes.attendeeDashboard.videos);
  };

  const redirectToCoursesPage = (e) => {
    preventDefaults(e);
    history.push(Routes.attendeeDashboard.rootPath + Routes.attendeeDashboard.courses);
  };

  const redirectToCourseOrderDetails = (courseOrder) => {
    if (courseOrder?.course?.creator_username && courseOrder?.course_order_id) {
      history.push(
        Routes.attendeeDashboard.rootPath +
          generatePath(Routes.attendeeDashboard.courseDetails, { course_order_id: courseOrder.course_order_id })
      );
    }
  };

  //#endregion End of Business Logics

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
            generatePath(Routes.attendeeDashboard.videoDetails, {
              video_id: video.video_id,
              video_order_id: video.video_order_id,
            })
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

  const renderCourseContents = (courseOrder) => {
    const sessionCount = getCourseOrderSessionContentCount(courseOrder.course?.modules ?? []);
    const videoCount = getCourseOrderVideoContentCount(courseOrder.course?.modules ?? []);
    const docCount = getCourseDocumentContentCount(courseOrder.course?.modules ?? []);

    return (
      <Space size={1} wrap={true}>
        {sessionCount > 0 ? <Tag color="blue" className={styles.mb5}>{`${sessionCount} sessions`}</Tag> : null}
        {videoCount > 0 ? <Tag color="purple" className={styles.mb5}>{`${videoCount} videos`}</Tag> : null}
        {docCount > 0 ? <Tag color="magenta" className={styles.mb5}>{`${docCount} files`}</Tag> : null}
      </Space>
    );
  };

  const renderCourseDuration = (course) =>
    course?.type === 'VIDEO'
      ? `${course?.validity ?? 0} days`
      : `${moment(course?.end_date)
          .endOf('day')
          .add(1, 'second')
          .diff(moment(course.start_date).startOf('day'), 'days')} days`;

  //#endregion End of Render Methods

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
      width: '76px',
      render: (text, record) => (record?.max_participants > 1 ? 'Group' : '1-on-1'),
    },
    {
      title: 'Day',
      dataIndex: 'inventory_external_id',
      key: 'inventory_external_id',
      width: '120px',
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
            <Col md={24} lg={5} xl={6}>
              <AddToCalendarButton
                buttonText="Add to Cal"
                eventData={{
                  ...record,
                  page_url: `${generateUrlFromUsername(record?.creator_username)}/e/${record.inventory_id}`,
                }}
              />
            </Col>
            <Col md={24} lg={5} xl={4}>
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
            <Col md={24} lg={5} xl={4}>
              {renderRefundPopup(record)}
            </Col>
            <Col md={24} lg={4} xl={4}>
              <Button block size="small" type="link" onClick={() => redirectToInventoryPage(record)}>
                Details
              </Button>
            </Col>
            <Col md={24} lg={5} xl={6}>
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

  const courseTableColumns = [
    {
      title: '',
      dataIndex: ['course', 'course_image_url'],
      align: 'center',
      width: md ? '150px' : '180px',
      render: (text, record) => (
        <Image
          src={text || 'error'}
          alt={record.course?.name}
          fallback={DefaultImage()}
          className={styles.thumbnailImage}
        />
      ),
    },
    {
      title: 'Course Name',
      dataIndex: ['course', 'name'],
    },
    {
      title: 'Course Content',
      width: '165px',
      render: renderCourseContents,
    },
    {
      title: 'Duration',
      width: '98px',
      render: (text, record) => renderCourseDuration(record.course),
    },
    {
      title: 'Price',
      key: 'price',
      dataIndex: 'price',
      width: '90px',
      render: (text, record) => (record.price > 0 ? `${record.currency?.toUpperCase()} ${record.price}` : 'Free'),
    },
    {
      title: '',
      width: '100px',
      render: (text, record) => (
        <Row gutter={[8, 8]} justify="end">
          <Col>
            <Button type="link" size="large" onClick={() => redirectToCourseOrderDetails(record)}>
              View Content
            </Button>
          </Col>
        </Row>
      ),
    },
  ];

  //#endregion End of Table Columns

  //#region Start of Mobile UI Handlers

  const renderMobileSessionItem = (item) => {
    const layout = (label, value) => (
      <Row>
        <Col span={9}>
          <Text strong>{label}</Text>
        </Col>
        <Col span={15}>: {value}</Col>
      </Row>
    );

    return (
      <Col xs={24}>
        <Card
          key={item.order_id}
          title={
            <div onClick={() => redirectToInventoryPage(item)}>
              <Text>{item.name}</Text>
              {item.is_course ? <BookTwoTone twoToneColor="#1890ff" /> : null}
            </div>
          }
          actions={[
            item.is_offline ? (
              <Popover
                arrowPointAtCenter
                placement="topRight"
                trigger="click"
                title="Event Address"
                content={item.offline_event_address}
              >
                <Button block size="small" type="text" className={styles.success}>
                  In person
                </Button>
              </Popover>
            ) : (
              <Button
                type="text"
                disabled={!item.join_url || isBeforeDate(moment(item.start_time).subtract(15, 'minutes'))}
                onClick={() => window.open(item.join_url)}
                className={
                  !item.join_url || isBeforeDate(moment(item.start_time).subtract(15, 'minutes'))
                    ? styles.disabledSuccess
                    : styles.success
                }
              >
                Join
              </Button>
            ),
            renderRefundPopup(item),
            <Button className={styles.warning} type="text" onClick={() => rescheduleSession(item)}>
              Reschedule
            </Button>,
          ]}
        >
          <div onClick={() => redirectToInventoryPage(item)}>
            {layout('Type', <Text>{item?.max_participants > 1 ? 'Group' : '1-on-1'}</Text>)}
            {layout('Day', <Text>{item?.start_time ? toLongDateWithDay(item?.start_time) : '-'}</Text>)}
            {layout(
              'Duration',
              <Text>{item?.start_time && item?.end_time ? getDuration(item?.start_time, item?.end_time) : '-'}</Text>
            )}
            {layout(
              'Time',
              <Text>
                {item?.start_time && item?.end_time
                  ? `${toLocaleTime(item?.start_time)} - ${toLocaleTime(item?.end_time)}`
                  : '-'}
              </Text>
            )}
          </div>
          <div className={styles.mt20}>
            <AddToCalendarButton
              type="button"
              buttonText="Add to My Calendar"
              eventData={{
                ...item,
                page_url: `${generateUrlFromUsername(item?.creator_username)}/e/${item.inventory_id}`,
              }}
            />
          </div>
        </Card>
      </Col>
    );
  };

  const renderMobileCourseItem = (item) => {
    const layout = (label, value) => (
      <Row>
        <Col span={7}>
          <Text strong>{label}</Text>
        </Col>
        <Col span={17} className={styles.mobileDetailsText}>
          : {value}
        </Col>
      </Row>
    );

    return (
      <Col xs={24}>
        <Card
          key={item.course_order_id}
          bodyStyle={{ padding: '10px' }}
          title={
            <div onClick={() => redirectToCourseOrderDetails(item)}>
              <Text>{item?.course?.name}</Text>
            </div>
          }
          actions={[
            <Button type="link" size="large" onClick={() => redirectToCourseOrderDetails(item)}>
              Details
            </Button>,
          ]}
        >
          <div onClick={() => redirectToCourseOrderDetails(item)}>
            {layout('Contents', renderCourseContents(item))}
            {layout('Duration', <Text>{renderCourseDuration(item.course)}</Text>)}
            {layout(
              'Price',
              <Text>{item?.price > 0 ? `${item?.currency?.toUpperCase()} ${item?.price}` : 'Free'}</Text>
            )}
          </div>
        </Card>
      </Col>
    );
  };

  //#endregion End of Mobile UI Handlers

  return (
    <div className={styles.dashboardContainer}>
      <Space
        direction="vertical"
        split={<Divider orientation="center" type="horizontal" className={styles.sectionDivider} />}
        className={styles.w100}
      >
        {/* Sessions Section */}
        <Space direction="vertical" align="middle" className={styles.w100}>
          <Title level={4}> Your Purchased Sessions </Title>
          <div className={styles.sessionsContainer}>
            {isMobileDevice ? (
              <Spin spinning={isSessionLoading}>
                {upcomingSessions.length > 0 ? (
                  <Row gutter={[10, 10]}>{upcomingSessions.map(renderMobileSessionItem)}</Row>
                ) : (
                  <Empty description="No upcoming purchased sessions" />
                )}
              </Spin>
            ) : (
              <Table
                columns={sessionTableColumns}
                data={upcomingSessions}
                loading={isSessionLoading}
                rowKey={(record) => record.order_id}
              />
            )}
          </div>
          <div className={styles.moreButtonContainer}>
            <Button type="primary" onClick={redirectToSessionsPage}>
              See More Sessions Purchased By You
            </Button>
          </div>
        </Space>
        {/* Videos Section */}
        <Space direction="vertical" className={styles.w100}>
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
        {/* Courses Section */}
        <Space direction="vertical" className={styles.w100}>
          <Title level={4}> Your Purchased Courses </Title>
          <div className={styles.coursesContainer}>
            {isMobileDevice ? (
              <Spin spinning={isCourseLoading}>
                {courses.length > 0 ? (
                  <Row gutter={[8, 8]}>{courses.map(renderMobileCourseItem)}</Row>
                ) : (
                  <Empty description="No active course orders" />
                )}
              </Spin>
            ) : (
              <Table
                size="small"
                columns={courseTableColumns}
                data={courses}
                loading={isCourseLoading}
                rowKey={(record) => record.course_order_id}
              />
            )}
          </div>
          <div className={styles.moreButtonContainer}>
            <Button type="primary" onClick={redirectToCoursesPage}>
              See More Courses Purchased By You
            </Button>
          </div>
        </Space>
      </Space>
    </div>
  );
};

export default DashboardPage;
