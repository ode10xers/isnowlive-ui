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
import {
  isAPISuccess,
  isUnapprovedUserError,
  preventDefaults,
  generateUrlFromUsername,
  deepCloneObject,
} from 'utils/helper';
import { getCourseSessionDetailsContentCount, getCourseVideoDetailsContentCount } from 'utils/course';

import styles from './style.module.scss';

const { Title, Text } = Typography;
const { Panel } = Collapse;

const {
  formatDate: { toLocaleTime, toLongDateWithDay },
} = dateUtil;

const CourseOrderDetails = ({ match, history }) => {
  const courseOrderID = match.params.course_id;
  const [isLoading, setIsLoading] = useState(false);
  const [courseOrderDetails, setCourseOrderDetails] = useState(null);
  const [expandedCourseModules, setExpandedCourseModules] = useState([]);

  const fetchCourseContentDetails = useCallback(async (courseData) => {
    let tempCourseData = deepCloneObject(courseData);
    if (courseData.course.modules?.length > 0) {
      try {
        tempCourseData.course.modules = await Promise.all(
          courseData.course.modules.map(async (courseModule) => {
            let tempModuleData = deepCloneObject(courseModule);

            if (courseModule.module_content?.length > 0) {
              try {
                tempModuleData.module_content = await Promise.all(
                  courseModule.module_content.map(async (moduleContent) => {
                    let productData = null;
                    let targetAPI = null;

                    if (moduleContent.product_type.toUpperCase() === 'VIDEO') {
                      targetAPI = apis.videos.getVideoById;
                    } else if (moduleContent.product_type.toUpperCase() === 'SESSION') {
                      targetAPI = apis.session.getInventoryDetailsByExternalId;
                    }

                    if (targetAPI) {
                      try {
                        const { status, data } = await targetAPI(moduleContent.product_id);

                        if (isAPISuccess(status) && data) {
                          productData = data;
                        }
                      } catch (error) {
                        console.error('Failed fetching product details for content');
                        console.error(error);
                      }
                    }

                    return {
                      ...moduleContent,
                      product_data: productData,
                    };
                  })
                );
              } catch (error) {
                console.error('Failed fetching course content details');
                console.error(error);
              }
            }

            return tempModuleData;
          })
        );
      } catch (error) {
        console.error('Failed fetching course module details');
        console.error(error);
      }
    }

    setCourseOrderDetails(tempCourseData);
  }, []);

  const fetchCourseOrderDetails = useCallback(
    async (courseOrderID) => {
      setIsLoading(true);
      try {
        const { status, data } = await apis.courses.getAttendeeCourses();

        if (isAPISuccess(status) && data) {
          const activeData = data.active;
          activeData.forEach((course) => {
            if (course.course_order_id === courseOrderID) {
              setCourseOrderDetails(course);
              fetchCourseContentDetails(course);
            }
          });
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
    },
    [fetchCourseContentDetails]
  );

  useEffect(() => {
    if (courseOrderID) {
      fetchCourseOrderDetails(courseOrderID);
    }
  }, [fetchCourseOrderDetails, courseOrderID]);

  const handleBackClicked = (e) => {
    preventDefaults(e);

    history.push(Routes.attendeeDashboard.rootPath + Routes.attendeeDashboard.courses);
  };

  const redirectToVideoOrderDetails = (content, isExpired = false) => {
    history.push(
      Routes.attendeeDashboard.rootPath + Routes.attendeeDashboard.videos + `/${content.product_id}/${content.order_id}`
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
        <Text>{toLongDateWithDay(content?.product_data?.start_time)}</Text>
        <Text>
          {' '}
          {toLocaleTime(content?.product_data?.start_time)} - {toLocaleTime(content?.product_data?.end_time)}{' '}
        </Text>
        <AddToCalendarButton
          iconOnly={true}
          eventData={{
            ...content.product_data,
            page_url: `${generateUrlFromUsername(content?.product_data?.username)}/e/${
              content?.product_data?.inventory_id
            }`,
          }}
        />
        {!content?.join_url ? (
          <Popover
            arrowPointAtCenter
            placement="topRight"
            trigger="click"
            title="Event Address"
            content={content.product_data.offline_event_address}
          >
            <Button block size="small" type="text" className={styles.success}>
              In person
            </Button>
          </Popover>
        ) : (
          <Button
            type="primary"
            size="small"
            className={styles.buyBtn}
            disabled={!content?.join_url}
            onClick={() => window.open(content.join_url)}
          >
            Join
          </Button>
        )}
      </Space>
    ) : (
      <Space align="center" size="large">
        <Text>{Math.floor((content?.product_data?.duration ?? 0) / 60)} mins </Text>
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
                      ...content?.product_data,
                      page_url: `${generateUrlFromUsername(content?.product_data?.username)}/e/${
                        content?.product_data?.inventory_id
                      }`,
                    }}
                  />
                </div>,
                content?.product_data?.is_offline ? (
                  <Popover
                    arrowPointAtCenter
                    placement="topRight"
                    trigger="click"
                    title="Event Address"
                    content={content?.product_data?.offline_event_address}
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
                    className={!content?.product_data?.join_url ? styles.disabledBuyBtn : styles.buyBtn}
                    disabled={!content?.product_data?.join_url}
                    onClick={() => window.open(content?.product_data?.join_url)}
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
              <Col xs={18}> : {toLongDateWithDay(content?.product_data?.start_time)} </Col>
              <Col xs={6}> Time </Col>
              <Col xs={18}>
                {' '}
                : {toLocaleTime(content?.product_data?.start_time)} - {toLocaleTime(content?.product_data?.end_time)}{' '}
              </Col>
            </>
          ) : (
            <>
              <Col xs={10}> Duration </Col>
              <Col xs={14}> : {Math.floor(content?.product_data?.duration ?? 0) / 60} mins </Col>
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
