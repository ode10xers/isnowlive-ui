import moment from 'moment';
import { message } from 'antd';

import dateUtil from './date';
import { getUsernameFromUrl } from './url';
import { getLocalUserDetails } from './storage';
import { reservedDomainName } from './constants';

const {
  formatDate: { getTimeDiff },
} = dateUtil;

export const deepCloneObject = (objData) => JSON.parse(JSON.stringify(objData));

// Will occur if a member that is not yet approved tries to access secure APIS
const FORBIDDEN = 403;
const UNAPPROVED_USER_ERROR_MESSAGE = 'user needs approval before performing this action';
export const isUnapprovedUserError = (errorResponse) =>
  errorResponse?.status === FORBIDDEN && errorResponse?.data?.message === UNAPPROVED_USER_ERROR_MESSAGE;

export const isInCreatorDashboard = () => window.location.pathname.includes('creator/dashboard');

export const getCreatorUsernameForHeader = () => {
  const creatorUsername = getUsernameFromUrl();
  const localUserDetails = getLocalUserDetails();

  const isCreatorInCreatorDashboard =
    window.location.pathname.indexOf('/creator/dashboard') >= 0 && localUserDetails && localUserDetails.is_creator;

  // THis might break in case creator A accesses their dashboard with B's username in URL
  if (isCreatorInCreatorDashboard) {
    // For specific URLs we will use creator username from localStorage
    return localUserDetails.username;
  } else if (creatorUsername && !reservedDomainName.includes(creatorUsername)) {
    // If username in URL is detected then use that
    return creatorUsername;
  } else {
    // else don't send anything
    return '';
  }
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
    console.error(error);
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
  if (url?.startsWith('https://') && ['png', 'jpeg', 'jpg', 'pdf', 'gif'].includes(extension)) {
    return true;
  }
  return false;
};

export const getDuration = (start_time, end_time) => {
  const duration = start_time && end_time ? getTimeDiff(end_time, start_time, 'minute') : 0;
  if (duration < 0) {
    return null;
  }

  const hours = Math.floor(duration / 60);
  const minutes = duration % 60;
  return `${hours > 0 ? `${hours} Hr` : ''} ${minutes > 0 ? `${minutes} min` : ''}`;
};

export const getPaymentStatus = (status) => {
  switch (status) {
    case 'PAYMENT_COMPLETED':
      return 'Paid';
    case 'CANCELLED':
      return 'Cancel';
    case 'CUSTOMER_CANCELLED':
      return 'Customer Cancelled';
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

export const preventDefaults = (e) => {
  e.preventDefault();
  e.stopPropagation();
};

export const generateFontFamilyStylingText = (fontFamily = '') =>
  `${
    fontFamily ? (fontFamily.includes(' ') ? `'${fontFamily}',` : `${fontFamily},`) : ''
  } "Segoe UI", Arial, sans-serif`;
