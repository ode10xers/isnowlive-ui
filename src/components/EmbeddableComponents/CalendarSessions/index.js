import React, { useState, useEffect } from 'react';
import { message, Empty } from 'antd';

import apis from 'apis';

import Loader from 'components/Loader';
import CalendarView from 'components/CalendarView';

import { generateUrlFromUsername, isAPISuccess } from 'utils/helper';
import dateUtil from 'utils/date';

// eslint-disable-next-line
import styles from './styles.scss';

const {
  formatDate: { toLocaleTime },
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
  const [isSessionLoading, setIsSessionLoading] = useState(true);
  const [calendarSession, setCalendarSession] = useState([]);
  const [calendarView, setCalendarView] = useState('month');
  const [readyToPaint, setReadyToPaint] = useState(false);
  const [sessionCountByDate, setSessionCountByDate] = useState({});
  const [calendarDate, setCalendarDate] = useState(new Date());

  const redirectToSessionsPage = (session) => {
    const baseUrl = generateUrlFromUsername('ellianto' || session.username || 'app');
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

  const getCalendarSessions = async (e) => {
    try {
      setIsSessionLoading(true);
      const profileUsername = window.location.hostname.split('.')[0] || '';
      const UpcomingRes = await apis.user.getSessionsByUsername(profileUsername, 'upcoming');
      const PastRes = await apis.user.getSessionsByUsername(profileUsername, 'past');
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

  useEffect(() => {
    getCalendarSessions();
    // eslint-disable-next-line
  }, []);

  function Event(props) {
    const onBookClick = (e) => {
      e.stopPropagation();

      alert('clicked event with id ' + event.inventory_id);
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
