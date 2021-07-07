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
import {
  isAPISuccess,
  orderType,
  productType,
  paymentSource,
  isUnapprovedUserError,
  preventDefaults,
} from 'utils/helper';

import { useGlobalContext } from 'services/globalContext';

import styles from './style.module.scss';

const { Text, Title } = Typography;
const { Panel } = Collapse;
const {
  timezoneUtils: { getTimezoneLocation },
} = dateUtil;

// Session data here should be
const sampleCourseData = {
  course_id: 'albuquerque-sera-sera',
  course_image_url:
    'https://dkfqbuenrrvge.cloudfront.net/image/1fWsqzwHDwQSwP3l_screenshot from 2021-06-05 20-54-40.png',
  course_name: 'Why hello there its a course',
  creator_username: 'ellianto',
  course_duration: 10,
  course_price: 75,
  course_currency: 'SGD',
  course_description: '<p>Sample course description will show up here</p>\n',
  students_learn:
    '<p>What the students will learn will show up here</p>\n<p> This is just a sample text to show how it will be populated </p>',
  who_is_this_for:
    '<p>What the students will learn will show up here</p>\n<p> This is just a sample text to show how it will be populated </p>',
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
  preview_images: [
    'https://dkfqbuenrrvge.cloudfront.net/image/1fWsqzwHDwQSwP3l_screenshot from 2021-06-05 20-54-40.png',
    'https://dkfqbuenrrvge.cloudfront.net/image/1fWsqzwHDwQSwP3l_screenshot from 2021-06-05 20-54-40.png',
    'https://dkfqbuenrrvge.cloudfront.net/image/1fWsqzwHDwQSwP3l_screenshot from 2021-06-05 20-54-40.png',
    'https://dkfqbuenrrvge.cloudfront.net/image/1fWsqzwHDwQSwP3l_screenshot from 2021-06-05 20-54-40.png',
    'https://dkfqbuenrrvge.cloudfront.net/image/1fWsqzwHDwQSwP3l_screenshot from 2021-06-05 20-54-40.png',
  ],
  faqs: [
    {
      question: 'What does the fox say?',
      answer: '<p>The quick brown fox</p>\n',
    },
    {
      question: 'Wake me up?',
      answer: '<p>Wake me up inside</p>\n',
    },
    {
      question: 'Never gonna?',
      answer: '<p>Give you up</p>\n',
    },
  ],
};
// TODO: Can move these into generic helper
const getCourseSessionContentCount = (courseModules = []) =>
  courseModules.reduce(
    (acc, module) => (acc += module.contents.filter((content) => content.content_type === 'SESSION').length ?? 0),
    0
  );
const getCourseVideoContentCount = (courseModules = []) =>
  courseModules.reduce(
    (acc, module) => (acc += module.contents.filter((content) => content.content_type === 'VIDEO').length ?? 0),
    0
  );

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
      message.error('Failed to load profile details');
      setIsLoading(false);
    }
  }, []);

  const getCourseDetails = useCallback(
    async (courseId) => {
      setIsLoading(true);

      try {
        // TODO: Implement API Here when ready
        // const { status, data } = await apis.courses.getDetails(courseId);
        const { status, data } = {
          status: 200,
          data: sampleCourseData,
        };

        if (isAPISuccess(status) && data) {
          setCourse(data);
          setExpandedCourseModules(data.modules.map((courseModule) => courseModule.module_id));
          if (data.creator_username) {
            getCreatorProfileDetails(data.creator_username);
          }
        }
      } catch (error) {
        console.error(error);
        showErrorModal('Failed fetching course details', error?.response?.data?.message || 'Something went wrong.');
      }

      setIsLoading(false);
    },
    [getCreatorProfileDetails]
  );

  useEffect(() => {
    console.log(courseId);
    if (courseId) {
      getCourseDetails(courseId);
    }
  }, [getCourseDetails, courseId]);

  // NOTE : This logic is for when it is opened in attendee dashboard
  // currently removing it until it is used
  // useEffect(() => {
  //   if (history && history.location.pathname.includes('dashboard')) {
  //     setIsOnAttendeeDashboard(true);
  //     setSelectedCourse(null);
  //   }
  // }, [history]);

  //#region Start of Buy Logics

  const showConfirmPaymentPopup = async () => {
    if (!course) {
      showErrorModal('Something went wrong', 'Invalid Course Selected');
      return;
    }

    let desc = [];

    // if (selectedCourse.inventory_ids?.length > 0) {
    //   desc.push(`${selectedCourse.inventory_ids.length} Sessions`);
    // }

    // if (selectedCourse.videos?.length > 0) {
    //   desc.push(`${selectedCourse.videos.length} Videos`);
    // }

    const sessionContentCount = getCourseSessionContentCount(course.modules ?? []);
    const videoContentCount = getCourseVideoContentCount(course.modules ?? []);

    if (sessionContentCount > 0) {
      desc.push(`${sessionContentCount} Sessions`);
    }

    if (videoContentCount > 0) {
      desc.push(`${videoContentCount} Videos`);
    }

    let paymentPopupData = {
      productId: course.course_id,
      productType: productType.COURSE,
      itemList: [
        {
          name: course.course_name,
          description: desc.join(', '),
          currency: course.course_currency,
          price: course.course_price,
        },
      ],
    };

    console.log(paymentPopupData);
    return;

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
        course_id: course.course_id,
        price: course.course_price,
        currency: course.course_currency?.toLowerCase(),
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
      <Space size="large" align="center">
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
          content: `${course?.course_duration} days`,
        })}
      </Space>
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

  const renderExtraContent = (content) =>
    content.content_type === 'SESSION' ? 'Live session' : `${Math.floor(content.content_data.duration / 60)} mins`;

  const renderContentIcon = (content) =>
    content.content_type === 'SESSION' ? (
      <VideoCameraOutlined className={styles.blueText} />
    ) : (
      <PlayCircleOutlined className={styles.blueText} />
    );

  const renderModuleContents = (content) => (
    <List.Item key={content.content_id} extra={<Text type="secondary"> {renderExtraContent(content)} </Text>}>
      <Space size="large">
        {renderContentIcon(content)}
        <Text strong> {content.content_name} </Text>
      </Space>
    </List.Item>
  );

  const renderCourseCurriculums = (courseModules = []) => {
    return courseModules.map((courseModule) => (
      <Panel
        key={courseModule.module_id}
        header={<Text className={styles.moduleHeader}> {courseModule.module_name} </Text>}
        extra={<Text className={styles.moduleHeader}> {courseModule.contents?.length} activities </Text>}
      >
        <List
          size="large"
          rowKey={(record) => record.content_id}
          dataSource={courseModule?.contents}
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
          <Row gutter={[10, 10]}>
            {carouselItem.map((imageUrl, imageIndex) => (
              <Col xs={6} key={`${imageIndex}_${imageUrl}`}>
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
                        {' '}
                        {course?.course_name}{' '}
                      </Title>
                      <div className={styles.courseDesc}>{ReactHtmlParser(course?.course_description)}</div>
                      <Button
                        size="large"
                        type="primary"
                        className={styles.courseBuyBtn}
                        onClick={handleCourseBuyClicked}
                      >
                        {course?.course_price > 0 ? 'Buy' : 'Get'} course for{' '}
                        {course?.course_price > 0
                          ? `${course?.course_currency?.toUpperCase()} ${course?.course_price}`
                          : 'Free'}
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
                {generateLongDescriptionTemplate(`What you'll learn`, course?.students_learn)}
              </Col>
              <Col xs={24}>
                {/* Who is this course for */}
                {generateLongDescriptionTemplate('Who is this course for?', course?.who_is_this_for)}
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
            <Row gutter={[30, 12]}>
              <Col xs={18}>{generateLongDescriptionTemplate('Know your mentor', creatorProfile?.profile?.bio)}</Col>
              <Col xs={6}>
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
              {renderImagePreviews(course?.preview_images)}
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
