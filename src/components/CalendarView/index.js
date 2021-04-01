import React from 'react';
import classNames from 'classnames';
import { Calendar, momentLocalizer, Navigate } from 'react-big-calendar';
import moment from 'moment';

import dateUtil from 'utils/date';
import { isMobileDevice } from 'utils/device';

import TimeGrid from 'react-big-calendar/lib/TimeGrid';
import 'react-big-calendar/lib/css/react-big-calendar.css';

import * as dates from 'date-arithmetic';
import styles from './styles.module.scss';
const localizer = momentLocalizer(moment);

const {
  formatDate: { toShortTimeWithPeriod },
} = dateUtil;

class MyWeek extends React.Component {
  render() {
    let { date } = this.props;
    let range = MyWeek.range(date);

    return <TimeGrid {...this.props} range={range} eventOffset={15} />;
  }
}

MyWeek.range = (date) => {
  let start = date;
  let end = dates.add(start, 2, 'day');

  let current = start;
  let range = [];

  while (dates.lte(current, end, 'day')) {
    range.push(current);
    current = dates.add(current, 1, 'day');
  }

  return range;
};

MyWeek.navigate = (date, action) => {
  switch (action) {
    case Navigate.PREVIOUS:
      return dates.add(date, -3, 'day');

    case Navigate.NEXT:
      return dates.add(date, 3, 'day');

    default:
      return date;
  }
};

MyWeek.title = (date) => {
  return `${moment(date).format('MMM Do')}`;
};

const CalendarView = ({
  inventories = [],
  onSelectInventory,
  calendarView,
  onViewChange,
  classes = [],
  customComponents = {},
  step = 60,
  defaultDate = new Date(),
}) => {
  // let views = isMobileDevice ? ['month',  'day', 'agenda'] : ['month', 'week', 'day', 'agenda'];
  let views = isMobileDevice
    ? { month: true, week: MyWeek, day: true, agenda: true }
    : { month: true, week: true, day: true, agenda: true };
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
        components={customComponents}
        // date={defaultDate}
      />
    </div>
  );
};

export default CalendarView;
