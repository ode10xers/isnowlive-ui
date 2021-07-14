import React, { useState, useEffect, useCallback } from 'react';
import ReactHtmlParser from 'react-html-parser';

import { Row, Col, Image, Collapse, Button, Divider, List, Typography, Spin, Popover, Space, Card, Tag } from 'antd';
import { ArrowLeftOutlined, DownOutlined, VideoCameraOutlined, PlayCircleOutlined } from '@ant-design/icons';

import Routes from 'routes';

import apis from 'apis';

import { showErrorModal } from 'components/Modals/modals';
import AddToCalendarButton from 'components/AddToCalendarButton';

import dateUtil from 'utils/date';
import { isMobileDevice } from 'utils/device';
import { isAPISuccess, isUnapprovedUserError, preventDefaults, generateUrlFromUsername } from 'utils/helper';
import { getCourseSessionDetailsContentCount, getCourseVideoDetailsContentCount } from 'utils/course';

import styles from './style.module.scss';

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
          product_id: 'scooby-dooby-doo',
          name: 'First modules first content',
          product_type: 'SESSION',
          order_data: {
            join_url: null,
            order_id: 'scooby-dooby-doo',
          },
        },
        {
          product_id: '1fcf5295-9ff0-4199-98f6-17ca92dd9e4d',
          name: 'First modules next content',
          product_type: 'VIDEO',
          order_data: {
            join_url: null,
            order_id: 'p9nyqFygbpR5Tae5',
          },
        },
      ],
    },
    {
      module_id: 'module_2',
      module_name: 'Video only module',
      contents: [
        {
          product_id: '7ced2ff4-6b51-4e07-9a24-1622d6473a88',
          name: 'First Video Content',
          product_type: 'VIDEO',
          order_data: {
            join_url: null,
            order_id: '5rzFq50ejB1nvoGZ',
          },
        },
        {
          product_id: '7ced2ff4-6b51-4e07-9a24-1622d6473a88',
          name: 'Next Video Content',
          product_type: 'VIDEO',
          order_data: {
            join_url: null,
            order_id: '5rzFq50ejB1nvoGZ',
          },
        },
      ],
    },
    {
      module_id: 'module_3',
      module_name: 'Session only module',
      contents: [
        {
          product_id: 'scooby-dooby-doo-bi',
          name: 'Session modules first content',
          product_type: 'SESSION',
          order_data: {
            join_url: null,
            order_id: 'scooby-dooby-doo',
          },
        },
        {
          product_id: 'scooby-dooby-doo-ba',
          name: 'Session modules first content',
          product_type: 'SESSION',
          order_data: {
            join_url: 'https://zoom.us/j/97026118970?pwd=ZVUvMldxZ2ZrZ1NBakN2c3dUVDNmUT09',
            order_id: 'scooby-dooby-doo',
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
  const courseId = match.params.course_id;
  const [isLoading, setIsLoading] = useState(false);
  const [courseOrderDetails, setCourseOrderDetails] = useState(null);
  const [expandedCourseModules, setExpandedCourseModules] = useState([]);

  const fetchCourseOrderDetails = useCallback(async (courseId) => {
    setIsLoading(true);
    try {
      const { status, data } = await apis.courses.getAttendeeCourses();

      if (isAPISuccess(status) && data) {
        const activeData = data.active;
        activeData.map((course) => {
          if (course.course_order_id === courseId) {
            setCourseOrderDetails(course);
            //setExpandedCourseModules(course.course.modules?.map((courseModule) => courseModule.module_id) ?? []);
          }
        });

        //setExpandedCourseModules(data.modules?.map((courseModule) => courseModule.module_id) ?? []);
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
    if (courseId) {
      fetchCourseOrderDetails(courseId);
    }
  }, [fetchCourseOrderDetails, courseId]);

  const handleBackClicked = (e) => {
    preventDefaults(e);

    history.push(Routes.attendeeDashboard.rootPath + Routes.attendeeDashboard.courses);
  };

  const redirectToVideoOrderDetails = (content, isExpired = false) => {
    history.push(
      Routes.attendeeDashboard.rootPath +
        Routes.attendeeDashboard.videos +
        `/${content.product_id}/${content.order_id}`,
      { video_order: { ...content, isExpired } }
    );
  };

  const renderCourseOrderContent = (courseOrder) => {
    const sessionCount = getCourseSessionDetailsContentCount(courseOrder.modules);
    const videoCount = getCourseVideoDetailsContentCount(courseOrder.modules);

    return (
      <Space split={<Divider type="vertical" />}>
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
          <Image className={styles.courseImage} src={orderDetails?.course.course_image_url} />
        </Col>
        <Col xs={24} md={12} lg={16}>
          <Space direction="vertical">
            <Title level={5} className={styles.courseTitle}>
              {' '}
              {orderDetails.course.name}{' '}
            </Title>
            <div className={styles.courseDescription}>{ReactHtmlParser(orderDetails.course.description)}</div>
            <Tag color="blue" className={styles.contentTag}>
              {renderCourseOrderContent(orderDetails.course)}
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

  const renderContentIcon = (contentType) =>
    contentType === 'SESSION' ? (
      <VideoCameraOutlined className={styles.blueText} />
    ) : (
      <PlayCircleOutlined className={styles.blueText} />
    );

  // TODO: Reimplement this to be interactive
  const renderExtraContent = (content, contentType) =>
    contentType === 'SESSION' ? (
      <Space align="center" size="large">
        <Text>{/* {toLongDateWithDay(content?.order_data?.start_time)} */}</Text>
        <Text>
          {' '}
          {/* {toLocaleTime(content?.order_data?.start_time)} - {toLocaleTime(content?.order_data?.end_time)}{' '} */}
        </Text>
        <AddToCalendarButton
          iconOnly={true}
          eventData={{
            ...content,
            page_url: `${generateUrlFromUsername(content?.order_data?.username)}/e/${
              content?.order_data?.inventory_id
            }`,
          }}
        />
        {false ? (
          <Popover
            arrowPointAtCenter
            placement="topRight"
            trigger="click"
            title="Event Address"
            content={content.order_data.offline_event_address}
          >
            <Button block size="small" type="text" className={styles.success}>
              In person
            </Button>
          </Popover>
        ) : (
          <Button
            type="primary"
            size="small"
            className={!content?.join_url ? styles.disabledBuyBtn : styles.buyBtn}
            disabled={!content?.join_url}
            onClick={() => window.open(content.join_url)}
          >
            Join
          </Button>
        )}
      </Space>
    ) : (
      <Space align="center" size="large">
        <Text>{/* {Math.floor(content.order_data.duration / 60)} mins  */}</Text>
        <Button type="primary" onClick={() => redirectToVideoOrderDetails(content)}>
          Watch Now
        </Button>
      </Space>
    );

  const renderMobileModuleContent = (content) => (
    <Col xs={24} key={content.product_id}>
      <Card
        title={content.name}
        extra={renderContentIcon(content.product_type)}
        actions={
          content?.product_type === 'SESSION'
            ? [
                <div className={styles.addToCalendarContainer}>
                  <AddToCalendarButton
                    buttonText="Add to Cal"
                    eventData={{
                      ...content?.order_data,
                      page_url: `${generateUrlFromUsername(content?.order_data?.username)}/e/${
                        content?.order_data?.inventory_id
                      }`,
                    }}
                  />
                </div>,
                content?.order_data?.is_offline ? (
                  <Popover
                    arrowPointAtCenter
                    placement="topRight"
                    trigger="click"
                    title="Event Address"
                    content={content?.order_data?.offline_event_address}
                  >
                    <Button block size="small" type="text" className={styles.success}>
                      In person
                    </Button>
                  </Popover>
                ) : (
                  <Button
                    type="primary"
                    block
                    size="small"
                    className={!content?.order_data?.join_url ? styles.disabledBuyBtn : styles.buyBtn}
                    disabled={!content?.order_data?.join_url}
                    onClick={() => window.open(content?.order_data?.join_url)}
                  >
                    Join
                  </Button>
                ),
              ]
            : [
                <Button type="primary" onClick={() => redirectToVideoOrderDetails(content)}>
                  Watch Now
                </Button>,
              ]
        }
      >
        <Row gutter={[4, 10]} align="middle">
          {content?.product_type === 'SESSION' ? (
            <>
              <Col xs={6}> Date </Col>
              <Col xs={18}> : {toLongDateWithDay(content?.order_data?.start_time)} </Col>
              <Col xs={6}> Time </Col>
              <Col xs={18}>
                {' '}
                : {toLocaleTime(content?.order_data?.start_time)} - {toLocaleTime(content?.order_data?.end_time)}{' '}
              </Col>
            </>
          ) : (
            <>
              <Col xs={10}> Duration </Col>
              <Col xs={14}> : {Math.floor(content?.order_data?.duration / 60)} mins </Col>
            </>
          )}
        </Row>
      </Card>
    </Col>
  );

  const renderModuleContents = (content) => (
    <List.Item key={content.product_id}>
      <Row gutter={[8, 8]} className={styles.w100} align="middle">
        <Col xs={24} md={12}>
          <Space className={styles.w100}>
            {renderContentIcon(content.product_type)}
            <Text strong> {content.name} </Text>
          </Space>
        </Col>
        <Col xs={24} md={12} className={styles.textAlignRight}>
          <Text type="secondary"> {renderExtraContent(content, content.product_type)} </Text>
        </Col>
      </Row>
    </List.Item>
  );

  const renderCourseCurriculums = (courseModules = []) => {
    return courseModules.map((courseModule) => (
      <Panel key={courseModule.name} header={<Text className={styles.moduleHeader}> {courseModule.name} </Text>}>
        {isMobileDevice ? (
          <Row gutter={[8, 8]} justify="center" className={styles.mobileCourseModuleContainer}>
            {courseModule?.module_content?.map(renderMobileModuleContent)}
          </Row>
        ) : (
          <List
            size="small"
            rowKey={(record) => record.product_id}
            dataSource={courseModule?.module_content}
            renderItem={renderModuleContents}
          />
        )}
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
                    {renderCourseCurriculums(courseOrderDetails?.course?.modules)}
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
