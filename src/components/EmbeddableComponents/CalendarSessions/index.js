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

function EventContainerWrapper(props) {
  const clonedEl = React.cloneElement(props.children, {}, props.children);
  console.log('clonedEl', clonedEl);

  return (
    <>
      {clonedEl}
    </>
  )
}

function Event({ event, children }) {
  console.log('event', children);
  return (
    <span style={{ fontSize: '12px' }}>
      {event.name}
      <span style={{ float: 'right', fontSize: '12px' }}>{toLocaleTime(event.beginning)}</span>
    </span>
  )
}

const CalendarSessions = () => {

  const [isSessionLoading, setIsSessionLoading] = useState(true);
  const [calendarSession, setCalendarSession] = useState([]);
  const [calendarView, setCalendarView] = useState('month');

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
  }, [])

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
            eventContainerWrapper: EventContainerWrapper,
          }}
          step={30}
        />
      ) : (
          <Empty />
        )}
    </Loader>
  )
}

export default CalendarSessions;