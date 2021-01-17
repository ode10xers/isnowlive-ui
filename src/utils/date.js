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
  toLongDateWithDay: (date) => moment(date).format('ddd, DD MMM YYYY'),
  toLongDateWithLongDay: (date) => moment(date).format('dddd, D MMMM YYYY'),
  toLongDateWithTime: (date) => moment(date).format('lll'),
  toLongDateWithDayTime: (date) => moment(date).format('llll'),
  toUtcStartOfDay: (date) => moment(date).startOf('day').utc().format(),
  toUtcEndOfDay: (date) => moment(date).endOf('day').utc().format(),
  getTimeDiff: (startTime = moment(), endTime = moment(), unit) => moment(startTime).diff(endTime, unit),
};

const timeCalculation = {
  isBeforeDate: (date) => moment().isBefore(moment(date)),
  isBeforeLimitHours: (date, limitInHours) => moment().isBefore(moment(date).subtract(limitInHours, 'hours')),
  createRange: (startTime, endTime) => moment.range(startTime, endTime).snapTo('day'),
  createWeekRange: (date, isPrevious) =>
    moment.rangeFromInterval('day', isPrevious ? -6 : 6, moment(date).endOf('day')).snapTo('day'),
  getRangeDiff: (rangeA, rangeB) =>
    moment.range(rangeB[0], rangeB[1]).snapTo('day').subtract(moment.range(rangeA[0], rangeA[1]).snapTo('day')),
};

const timezoneUtils = {
  getCurrentLongTimezone: () => {
    const timeString = new Date().toTimeString();
    const longTimezone = timeString.substr(timeString.indexOf('('));
    return longTimezone.substring(1, longTimezone.length - 1);
  },
};

const dateUtil = {
  formatDate,
  timeCalculation,
  timezoneUtils,
};

export default dateUtil;
