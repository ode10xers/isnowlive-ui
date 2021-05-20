import { generateUrlFromUsername, getUsernameFromUrl } from 'utils/helper';
import { getLocalUserDetails } from 'utils/storage';
import parseQueryString from 'utils/parseQueryString';

export const widgetComponentsName = {
  CALENDAR: {
    value: 'calendar',
    label: 'Calendar',
  },
  PASSES: {
    value: 'passes',
    label: 'Passes',
  },
  VIDEOS: {
    value: 'videos',
    label: 'Videos',
  },
  COURSES: {
    value: 'courses',
    label: 'Courses',
  },
  MEMBERSHIPS: {
    value: 'memberships',
    label: 'Memberships',
  },
};

export const publishedWidgets = ['calendar', 'passes', 'videos', 'courses', 'memberships'];

export const generateWidgetLink = (widgetName, userNameValue = '') => {
  const username = userNameValue !== '' ? userNameValue : getLocalUserDetails()?.username || getUsernameFromUrl();
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

export const isInIframeWidget = () => {
  // Compares the current window location with the parent's
  // If it is viewed inside an iframe from a diff site
  // this function will return true
  return window.location !== window.parent.location;
};
