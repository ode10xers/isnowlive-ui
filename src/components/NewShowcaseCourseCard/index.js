import React, { useState, useEffect, useCallback } from 'react';
import ReactHtmlParser from 'react-html-parser';
import classNames from 'classnames';

import { Row, Col, Typography, Button, message, Image, Collapse, List, Space } from 'antd';

import apis from 'apis';

import Loader from 'components/Loader';
import AuthModal from 'components/AuthModal';
import { showPurchaseSingleCourseSuccessModal, showErrorModal, showAlreadyBookedModal } from 'components/Modals/modals';

import dateUtil from 'utils/date';
import { isAPISuccess, orderType, productType, paymentSource, isUnapprovedUserError } from 'utils/helper';

import { useGlobalContext } from 'services/globalContext';

import styles from './styles.module.scss';
import { PlayCircleOutlined, VideoCameraOutlined } from '@ant-design/icons';

const { Text, Title, Paragraph } = Typography;
const { Panel } = Collapse;
const {
  timezoneUtils: { getTimezoneLocation },
} = dateUtil;

const sampleCourseData = {
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
      module_name: 'The first module',
      contents: [
        {
          content_id: 'scooby-dooby-doo',
          content_name: 'First modules first content',
          content_type: 'SESSION',
          // TODO: Confirm later whether it will be inventory/session
          // A sample Session Object (from GET Session API)
          content_data: {
            price: 30,
            currency: 'eur',
            max_participants: 25,
            name: 'Boris',
            description: '<p>test</p>\n',
            session_image_url:
              'https://dkfqbuenrrvge.cloudfront.net/image/1fWsqzwHDwQSwP3l_screenshot from 2021-06-05 20-54-40.png',
            document_urls: [],
            beginning: '2021-07-04T18:30:00Z',
            expiry: '2021-08-31T18:29:59Z',
            prerequisites: '',
            pay_what_you_want: false,
            recurring: true,
            is_refundable: true,
            refund_before_hours: 24,
            user_timezone_offset: 330,
            user_timezone: 'India Standard Time',
            color_code: '#009688',
            is_course: false,
            is_offline: false,
            session_id: 389,
            group: true,
            is_active: true,
            session_external_id: '0112baf0-8406-4fba-96fc-983e84ef6a2c',
            creator_username: 'zeebraman',
            tags: [],
            offline_event_address: '',
            Videos: null,
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
  ],
};

const NewShowcaseCourseCard = () => {
  const { showPaymentPopup } = useGlobalContext();

  // eslint-disable-next-line
  const [isOnAttendeeDashboard, setIsOnAttendeeDashboard] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [shouldFollowUpGetCourse, setShouldFollowUpGetCourse] = useState(false);
  const [course, setCourse] = useState(null);

  const [creatorProfile, setCreatorProfile] = useState(null);
  const [creatorImageUrl, setCreatorImageUrl] = useState(null);

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

  useEffect(() => {
    setCourse(sampleCourseData);
    // TODO: Ideally we should pass this the username from the course details response
    // So we should call this after fetching course details
    getCreatorProfileDetails(sampleCourseData.creator_username);
  }, [getCreatorProfileDetails]);

  // NOTE : This logic is for when it is opened in attendee dashboard
  // currently removing it until it is used
  // useEffect(() => {
  //   if (history && history.location.pathname.includes('dashboard')) {
  //     setIsOnAttendeeDashboard(true);
  //     setSelectedCourse(null);
  //   }
  // }, [history]);

  useEffect(() => {
    if (shouldFollowUpGetCourse) {
      showConfirmPaymentPopup();
    }
    //eslint-disable-next-line
  }, [shouldFollowUpGetCourse]);

  //#region Start of Buy Logics

  const showConfirmPaymentPopup = async () => {
    if (!selectedCourse) {
      showErrorModal('Something went wrong', 'Invalid Course Selected');
      return;
    }

    if (!shouldFollowUpGetCourse) {
      // await getUsableSubscriptionForUser(selectedCourse.id);
      setShouldFollowUpGetCourse(true);
      return;
    } else {
      setShouldFollowUpGetCourse(false);
    }

    let desc = [];

    if (selectedCourse.inventory_ids?.length > 0) {
      desc.push(`${selectedCourse.inventory_ids.length} Sessions`);
    }

    if (selectedCourse.videos?.length > 0) {
      desc.push(`${selectedCourse.videos.length} Videos`);
    }

    let paymentPopupData = {
      productId: selectedCourse.id,
      productType: productType.COURSE,
      itemList: [
        {
          name: selectedCourse.name,
          description: desc.join(', '),
          currency: selectedCourse.currency,
          price: selectedCourse.price,
        },
      ],
    };

    // if (usableUserSubscription) {
    //   paymentPopupData = {
    //     ...paymentPopupData,
    //     paymentInstrumentDetails: {
    //       type: 'SUBSCRIPTION',
    //       ...usableUserSubscription,
    //     },
    //   };

    //   showPaymentPopup(paymentPopupData, buyCourseWithSubscription);
    // } else {
    //   showPaymentPopup(paymentPopupData, buySingleCourse);
    // }

    showPaymentPopup(paymentPopupData, buySingleCourse);
  };

  const buySingleCourse = async (couponCode = '') => {
    if (!selectedCourse) {
      showErrorModal('Something went wrong', 'Invalid Course Selected');
      return;
    }

    setIsLoading(true);

    try {
      const { status, data } = await apis.courses.createOrderForUser({
        course_id: selectedCourse.id,
        price: selectedCourse.price,
        currency: selectedCourse.currency?.toLowerCase(),
        timezone_location: getTimezoneLocation(),
        coupon_code: couponCode,
        payment_source: paymentSource.GATEWAY,
      });

      if (isAPISuccess(status) && data) {
        setSelectedCourse(null);
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

  const openAuthModal = (course) => {
    setSelectedCourse(course);
    setShowAuthModal(true);
  };

  const closeAuthModal = () => {
    setShowAuthModal(false);
  };

  const generateLongDescriptionTemplate = (title, content) => (
    <Row gutter={[8, 16]}>
      <Col xs={24}>
        <Title level={3}> {title} </Title>
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
        className={styles.modulePanel}
        key={courseModule.module_id}
        header={<Text className={styles.moduleHeader}> {courseModule.module_name} </Text>}
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

  const renderCourseFAQs = (faqs = []) => {
    return faqs.map((faq) => (
      <Panel
        className={styles.faqPanel}
        key={faq.question}
        header={<Text className={styles.faqHeader}> {faq.question} </Text>}
      >
        <div className={styles.longContentWrapper}>{ReactHtmlParser(faq.answer)}</div>
      </Panel>
    ));
  };

  return (
    <div className={classNames(isOnAttendeeDashboard ? styles.dashboardPadding : undefined, styles.newCourseDetails)}>
      <AuthModal visible={showAuthModal} closeModal={closeAuthModal} onLoggedInCallback={showConfirmPaymentPopup} />
      <Loader loading={isLoading} text="Processing payment" size="large">
        <Row gutter={[8, 50]}>
          <Col xs={24}>
            <Row
              type="flex"
              align="center"
              style={{
                backgroundPosition: 'center',
                backgroundSize: 'cover',
                backgroundRepeat: 'no-repeat',
                height: '400px',
                boxShadow: 'inset 0 0 0 2000px rgba(0, 0, 0, 0.5)',
                backgroundImage: 'url(' + course?.course_image_url + ')',
              }}
            >
              <Col
                xs={24}
                sm={isOnAttendeeDashboard ? 12 : 8}
                lg={isOnAttendeeDashboard ? 14 : 22}
                className={styles.courseInfoWrapper}
              >
                <Row>
                  <Col
                    xs={24}
                    className={styles.courseNameWrapper}
                    style={{ display: 'inline-flex', justifyContent: 'center', alignItems: 'center' }}
                  >
                    <Text strong className={styles.courseName}>
                      {' '}
                      {course?.course_name}{' '}
                    </Text>
                  </Col>
                  <Col
                    xs={24}
                    className={styles.coursePriceWrapper}
                    style={{ display: 'inline-flex', justifyContent: 'center', alignItems: 'center' }}
                  >
                    <Text strong className={styles.blueText}>
                      {course?.course_price > 0
                        ? `${course?.course_currency?.toUpperCase()} ${course?.course_price}`
                        : 'Free'}
                    </Text>
                  </Col>
                </Row>
                {!isOnAttendeeDashboard && (
                  <Row type="flex" align="center">
                    <Col
                      xs={24}
                      sm={6}
                      lg={4}
                      className={styles.buyButtonWrapper}
                      style={{ display: 'inline-flex', justifyContent: 'center', alignItems: 'center' }}
                    >
                      <Button
                        block
                        className={styles.buyButton}
                        type="primary"
                        onClick={(e) => {
                          e.stopPropagation();
                          openAuthModal(course);
                        }}
                      >
                        Buy Course
                      </Button>
                    </Col>
                  </Row>
                )}
              </Col>
            </Row>
          </Col>
          <Col xs={24}>
            {/* What you'll learn */}
            {generateLongDescriptionTemplate(`What you'll learn`, course?.students_learn)}
          </Col>
          <Col xs={24}>
            {/* Who is this course for */}
            {generateLongDescriptionTemplate('Who is this course for?', course?.who_is_this_for)}
          </Col>
          <Col xs={24}>
            {/* Course Contents */}
            <Row gutter={[8, 20]}>
              <Col xs={24}>
                <Title level={4}>Course curriculum</Title>
              </Col>
              <Col xs={24}>
                <Paragraph>This course is structured into {course?.modules?.length} modules.</Paragraph>
              </Col>
              <Col xs={24}>
                <Collapse
                  ghost
                  className={styles.courseModules}
                  defaultActiveKey={course?.modules.map((courseModule) => courseModule.module_id)}
                >
                  {renderCourseCurriculums(course?.modules)}
                </Collapse>
              </Col>
            </Row>
          </Col>
          <Col xs={24}>
            {/* Know Your Mentor */}
            <Row gutter={[30, 12]}>
              <Col xs={18}>{generateLongDescriptionTemplate('Know your mentor', creatorProfile?.profile?.bio)}</Col>
              <Col xs={6}>
                <Image className={styles.creatorProfileImage} preview={false} src={creatorImageUrl} />
              </Col>
            </Row>
          </Col>
          <Col xs={24}>{/* Preview Images */}</Col>
          <Col xs={24}>{/* Testimonials ? */}</Col>
          <Col xs={24}>
            {/* FAQs */}
            <Row gutter={[8, 20]}>
              <Col xs={24}>
                <Title level={3}>Let us answer all your doubts</Title>
              </Col>
              <Col xs={24}>
                <Collapse
                  ghost
                  className={styles.courseFAQs}
                  defaultActiveKey={course?.faqs.map((faq) => faq.faq_question)}
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

export default NewShowcaseCourseCard;
