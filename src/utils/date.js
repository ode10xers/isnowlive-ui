import moment from 'moment';

const formatDate = {
  toLocaleTime: (date) => moment(date).format('LT'),
  toLocaleDate: (date) => moment(date).format('L'),
  toShortTime: (date) => moment(date).format('hh:mm'),
  toLongDate: (date) => moment(date).format('Do MMM YYYY'),
  toShortDate: (date) => moment(date).format('YYYY-MM-DD'),
  toDayOfWeek: (date) => moment(date).format('dddd'),
  toShortMonth: (date) => moment(date).format('MMM'),
  toDate: (date) => moment(date).format('DD'),
};

const dateUtil = {
  formatDate,
};

export default dateUtil;
