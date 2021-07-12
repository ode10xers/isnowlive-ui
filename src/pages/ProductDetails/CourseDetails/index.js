import React, { useState, useEffect, useCallback } from 'react';
import ReactHtmlParser from 'react-html-parser';

import { Row, Col, Typography, Button, message, Image, Collapse, List, Space, Carousel } from 'antd';
import {
  PlayCircleOutlined,
  VideoCameraOutlined,
  ScheduleOutlined,
  DownOutlined,
  MinusOutlined,
  PlusOutlined,
} from '@ant-design/icons';

import apis from 'apis';

import Loader from 'components/Loader';
import AuthModal from 'components/AuthModal';
import { showPurchaseSingleCourseSuccessModal, showErrorModal, showAlreadyBookedModal } from 'components/Modals/modals';

import dateUtil from 'utils/date';
import { isMobileDevice } from 'utils/device';
import { getCourseSessionContentCount, getCourseVideoContentCount } from 'utils/course';
import {
  isAPISuccess,
  orderType,
  productType,
  paymentSource,
  isUnapprovedUserError,
  preventDefaults,
  deepCloneObject,
} from 'utils/helper';

import { useGlobalContext } from 'services/globalContext';

import styles from './style.module.scss';

const { Text, Title } = Typography;
const { Panel } = Collapse;
const {
  timezoneUtils: { getTimezoneLocation },
} = dateUtil;

// TODO: Adjust keys here once API is implemented
const CourseDetails = ({ match }) => {
  const courseId = match.params.course_id;

  const { showPaymentPopup } = useGlobalContext();

  const [course, setCourse] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const [creatorProfile, setCreatorProfile] = useState(null);
  const [creatorImageUrl, setCreatorImageUrl] = useState(null);

  const [expandedCourseModules, setExpandedCourseModules] = useState([]);

  const getCreatorProfileDetails = useCallback(async (creatorUsername) => {
    try {
      const { data } = creatorUsername
        ? await apis.user.getProfileByUsername(creatorUsername)
        : await apis.user.getProfile();
      if (data) {
        setCreatorProfile(data);
        setCreatorImageUrl(data.profile_image_url);
        setIsLoading(false);
      }
    } catch (error) {
      console.error(error);
      message.error(error?.response?.data?.message || 'Failed to load profile details');
      setIsLoading(false);
    }
  }, []);

  const fetchCourseContentDetails = useCallback(async (courseData) => {
    let tempCourseData = deepCloneObject(courseData);

    if (courseData.modules?.length > 0) {
      try {
        tempCourseData.modules = await Promise.all(
          courseData.modules.map(async (courseModule) => {
            let tempModuleData = deepCloneObject(courseModule);

            if (courseModule.module_content?.length > 0) {
              try {
                tempModuleData.module_content = await Promise.all(
                  courseModule.module_content.map(async (moduleContent) => {
                    let productData = null;
                    let targetAPI = null;

                    if (moduleContent.product_type.toUpperCase() === 'VIDEO') {
                      targetAPI = apis.videos.getVideoById;
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

    setCourse(tempCourseData);
  }, []);

  const getCourseDetails = useCallback(
    async (courseId) => {
      setIsLoading(true);

      try {
        const { status, data } = await apis.courses.getDetails(courseId);

        if (isAPISuccess(status) && data) {
          setExpandedCourseModules(data.modules.map((courseModule) => courseModule.name));
          if (data.creator_username) {
            getCreatorProfileDetails(data.creator_username);
          }

          await fetchCourseContentDetails(data);
        }
      } catch (error) {
        console.error(error);
        showErrorModal('Failed fetching course details', error?.response?.data?.message || 'Something went wrong.');
      }

      setIsLoading(false);
    },
    [fetchCourseContentDetails, getCreatorProfileDetails]
  );

  useEffect(() => {
    if (courseId) {
      getCourseDetails(courseId);
    }
  }, [getCourseDetails, courseId]);

  //#region Start of Buy Logics

  const showConfirmPaymentPopup = async () => {
    if (!course) {
      showErrorModal('Something went wrong', 'Invalid Course Selected');
      return;
    }

    let desc = [];

    const sessionContentCount = getCourseSessionContentCount(course.modules ?? []);
    const videoContentCount = getCourseVideoContentCount(course.modules ?? []);

    if (sessionContentCount > 0) {
      desc.push(`${sessionContentCount} Sessions`);
    }

    if (videoContentCount > 0) {
      desc.push(`${videoContentCount} Videos`);
    }

    let paymentPopupData = {
      productId: course.id,
      productType: productType.COURSE,
      itemList: [
        {
          name: course.name,
          description: desc.join(', '),
          currency: course.currency,
          price: course.price,
        },
      ],
    };

    showPaymentPopup(paymentPopupData, buySingleCourse);
  };

  const buySingleCourse = async (couponCode = '') => {
    if (!course) {
      showErrorModal('Something went wrong', 'Invalid Course Selected');
      return;
    }

    setIsLoading(true);

    try {
      const { status, data } = await apis.courses.createOrderForUser({
        course_id: course.id,
        price: course.price,
        currency: course.currency?.toLowerCase(),
        timezone_location: getTimezoneLocation(),
        coupon_code: couponCode,
        payment_source: paymentSource.GATEWAY,
      });

      if (isAPISuccess(status) && data) {
        setIsLoading(false);

        if (data.payment_required) {
          return {
            ...data,
            is_successful_order: true,
            payment_order_type: orderType.COURSE,
            payment_order_id: data.course_order_id,
          };
        } else {
          showPurchaseSingleCourseSuccessModal();
          return {
            ...data,
            is_successful_order: true,
          };
        }
      }
    } catch (error) {
      setIsLoading(false);
      if (error?.response?.status === 500 && error?.response?.data?.message === 'unable to apply discount to order') {
        showErrorModal(
          'Discount Code Not Applicable',
          'The discount code you entered is not applicable this product. Please try again with a different discount code'
        );
      } else if (
        error?.response?.status === 500 &&
        error?.response?.data?.message === 'user already has a confirmed order for this course'
      ) {
        showAlreadyBookedModal(productType.COURSE);
      } else if (!isUnapprovedUserError(error.response)) {
        message.error(error.response?.data?.message || 'Something went wrong');
      }
    }

    return {
      is_successful_order: false,
    };
  };

  //#endregion End of Buy Logics

  const closeAuthModal = () => {
    setShowAuthModal(false);
  };

  const handleCourseBuyClicked = (e) => {
    preventDefaults(e);

    if (!course) {
      showErrorModal('Invalid course selected!');
      return;
    }

    setShowAuthModal(true);
  };

  const renderCourseInfoItem = ({ icon, title, content }) => (
    <Col className={styles.textAlignCenter}>
      <Space direction="vertical" size="small" className={styles.courseInfoItem}>
        <Text className={styles.courseInfoContent}> {content} </Text>
        <Space size="small" align="center" className={styles.courseTitleContainer}>
          {icon}
          <Text className={styles.courseInfoTitle}> {title} </Text>
        </Space>
      </Space>
    </Col>
  );

  const renderCourseInfos = (course = null) => {
    if (!course) {
      return null;
    }

    const sessionContentCount = getCourseSessionContentCount(course.modules ?? []);
    const videoContentCount = getCourseVideoContentCount(course.modules ?? []);

    return (
      <Row justify="center" align="middle">
        {sessionContentCount > 0
          ? renderCourseInfoItem({
              icon: <VideoCameraOutlined className={styles.courseInfoIcon} />,
              title: 'Live sessions',
              content: sessionContentCount,
            })
          : null}
        {videoContentCount > 0
          ? renderCourseInfoItem({
              icon: <PlayCircleOutlined className={styles.courseInfoIcon} />,
              title: 'Recorded videos',
              content: videoContentCount,
            })
          : null}
        {renderCourseInfoItem({
          icon: <ScheduleOutlined className={styles.courseInfoIcon} />,
          title: 'Course duration',
          content: `${course?.validity} days`,
        })}
      </Row>
    );
  };

  const generateLongDescriptionTemplate = (title, content) => (
    <Row gutter={[8, 16]}>
      <Col xs={24}>
        <Title level={3} className={styles.longDescriptionTitle}>
          {' '}
          {title}{' '}
        </Title>
      </Col>
      <Col xs={24}>
        <div className={styles.longContentWrapper}>{ReactHtmlParser(content)}</div>
      </Col>
    </Row>
  );

  const renderContentIcon = (productType) =>
    productType.toUpperCase() === 'SESSION' ? (
      <VideoCameraOutlined className={styles.blueText} />
    ) : (
      <PlayCircleOutlined className={styles.blueText} />
    );

  const renderModuleContents = (content) => (
    <List.Item key={content.product_id}>
      <Row gutter={[8, 8]} className={styles.w100} align="middle">
        <Col xs={14} md={18}>
          <Space className={styles.w100}>
            {renderContentIcon(content.product_type)}
            <Text strong> {content.name} </Text>
          </Space>
        </Col>
        <Col xs={10} md={6} className={styles.textAlignRight}>
          <Text type="secondary">
            {' '}
            {content.product_type?.toUpperCase() === 'SESSION'
              ? 'Live session'
              : `${Math.floor((content.product_data?.duration ?? 0) / 60)} mins`}{' '}
          </Text>
        </Col>
      </Row>
    </List.Item>
  );

  const renderCourseCurriculums = (courseModules = []) => {
    return courseModules.map((courseModule) => (
      <Panel key={courseModule.name} header={<Text className={styles.moduleHeader}> {courseModule.name} </Text>}>
        <List
          size={isMobileDevice ? 'small' : 'large'}
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

    // TODO: Currently using index as keys, rethink based on API Implementation
    return carouselItems.map((carouselItem, idx) => (
      <div className={styles.carouselItem} key={idx}>
        <Image.PreviewGroup>
          <Row gutter={[10, 10]}>
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

  return (
    <div className={styles.newCourseDetails}>
      <AuthModal visible={showAuthModal} closeModal={closeAuthModal} onLoggedInCallback={showConfirmPaymentPopup} />
      <Loader loading={isLoading} text="Processing payment" size="large">
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
                      <div className={styles.courseDesc}>{ReactHtmlParser(course?.description)}</div>
                      <Button
                        size="large"
                        type="primary"
                        className={styles.courseBuyBtn}
                        onClick={handleCourseBuyClicked}
                      >
                        {course?.price > 0 ? 'Buy' : 'Get'} course for{' '}
                        {course?.price > 0 ? `${course?.currency?.toUpperCase()} ${course?.price}` : 'Free'}
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
              <Col xs={24}>
                {/* What you'll learn */}
                {generateLongDescriptionTemplate(`What you'll learn`, course?.summary)}
              </Col>
              <Col xs={24}>
                {/* Who is this course for */}
                <Row gutter={[8, 20]} justify="center">
                  <Col xs={24}>
                    <Title level={3} className={styles.longDescriptionTitle}>
                      {' '}
                      Who is this course for?{' '}
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
                                  {' '}
                                  {persona.heading}{' '}
                                </Title>
                                <div className={styles.personaItemContent}>{ReactHtmlParser(persona.description)}</div>
                              </Space>
                            </div>
                          </Col>
                        ))}
                    </Row>
                  </Col>
                </Row>
              </Col>
            </Row>
          </Col>
          <Col xs={24} className={styles.courseCurriculumSection}>
            {/* Course Contents */}
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
          <Col xs={24} className={styles.paddedContent}>
            {/* Know Your Mentor */}
            <Row gutter={[30, 12]} className={styles.mb30}>
              <Col xs={24} md={18}>
                {generateLongDescriptionTemplate('Know your mentor', creatorProfile?.profile?.bio)}
              </Col>
              <Col xs={24} md={6} className={styles.textAlignCenter}>
                <Image className={styles.creatorProfileImage} preview={false} src={creatorImageUrl} />
              </Col>
            </Row>
          </Col>
          <Col xs={24} className={styles.coursePreviewImagesSection}>
            <Title level={5} className={styles.coursePreviewTitle}>
              See what happens inside the course
            </Title>
            {/* Preview Images */}
            <Carousel dots={{ className: styles.carouselDots }} className={styles.coursePreviewImagesContainer}>
              {renderImagePreviews(course?.preview_image_url)}
            </Carousel>
          </Col>
          <Col xs={24} className={styles.courseFAQSection}>
            {/* FAQs */}
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
        </Row>
      </Loader>
    </div>
  );
};

export default CourseDetails;
