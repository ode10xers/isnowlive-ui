import React, { useState, useEffect } from 'react';
import classNames from 'classnames';
import { useHistory } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';

import { Row, Col, Image, Typography, Button, Tag, Card, message } from 'antd';

import config from 'config';
import apis from 'apis';

import Loader from 'components/Loader';
import PurchaseModal from 'components/PurchaseModal';
import { showCourseBookingSuccessModal, showErrorModal } from 'components/Modals/modals';
import DefaultImage from 'components/Icons/DefaultImage';

import dateUtil from 'utils/date';
import { isMobileDevice } from 'utils/device';
import { isValidFile, isAPISuccess, orderType, courseType } from 'utils/helper';

import styles from './styles.module.scss';

const stripePromise = loadStripe(config.stripe.secretKey);

const { Text } = Typography;
const {
  formatDate: { toShortDateWithYear },
  timezoneUtils: { getTimezoneLocation },
} = dateUtil;

const noop = () => {};

const ShowcaseCourseCard = ({ course = null, onCardClick = noop, username = null }) => {
  const history = useHistory();
  const [isOnAttendeeDashboard, setIsOnAttendeeDashboard] = useState(false);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const openPurchaseModal = () => {
    setShowPurchaseModal(true);
  };

  const closePurchaseModal = () => {
    setShowPurchaseModal(false);
  };

  useEffect(() => {
    if (history.location.pathname.includes('dashboard')) {
      setIsOnAttendeeDashboard(true);
    }
  }, [history]);

  const initiatePaymentForOrder = async (orderDetails) => {
    setIsLoading(true);

    try {
      const { status, data } = await apis.payment.createPaymentSessionForOrder({
        order_id: orderDetails.course_order_id,
        order_type: orderType.COURSE,
      });

      if (isAPISuccess(status) && data) {
        const stripe = await stripePromise;

        const result = await stripe.redirectToCheckout({
          sessionId: data.payment_gateway_session_id,
        });

        if (result.error) {
          message.error('Cannot initiate payment at this time, please try again...');
          setIsLoading(false);
        }
      }
    } catch (error) {
      setIsLoading(false);
      message.error(error.response?.data?.message || 'Something went wrong');
    }
  };

  const createOrder = async (userEmail) => {
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
      });

      if (isAPISuccess(status) && data) {
        if (data.payment_required) {
          initiatePaymentForOrder(data);
        } else {
          setIsLoading(false);

          showCourseBookingSuccessModal(userEmail, username);
        }
      }
    } catch (error) {
      setIsLoading(false);
      message.error(error.response?.data?.message || 'Something went wrong');
    }
  };

  return (
    <div
      className={classNames(
        isOnAttendeeDashboard ? styles.dashboardPadding : undefined,
        styles.showcaseCourseCardWrapper
      )}
    >
      <PurchaseModal visible={showPurchaseModal} closeModal={closePurchaseModal} createOrder={createOrder} />
      <Loader loading={isLoading} text="Processing payment" size="large">
        <Card
          className={styles.showcaseCourseCard}
          hoverable={true}
          bordered={true}
          footer={null}
          bodyStyle={{ padding: '10px 10px 0px' }}
          onClick={onCardClick}
        >
          {isMobileDevice ? (
            <Row gutter={[8, 4]}>
              <Col xs={24} className={styles.courseImageWrapper}>
                <Image
                  preview={false}
                  height={100}
                  className={styles.courseImage}
                  src={isValidFile(course?.course_image_url) ? course?.course_image_url : DefaultImage}
                />
              </Col>
              <Col xs={24} className={styles.courseInfoWrapper}>
                <Row gutter={[8, 8]}>
                  <Col xs={24} className={styles.courseNameWrapper}>
                    <Text strong> {course?.name} </Text>
                  </Col>
                  <Col xs={24} className={styles.courseDetailsWrapper}>
                    <Text type="secondary">
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
                      {course?.currency?.toUpperCase()} {course?.price}
                    </Text>
                  </Col>
                </Row>
              </Col>
              {!isOnAttendeeDashboard && (
                <Col xs={24} className={styles.buyButtonWrapper}>
                  <Button
                    block
                    className={styles.buyButton}
                    type="primary"
                    onClick={(e) => {
                      e.stopPropagation();
                      openPurchaseModal();
                    }}
                  >
                    Buy Course
                  </Button>
                </Col>
              )}
            </Row>
          ) : (
            <Row gutter={[16, 8]}>
              <Col xs={24} md={isOnAttendeeDashboard ? 12 : 10} xl={10} className={styles.courseImageWrapper}>
                <Image
                  preview={false}
                  height={130}
                  className={styles.courseImage}
                  src={isValidFile(course?.course_image_url) ? course?.course_image_url : DefaultImage}
                />
              </Col>
              <Col
                xs={24}
                md={isOnAttendeeDashboard ? 12 : 8}
                xl={isOnAttendeeDashboard ? 14 : 10}
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
                      {course?.currency?.toUpperCase()} {course?.price}
                    </Text>
                  </Col>
                </Row>
              </Col>
              {!isOnAttendeeDashboard && (
                <Col xs={24} md={6} xl={4} className={styles.buyButtonWrapper}>
                  <Button
                    block
                    className={styles.buyButton}
                    type="primary"
                    onClick={(e) => {
                      e.stopPropagation();
                      openPurchaseModal();
                    }}
                  >
                    Buy Course
                  </Button>
                </Col>
              )}
            </Row>
          )}
        </Card>
      </Loader>
    </div>
  );
};

export default ShowcaseCourseCard;
