import React, { useState, useEffect } from 'react';
import classNames from 'classnames';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';

import dateUtil from 'utils/date';
import { isMobileDevice } from 'utils/device';

import 'react-big-calendar/lib/css/react-big-calendar.css';

import styles from './styles.module.scss';
const localizer = momentLocalizer(moment);

const {
  formatDate: { toShortTimeWithPeriod },
} = dateUtil;

const CalendarView = ({
  inventories = [],
  onSelectInventory,
  calendarView,
  onViewChange,
  classes = [],
  customComponents = {},
  step = 60,
  updateCalendarDate = false,
}) => {
  const [viewDate, setViewDate] = useState(new Date());

  const onCalendarNavigate = (...props) => {
    setViewDate(props[0]);
  };

  useEffect(() => {
    if (updateCalendarDate) {
      setViewDate(updateCalendarDate.date);
    }
  }, [updateCalendarDate]);

  const views = ['month', isMobileDevice ? 'day' : 'week', 'agenda'];
  return (
    <div className={classNames(styles.calendarWrapper, styles.mt20, ...classes)}>
      <Calendar
        views={views}
        className={styles.calendar}
        localizer={localizer}
        events={inventories}
        step={step}
        selectable
        showMultiDayTimes
        style={{ minHeight: 600, height: '100%' }}
        onSelectEvent={onSelectInventory}
        view={calendarView}
        onView={onViewChange}
        titleAccessor={(e) => e.name}
        startAccessor={(e) => moment(e.start_time).toDate()}
        endAccessor={(e) => moment(e.end_time).toDate()}
        tooltipAccessor={(e) =>
          `${e.name} - ${toShortTimeWithPeriod(e.start_time)} - ${toShortTimeWithPeriod(e.end_time)}`
        }
        drilldownView={isMobileDevice ? 'day' : 'week'}
        components={customComponents}
        date={viewDate}
        onNavigate={onCalendarNavigate}
      />
    </div>
  );
};

export default CalendarView;
