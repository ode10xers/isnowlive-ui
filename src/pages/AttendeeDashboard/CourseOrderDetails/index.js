import React, { useState, useEffect, useCallback } from 'react';
import { generatePath } from 'react-router';
import ReactHtmlParser from 'react-html-parser';
import moment from 'moment';

import { Row, Col, Image, Collapse, Button, Divider, List, Typography, Spin, Popover, Space, Card, Tag } from 'antd';
import {
  ArrowLeftOutlined,
  DownOutlined,
  VideoCameraOutlined,
  PlayCircleOutlined,
  FilePdfOutlined,
} from '@ant-design/icons';

import Routes from 'routes';
import apis from 'apis';

import { showErrorModal } from 'components/Modals/modals';
import AddToCalendarButton from 'components/AddToCalendarButton';

import dateUtil from 'utils/date';
import { isMobileDevice } from 'utils/device';
import { redirectToInventoryPage } from 'utils/redirect';
import {
  isAPISuccess,
  isUnapprovedUserError,
  preventDefaults,
  generateUrlFromUsername,
  deepCloneObject,
  videoSourceType,
} from 'utils/helper';
import {
  getCourseDocumentContentCount,
  getCourseOrderSessionContentCount,
  getCourseOrderVideoContentCount,
} from 'utils/course';

import styles from './style.module.scss';
import { attendeeProductOrderTypes } from 'utils/constants';

const { Title, Text } = Typography;
const { Panel } = Collapse;

const {
  formatDate: { toLocaleTime, toLongDateWithDay },
  timeCalculation: { isBeforeDate },
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
                  courseModule.module_content
                    .filter((content) => content.order_id || content.product_type === 'DOCUMENT')
                    .map(async (moduleContent) => {
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

        tempCourseData.course.modules = tempCourseData.course.modules.filter(
          (module) => module.module_content.length > 0
        );
      } catch (error) {
        console.error('Failed fetching course module details');
        console.error(error);
      }
    }

    setCourseOrderDetails(tempCourseData);
    setExpandedCourseModules([tempCourseData.course.modules[0].name]);
  }, []);

  const fetchCourseOrderDetails = useCallback(
    async (courseOrderID) => {
      setIsLoading(true);
      try {
        const { status, data } = await apis.courses.getAttendeeCourses();

        if (isAPISuccess(status) && data) {
          const activeData = data.active;
          const targetCourse = activeData.find((course) => course.course_order_id === courseOrderID);

          fetchCourseContentDetails(targetCourse);
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

  const redirectToDocumentDetails = (content) => {
    history.push(
      Routes.attendeeDashboard.rootPath +
        generatePath(Routes.attendeeDashboard.documentDetails, {
          product_type: attendeeProductOrderTypes.COURSE,
          product_order_id: courseOrderID,
          document_id: content.product_id,
        })
    );
  };

  const renderCourseOrderContent = (courseOrder) => {
    const sessionCount = getCourseOrderSessionContentCount(courseOrder.modules ?? []);
    const videoCount = getCourseOrderVideoContentCount(courseOrder.modules ?? []);
    const docCount = getCourseDocumentContentCount(courseOrder.modules ?? []);

    return (
      <Space>
        {sessionCount > 0 ? <Tag color="blue">{`${sessionCount} sessions`}</Tag> : null}
        {videoCount > 0 ? <Tag color="purple">{`${videoCount} videos`}</Tag> : null}
        {docCount > 0 ? <Tag color="magenta">{`${docCount} files`}</Tag> : null}
      </Space>
    );
  };

  const renderCourseOrderDetails = (orderDetails) => (
    <div className={styles.courseOrderDetailsContainer}>
      <Row gutter={[12, 12]}>
        <Col xs={24} md={12} lg={8}>
          <Image className={styles.courseImage} src={orderDetails?.course.course_image_url} />
        </Col>
        <Col xs={24} md={12} lg={16}>
          <Space direction="vertical">
            <Title level={5} className={styles.courseTitle}>
              {orderDetails.course.name}
            </Title>
            <div className={styles.courseDescription}>{ReactHtmlParser(orderDetails.course.description)}</div>
            {renderCourseOrderContent(orderDetails.course)}
          </Space>
        </Col>
      </Row>
    </div>
  );

  const renderContentIcon = (contentType) =>
    contentType === 'SESSION' ? (
      <VideoCameraOutlined className={styles.blueText} />
    ) : contentType === 'VIDEO' ? (
      <PlayCircleOutlined className={styles.blueText} />
    ) : contentType === 'DOCUMENT' ? (
      <FilePdfOutlined className={styles.blueText} />
    ) : null;

  const renderExtraContent = (content, contentType) =>
    contentType === 'SESSION' ? (
      <Space align="center" size="large">
        <Text>{toLongDateWithDay(content?.product_data?.start_time)}</Text>
        <Text>
          {toLocaleTime(content?.product_data?.start_time)} - {toLocaleTime(content?.product_data?.end_time)}
        </Text>
        <Button ghost type="primary" size="small" onClick={() => redirectToInventoryPage(content?.product_data)}>
          See Details
        </Button>
        <AddToCalendarButton
          eventData={{
            ...content.product_data,
            page_url: `${generateUrlFromUsername(content?.product_data?.creator_username)}/e/${
              content?.product_data?.inventory_id
            }`,
          }}
        />
        {isBeforeDate(content.product_data?.end_time) ? (
          !content?.join_url ? (
            <Popover
              arrowPointAtCenter
              placement="topRight"
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
              disabled={
                !content?.join_url || isBeforeDate(moment(content.product_data?.start_time).subtract(15, 'minutes'))
              }
              onClick={() => window.open(content.join_url)}
            >
              Join
            </Button>
          )
        ) : (
          <Button block type="primary" size="small" disabled={true} className={styles.disabledBuyBtn}>
            Attended
          </Button>
        )}
      </Space>
    ) : contentType === 'VIDEO' ? (
      <Space align="center" size="large">
        {content.product_data?.source === videoSourceType.YOUTUBE ? (
          <Text> Video </Text>
        ) : (
          <Text>{Math.floor((content?.product_data?.duration ?? 0) / 60)} mins </Text>
        )}
        <Button type="primary" onClick={() => redirectToVideoOrderDetails(content)}>
          Watch Now
        </Button>
      </Space>
    ) : contentType === 'DOCUMENT' ? (
      <Button type="primary" onClick={() => redirectToDocumentDetails(content)}>
        View File
      </Button>
    ) : null;

  const renderMobileModuleContent = (content) => (
    <Col xs={24} key={content.product_id}>
      <Card
        title={content.name}
        extra={renderContentIcon(content.product_type)}
        actions={
          content?.product_type === 'SESSION'
            ? [
                <Button
                  ghost
                  type="primary"
                  size="small"
                  onClick={() => redirectToInventoryPage(content?.product_data)}
                >
                  Details
                </Button>,
                <div className={styles.addToCalendarContainer}>
                  <AddToCalendarButton
                    buttonText="Add to Cal"
                    eventData={{
                      ...content?.product_data,
                      page_url: `${generateUrlFromUsername(content?.product_data?.creator_username)}/e/${
                        content?.product_data?.inventory_id
                      }`,
                    }}
                  />
                </div>,
                isBeforeDate(content.product_data?.end_time) ? (
                  content?.product_data?.is_offline ? (
                    <Popover
                      arrowPointAtCenter
                      placement="topRight"
                      trigger="click"
                      title="Event Address"
                      content={content?.product_data?.offline_event_address}
                    >
                      <Button size="small" type="text" className={styles.success}>
                        In person
                      </Button>
                    </Popover>
                  ) : (
                    <Button
                      type="primary"
                      size="small"
                      className={styles.buyBtn}
                      disabled={
                        !content?.join_url ||
                        isBeforeDate(moment(content.product_data?.start_time).subtract(15, 'minutes'))
                      }
                      onClick={() => window.open(content?.join_url)}
                    >
                      Join
                    </Button>
                  )
                ) : (
                  <Button disabled={true} size="small" type="primary" className={styles.disabledBuyBtn}>
                    Attended
                  </Button>
                ),
              ]
            : content?.product_type === 'VIDEO'
            ? [
                <Button type="primary" onClick={() => redirectToVideoOrderDetails(content)}>
                  Watch Now
                </Button>,
              ]
            : content?.product_type === 'DOCUMENT'
            ? [
                <Button type="primary" onClick={() => redirectToDocumentDetails(content)}>
                  View File
                </Button>,
              ]
            : []
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
          ) : content?.product_type === 'VIDEO' ? (
            content.product_data?.source === videoSourceType.YOUTUBE ? (
              <Text> Video </Text>
            ) : (
              <Text>{Math.floor((content?.product_data?.duration ?? 0) / 60)} mins </Text>
            )
          ) : content?.product_type === 'DOCUMENT' ? (
            <Button type="primary" onClick={() => redirectToDocumentDetails(content)}>
              View File
            </Button>
          ) : null}
        </Row>
      </Card>
    </Col>
  );

  const renderModuleContents = (content) => (
    <List.Item key={content.product_id}>
      <Row gutter={[8, 8]} className={styles.w100} align="middle">
        <Col xs={24} md={6} xl={10}>
          <Space className={styles.w100}>
            {renderContentIcon(content.product_type)}
            <Text strong> {content.name} </Text>
          </Space>
        </Col>
        <Col xs={24} md={18} xl={14} className={styles.textAlignRight}>
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
