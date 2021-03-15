import { generateUrlFromUsername } from 'utils/helper';
import { getLocalUserDetails } from 'utils/storage';

export const widgetComponentsName = {
  CALENDAR: {
    value: 'calendar',
    label: 'Calendar',
  },
};

export const generateWidgetLink = (widgetName) => {
  const username = getLocalUserDetails().username;
  const siteLink = generateUrlFromUsername(username);

  const queryParams = Object.entries({
    isWidget: true,
    page: widgetName || 'calendar',
  })
    .map(([key, val]) => `${key}=${val}`)
    .join('&');

  return `${siteLink}?${queryParams}`;
};
