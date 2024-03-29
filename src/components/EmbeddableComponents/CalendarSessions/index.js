import React, { useState, useEffect } from 'react';
import { message, Empty, Typography, Row, Col } from 'antd';

import apis from 'apis';

import Loader from 'components/Loader';
import AuthModal from 'components/AuthModal';
import CalendarWrapper from 'components/CalendarWrapper';
import { getSessionCountByDate } from 'components/CalendarWrapper/helper';
import { showAlreadyBookedModal, showBookSingleSessionSuccessModal } from 'components/Modals/modals';

import dateUtil from 'utils/date';
import { isAPISuccess, isUnapprovedUserError } from 'utils/helper';
import { orderType, productType, paymentSource } from 'utils/constants';

import { useGlobalContext } from 'services/globalContext';

import styles from './style.module.scss';
// const logo = require('assets/images/Logo-passion-transparent.png');

const { Text } = Typography;
const {
  formatDate: { toLongDateWithTime },
  timezoneUtils: { getCurrentLongTimezone, getTimezoneLocation },
} = dateUtil;

const CalendarSessions = () => {
  const { showPaymentPopup } = useGlobalContext();

  const [isSessionLoading, setIsSessionLoading] = useState(true);
  const [calendarSession, setCalendarSession] = useState([]);
  const [readyToPaint, setReadyToPaint] = useState(false);
  const [sessionCountByDate, setSessionCountByDate] = useState({});
  const [purchaseModalVisible, setAuthModalVisible] = useState(false);
  const [selectedInventory, setSelectedInventory] = useState(null);
  const [calendarStartDate, setCalendarStartDate] = useState(new Date());

  const getCalendarSessions = async () => {
    try {
      setIsSessionLoading(true);
      const UpcomingRes = await apis.user.getSessionsByUsername('upcoming');
      const PastRes = await apis.user.getSessionsByUsername('past');
      if (isAPISuccess(UpcomingRes.status) && isAPISuccess(PastRes.status)) {
        setReadyToPaint(false);
        const res = getSessionCountByDate([...UpcomingRes.data, ...PastRes.data]);
        setSessionCountByDate(res);
        setCalendarSession([
          ...UpcomingRes.data.map((upcomingSessions) => ({
            ...upcomingSessions,
            isPast: false,
          })),
          ...PastRes.data.map((pastSessions) => ({
            ...pastSessions,
            isPast: true,
          })),
        ]);
        if (UpcomingRes.data.length > 0) {
          setCalendarStartDate(new Date(UpcomingRes.data[0].start_time));
        }
        setReadyToPaint(true);
        setIsSessionLoading(false);
      }
    } catch (error) {
      setIsSessionLoading(false);
      message.error('Failed to load user session details');
    }
  };

  const showAuthModal = (inventory) => {
    setSelectedInventory(inventory);
    setAuthModalVisible(true);
  };

  const onEventBookClick = (event) => {
    showAuthModal(event);
  };

  const closeAuthModal = () => {
    setSelectedInventory(null);
    setAuthModalVisible(false);
  };

  const createOrder = async (couponCode = '', priceAmount = 5) => {
    // Currently discount engine has not been implemented for session
    // however this form of createOrder will be what is used to accommodate
    // the new Payment Popup

    // Some front end checks to prevent the logic below from breaking
    if (!selectedInventory) {
      message.error('Invalid session schedule selected');
      return null;
    }

    setIsSessionLoading(true);

    try {
      let payload = {
        inventory_id: selectedInventory.inventory_id,
        user_timezone_offset: new Date().getTimezoneOffset(),
        user_timezone_location: getTimezoneLocation(),
        user_timezone: getCurrentLongTimezone(),
        coupon_code: couponCode,
        payment_source: paymentSource.GATEWAY,
      };

      if (selectedInventory.pay_what_you_want) {
        payload = { ...payload, amount: priceAmount };
      }

      const { status, data } = await apis.session.createOrderForUser(payload);

      if (isAPISuccess(status) && data) {
        setIsSessionLoading(false);
        // Keeping inventory_id since it's needed in confirmation modal
        const inventoryId = selectedInventory.inventory_id;
        setSelectedInventory(null);

        if (data.payment_required) {
          return {
            ...data,
            is_successful_order: true,
            payment_order_type: orderType.CLASS,
            payment_order_id: data.order_id,
            inventory_id: inventoryId,
          };
        } else {
          showBookSingleSessionSuccessModal(inventoryId);
          return {
            ...data,
            is_successful_order: false,
          };
        }
      }
    } catch (error) {
      setIsSessionLoading(false);

      if (
        error.response?.data?.message === 'It seems you have already booked this session, please check your dashboard'
      ) {
        showAlreadyBookedModal(productType.CLASS);
      } else if (error.response?.data?.message === 'user already has a confirmed order for this pass') {
        showAlreadyBookedModal(productType.PASS);
      } else if (!isUnapprovedUserError(error.response)) {
        message.error(error.response?.data?.message || 'Something went wrong');
      }
    }

    return {
      is_successful_order: false,
    };
  };

  const showConfirmPaymentPopup = () => {
    if (!selectedInventory) {
      message.error('Invalid session schedule selected');
      return;
    }

    const desc = toLongDateWithTime(selectedInventory.start_time);

    let flexiblePaymentDetails = null;

    if (selectedInventory.pay_what_you_want) {
      flexiblePaymentDetails = {
        enabled: true,
        minimumPrice: selectedInventory.total_price,
      };
    }

    const paymentPopupData = {
      productId: selectedInventory.session_external_id,
      productType: productType.CLASS,
      itemList: [
        {
          name: selectedInventory.name,
          description: desc,
          currency: selectedInventory.currency,
          price: selectedInventory.total_price,
          pay_what_you_want: selectedInventory.pay_what_you_want,
        },
      ],
      flexiblePaymentDetails,
    };

    showPaymentPopup(paymentPopupData, createOrder);
  };

  useEffect(() => {
    getCalendarSessions();

    document.body.style.backgroundColor = 'transparent';
    // eslint-disable-next-line
  }, []);

  return (
    <div className={styles.calendarSessionPluginContainer}>
      <Loader loading={isSessionLoading} size="large" text="Loading sessions">
        <AuthModal
          visible={purchaseModalVisible}
          closeModal={closeAuthModal}
          onLoggedInCallback={showConfirmPaymentPopup}
        />
        {calendarSession.length > 0 && readyToPaint ? (
          <>
            <Row>
              <Col xs={24}>
                <Text type="primary" className={styles.timezoneHelpText}>
                  All event times shown below are in your local time zone ({getCurrentLongTimezone()})
                </Text>
              </Col>
            </Row>

            <CalendarWrapper
              calendarSessions={calendarSession}
              sessionCountByDate={sessionCountByDate}
              onEventBookClick={onEventBookClick}
              startDate={calendarStartDate}
            />
          </>
        ) : (
          <Empty />
        )}
      </Loader>
    </div>
  );
};

export default CalendarSessions;
