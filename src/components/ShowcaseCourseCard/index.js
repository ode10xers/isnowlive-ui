import React, { useState, useEffect, useCallback } from 'react';
import { useHistory } from 'react-router-dom';
import classNames from 'classnames';

import { Row, Col, Image, Typography, Button, Tag, Card, message } from 'antd';

import apis from 'apis';

import Loader from 'components/Loader';
import AuthModal from 'components/AuthModal';
import DefaultImage from 'components/Icons/DefaultImage';
import {
  showPurchaseSingleCourseSuccessModal,
  showGetCourseWithSubscriptionSuccessModal,
  showErrorModal,
  showAlreadyBookedModal,
} from 'components/Modals/modals';

import dateUtil from 'utils/date';
import { isMobileDevice } from 'utils/device';
import { getLocalUserDetails } from 'utils/storage';
import { redirectToCoursesPage } from 'utils/redirect';
import { orderType, courseType, productType, paymentSource } from 'utils/constants';
import { isValidFile, isAPISuccess, isUnapprovedUserError } from 'utils/helper';

import { useGlobalContext } from 'services/globalContext';

import styles from './styles.module.scss';

const { Text } = Typography;
const {
  formatDate: { toShortDateWithYear },
  timezoneUtils: { getTimezoneLocation },
} = dateUtil;

const ShowcaseCourseCard = ({ courses = null, onCardClick = redirectToCoursesPage }) => {
  const history = useHistory();

  const {
    showPaymentPopup,
    state: { userDetails },
  } = useGlobalContext();

  const [isOnAttendeeDashboard, setIsOnAttendeeDashboard] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [usableUserSubscription, setUsableUserSubscription] = useState(null);
  const [shouldFollowUpGetCourse, setShouldFollowUpGetCourse] = useState(false);

  const getUsableSubscriptionForUser = useCallback(async (courseId) => {
    try {
      const loggedInUserData = getLocalUserDetails();

      if (loggedInUserData) {
        // currently commented out because subscriptions does not support courses
        // const { status, data } = await apis.subscriptions.getUserSubscriptionForCourse(courseId);

        // if (isAPISuccess(status) && data) {
        //   if (data.active.length > 0) {
        //     // Choose a purchased subscription based on these conditions
        //     // 1. Should be usable for Courses
        //     // 2. Still have credits to purchase courses
        //     // 3. This course can be purchased by this subscription
        //     const usableSubscription =
        //       data.active.find(
        //         (subscription) =>
        //           subscription.products['COURSE'] &&
        //           subscription.products['COURSE']?.credits > 0 &&
        //           subscription.products['COURSE']?.product_ids?.includes(courseId)
        //       ) || null;

        //     setUsableUserSubscription(usableSubscription);
        //   } else {
        //     setUsableUserSubscription(null);
        //   }
        // }
        setUsableUserSubscription(null);
      }
    } catch (error) {
      message.error(error?.response?.data?.message || 'Failed fetching usable membership for user');
      setIsLoading(false);
    }
  }, []);

  const openAuthModal = (course) => {
    setSelectedCourse(course);
    setShowAuthModal(true);
  };

  const closeAuthModal = () => {
    setShowAuthModal(false);
  };

  useEffect(() => {
    if (history && history.location.pathname.includes('dashboard')) {
      setIsOnAttendeeDashboard(true);
      setSelectedCourse(null);
    }
  }, [history]);

  useEffect(() => {
    if (shouldFollowUpGetCourse) {
      showConfirmPaymentPopup();
    }
    //eslint-disable-next-line
  }, [shouldFollowUpGetCourse]);

  useEffect(() => {
    if (!userDetails) {
      setUsableUserSubscription(null);
    }
  }, [userDetails]);

  const showConfirmPaymentPopup = async () => {
    if (!selectedCourse) {
      showErrorModal('Something went wrong', 'Invalid Course Selected');
      return;
    }

    if (!shouldFollowUpGetCourse && !usableUserSubscription) {
      await getUsableSubscriptionForUser(selectedCourse.id);
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
          price: selectedCourse.total_price,
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

  //eslint-disable-next-line
  const buyCourseWithSubscription = async () => {
    setIsLoading(true);
    try {
      const { status, data } = await apis.courses.createOrderForUser({
        course_id: selectedCourse.id,
        price: selectedCourse.total_price,
        currency: selectedCourse.currency?.toLowerCase(),
        timezone_location: getTimezoneLocation(),
        payment_source: paymentSource.SUBSCRIPTION,
        source_id: usableUserSubscription.subscription_order_id,
      });

      if (isAPISuccess(status) && data) {
        showGetCourseWithSubscriptionSuccessModal();
        setIsLoading(false);
        setSelectedCourse(null);
        return {
          ...data,
          is_successful_order: true,
        };
      }
    } catch (error) {
      setIsLoading(false);
      if (
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

  const buySingleCourse = async (couponCode = '') => {
    if (!selectedCourse) {
      showErrorModal('Something went wrong', 'Invalid Course Selected');
      return;
    }

    setIsLoading(true);

    try {
      const { status, data } = await apis.courses.createOrderForUser({
        course_id: selectedCourse.id,
        price: selectedCourse.total_price,
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

  return (
    <div
      className={classNames(
        isOnAttendeeDashboard ? styles.dashboardPadding : undefined,
        styles.showcaseCourseCardWrapper
      )}
    >
      <AuthModal visible={showAuthModal} closeModal={closeAuthModal} onLoggedInCallback={showConfirmPaymentPopup} />
      <Loader loading={isLoading} text="Processing payment" size="large">
        <Row gutter={[8, 10]}>
          {courses?.length > 0 &&
            courses.map((course) => (
              <Col xs={24} key={course?.id}>
                <Card
                  className={styles.showcaseCourseCard}
                  hoverable={true}
                  bordered={true}
                  footer={null}
                  bodyStyle={{ padding: '10px' }}
                  onClick={() => onCardClick(course)}
                >
                  <Row gutter={[16, 8]}>
                    <Col xs={24} sm={isOnAttendeeDashboard ? 12 : 10} lg={10} className={styles.courseImageWrapper}>
                      <Image
                        loading="lazy"
                        preview={false}
                        height={isMobileDevice ? 100 : 130}
                        className={styles.courseImage}
                        src={isValidFile(course?.course_image_url) ? course?.course_image_url : DefaultImage}
                      />
                    </Col>
                    <Col
                      xs={24}
                      sm={isOnAttendeeDashboard ? 12 : 8}
                      lg={isOnAttendeeDashboard ? 14 : 10}
                      className={styles.courseInfoWrapper}
                    >
                      <Row gutter={[8, 4]}>
                        <Col xs={24} className={styles.courseNameWrapper}>
                          <Text strong> {course?.name} </Text>
                        </Col>
                        <Col xs={24} className={styles.courseDetailsWrapper}>
                          <Text>
                            {course?.type === courseType.MIXED
                              ? `${toShortDateWithYear(course?.start_date)} - ${toShortDateWithYear(course?.end_date)}`
                              : `Validity: ${course?.validity} days`}
                          </Text>
                        </Col>
                        <Col xs={24} className={styles.courseDetailsWrapper}>
                          {course?.videos?.length > 0 && <Tag color="blue"> {course?.videos?.length} Videos </Tag>}
                          {course?.inventory_ids?.length > 0 && (
                            <Tag color="volcano"> {course?.inventory_ids?.length} Sessions </Tag>
                          )}
                        </Col>
                        <Col xs={24} className={styles.coursePriceWrapper}>
                          <Text strong className={styles.blueText}>
                            {course.total_price > 0
                              ? `${course?.currency?.toUpperCase()} ${course?.total_price}`
                              : 'Free'}
                          </Text>
                        </Col>
                      </Row>
                    </Col>
                    {!isOnAttendeeDashboard && (
                      <Col xs={24} sm={6} lg={4} className={styles.buyButtonWrapper}>
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
                    )}
                  </Row>
                </Card>
              </Col>
            ))}
        </Row>
      </Loader>
    </div>
  );
};

export default ShowcaseCourseCard;
