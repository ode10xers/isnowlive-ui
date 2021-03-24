import React, { useState, useEffect } from 'react';
import { message, Empty } from 'antd';
import { loadStripe } from '@stripe/stripe-js';

import config from 'config';
import apis from 'apis';

import Loader from 'components/Loader';
import CalendarView from 'components/CalendarView';
import PurchaseModal from 'components/PurchaseModal';
import { showBookingSuccessModal, showAlreadyBookedModal } from 'components/Modals/modals';

import { generateUrlFromUsername, isAPISuccess, orderType, productType, paymentSource } from 'utils/helper';
import dateUtil from 'utils/date';

import { useGlobalContext } from 'services/globalContext';

// eslint-disable-next-line
import styles from './styles.scss';

const stripePromise = loadStripe(config.stripe.secretKey);

const {
  formatDate: { toLocaleTime },
  timezoneUtils: { getCurrentLongTimezone, getTimezoneLocation },
} = dateUtil;

function generateLightColorHex() {
  let color = '#';
  for (let i = 0; i < 3; i++)
    color += ('0' + Math.floor(((1 + Math.random()) * Math.pow(16, 2)) / 2).toString(16)).slice(-2);
  return color;
}

function getDarkColor() {
  var color = '#';
  for (var i = 0; i < 6; i++) {
    color += Math.floor(Math.random() * 10);
  }
  return color;
}

const CalendarSessions = () => {
  const { showPaymentPopup } = useGlobalContext();

  const [isSessionLoading, setIsSessionLoading] = useState(true);
  const [calendarSession, setCalendarSession] = useState([]);
  const [calendarView, setCalendarView] = useState('month');
  const [readyToPaint, setReadyToPaint] = useState(false);
  const [sessionCountByDate, setSessionCountByDate] = useState({});
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [purchaseModalVisible, setPurchaseModalVisible] = useState(false);
  const [selectedInventory, setSelectedInventory] = useState(null);

  const profileUsername = window.location.hostname.split('.')[0] || '';

  const redirectToSessionsPage = (session) => {
    const baseUrl = generateUrlFromUsername(session.username || 'app');
    window.open(`${baseUrl}/s/${session.session_id}`);
  };

  const onViewChange = (e) => {
    setCalendarView(e);
  };

  const getSessionCountByDate = (allEvents) => {
    const eventsPerDay = {};
    setReadyToPaint(false);
    allEvents.forEach((event) => {
      if (eventsPerDay[event.session_date]) {
        const tempVal = eventsPerDay[event.session_date];
        if (!tempVal.includes(event.inventory_id)) {
          const updatedVal = [...tempVal, event.inventory_id];
          eventsPerDay[event.session_date] = updatedVal;
        }
      } else {
        eventsPerDay[event.session_date] = [event.inventory_id];
      }
    });
    return eventsPerDay;
  };

  const getCalendarSessions = async (username) => {
    try {
      setIsSessionLoading(true);
      const UpcomingRes = await apis.user.getSessionsByUsername(username, 'upcoming');
      const PastRes = await apis.user.getSessionsByUsername(username, 'past');
      if (isAPISuccess(UpcomingRes.status) && isAPISuccess(PastRes.status)) {
        const res = getSessionCountByDate([...UpcomingRes.data, ...PastRes.data]);
        setSessionCountByDate(res);
        setCalendarSession([...UpcomingRes.data, ...PastRes.data]);
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

  const closePurchaseModal = () => {
    setSelectedInventory(null);
    setPurchaseModalVisible(false);
  };

  // Used to fetch order details, which will then gets
  // passed to confirmation modal
  const getAttendeeOrderDetails = async (orderId) => {
    try {
      const { status, data } = await apis.session.getAttendeeUpcomingSession();

      if (isAPISuccess(status) && data) {
        return data.find((orderDetails) => orderDetails.order_id === orderId);
      }
    } catch (error) {
      console.error(error?.response?.data?.message || 'Failed to fetch attendee order details');
    }

    return null;
  };

  const initiatePaymentForOrder = async (payload) => {
    try {
      const { status, data } = await apis.payment.createPaymentSessionForOrder(payload);

      if (isAPISuccess(status) && data) {
        const stripe = await stripePromise;
        const result = await stripe.redirectToCheckout({
          sessionId: data.payment_gateway_session_id,
        });

        if (result.error) {
          message.error('Cannot initiate payment at this time, please try again...');
        }
      }
    } catch (error) {
      message.error(error.response?.data?.message || 'Something went wrong');
    }
  };

  const createOrder = async (userEmail, couponCode = '') => {
    // Currently discount engine has not been implemented for session
    // however this form of createOrder will be what is used to accomodate
    // the new Payment Popup

    if (!selectedInventory) {
      message.error('Invalid session schedule selected');
      return;
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
        if (data.payment_required) {
          initiatePaymentForOrder({
            order_id: data.order_id,
            order_type: orderType.CLASS,
          });
        } else {
          const orderDetails = await getAttendeeOrderDetails(data.order_id);
          showBookingSuccessModal(userEmail, null, false, false, profileUsername, orderDetails);

          setSelectedInventory(null);
        }
      }
    } catch (error) {
      message.error(error.response?.data?.message || 'Something went wrong');

      if (
        error.response?.data?.message === 'It seems you have already booked this session, please check your dashboard'
      ) {
        showAlreadyBookedModal(productType.CLASS, profileUsername);
      } else if (error.response?.data?.message === 'user already has a confirmed order for this pass') {
        showAlreadyBookedModal(productType.PASS, profileUsername);
      }
    }

    setIsSessionLoading(false);
  };

  const showConfirmPaymentPopup = () => {
    if (!selectedInventory) {
      message.error('Invalid session schedule selected');
      return;
    }

    const desc = '';

    const paymentPopupData = {
      productId: selectedInventory.inventory_id,
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

  function Event(props) {
    const onBookClick = (e) => {
      e.stopPropagation();
      console.log(event);
      showPurchaseModal(event);
    };

    const { event } = props;

    const borderColor = generateLightColorHex();

    if (calendarView === 'month' || calendarView === 'agenda') {
      const totalSessionThisDay = sessionCountByDate[event?.session_date] || 0;

      const onMobileDateCellClick = (e) => {
        const [y, m, d] = event.session_date.split('-');
        setCalendarDate(new Date(y, m - 1, d));
        setCalendarView('day');
        e.stopPropagation();
      };

      const bgColor = getDarkColor();

      return (
        <>
          <div
            className="custom-event-container custom-month-event-container"
            style={{ border: `2px solid ${borderColor}` }}
          >
            <span className="event-title">{event.name}</span>
            <span className="event-time">{toLocaleTime(event.start_time)}</span>
          </div>
          <div
            className="custom-event-month-container-mb"
            style={{ background: `${bgColor}` }}
            onClick={onMobileDateCellClick}
          >
            {totalSessionThisDay.length}
          </div>
        </>
      );
    }

    if (calendarView === 'week' || calendarView === 'day') {
      return (
        <div
          className="custom-event-container custom-day-event-container"
          style={{
            border: `2px solid ${borderColor}`,
          }}
        >
          <div className="event-title">{event.name}</div>
          <div className="event-time">{`${toLocaleTime(event.start_time)} - ${toLocaleTime(event.end_time)}`}</div>
          <div className="event-tags-container">{event.group && <span className="group-pill">Group</span>}</div>
          <button onClick={(e) => onBookClick(e)} className="book-btn">
            Book
          </button>
        </div>
      );
    }
  }

  return (
    <Loader loading={isSessionLoading} size="large" text="Loading sessions">
      <PurchaseModal
        visible={purchaseModalVisible}
        closeModal={closePurchaseModal}
        createOrder={showConfirmPaymentPopup}
      />
      {calendarSession.length > 0 && readyToPaint ? (
        <CalendarView
          inventories={calendarSession}
          onSelectInventory={redirectToSessionsPage}
          onViewChange={onViewChange}
          calendarView={calendarView}
          classes={['custom-calendar-view']}
          customComponents={{
            event: Event,
          }}
          step={30}
          defaultDate={calendarDate}
        />
      ) : (
        <Empty />
      )}
    </Loader>
  );
};

export default CalendarSessions;
