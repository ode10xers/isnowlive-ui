import moment from 'moment';
import dateUtil from 'utils/date';

const {
  formatDate: { getTimeDiff },
} = dateUtil;

export const generateQueryString = (data) => {
  return Object.entries(data)
    .map(([key, val]) => `${key}=${val}`)
    .join('&');
};

const appendScript = (src, charset) => {
  const script = document.createElement('script');
  script.src = src;
  script.async = true;
  if (charset) {
    script.charset = charset;
  }
  if (document.querySelectorAll(`script[src="${src}"]`).length !== 0) {
    document.querySelectorAll(`script[src="${src}"]`)[0].remove();
  }
  document.body.appendChild(script);
  if (window.instgrm) {
    window.instgrm.Embeds.process();
  }
};

export const parseEmbedCode = (parsedItem) => {
  if (Array.isArray(parsedItem)) {
    return parsedItem?.map((el) => {
      if (el.type === 'script') {
        appendScript(el.props.src, el.props.charset);
        return null;
      }
      return el;
    });
  } else {
    return parsedItem;
  }
};

export const getCurrencyList = async () => {
  try {
    const currencyList = await fetch('https://openexchangerates.org/api/currencies.json').then((res) => res.json());
    return currencyList;
  } catch (error) {
    console.log('Failed to load currency list', error?.response?.error);
  }
};

export const convertSchedulesToLocal = (schedules) => {
  if (schedules) {
    for (let i = 0; i < schedules.length; i++) {
      schedules[i].session_date = moment(schedules[i].session_date).format();
      schedules[i].start_time = moment(schedules[i].start_time).format();
      schedules[i].end_time = moment(schedules[i].end_time).format();
    }
  }
  return schedules;
};

export const convertSchedulesToUTC = (schedules) => {
  if (schedules) {
    for (let i = 0; i < schedules.length; i++) {
      schedules[i].session_date = moment(schedules[i].session_date).utc().format();
      schedules[i].start_time = moment(schedules[i].start_time).utc().format();
      schedules[i].end_time = moment(schedules[i].end_time).utc().format();
    }
  }
  return schedules;
};

export const generateTimes = () => {
  const times = [];

  const intervalInMins = moment.duration(15, 'minutes');
  const BEGINNING_OF_TODAY = moment().startOf('day');
  const time = moment(BEGINNING_OF_TODAY);

  const format = (m) => m.format('hh:mm a');
  const getObject = (m) => ({
    label: format(m),
    value: m.format(),
  });
  const addIntervalAndPush = () => {
    times.push(getObject(time));
    time.add(intervalInMins, 'm');
  };
  addIntervalAndPush();

  while (format(time) !== format(BEGINNING_OF_TODAY)) {
    addIntervalAndPush();
  }
  return times;
};

export const isAPISuccess = (statusCode) => {
  const successStatusCode = [200, 201, 204];
  return successStatusCode.includes(statusCode);
};

export const isValidFile = (url) => {
  const extenstion = url?.split('.')?.pop();
  if (url?.startsWith('https://') && ['png', 'jpeg', 'jpg', 'pdf'].includes(extenstion)) {
    return true;
  }
  return false;
};

export const generateUrlFromUsername = (username) => {
  let newUrl = '';
  if (process.env.NODE_ENV === 'development') {
    newUrl = 'http://' + username + '.localhost:' + window.location.port;
  } else if (window.location.origin.includes('stage')) {
    newUrl = 'https://' + username + '.stage.passion.do';
  } else {
    newUrl = 'https://' + username + '.passion.do';
  }
  return newUrl;
};

export const generateUrl = () => {
  let newUrl = '';
  if (process.env.NODE_ENV === 'development') {
    newUrl = 'http://localhost:' + window.location.port;
  } else if (window.location.origin.includes('stage')) {
    newUrl = 'https://app.stage.passion.do';
  } else {
    newUrl = 'https://app.passion.do';
  }
  return newUrl;
};

export const generateRandomColor = () => `#${Math.floor(Math.random() * 16777215).toString(16)}`;

export const getDuration = (start_time, end_time) => {
  let duration = start_time && end_time ? getTimeDiff(end_time, start_time, 'minute') : 0;
  if (duration >= 60) {
    return `${duration / 60} Hr`;
  }
  if (duration < 0) {
    return null;
  }
  return `${duration} Min`;
};

export const scrollToErrorField = (errorFields) => {
  const errorElement = document.getElementById(errorFields[0].name);
  errorElement.focus();
  errorElement.scrollIntoView();
};

export const getPaymentStatus = (status) => {
  switch (status) {
    case 'PAYMENT_COMPLETED':
      return 'Paid';
    case 'CANCELLED':
      return 'Cancel';
    default:
      return 'Unpaid';
  }
};

export const ZoomAuthType = {
  OAUTH: 'OAUTH',
  JWT: 'JWT',
  NOT_CONNECTED: 'NOT_CONNECTED',
};

export const StripeAccountStatus = {
  NOT_CONNECTED: 'NOT_CONNECTED',
  VERIFICATION_PENDING: 'VERIFICATION_PENDING',
  CONNECTED: 'CONNECTED',
};

export const paymentSource = {
  GATEWAY: 'PAYMENT_GATEWAY',
  CLASS_PASS: 'PASS',
};

export const orderType = {
  CLASS: 'SESSION_ORDER',
  PASS: 'PASS_ORDER',
};

export const isoDayOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
