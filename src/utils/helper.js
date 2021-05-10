import moment from 'moment';
import { message } from 'antd';
import dateUtil from 'utils/date';
import { getLocalUserDetails } from './storage';

const {
  formatDate: { getTimeDiff },
} = dateUtil;

// Will occur if a member that is not yet approved tries to access secure APIS
const FORBIDDEN = 403;
const UNAPPROVED_USER_ERROR_MESSAGE = 'user needs approval before performing this action';
export const isUnapprovedUserError = (errorResponse) =>
  errorResponse.status === FORBIDDEN && errorResponse.data?.message === UNAPPROVED_USER_ERROR_MESSAGE;

export const tagColors = ['magenta', 'red', 'volcano', 'orange', 'gold', 'green', 'cyan', 'blue', 'geekblue', 'purple'];

export const getUsernameFromUrl = () => window.location.hostname.split('.')[0] || 'app';

export const getCreatorUsernameForHeader = () => {
  const creatorUsername = getUsernameFromUrl();
  const localUserDetails = getLocalUserDetails();

  const isCreatorInCreatorDashboard =
    localUserDetails && localUserDetails.is_creator && window.location.pathname.indexOf('/creator/dashboard') >= 0;

  // THis might break in case creator A accesses their dashboard with B's username in URL
  if (isCreatorInCreatorDashboard) {
    // For specific URLs we will use creator username from localStorage
    return localUserDetails.username;
  } else if (!reservedDomainName.includes(creatorUsername)) {
    // If username in URL is detected then use that
    return creatorUsername;
  } else {
    // else don't send anything
    return '';
  }
};

export const generateQueryString = (data) => {
  return Object.entries(data)
    .map(([key, val]) => `${key}=${val}`)
    .join('&');
};

export const generateMailToLink = (creatorProfileData) => {
  const passionEmail = 'friends@passion.do';
  return `mailto:${creatorProfileData.email}?cc=${passionEmail}&subject=I%20would%20like%20to%20join%20your%20community&body=Hi%20${creatorProfileData.first_name}`;
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
  const extension = url?.split('.')?.pop();
  if (url?.startsWith('https://') && ['png', 'jpeg', 'jpg', 'pdf'].includes(extension)) {
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

export const generateUrl = (targetDomain = 'app') => {
  let newUrl = '';
  if (process.env.NODE_ENV === 'development') {
    newUrl = `http://${targetDomain === 'app' ? '' : targetDomain + '.'}localhost:` + window.location.port;
  } else if (window.location.origin.includes('stage')) {
    newUrl = `https://${targetDomain}.stage.passion.do`;
  } else {
    newUrl = `https://${targetDomain}.passion.do`;
  }
  return newUrl;
};

export const generateRandomColor = () => `#${Math.floor(Math.random() * 16777215).toString(16)}`;

export const getRandomTagColor = () => tagColors[Math.floor(Math.random() * tagColors.length)];

export const getDuration = (start_time, end_time) => {
  let duration = start_time && end_time ? getTimeDiff(end_time, start_time, 'minute') : 0;
  if (duration >= 60) {
    return `${Math.floor(duration / 60)} Hr`;
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

export const copyToClipboard = (link) => {
  // Fallback method if navigator.clipboard is not supported
  if (!navigator.clipboard) {
    var textArea = document.createElement('textarea');
    textArea.value = link;

    // Avoid scrolling to bottom
    textArea.style.top = '0';
    textArea.style.left = '0';
    textArea.style.position = 'fixed';

    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
      var successful = document.execCommand('copy');

      if (successful) {
        message.success('Copied to clipboard!');
      } else {
        message.error('Failed to copy to clipboard');
      }
    } catch (err) {
      message.error('Failed to copy to clipboard');
    }

    document.body.removeChild(textArea);
  } else {
    navigator.clipboard.writeText(link).then(
      function () {
        message.success('Copied to clipboard!');
      },
      function (err) {
        message.error('Failed to copy to clipboard');
      }
    );
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

export const StripePaymentStatus = {
  AWAITING_CAPTURE: 'AWAITING_CAPTURE',
  AWAITING_METHOD: 'AWAITING_METHOD',
  AUTHORIZATION_REQUIRED: 'AUTHORIZATION_REQUIRED',
  SUCCESS: 'SUCCESS',
};

export const paymentSource = {
  GATEWAY: 'PAYMENT_GATEWAY',
  PASS: 'PASS',
  SUBSCRIPTION: 'SUBSCRIPTION',
};

export const paymentMethods = {
  WALLET: {
    GOOGLE_PAY: 'google_pay',
    APPLE_PAY: 'apple_pay',
  },
};

export const orderType = {
  CLASS: 'SESSION_ORDER',
  PASS: 'PASS_ORDER',
  VIDEO: 'VIDEO_ORDER',
  COURSE: 'COURSE_ORDER',
  SUBSCRIPTION: 'SUBSCRIPTION_ORDER',
};

export const courseType = {
  MIXED: 'MIXED',
  VIDEO_SEQ: 'VIDEO_SEQUENCE',
  VIDEO_NON_SEQ: 'VIDEO_NON_SEQUENCE',
};

export const productType = {
  CLASS: 'Session',
  PASS: 'Pass',
  VIDEO: 'Video',
  COURSE: 'Course',
  SUBSCRIPTION: 'Membership',
  PRODUCT: 'Product', //As a default
};

export const isoDayOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const reservedDomainName = ['app', ...(process.env.NODE_ENV === 'development' ? ['localhost'] : [])];
