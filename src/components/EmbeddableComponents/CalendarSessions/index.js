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
  let color = "#";
  for (let i = 0; i < 3; i++)
    color += ("0" + Math.floor(((1 + Math.random()) * Math.pow(16, 2)) / 2).toString(16)).slice(-2);
  return color;
}

const CalendarSessions = () => {
  const [isSessionLoading, setIsSessionLoading] = useState(true);
  const [calendarSession, setCalendarSession] = useState([]);
  const [calendarView, setCalendarView] = useState('week');

  const redirectToSessionsPage = (session) => {
    const baseUrl = generateUrlFromUsername('ellianto' || session.username || 'app');
    window.open(`${baseUrl}/s/${session.session_id}`);
  };

  const onViewChange = (e) => {
    setCalendarView(e);
  };

  const getCalendarSessions = async (e) => {
    try {
      setIsSessionLoading(true);
      let profileUsername = 'ellianto';
      // if (username) {
      //   profileUsername = username;
      // } else {
      //   profileUsername = getLocalUserDetails().username;
      // }
      const UpcomingRes = await apis.user.getSessionsByUsername(profileUsername, 'upcoming');
      const PastRes = await apis.user.getSessionsByUsername(profileUsername, 'past');
      if (isAPISuccess(UpcomingRes.status) && isAPISuccess(PastRes.status)) {
        setCalendarSession([...UpcomingRes.data, ...PastRes.data]);
        setIsSessionLoading(false);
      }
    } catch (error) {
      setIsSessionLoading(false);
      message.error('Failed to load user session details');
    }
  };

  useEffect(() => {
    getCalendarSessions();
  }, []);

  function Event({ event }) {

    const onBookClick = (e) => {
      e.stopPropagation();

      alert('clicked event with id ' + event.inventory_id);
    }

    const borderColor = generateLightColorHex();

    if (calendarView === 'month' || calendarView === 'agenda') {
      return (
        <div style={{ fontSize: '12px', padding: '2px 4px 0', border: `2px solid ${borderColor}`, borderRadius: '3px' }}>
          <span
            style={{ display: 'inline-block', maxWidth: 'calc(100% - 60px)', overflow: 'hidden', textOverflow: 'ellipsis' }}
          >
            {event.name}
          </span>
          <span style={{ float: 'right', fontSize: '12px' }}>{toLocaleTime(event.start_time)}</span>
        </div>
      );
    }

    if (calendarView === 'week' || calendarView === 'day') {
      return (
        <div style={{ height: '118px', fontSize: '12px', padding: '2px 4px 0', border: `2px solid ${borderColor}`, borderRadius: '3px', fontFamily: 'Roboto' }}>
          <div style={{ fontSize: '14px', margin: '5px 0 8px', color: '#595959', lineHeight: '16px' }}>
            {event.name}
          </div>
          <div style={{ fontSize: '12px', marginBottom: '5px', color: '#595959', lineHeight: '14px' }}>
            {`${toLocaleTime(event.start_time)} - ${toLocaleTime(event.end_time)}`}
          </div>
          <div style={{ marginBottom: '10px' }}>
            {event.group &&
              <span
                style={{ display: 'inline-block', padding: '5px', background: '#B5F5EC', color: '#006D75', borderRadius: '4px' }}>
                Group
              </span>}
          </div>
          <button
            onClick={(e) => onBookClick(e)}
            style={{ width: '100%', textAlign: 'center', padding: '5px', background: '#FFFFFF', color: '#595959', border: '1px solid #F0F0F0', borderRadius: '2px' }}>
            Book
          </button>
        </div>
      );
    }
  }

  return (
    <Loader loading={isSessionLoading} size="large" text="Loading sessions">
      {calendarSession.length > 0 ? (
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
        />
      ) : (
          <Empty />
        )}
    </Loader>
  );
};

export default CalendarSessions;
