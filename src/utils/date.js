import Moment from 'moment';
//Pending Use
import { extendMoment } from 'moment-range';

const moment = extendMoment(Moment);

const formatDate = {
  toLocaleTime: (date) => moment(date).format('LT'),
  toLocaleDate: (date) => moment(date).format('L'),
  toShortTime: (date) => moment(date).format('hh:mm'),
  toShortTimeWithPeriod: (date) => moment(date).format('hh:mm a'),
  toLongDate: (date) => moment(date).format('Do MMM YYYY'),
  toShortDate: (date) => moment(date).format('YYYY-MM-DD'),
  toDayOfWeek: (date) => moment(date).format('dddd'),
  toShortDayOfWeek: (date) => moment(date).format('ddd'),
  toShortMonth: (date) => moment(date).format('MMM'),
  toDate: (date) => moment(date).format('DD'),
  toMonthYear: (date) => moment(date).format('MMMM YYYY'),
  toDateAndTime: (date) => moment(date).format('DD/MM/YYYY, hh:mm A'),
  toLongDateWithDay: (date) => moment(date).format('ddd, DD MMM'),
  toLongDateWithLongDay: (date) => moment(date).format('dddd, D MMMM YYYY'),
  toLongDateWithTime: (date) => moment(date).format('lll'),
  toLongDateWithDayTime: (date) => moment(date).format('llll'),
  toShortDateWithYear: (date) => moment(date).format(`DD MMM 'YY`),
  toShortDateMonth: (date) => moment(date).format(`DD MMM`),
  toUtcStartOfDay: (date) => moment(date).startOf('day').utc().format(),
  toUtcEndOfDay: (date) => moment(date).endOf('day').utc().format(),
  getTimeDiff: (startTime = moment(), endTime = moment(), unit = 'minutes') => moment(startTime).diff(endTime, unit),
  getISODayOfWeek: (date) => moment(date).isoWeekday(),
  getVideoMinutesDuration: (durationSeconds) =>
    `${Math.round(moment.duration(durationSeconds, 'seconds').asMinutes())} mins`,
  getVideoDuration: (durationSeconds) => {
    const durationMinutes = Math.floor(durationSeconds / 60);

    const hours = Math.floor(durationMinutes / 60);
    const minutes = durationMinutes % 60;
    return `${hours > 0 ? `${hours} Hr` : ''} ${minutes > 0 ? `${minutes} mins` : ''}`;
  },
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
  // For now the limit is 21 daus
  isNewUserBasedOnSignupDate: (signupDate) => (signupDate ? moment().diff(moment(signupDate), 'days') <= 21 : false),
  dateIsBeforeDate: (startDate, endDate) => moment(startDate).isSameOrBefore(moment(endDate)),
  isPresentOrFuture: (date) => moment().isSameOrBefore(moment(date)),
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
