import { getUsernameFromUrl, generateUrlFromUsername, reservedDomainName } from 'utils/helper';
import { isInIframeWidget, isWidgetUrl } from 'utils/widgets';

export const redirectToInventoryPage = (inventory) => {
  let urlUsername = getUsernameFromUrl();

  if (reservedDomainName.includes(urlUsername)) {
    urlUsername = 'app';
  }

  const baseUrl = generateUrlFromUsername(inventory.creator_username || inventory.username || urlUsername);
  const targetUrl = `${baseUrl}/e/${inventory.inventory_id}`;

  if (isInIframeWidget() || isWidgetUrl()) {
    window.open(targetUrl, '_self');
  } else {
    window.open(targetUrl);
  }
};

export const redirectToSessionsPage = (session) => {
  let urlUsername = getUsernameFromUrl();

  if (reservedDomainName.includes(urlUsername)) {
    urlUsername = 'app';
  }

  const baseUrl = generateUrlFromUsername(session.creator_username || urlUsername);
  const targetUrl = `${baseUrl}/s/${session.session_id}`;

  if (isInIframeWidget() || isWidgetUrl()) {
    window.open(targetUrl, '_self');
  } else {
    window.open(targetUrl);
  }
};

export const redirectToVideosPage = (video) => {
  let urlUsername = getUsernameFromUrl();

  if (reservedDomainName.includes(urlUsername)) {
    urlUsername = 'app';
  }

  const baseUrl = generateUrlFromUsername(video.creator_username || urlUsername);

  const targetUrl = `${baseUrl}/v/${video.external_id}`;

  if (isInIframeWidget() || isWidgetUrl()) {
    window.open(targetUrl, '_self');
  } else {
    window.open(targetUrl);
  }
};

export const redirectToCoursesPage = (course) => {
  let urlUsername = getUsernameFromUrl();

  if (reservedDomainName.includes(urlUsername)) {
    urlUsername = 'app';
  }

  const baseUrl = generateUrlFromUsername(course.creator_username || urlUsername);
  const targetUrl = `${baseUrl}/c/${course.id}`;

  if (isInIframeWidget() || isWidgetUrl()) {
    window.open(targetUrl, '_self');
  } else {
    window.open(targetUrl);
  }
};
