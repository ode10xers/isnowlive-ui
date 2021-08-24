import React, { useState, useCallback, useEffect } from 'react';
import moment from 'moment';
import ReactHtmlParser from 'react-html-parser';
import classNames from 'classnames';

import { Row, Col, Typography, Button, message, Image, Collapse, List, Space, Carousel } from 'antd';
import {
  PlayCircleOutlined,
  VideoCameraOutlined,
  ScheduleOutlined,
  DownOutlined,
  MinusOutlined,
  PlusOutlined,
  NotificationOutlined,
} from '@ant-design/icons';

import apis from 'apis';
import dummy from 'data/dummy';

import Loader from 'components/Loader';
import { showErrorModal } from 'components/Modals/modals';

import dateUtil from 'utils/date';
import { generateColorPalletteForProfile } from 'utils/colors';
import { getCourseSessionContentCount, getCourseVideoContentCount } from 'utils/course';
import {
  isAPISuccess,
  deepCloneObject,
  preventDefaults,
  reservedDomainName,
  getUsernameFromUrl,
  videoSourceType,
  convertHexToRGB,
  isBrightColorShade,
} from 'utils/helper';

import styles from './style.module.scss';

const { Text, Title } = Typography;
const { Panel } = Collapse;
const {
  formatDate: { toLongDateWithDay, toLocaleTime },
} = dateUtil;

const CourseDetailPreview = ({ match, history }) => {
  const [isLoading, setIsLoading] = useState(false);

  const [creatorProfile, setCreatorProfile] = useState(null);
  const [course, setCourse] = useState(null);

  const [creatorImageUrl, setCreatorImageUrl] = useState(null);

  const [expandedCourseModules, setExpandedCourseModules] = useState([]);

  const fetchCreatorDetails = useCallback(async (creatorUsername) => {
    setIsLoading(true);

    try {
      const { status, data } = await apis.user.getProfileByUsername(creatorUsername);

      if (isAPISuccess(status) && data) {
        setCreatorProfile(data);
        setCreatorImageUrl(data.profile_image_url);
      }
    } catch (error) {
      message.error(error?.response?.data?.message || 'Failed to fetch creator profile');
    }

    setIsLoading(false);
  }, []);

  const fetchCourseContentDetails = useCallback(async (courseData = {}, dataTemplate = 'YOGA') => {
    let tempCourseData = deepCloneObject(courseData);

    const inventoriesData = dummy[dataTemplate].SESSIONS.map((session) =>
      session.inventory.map((inventory) => ({ ...session, ...inventory }))
    ).flat();
    const videosData = dummy[dataTemplate].VIDEOS;

    if (courseData.modules && courseData.modules?.length > 0) {
      try {
        tempCourseData.modules = courseData.modules.map((courseModule) => {
          let tempModuleData = deepCloneObject(courseModule);

          if (courseModule.module_content?.length > 0) {
            try {
              tempModuleData.module_content = courseModule.module_content.map((moduleContent) => {
                let productData = null;

                if (moduleContent.product_type.toUpperCase() === 'VIDEO') {
                  productData = videosData.find((video) => video.external_id === moduleContent.product_id);
                } else if (moduleContent.product_type.toUpperCase() === 'SESSION') {
                  productData = inventoriesData.find(
                    (inventory) => inventory.inventory_external_id === moduleContent.product_id
                  );
                }

                return {
                  ...moduleContent,
                  product_data: productData,
                };
              });
            } catch (error) {
              console.error('Failed fetching course content details');
              console.error(error);
            }
          }

          return tempModuleData;
        });
      } catch (error) {
        console.error('Failed fetching course module details');
        console.error(error);
      }
    }

    setCourse(tempCourseData);
  }, []);

  useEffect(() => {
    const creatorUsername = getUsernameFromUrl();

    if (creatorUsername && !reservedDomainName.includes(creatorUsername)) {
      fetchCreatorDetails(creatorUsername);
    }
  }, [fetchCreatorDetails]);

  useEffect(() => {
    if (match.params.course_id) {
      const templateData = creatorProfile?.profile?.category ?? 'YOGA';

      const targetCourse = dummy[templateData].COURSES.find((course) => course.id === match.params.course_id);

      if (targetCourse) {
        fetchCourseContentDetails(targetCourse, templateData);
      } else {
        message.error('Invalid course ID');
      }
    }
  }, [creatorProfile, match.params, fetchCourseContentDetails]);

  useEffect(() => {
    let profileColorObject = null;
    if (creatorProfile && creatorProfile?.profile?.color) {
      profileColorObject = generateColorPalletteForProfile(
        creatorProfile?.profile?.color,
        creatorProfile?.profile?.new_profile
      );

      Object.entries(profileColorObject).forEach(([key, val]) => {
        document.documentElement.style.setProperty(key, val);
      });
    }

    return () => {
      if (profileColorObject) {
        Object.keys(profileColorObject).forEach((key) => {
          document.documentElement.style.removeProperty(key);
        });
      }
    };
  }, [creatorProfile]);

  //#region Start of UI Render Methods

  const handleCourseBuyClicked = (e) => {
    preventDefaults(e);

    if (!course) {
      showErrorModal('Invalid course selected!');
      return;
    }

    message.info('This page is just a preview, so you cannot buy this product');
  };

  const renderCourseInfoItem = ({ icon, title, content }) => (
    <Space direction="vertical" size="small" className={styles.courseInfoItem}>
      <Text className={styles.courseInfoContent}> {content} </Text>
      <Space size="small" align="center" className={styles.courseTitleContainer}>
        {icon}
        <Text className={styles.courseInfoTitle}> {title} </Text>
      </Space>
    </Space>
  );

  const renderCourseInfos = (course = null) => {
    if (!course) {
      return null;
    }

    const sessionContentCount = getCourseSessionContentCount(course.modules ?? []);
    const videoContentCount = getCourseVideoContentCount(course.modules ?? []);

    return (
      <Row justify="center" align="middle">
        {sessionContentCount > 0 ? (
          <Col xs={{ flex: '1 1 50%' }} md={{ flex: 1 }} className={styles.textAlignCenter}>
            {renderCourseInfoItem({
              icon: <VideoCameraOutlined className={styles.courseInfoIcon} />,
              title: 'Live sessions',
              content: sessionContentCount,
            })}
          </Col>
        ) : null}
        {videoContentCount > 0 ? (
          <Col xs={{ flex: '1 1 50%' }} md={{ flex: 1 }} className={styles.textAlignCenter}>
            {renderCourseInfoItem({
              icon: <PlayCircleOutlined className={styles.courseInfoIcon} />,
              title: 'Recorded videos',
              content: videoContentCount,
            })}
          </Col>
        ) : null}
        <Col xs={{ flex: '1 1 50%' }} md={{ flex: 1 }} className={styles.textAlignCenter}>
          {renderCourseInfoItem({
            icon: <ScheduleOutlined className={styles.courseInfoIcon} />,
            title: 'Course duration',
            content:
              course?.type === 'VIDEO'
                ? `${course?.validity ?? 0} days`
                : `${moment(course?.end_date)
                    .endOf('day')
                    .add(1, 'second')
                    .diff(moment(course.start_date).startOf('day'), 'days')} days`,
          })}
        </Col>
        {course?.type !== 'VIDEO' && (
          <Col xs={{ flex: '1 1 50%' }} md={{ flex: 1 }} className={styles.textAlignCenter}>
            {renderCourseInfoItem({
              icon: <NotificationOutlined className={styles.courseInfoIcon} />,
              title: 'Starts at',
              content: toLongDateWithDay(course?.start_date),
            })}
          </Col>
        )}
      </Row>
    );
  };

  const generateLongDescriptionTemplate = (title, content) => (
    <Row gutter={[8, 16]}>
      <Col xs={24}>
        <Title level={3} className={styles.longDescriptionTitle}>
          {title}
        </Title>
      </Col>
      <Col xs={24}>
        <div className={styles.longContentWrapper}>{ReactHtmlParser(content)}</div>
      </Col>
    </Row>
  );

  const renderContentIcon = (productType) =>
    productType.toUpperCase() === 'SESSION' ? (
      <VideoCameraOutlined className={styles.contentIcon} />
    ) : (
      <PlayCircleOutlined className={styles.contentIcon} />
    );

  const renderContentDetails = (contentData) => {
    switch (contentData.product_type?.toUpperCase()) {
      case 'VIDEO':
        if (contentData.product_data?.source === videoSourceType.YOUTUBE) {
          return <Text type="secondary"> Video </Text>;
        } else {
          return (
            <Text type="secondary">Video : {Math.floor((contentData.product_data?.duration ?? 0) / 60)} mins</Text>
          );
        }
      case 'SESSION':
        return (
          <Space align="center">
            <Text type="secondary">{toLongDateWithDay(contentData?.product_data?.start_time)}</Text>
            <Text type="secondary">
              {toLocaleTime(contentData?.product_data?.start_time)} -{' '}
              {toLocaleTime(contentData?.product_data?.end_time)}
            </Text>
          </Space>
        );
      default:
        break;
    }
  };

  const renderModuleContents = (content) => (
    <List.Item key={content.product_id} className={styles.moduleContentItems}>
      <Row gutter={[8, 8]} className={styles.w100} align="middle">
        <Col xs={24} md={12} lg={14}>
          <Space className={styles.w100}>
            {renderContentIcon(content.product_type)}
            <Text strong className={styles.moduleContentName}>
              {' '}
              {content.name}{' '}
            </Text>
          </Space>
        </Col>
        <Col xs={24} md={12} lg={10} className={styles.textAlignRight}>
          {renderContentDetails(content)}
        </Col>
      </Row>
    </List.Item>
  );

  const renderCourseCurriculums = (courseModules = []) => {
    return courseModules.map((courseModule) => (
      <Panel key={courseModule.name} header={<Text className={styles.moduleHeader}> {courseModule.name} </Text>}>
        <List
          rowKey={(record) => record.content_id}
          dataSource={courseModule?.module_content}
          renderItem={renderModuleContents}
        />
      </Panel>
    ));
  };

  const renderImagePreviews = (imageUrls = []) => {
    const perChunk = 4;
    const carouselItems = imageUrls.reduce((resultArray, item, index) => {
      const chunkIndex = Math.floor(index / perChunk);

      if (!resultArray[chunkIndex]) {
        resultArray[chunkIndex] = []; // start a new chunk
      }

      resultArray[chunkIndex].push(item);

      return resultArray;
    }, []);

    return carouselItems.map((carouselItem, idx) => (
      <div className={styles.carouselItem} key={idx}>
        <Image.PreviewGroup>
          <Row gutter={[10, 10]} justify="center" align="middle">
            {carouselItem.map((imageUrl, imageIndex) => (
              <Col xs={12} md={6} key={`${imageIndex}_${imageUrl}`}>
                <Image width="100%" className={styles.coursePreviewImage} src={imageUrl} />
              </Col>
            ))}
          </Row>
        </Image.PreviewGroup>
      </div>
    ));
  };

  const renderCourseFAQs = (faqs = []) => {
    return faqs.map((faq) => (
      <Panel
        className={styles.faqPanel}
        key={faq.question}
        header={<Text className={styles.faqHeader}> {faq.question} </Text>}
      >
        <div className={styles.faqContentWrapper}>{ReactHtmlParser(faq.answer)}</div>
      </Panel>
    ));
  };

  //#endregion End of UI Render Methods

  return (
    <div className={styles.newCourseDetails}>
      <Loader loading={isLoading} size="large">
        <Row gutter={[8, 50]}>
          <Col xs={24}>
            <Row>
              <Col xs={24}>
                <div className={styles.courseImageContainer}>
                  <Image
                    width="100%"
                    className={styles.courseCoverImage}
                    src={course?.course_image_url}
                    preview={false}
                  />
                  <div className={styles.courseBuyContainer}>
                    <Space direction="vertical" className={styles.courseBuyDetails}>
                      <Title level={3} className={styles.courseName}>
                        {course?.name}
                      </Title>
                      {course?.description && (
                        <div className={styles.courseDesc}>{ReactHtmlParser(course?.description)}</div>
                      )}
                      <Button
                        size="large"
                        type="primary"
                        className={classNames(
                          styles.courseBuyBtn,
                          isBrightColorShade(convertHexToRGB(creatorProfile?.profile?.color ?? '#1890ff'))
                            ? styles.darkText
                            : styles.lightText
                        )}
                        onClick={handleCourseBuyClicked}
                        disabled={!course || (!course.current_capacity && course.type !== 'VIDEO') || !course.modules}
                      >
                        {course?.type !== 'VIDEO' && course?.current_capacity <= 0 ? (
                          `Course has reached max capacity`
                        ) : !course?.modules ? (
                          // NOTE : Empty here means that there is no modules at all
                          // There can be a case where the modules are all outlines
                          `Cannot purchase an empty course`
                        ) : (
                          <>
                            {course?.total_price > 0 ? 'Buy' : 'Get'} course for{' '}
                            {course?.total_price > 0
                              ? `${course?.currency?.toUpperCase()} ${course?.total_price}`
                              : 'Free'}
                          </>
                        )}
                      </Button>
                    </Space>
                  </div>
                </div>
              </Col>
              <Col xs={24}>
                <Row justify="center">
                  <Col className={styles.courseInfoContainer}>{renderCourseInfos(course)}</Col>
                </Row>
              </Col>
            </Row>
          </Col>
          <Col xs={24} className={styles.paddedContent}>
            <Row gutter={[8, 30]}>
              {/* What you'll learn */}
              {course?.summary && course.summary.length > 0 && (
                <Col xs={24}>{generateLongDescriptionTemplate(`What you'll learn`, course?.summary)}</Col>
              )}
              {/* Who is this course for */}
              {course?.topic && course?.topic?.length > 0 && (
                <Col xs={24}>
                  <Row gutter={[8, 20]} justify="center">
                    <Col xs={24}>
                      <Title level={3} className={styles.longDescriptionTitle}>
                        Who is this course for?
                      </Title>
                    </Col>
                    <Col xs={24}>
                      <Row gutter={[12, 12]} justify="center" className={styles.personaContainer}>
                        {course?.topic?.length > 0 &&
                          course?.topic.map((persona) => (
                            <Col xs={24} md={8} key={persona.heading}>
                              <div className={styles.personaItemWrapper}>
                                <Space direction="vertical" size="large" className={styles.personaItem}>
                                  <Title level={5} className={styles.personaItemTitle}>
                                    {persona.heading}
                                  </Title>
                                  <div className={styles.personaItemContent}>
                                    {ReactHtmlParser(persona.description)}
                                  </div>
                                </Space>
                              </div>
                            </Col>
                          ))}
                      </Row>
                    </Col>
                  </Row>
                </Col>
              )}
            </Row>
          </Col>
          {/* Course Contents */}
          {course?.modules && course?.modules?.length > 0 && (
            <Col xs={24} className={styles.courseCurriculumSection}>
              <Row gutter={[8, 20]} justify="center" className={styles.courseCurriculumContainer}>
                <Col>
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
                    {renderCourseCurriculums(course?.modules)}
                  </Collapse>
                </Col>
              </Row>
            </Col>
          )}
          {/* Know Your Mentor */}
          <Col xs={24} className={styles.paddedContent}>
            <Row gutter={[30, 12]} className={styles.mb30}>
              <Col xs={24} md={18}>
                {generateLongDescriptionTemplate('Know your mentor', creatorProfile?.profile?.bio)}
              </Col>
              <Col xs={24} md={6} className={styles.textAlignCenter}>
                <Image className={styles.creatorProfileImage} preview={false} src={creatorImageUrl} />
              </Col>
            </Row>
          </Col>
          {/* Preview Images */}
          {course?.preview_image_url && course?.preview_image_url?.length > 0 && (
            <Col xs={24} className={styles.coursePreviewImagesSection}>
              <Title level={5} className={styles.coursePreviewTitle}>
                See what happens inside the course
              </Title>
              <Carousel dots={{ className: styles.carouselDots }} className={styles.coursePreviewImagesContainer}>
                {renderImagePreviews(course?.preview_image_url)}
              </Carousel>
            </Col>
          )}

          {/* FAQs */}
          {course?.faqs && course.faqs.length > 0 && (
            <Col xs={24} className={styles.courseFAQSection}>
              <Row gutter={[8, 20]} className={styles.courseFAQContainer}>
                <Col xs={24}>
                  <Title level={3} className={styles.longDescriptionTitle}>
                    Let us answer all your doubts
                  </Title>
                </Col>
                <Col xs={24}>
                  <Collapse
                    ghost
                    expandIconPosition="right"
                    className={styles.courseFAQs}
                    defaultActiveKey={course?.faqs.map((faq) => faq.faq_question)}
                    expandIcon={({ isActive }) =>
                      isActive ? (
                        <MinusOutlined className={styles.faqExpandIcon} />
                      ) : (
                        <PlusOutlined className={styles.faqExpandIcon} />
                      )
                    }
                  >
                    {renderCourseFAQs(course?.faqs)}
                  </Collapse>
                </Col>
              </Row>
            </Col>
          )}
        </Row>
      </Loader>
    </div>
  );
};

export default CourseDetailPreview;
