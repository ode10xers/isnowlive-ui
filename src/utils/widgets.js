import { generateUrlFromUsername, getUsernameFromUrl } from 'utils/helper';
import { getLocalUserDetails } from 'utils/storage';
import parseQueryString from 'utils/parseQueryString';

export const widgetComponentsName = {
  CALENDAR: {
    value: 'calendar',
    label: 'Calendar',
    styling: [
      {
        key: '--calendar-plugin-heading-font-color',
        label: 'Heading Text Color',
      },
      {
        key: '--calendar-plugin-heading-background-color',
        label: 'Heading Background Color',
      },
      {
        key: '--calendar-plugin-card-font-color',
        label: 'Card Text Color',
      },
      {
        key: '--calendar-plugin-card-background-color',
        label: 'Card Background Color',
      },
      {
        key: '--calendar-plugin-cta-font-color',
        label: 'Button Text Color',
      },
      {
        key: '--calendar-plugin-cta-background-color',
        label: 'Button Background Color',
      },
    ],
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
      // {
      //   key: '--new-video-card-background-color',
      //   label: 'Card Background',
      // },
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
    styling: [
      {
        key: '--course-widget-background-color',
        label: 'Plugin Background',
      },
      {
        key: '--course-widget-bar-color',
        label: 'Top Bar Color',
      },
      {
        key: '--course-card-background-color',
        label: 'Card Background Color',
      },
      {
        key: '--course-card-font-color',
        label: 'Card Text Color',
      },
    ],
  },
  MEMBERSHIPS: {
    value: 'memberships',
    label: 'Memberships',
    styling: [],
  },
  LIST: {
    value: 'list',
    label: 'Sessions List',
    styling: [
      {
        key: '--session-list-card-background-color',
        label: 'Card Background',
      },
      {
        key: '--session-list-card-font-color',
        label: 'Card Text Color',
      },
      {
        key: '--session-list-bar-color',
        label: 'Top Bar Color',
      },
      {
        key: '--session-list-date-font-color',
        label: 'Date Color',
      },
      {
        key: '--session-list-widget-background-color',
        label: 'Plugin Background',
      },
    ],
  },
};

export const publishedWidgets = ['calendar', 'passes', 'videos', 'courses', 'memberships', 'list'];

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
