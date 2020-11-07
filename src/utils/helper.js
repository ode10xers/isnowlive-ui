import moment from 'moment';

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

export const isAPISuccess = (statusCode) => {
  const successStatusCode = [200, 201, 204];
  return successStatusCode.includes(statusCode);
};

export const isValidImage = (url) => {
  const extenstion = url?.split('.')?.pop();
  if (url?.startsWith('https://') && ['png, jpeg, jpg'].includes(extenstion)) {
    return true;
  }
  return false;
};
