import { generateUrlFromUsername } from 'utils/helper';
import { getLocalUserDetails } from 'utils/storage';
import parseQueryString from 'utils/parseQueryString';

export const widgetComponentsName = {
  CALENDAR: {
    value: 'calendar',
    label: 'Calendar',
  },
};

export const generateWidgetLink = (widgetName, userNameValue = '') => {
  const username = userNameValue !== '' ? userNameValue : getLocalUserDetails().username;
  const siteLink = generateUrlFromUsername(username);

  const queryParams = Object.entries({
    isWidget: true,
    widgetType: widgetName || 'calendar',
  })
    .map(([key, val]) => `${key}=${val}`)
    .join('&');

  return `${siteLink}?${queryParams}`;
};

export const isWidgetUrl = () => {
  const location = window.location;
  const { isWidget } = parseQueryString(location.search);
  return isWidget === 'true';
};
