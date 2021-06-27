import { generateUrlFromUsername, getUsernameFromUrl } from 'utils/helper';
import { getLocalUserDetails } from 'utils/storage';
import parseQueryString from 'utils/parseQueryString';

export const widgetComponentsName = {
  CALENDAR: {
    value: 'calendar',
    label: 'Calendar',
    styling: [],
  },
  PASSES: {
    value: 'passes',
    label: 'Passes',
    styling: [],
  },
  VIDEOS: {
    value: 'videos',
    label: 'Videos',
    styling: [
      {
        key: '--new-video-card-background-color',
        label: 'Card Background',
      },
      {
        key: '--new-video-card-font-color ',
        label: 'Card Text Color',
      },
      // {
      //   key: '--video-card-background-color',
      //   label: 'Card Background',
      // },
      // {
      //   key: '--video-card-font-color',
      //   label: 'Card Text Color',
      // },
      // {
      //   key: '--primary-button-color',
      //   label: 'Buy Button Color',
      // },
      // {
      //   key: '--primary-button-font-color',
      //   label: 'Buy Button Text Color',
      // },
      // {
      //   key: '--secondary-button-color',
      //   label: 'Details Button Color',
      // },
      // {
      //   key: '--secondary-button-font-color',
      //   label: 'Details Button Text Color',
      // },
      {
        key: '--video-widget-background-color',
        label: 'Plugin Background',
      },
    ],
  },
  COURSES: {
    value: 'courses',
    label: 'Courses',
    styling: [],
  },
  MEMBERSHIPS: {
    value: 'memberships',
    label: 'Memberships',
    styling: [],
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
