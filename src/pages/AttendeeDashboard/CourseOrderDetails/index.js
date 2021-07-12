import React, { useState, useEffect, useCallback } from 'react';
import ReactHtmlParser from 'react-html-parser';

import {
  Row,
  Col,
  Image,
  Collapse,
  Button,
  Divider,
  List,
  Typography,
  Spin,
  Popover,
  Space,
  // Progress,
  Tag,
} from 'antd';
import { ArrowLeftOutlined, DownOutlined, VideoCameraOutlined, PlayCircleOutlined } from '@ant-design/icons';

import Routes from 'routes';

import { showErrorModal } from 'components/Modals/modals';
import AddToCalendarButton from 'components/AddToCalendarButton';

import dateUtil from 'utils/date';
import { isMobileDevice } from 'utils/device';
import { isAPISuccess, isUnapprovedUserError, preventDefaults, generateUrlFromUsername } from 'utils/helper';
import { getCourseSessionContentCount, getCourseVideoContentCount } from 'utils/course';

import styles from './style.module.scss';

// TODO: Confirm what to do with the Progress
const sampleOrderData = {
  course_id: 'albuquerque-sera-sera',
  course_order_id: 'ad-astra-abyssosque',
  course_image_url:
    'https://dkfqbuenrrvge.cloudfront.net/image/1fWsqzwHDwQSwP3l_screenshot from 2021-06-05 20-54-40.png',
  course_name: 'Why hello there its a course',
  course_description:
    '<p>What should we do in case this description is super long? Because the image should not stretch vertically.</p>\n',
  modules: [
    {
      module_id: 'module_1',
      module_name: 'First Mixed module',
      contents: [
        {
          content_id: 'scooby-dooby-doo',
          content_name: 'First modules first content',
          content_type: 'SESSION',
          content_data: {
            inventory_id: 3535,
            start_time: '2021-07-08T07:00:00Z',
            end_time: '2021-07-08T07:30:00Z',
            session_date: '2021-07-08',
            price: 16,
            currency: 'sgd',
            max_participants: 10,
            name: 'Yoga at the Park (Guided by: Irini Lembessis) LAVAL',
            description: '<p>Desc</p>\n',
            session_image_url:
              'https://dkfqbuenrrvge.cloudfront.net/image/6xC6Fn7yFOsqrEo0_desert safari facebook cover.png',
            document_urls: [],
            beginning: '2021-06-18T17:00:00Z',
            expiry: '2021-07-31T16:59:59Z',
            prerequisites: '',
            pay_what_you_want: false,
            recurring: true,
            is_refundable: false,
            refund_before_hours: 0,
            user_timezone_offset: 420,
            user_timezone: 'Indochina Time',
            color_code: '#ff9800',
            is_course: false,
            is_offline: true,
            session_id: 382,
            group: true,
            is_active: true,
            session_external_id: '29ce0e74-113d-4756-a723-eec687f623a9',
            creator_username: 'ellianto',
            tags: [],
            offline_event_address: 'Gobi Dessert is better maybe',
            total_bookings: 0,
            total_price: 19.2,
          },
        },
        {
          content_id: 'yabba-dabba-doo',
          content_name: 'First modules next content',
          content_type: 'VIDEO',
          content_data: {
            title: 'Create, Upload, Cancel after Fix',
            description: '<p>Test</p>\n',
            validity: 1,
            price: 8,
            pay_what_you_want: false,
            currency: 'sgd',
            thumbnail_url: 'https://dkfqbuenrrvge.cloudfront.net/image/icpyj903a88nfzHZ_thumbnail.gif',
            external_id: 'cb4a9cd4-8dc7-4526-9fed-72fb43257a44',
            is_published: true,
            video_url: '',
            video_uid: '11458eea7ad9e069add75a2fb569df50',
            duration: 489,
            status: 'UPLOAD_SUCCESS',
            watch_limit: 1,
            creator_username: 'ellianto',
            is_course: false,
            tags: [],
            total_price: 9.6,
            sessions: [],
          },
        },
      ],
    },
    {
      module_id: 'module_2',
      module_name: 'Video only module',
      contents: [
        {
          content_id: 'yabba-dabba-doo-bi',
          content_name: 'First Video Content',
          content_type: 'VIDEO',
          content_data: {
            title: 'Create, Upload, Cancel after Fix',
            description: '<p>Test</p>\n',
            validity: 1,
            price: 8,
            pay_what_you_want: false,
            currency: 'sgd',
            thumbnail_url: 'https://dkfqbuenrrvge.cloudfront.net/image/icpyj903a88nfzHZ_thumbnail.gif',
            external_id: 'cb4a9cd4-8dc7-4526-9fed-72fb43257a44',
            is_published: true,
            video_url: '',
            video_uid: '11458eea7ad9e069add75a2fb569df50',
            duration: 489,
            status: 'UPLOAD_SUCCESS',
            watch_limit: 1,
            creator_username: 'ellianto',
            is_course: false,
            tags: [],
            total_price: 9.6,
            sessions: [],
          },
        },
        {
          content_id: 'yabba-dabba-doo-ba',
          content_name: 'Next Video Content',
          content_type: 'VIDEO',
          content_data: {
            title: 'Create, Upload, Cancel after Fix',
            description: '<p>Test</p>\n',
            validity: 1,
            price: 8,
            pay_what_you_want: false,
            currency: 'sgd',
            thumbnail_url: 'https://dkfqbuenrrvge.cloudfront.net/image/icpyj903a88nfzHZ_thumbnail.gif',
            external_id: 'cb4a9cd4-8dc7-4526-9fed-72fb43257a44',
            is_published: true,
            video_url: '',
            video_uid: '11458eea7ad9e069add75a2fb569df50',
            duration: 489,
            status: 'UPLOAD_SUCCESS',
            watch_limit: 1,
            creator_username: 'ellianto',
            is_course: false,
            tags: [],
            total_price: 9.6,
            sessions: [],
          },
        },
      ],
    },
    {
      module_id: 'module_3',
      module_name: 'Session only module',
      contents: [
        {
          content_id: 'scooby-dooby-doo-bi',
          content_name: 'Session modules first content',
          content_type: 'SESSION',
          content_data: {
            inventory_id: 3535,
            start_time: '2021-07-08T07:00:00Z',
            end_time: '2021-07-08T07:30:00Z',
            session_date: '2021-07-08',
            price: 16,
            currency: 'sgd',
            max_participants: 10,
            name: 'Yoga at the Park (Guided by: Irini Lembessis) LAVAL',
            description: '<p>Desc</p>\n',
            session_image_url:
              'https://dkfqbuenrrvge.cloudfront.net/image/6xC6Fn7yFOsqrEo0_desert safari facebook cover.png',
            document_urls: [],
            beginning: '2021-06-18T17:00:00Z',
            expiry: '2021-07-31T16:59:59Z',
            prerequisites: '',
            pay_what_you_want: false,
            recurring: true,
            is_refundable: false,
            refund_before_hours: 0,
            user_timezone_offset: 420,
            user_timezone: 'Indochina Time',
            color_code: '#ff9800',
            is_course: false,
            is_offline: true,
            session_id: 382,
            group: true,
            is_active: true,
            session_external_id: '29ce0e74-113d-4756-a723-eec687f623a9',
            creator_username: 'ellianto',
            tags: [],
            offline_event_address: 'Gobi Dessert is better maybe',
            total_bookings: 0,
            total_price: 19.2,
          },
        },
        {
          content_id: 'scooby-dooby-doo-ba',
          content_name: 'Session modules first content',
          content_type: 'SESSION',
          content_data: {
            inventory_id: 3535,
            start_time: '2021-07-08T07:00:00Z',
            end_time: '2021-07-08T07:30:00Z',
            session_date: '2021-07-08',
            price: 16,
            currency: 'sgd',
            max_participants: 10,
            name: 'Yoga at the Park (Guided by: Irini Lembessis) LAVAL',
            description: '<p>Desc</p>\n',
            session_image_url:
              'https://dkfqbuenrrvge.cloudfront.net/image/6xC6Fn7yFOsqrEo0_desert safari facebook cover.png',
            document_urls: [],
            beginning: '2021-06-18T17:00:00Z',
            expiry: '2021-07-31T16:59:59Z',
            prerequisites: '',
            pay_what_you_want: false,
            recurring: true,
            is_refundable: false,
            refund_before_hours: 0,
            user_timezone_offset: 420,
            user_timezone: 'Indochina Time',
            color_code: '#ff9800',
            is_course: false,
            is_offline: true,
            session_id: 382,
            group: true,
            is_active: true,
            session_external_id: '29ce0e74-113d-4756-a723-eec687f623a9',
            creator_username: 'ellianto',
            tags: [],
            offline_event_address: 'Gobi Dessert is better maybe',
            total_bookings: 0,
            total_price: 19.2,
          },
        },
      ],
    },
  ],
};

const { Title, Text } = Typography;
const { Panel } = Collapse;

const {
  formatDate: { toLocaleTime, toLongDateWithDay },
} = dateUtil;

const CourseOrderDetails = ({ match, history }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [courseOrderDetails, setCourseOrderDetails] = useState(null);

  const [expandedCourseModules, setExpandedCourseModules] = useState([]);

  const fetchCourseOrderDetails = useCallback(async () => {
    setIsLoading(true);

    try {
      // TODO: Implement API here (confirm with BE)
      const { status, data } = {
        status: 200,
        data: sampleOrderData,
      };

      if (isAPISuccess(status) && data) {
        setCourseOrderDetails(data);
        setExpandedCourseModules(data.modules?.map((courseModule) => courseModule.module_id) ?? []);
      }
    } catch (error) {
      console.error(error);

      if (!isUnapprovedUserError(error?.response)) {
        showErrorModal(
          'Failed to fetch attendee course order details',
          error?.response?.data?.message || 'Something went wrong.'
        );
      }
    }

    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchCourseOrderDetails();
  }, [fetchCourseOrderDetails]);

  const handleBackClicked = (e) => {
    preventDefaults(e);

    history.push(Routes.attendeeDashboard.rootPath + Routes.attendeeDashboard.courses);
  };

  const redirectToVideoOrderDetails = (e) => {
    preventDefaults(e);
  };

  const renderCourseOrderContent = (courseOrder) => {
    const sessionCount = getCourseSessionContentCount(courseOrder.modules);
    const videoCount = getCourseVideoContentCount(courseOrder.modules);

    return (
      <Space size="small" split={<Divider type="vertical" />}>
        {sessionCount > 0 ? <Text className={styles.blueText}> {`${sessionCount} sessions`} </Text> : null}
        {videoCount > 0 ? <Text className={styles.blueText}> {`${videoCount} videos`} </Text> : null}
      </Space>
    );
  };

  // TODO: Rework Progress based on API Data
  const renderCourseOrderDetails = (orderDetails) => (
    <div className={styles.courseOrderDetailsContainer}>
      <Row gutter={[12, 12]}>
        <Col xs={24} md={12} lg={8}>
          <Image className={styles.courseImage} src={orderDetails?.course_image_url} />
        </Col>
        <Col xs={24} md={12} lg={16}>
          <Space direction="vertical">
            <Title level={5} className={styles.courseTitle}>
              {' '}
              {orderDetails.course_name}{' '}
            </Title>
            <div className={styles.courseDescription}>{ReactHtmlParser(orderDetails.course_description)}</div>
            <Tag color="blue" className={styles.contentTag}>
              {renderCourseOrderContent(orderDetails)}
            </Tag>
          </Space>
        </Col>
        {/* <Col xs={4}>
          <Progress
            type="circle"
            success={{ percent: 40 }}
            format={(percent, successPercent) => (
              <Text className={styles.progressPercent}>
                {' '}
                <span className={styles.percentText}> {successPercent}% </span> <br /> Completed{' '}
              </Text>
            )}
          />
        </Col> */}
      </Row>
    </div>
  );

  const renderContentIcon = (content) =>
    content.content_type === 'SESSION' ? (
      <VideoCameraOutlined className={styles.blueText} />
    ) : (
      <PlayCircleOutlined className={styles.blueText} />
    );

  // TODO: Reimplement this to be interactive
  const renderExtraContent = (content, contentType) =>
    contentType === 'SESSION' ? (
      <Space align="center" size="large">
        <Text> {toLongDateWithDay(content?.start_time)} </Text>
        <Text>
          {' '}
          {toLocaleTime(content?.start_time)} - {toLocaleTime(content?.end_time)}{' '}
        </Text>
        <AddToCalendarButton
          iconOnly={true}
          eventData={{
            ...content,
            page_url: `${generateUrlFromUsername(content?.username)}/e/${content?.inventory_id}`,
          }}
        />
        {content.is_offline ? (
          <Popover
            arrowPointAtCenter
            placement="topRight"
            trigger="click"
            title="Event Address"
            content={content.offline_event_address}
          >
            <Button block size="small" type="text" className={styles.success}>
              In person
            </Button>
          </Popover>
        ) : (
          <Button
            type="primary"
            size="small"
            className={!content.join_url ? styles.disabledBuyBtn : styles.buyBtn}
            disabled={!content.join_url}
            onClick={() => window.open(content.join_url)}
          >
            Join
          </Button>
        )}
      </Space>
    ) : (
      <Space align="center" size="large">
        <Text> {Math.floor(content.duration / 60)} mins </Text>
        <Button type="primary" onClick={redirectToVideoOrderDetails}>
          Watch Now
        </Button>
      </Space>
    );

  const renderModuleContents = (content) => (
    <List.Item key={content.content_id}>
      <Row gutter={[8, 8]} className={styles.w100} align="middle">
        <Col xs={24} md={12}>
          <Space className={styles.w100}>
            {renderContentIcon(content)}
            <Text strong> {content.content_name} </Text>
          </Space>
        </Col>
        <Col xs={24} md={12} className={styles.textAlignRight}>
          <Text type="secondary"> {renderExtraContent(content.content_data, content.content_type)} </Text>
        </Col>
      </Row>
    </List.Item>
  );

  const renderCourseCurriculums = (courseModules = []) => {
    return courseModules.map((courseModule) => (
      <Panel
        key={courseModule.module_id}
        header={<Text className={styles.moduleHeader}> {courseModule.module_name} </Text>}
      >
        <List
          size={isMobileDevice ? 'small' : 'large'}
          rowKey={(record) => record.content_id}
          dataSource={courseModule?.contents}
          renderItem={renderModuleContents}
        />
      </Panel>
    ));
  };

  return (
    <div className={styles.box}>
      <Spin spinning={isLoading} tip="Fetching course order details" size="large">
        {courseOrderDetails && (
          <Row gutter={[4, 4]} className={styles.courseOrderContainer}>
            <Col xs={24} className={styles.mb20}>
              <Button ghost type="primary" size="large" icon={<ArrowLeftOutlined />} onClick={handleBackClicked}>
                Back to my courses
              </Button>
            </Col>
            <Col xs={24}>{renderCourseOrderDetails(courseOrderDetails)}</Col>
            <Col xs={24}>
              <Divider type="horizontal" />
            </Col>
            <Col xs={24} className={styles.courseCurriculumSection}>
              <Row gutter={[8, 10]} justify="center" className={styles.courseCurriculumContainer}>
                <Col xs={24}>
                  <Title level={3} className={styles.courseCurriculumText}>
                    Course curriculum
                  </Title>
                </Col>
                <Col xs={24}>
                  <Collapse
                    ghost
                    expandIconPosition="right"
                    className={styles.courseModules}
                    activeKey={expandedCourseModules}
                    onChange={setExpandedCourseModules}
                    expandIcon={({ isActive }) => (
                      <DownOutlined className={styles.curriculumExpandIcon} rotate={isActive ? 180 : 0} />
                    )}
                  >
                    {renderCourseCurriculums(courseOrderDetails?.modules)}
                  </Collapse>
                </Col>
              </Row>
            </Col>
          </Row>
        )}
      </Spin>
    </div>
  );
};

export default CourseOrderDetails;
