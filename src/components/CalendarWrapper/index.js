import React, { useState } from 'react';

import CalendarView from 'components/CalendarView';

import { generateLightColorHex, getBackgroundColorsForMobile } from './helper';

import dateUtil from 'utils/date';
import { isMobileDevice } from 'utils/device';
import { redirectToInventoryPage } from 'utils/redirect';

// eslint-disable-next-line
import styles from './styles.scss';

const {
  formatDate: { toLocaleTime },
} = dateUtil;

// This component may be eliminated but adding it for now as have limited time
const CalendarWrapper = ({ calendarSessions, sessionCountByDate, onEventBookClick, startDate = null }) => {
  const [calendarView, setCalendarView] = useState(isMobileDevice ? 'day' : 'week');
  const [explicitUpdateCalendarDate, setExplicitUpdateCalendarDate] = useState(false);

  const onViewChange = (e) => {
    setCalendarView(e);
    setExplicitUpdateCalendarDate(false);
  };

  const Event = ({ event }) => {
    const onBookClick = (e) => {
      e.stopPropagation();
      onEventBookClick(event);
    };

    const borderColor = generateLightColorHex();

    if (calendarView === 'month' || calendarView === 'agenda') {
      const totalSessionThisDay = sessionCountByDate[event?.session_date] || 0;

      const onMobileDateCellClick = (e) => {
        const [y, m, d] = event.session_date.split('-');
        // setCalendarDate(new Date(y, m - 1, d));
        setCalendarView('day');
        setExplicitUpdateCalendarDate({ date: new Date(y, m - 1, d) });
        e.stopPropagation();
      };

      const bgColor = getBackgroundColorsForMobile();

      return (
        <>
          <div
            className="custom-event-container custom-month-event-container"
            style={{ border: `2px solid var(--calendar-plugin-cta-background-color, ${borderColor})` }}
            onClick={() => redirectToInventoryPage(event)}
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
          className={`custom-event-container custom-day-event-container ${event.isPast ? 'past-event' : ''}`}
          style={{ border: `2px solid var(--calendar-plugin-cta-background-color, ${borderColor})` }}
          onClick={() => redirectToInventoryPage(event)}
        >
          <div className="event-title">{event.name}</div>
          <div className="event-time">{`${toLocaleTime(event.start_time)} - ${toLocaleTime(event.end_time)}`}</div>
          <div className="event-tags-container">{event.group && <span className="group-pill">Group</span>}</div>
          <button onClick={(e) => onBookClick(e)} className="book-btn" disabled={event.isPast}>
            Book
          </button>
        </div>
      );
    }
  };

  return (
    <CalendarView
      inventories={calendarSessions}
      onSelectInventory={redirectToInventoryPage}
      onViewChange={onViewChange}
      calendarView={calendarView}
      classes={['custom-calendar-view']}
      customComponents={{
        event: Event,
      }}
      step={40}
      updateCalendarDate={explicitUpdateCalendarDate}
      startDate={startDate}
    />
  );
};

export default CalendarWrapper;
