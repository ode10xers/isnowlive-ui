import React, { useState, useEffect } from 'react';
import { message, Empty } from 'antd';

import apis from 'apis';

import Loader from 'components/Loader';
import CalendarWrapper from 'components/CalendarWrapper';
import PurchaseModal from 'components/PurchaseModal';
import { showAlreadyBookedModal, showBookSingleSessionSuccessModal } from 'components/Modals/modals';

import { isAPISuccess, orderType, productType, paymentSource } from 'utils/helper';
import dateUtil from 'utils/date';

import { useGlobalContext } from 'services/globalContext';

import { getSessionCountByDate } from 'components/CalendarWrapper/helper';

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
  const [purchaseModalVisible, setPurchaseModalVisible] = useState(false);
  const [selectedInventory, setSelectedInventory] = useState(null);

  const profileUsername = window.location.hostname.split('.')[0] || '';

  const getCalendarSessions = async (username) => {
    try {
      setIsSessionLoading(true);
      const UpcomingRes = await apis.user.getSessionsByUsername(username, 'upcoming');
      const PastRes = await apis.user.getSessionsByUsername(username, 'past');
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
        setReadyToPaint(true);
        setIsSessionLoading(false);
      }
    } catch (error) {
      setIsSessionLoading(false);
      message.error('Failed to load user session details');
    }
  };

  const showPurchaseModal = (inventory) => {
    setSelectedInventory(inventory);
    setPurchaseModalVisible(true);
  };

  const onEventBookClick = (event) => {
    showPurchaseModal(event);
  };

  const closePurchaseModal = () => {
    setSelectedInventory(null);
    setPurchaseModalVisible(false);
  };

  const createOrder = async (couponCode = '') => {
    // Currently discount engine has not been implemented for session
    // however this form of createOrder will be what is used to accomodate
    // the new Payment Popup

    // Some front end checks to prevent the logic below from breaking
    if (!selectedInventory) {
      message.error('Invalid session schedule selected');
      return null;
    }

    setIsSessionLoading(true);

    try {
      const payload = {
        inventory_id: selectedInventory.inventory_id,
        user_timezone_offset: new Date().getTimezoneOffset(),
        user_timezone_location: getTimezoneLocation(),
        user_timezone: getCurrentLongTimezone(),
        payment_source: paymentSource.GATEWAY,
      };

      const { status, data } = await apis.session.createOrderForUser(payload);

      if (isAPISuccess(status) && data) {
        setIsSessionLoading(false);
        // Keeping inventory_id since it's needed in confirmation modal
        const inventoryId = selectedInventory.inventory_id;
        setSelectedInventory(null);

        if (data.payment_required) {
          return {
            ...data,
            payment_order_type: orderType.CLASS,
            payment_order_id: data.order_id,
            inventory_id: inventoryId,
          };
        } else {
          showBookSingleSessionSuccessModal(inventoryId);
          return null;
        }
      }
    } catch (error) {
      setIsSessionLoading(false);

      message.error(error.response?.data?.message || 'Something went wrong');

      if (
        error.response?.data?.message === 'It seems you have already booked this session, please check your dashboard'
      ) {
        showAlreadyBookedModal(productType.CLASS);
      } else if (error.response?.data?.message === 'user already has a confirmed order for this pass') {
        showAlreadyBookedModal(productType.PASS);
      }

      return null;
    }
  };

  const showConfirmPaymentPopup = () => {
    if (!selectedInventory) {
      message.error('Invalid session schedule selected');
      return;
    }

    const desc = toLongDateWithTime(selectedInventory.start_time);

    const paymentPopupData = {
      productId: selectedInventory.inventory_id,
      productType: 'SESSION',
      itemList: [
        {
          name: selectedInventory.name,
          description: desc,
          currency: selectedInventory.currency,
          price: selectedInventory.price,
        },
      ],
    };

    showPaymentPopup(paymentPopupData, createOrder);
  };

  useEffect(() => {
    getCalendarSessions(profileUsername);
    // eslint-disable-next-line
  }, [profileUsername]);

  return (
    <Loader loading={isSessionLoading} size="large" text="Loading sessions">
      <PurchaseModal
        visible={purchaseModalVisible}
        closeModal={closePurchaseModal}
        createOrder={showConfirmPaymentPopup}
      />
      {calendarSession.length > 0 && readyToPaint ? (
        <CalendarWrapper
          calendarSessions={calendarSession}
          sessionCountByDate={sessionCountByDate}
          onEventBookClick={onEventBookClick}
        />
      ) : (
        <Empty />
      )}
    </Loader>
  );
};

export default CalendarSessions;
