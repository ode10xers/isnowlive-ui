import moment from 'moment';

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
  toLongDateWithTime: (date) => moment(date).format('lll'),
  toUtcStartOfDay: (date) => moment(date).utc().startOf('day').format(),
  toUtcEndOfDay: (date) => moment(date).utc().endOf('day').format(),
  getTimeDiff: (startTime = moment(), endTime = moment(), unit) => moment(startTime).diff(endTime, unit),
};

const dateUtil = {
  formatDate,
};

export default dateUtil;
