import React, { useState, useEffect } from 'react';
import classNames from 'classnames';
import { useHistory } from 'react-router-dom';

import { Row, Col, Image, Typography, Button, Tag, Card, message } from 'antd';

import apis from 'apis';

import Loader from 'components/Loader';
import PurchaseModal from 'components/PurchaseModal';
import { showCoursePurchaseSuccessModal, showErrorModal, showAlreadyBookedModal } from 'components/Modals/modals';
import DefaultImage from 'components/Icons/DefaultImage';

import dateUtil from 'utils/date';
import { isMobileDevice } from 'utils/device';
import { isValidFile, isAPISuccess, orderType, courseType, productType } from 'utils/helper';

import { useGlobalContext } from 'services/globalContext';

import styles from './styles.module.scss';

const { Text } = Typography;
const {
  formatDate: { toShortDateWithYear },
  timezoneUtils: { getTimezoneLocation },
} = dateUtil;

const noop = () => {};

//TODO: Compare to LiveCourseCard, if similar then refactor
const ShowcaseCourseCard = ({ courses = null, onCardClick = noop, username = null }) => {
  const history = useHistory();

  const { showPaymentPopup } = useGlobalContext();

  const [isOnAttendeeDashboard, setIsOnAttendeeDashboard] = useState(false);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);

  const openPurchaseModal = (course) => {
    setSelectedCourse(course);
    setShowPurchaseModal(true);
  };

  const closePurchaseModal = () => {
    setSelectedCourse(null);
    setShowPurchaseModal(false);
  };

  useEffect(() => {
    if (history.location.pathname.includes('dashboard')) {
      setIsOnAttendeeDashboard(true);
      setSelectedCourse(null);
    }
  }, [history]);

  const showConfirmPaymentPopup = () => {
    if (!selectedCourse) {
      showErrorModal('Something went wrong', 'Invalid Course Selected');
      return;
    }

    let desc = [];

    if (selectedCourse.inventory_ids?.length > 0) {
      desc.push(`${selectedCourse.inventory_ids.length} Sessions`);
    }

    if (selectedCourse.videos?.length > 0) {
      desc.push(`${selectedCourse.videos.length} Videos`);
    }

    const paymentPopupData = {
      productId: selectedCourse.id,
      productType: 'COURSE',
      itemList: [
        {
          name: selectedCourse.name,
          description: desc.join(', '),
          currency: selectedCourse.currency,
          price: selectedCourse.price,
        },
      ],
    };

    showPaymentPopup(paymentPopupData, createOrder);
  };

  const createOrder = async (userEmail, couponCode = '') => {
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
        payment_source: 'PAYMENT_GATEWAY', // TODO: Need to make payment_source value dynamic - PAYMENT_GATEWAY / SUBSCRIPTION
      });

      if (isAPISuccess(status) && data) {
        if (data.payment_required) {
          return {
            ...data,
            payment_order_type: orderType.COURSE,
            payment_order_id: data.course_order_id,
          };
        } else {
          setIsLoading(false);

          showCoursePurchaseSuccessModal();
          setSelectedCourse(null);
          return null;
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
      } else {
        message.error(error.response?.data?.message || 'Something went wrong');
      }
    }
  };

  return (
    <div
      className={classNames(
        isOnAttendeeDashboard ? styles.dashboardPadding : undefined,
        styles.showcaseCourseCardWrapper
      )}
    >
      <PurchaseModal
        visible={showPurchaseModal}
        closeModal={closePurchaseModal}
        createOrder={showConfirmPaymentPopup}
      />
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
                    <Col xs={24} lg={isOnAttendeeDashboard ? 12 : 10} xl={10} className={styles.courseImageWrapper}>
                      <Image
                        preview={false}
                        height={isMobileDevice ? 100 : 130}
                        className={styles.courseImage}
                        src={isValidFile(course?.course_image_url) ? course?.course_image_url : DefaultImage}
                      />
                    </Col>
                    <Col
                      xs={24}
                      lg={isOnAttendeeDashboard ? 12 : 8}
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
                      <Col xs={24} lg={6} xl={4} className={styles.buyButtonWrapper}>
                        <Button
                          block
                          className={styles.buyButton}
                          type="primary"
                          onClick={(e) => {
                            e.stopPropagation();
                            openPurchaseModal(course);
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
