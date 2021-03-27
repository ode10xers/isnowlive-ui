import Moment from 'moment';

// Import the specific locale, else it won't show properly
// import 'moment/locale/hi';

//Pending Use
import { extendMoment } from 'moment-range';

import { getLanguage } from 'utils/storage';

const moment = extendMoment(Moment);

const formatDate = {
  toLocaleTime: (date) => moment(date).locale(getLanguage()).format('LT'),
  toLocaleDate: (date) => moment(date).locale(getLanguage()).format('L'),
  toShortTime: (date) => moment(date).locale(getLanguage()).format('hh:mm'),
  toShortTimeWithPeriod: (date) => moment(date).locale(getLanguage()).format('hh:mm a'),
  toLongDate: (date) => moment(date).locale(getLanguage()).format('Do MMM YYYY'),
  toShortDate: (date) => moment(date).locale(getLanguage()).format('YYYY-MM-DD'),
  toDayOfWeek: (date) => moment(date).locale(getLanguage()).format('dddd'),
  toShortDayOfWeek: (date) => moment(date).locale(getLanguage()).format('ddd'),
  toShortMonth: (date) => moment(date).locale(getLanguage()).format('MMM'),
  toDate: (date) => moment(date).locale(getLanguage()).format('DD'),
  toDateAndTime: (date) => moment(date).locale(getLanguage()).format('DD/MM/YYYY, hh:mm A'),
  toLongDateWithDay: (date) => moment(date).locale(getLanguage()).format('ddd, DD MMM YYYY'),
  toLongDateWithLongDay: (date) => moment(date).locale(getLanguage()).format('dddd, D MMMM YYYY'),
  toLongDateWithTime: (date) => moment(date).locale(getLanguage()).format('lll'),
  toLongDateWithDayTime: (date) => moment(date).locale(getLanguage()).format('llll'),
  toShortDateWithYear: (date) => moment(date).locale(getLanguage()).format(`DD MMM 'YY`),
  toUtcStartOfDay: (date) => moment(date).startOf('day').utc().format(),
  toUtcEndOfDay: (date) => moment(date).endOf('day').utc().format(),
  getTimeDiff: (startTime = moment(), endTime = moment(), unit) => moment(startTime).diff(endTime, unit),
  getISODayOfWeek: (date) => moment(date).isoWeekday(),
};

const timezoneUtils = {
  getCurrentLongTimezone: () => {
    const timeString = new Date().toTimeString();
    const longTimezone = timeString.substr(timeString.indexOf('('));
    return longTimezone.substring(1, longTimezone.length - 1);
  },
  getTimezoneLocation: () => Intl.DateTimeFormat().resolvedOptions().timeZone,
};

const timeCalculation = {
  dateIsBeforeDate: (startDate, endDate) => moment(startDate).isSameOrBefore(moment(endDate)),
  isBeforeDate: (date) => moment().isSameOrBefore(moment(date)),
  isSameOrBeforeToday: (date) => moment(date).endOf('day').isSameOrBefore(moment().startOf('day')),
  isBeforeLimitHours: (date, limitInHours) => moment().isBefore(moment(date).subtract(limitInHours, 'hours')),
  createRange: (startTime, endTime) => moment.range(startTime, endTime).snapTo('day'),
  createWeekRange: (date, isPrevious) =>
    moment.rangeFromInterval('day', isPrevious ? -6 : 6, moment(date).endOf('day')).snapTo('day'),
  getRangeDiff: (rangeA, rangeB) =>
    moment.range(rangeB[0], rangeB[1]).snapTo('day').subtract(moment.range(rangeA[0], rangeA[1]).snapTo('day')),
  generateCalendarTimeInfo: (startDate, endDate) => {
    const startMoment = moment(startDate);
    const endMoment = moment(endDate);
    const timezoneLocation = timezoneUtils.getTimezoneLocation();

    const calendarTimeData = {
      startTime: startMoment.format(),
      endTime: endMoment.format(),
      duration: moment.duration(endMoment.diff(startMoment)).asHours(),
      timezone: timezoneLocation,
    };

    return calendarTimeData;
  },
};

const dateUtil = {
  formatDate,
  timeCalculation,
  timezoneUtils,
};

export default dateUtil;
