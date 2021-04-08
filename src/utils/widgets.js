import { generateUrlFromUsername } from 'utils/helper';
import { getLocalUserDetails } from 'utils/storage';
import { getAuthCookie } from 'services/authCookie';
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

export const generateWidgetUrl = (userName, widgetToLoad, passAuthCodeInUrl = false) => {
  let authCode = null;
  if (passAuthCodeInUrl) {
    const authCodeFromCookie = getAuthCookie();
    if (authCodeFromCookie && authCodeFromCookie !== '') {
      authCode = authCodeFromCookie;
    } else {
      const userDetails = getLocalUserDetails();
      authCode = userDetails?.auth_token;
    }
  }

  return (
    generateWidgetLink(widgetToLoad, userName) +
    `${passAuthCodeInUrl && authCode && authCode !== '' ? `&authCode=${authCode}` : ''}`
  );
};

export const isWidgetUrl = () => {
  const location = window.location;
  const { isWidget } = parseQueryString(location.search);
  return isWidget === 'true';
};
