import { generateUrlFromUsername, getUsernameFromUrl } from 'utils/url';
import { getLocalUserDetails } from 'utils/storage';
import parseQueryString from 'utils/parseQueryString';

export const localStoragePluginStylingKeyPrefix = 'passion_plugin_styling_';

export const widgetComponentsName = {
  CALENDAR: {
    value: 'calendar',
    label: 'Sessions - Calendar',
    product: 'Session',
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
  // TODO: Fix this implementation for plugin variations, very hacky
  INVENTORIES: {
    value: 'inventory-list',
    label: 'Sessions - List (Name only)',
    product: 'Session',
    styling: [
      {
        key: '--inventory-list-plugin-month-font-color',
        label: 'Month Heading Color',
      },
      {
        key: '--inventory-list-plugin-inventory-font-color',
        label: 'List Text Color',
      },
      {
        key: '--inventory-list-plugin-date-heading-background-color',
        label: 'Date Heading Background Color',
      },
      {
        key: '--inventory-list-plugin-date-heading-font-color',
        label: 'Date Heading Text Color',
      },
      {
        key: '--inventory-list-plugin-cta-background-color',
        label: 'Button Background Color',
      },
      {
        key: '--inventory-list-plugin-cta-font-color',
        label: 'Button Text Color',
      },
    ],
  },
  INVENTORIES_WITH_IMAGE: {
    value: 'inventory-list-image',
    label: 'Sessions - List (Name and Image)',
    product: 'Session',
    styling: [
      {
        key: '--inventory-list-plugin-month-font-color',
        label: 'Month Heading Color',
      },
      {
        key: '--inventory-list-plugin-inventory-font-color',
        label: 'List Text Color',
      },
      {
        key: '--inventory-list-plugin-date-heading-background-color',
        label: 'Date Heading Background Color',
      },
      {
        key: '--inventory-list-plugin-date-heading-font-color',
        label: 'Date Heading Text Color',
      },
      {
        key: '--inventory-list-plugin-cta-background-color',
        label: 'Button Background Color',
      },
      {
        key: '--inventory-list-plugin-cta-font-color',
        label: 'Button Text Color',
      },
    ],
  },
  INVENTORIES_WITH_DESC: {
    value: 'inventory-list-desc',
    label: 'Sessions - List (Name and Description)',
    product: 'Session',
    styling: [
      {
        key: '--inventory-list-plugin-month-font-color',
        label: 'Month Heading Color',
      },
      {
        key: '--inventory-list-plugin-inventory-font-color',
        label: 'List Text Color',
      },
      {
        key: '--inventory-list-plugin-date-heading-background-color',
        label: 'Date Heading Background Color',
      },
      {
        key: '--inventory-list-plugin-date-heading-font-color',
        label: 'Date Heading Text Color',
      },
      {
        key: '--inventory-list-plugin-cta-background-color',
        label: 'Button Background Color',
      },
      {
        key: '--inventory-list-plugin-cta-font-color',
        label: 'Button Text Color',
      },
    ],
  },
  INVENTORIES_WITH_IMAGE_DESC: {
    value: 'inventory-list-image-desc',
    label: 'Sessions - List (Name, Image, and Description)',
    product: 'Session',
    styling: [
      {
        key: '--inventory-list-plugin-month-font-color',
        label: 'Month Heading Color',
      },
      {
        key: '--inventory-list-plugin-inventory-font-color',
        label: 'List Text Color',
      },
      {
        key: '--inventory-list-plugin-date-heading-background-color',
        label: 'Date Heading Background Color',
      },
      {
        key: '--inventory-list-plugin-date-heading-font-color',
        label: 'Date Heading Text Color',
      },
      {
        key: '--inventory-list-plugin-cta-background-color',
        label: 'Button Background Color',
      },
      {
        key: '--inventory-list-plugin-cta-font-color',
        label: 'Button Text Color',
      },
    ],
  },
  LIST: {
    value: 'list',
    label: 'Sessions - Cards',
    product: 'Session',
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
  AVAILABILITY: {
    value: 'availability',
    label: 'Availabilities - Cards',
    product: 'Availability',
    styling: [
      {
        key: '--availability-card-background-color',
        label: 'Card Background Color',
      },
      {
        key: '--availability-card-font-color',
        label: 'Card Text Color',
      },
      {
        key: '--availability-cta-background-color',
        label: 'Button Background Color',
      },
      {
        key: '--availability-cta-font-color',
        label: 'Button Text Color',
      },
    ],
  },
  PASSES: {
    value: 'passes',
    label: 'Passes - List',
    product: 'Pass',
    styling: [
      {
        key: '--pass-plugin-heading-background-color',
        label: 'Table Heading Background Color',
      },
      {
        key: '--pass-plugin-heading-text-color',
        label: 'Table Heading Text Color',
      },
      {
        key: '--pass-plugin-table-background-color',
        label: 'Table Rows Background Color',
      },
      {
        key: '--pass-plugin-table-text-color',
        label: 'Table Rows Text Color',
      },
      {
        key: '--pass-plugin-cta-background-color',
        label: 'Button Background Color',
      },
      {
        key: '--pass-plugin-cta-text-color',
        label: 'Button Text Color',
      },
      {
        key: '--pass-plugin-desc-text-color',
        label: 'Description Text Color',
      },
    ],
  },
  VIDEOS: {
    value: 'videos',
    label: 'Videos - Cards',
    product: 'Video',
    styling: [
      {
        key: '--video-widget-background-color',
        label: 'Plugin Background',
      },
      {
        key: '--video-plugin-text-color',
        label: 'Text Color',
      },
      {
        key: '--video-plugin-cta-background-color',
        label: 'Button Background Color',
      },
      {
        key: '--video-plugin-cta-font-color',
        label: 'Button Text Color',
      },
      {
        key: '--video-plugin-light-color',
        label: 'Light Background Color',
      },
    ],
  },
  COURSES: {
    value: 'courses',
    label: 'Courses - Cards',
    product: 'Course',
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
    label: 'Memberships - Cards',
    product: 'Membership',
    styling: [
      {
        key: '--membership-widget-background-color',
        label: 'Plugin Background Color',
      },
      {
        key: '--membership-plugin-text-color',
        label: 'Other Text Color',
      },
      {
        key: '--membership-plugin-cta-background-color',
        label: 'Button Background Color',
      },
      {
        key: '--membership-plugin-cta-font-color',
        label: 'Button Text Color',
      },
      {
        key: '--session-list-card-background-color',
        label: 'Session Card Background',
      },
      {
        key: '--session-list-card-font-color',
        label: 'Session Card Text Color',
      },
      {
        key: '--video-plugin-text-color',
        label: 'Video Text Color',
      },
    ],
  },
};

export const publishedWidgets = [
  'calendar',
  'passes',
  'videos',
  'courses',
  'memberships',
  'list',
  'availability',
  'inventory-list',
];

export const generateWidgetLink = (queryParamData, userNameValue = '') => {
  const username = userNameValue !== '' ? userNameValue : getLocalUserDetails()?.username || getUsernameFromUrl();
  const siteLink = generateUrlFromUsername(username);

  const queryParams = Object.entries(queryParamData)
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
