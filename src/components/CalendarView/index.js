import React from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';

import dateUtil from 'utils/date';

import 'react-big-calendar/lib/css/react-big-calendar.css';
import styles from './styles.module.scss';
const localizer = momentLocalizer(moment);

const {
  formatDate: { toShortTimeWithPeriod },
} = dateUtil;

const CalendarView = ({ inventories = [], onSelectInventory, calendarView, onViewChange }) => {
  return (
    <div className={styles.mt20}>
      <Calendar
        localizer={localizer}
        events={inventories}
        step={60}
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
      />
    </div>
  );
};

export default CalendarView;
