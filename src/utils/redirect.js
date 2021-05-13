import { getUsernameFromUrl, generateUrlFromUsername, reservedDomainName } from 'utils/helper';
import { isWidgetUrl } from 'utils/widgets';
import parseQueryString from 'utils/parseQueryString';

export const redirectToInventoryPage = (inventory) => {
  const baseUrl = generateUrlFromUsername(inventory.creator_username || 'app');

  if (isWidgetUrl()) {
    const { isWidget, authCode } = parseQueryString(window.location.search);

    window.open(
      `${baseUrl}/e/${inventory.inventory_id}?isWidget=${isWidget}${authCode ? `&authCode=${authCode}` : ''}`,
      '_self'
    );
  } else {
    window.open(`${baseUrl}/e/${inventory.inventory_id}`);
  }
};

export const redirectToSessionsPage = (session) => {
  let urlUsername = getUsernameFromUrl();

  if (reservedDomainName.includes(urlUsername)) {
    urlUsername = 'app';
  }

  const baseUrl = generateUrlFromUsername(session.creator_username || urlUsername);

  if (isWidgetUrl()) {
    const { isWidget, authCode } = parseQueryString(window.location.search);

    window.open(
      `${baseUrl}/s/${session.session_id}?isWidget=${isWidget}${authCode ? `&authCode=${authCode}` : ''}`,
      '_self'
    );
  } else {
    window.open(`${baseUrl}/s/${session.session_id}`);
  }
};

export const redirectToVideosPage = (video) => {
  let urlUsername = getUsernameFromUrl();

  if (reservedDomainName.includes(urlUsername)) {
    urlUsername = 'app';
  }

  const baseUrl = generateUrlFromUsername(video.creator_username || urlUsername);

  if (isWidgetUrl()) {
    const { isWidget, authCode } = parseQueryString(window.location.search);

    window.open(
      `${baseUrl}/v/${video.external_id}?isWidget=${isWidget}${authCode ? `&authCode=${authCode}` : ''}`,
      '_self'
    );
  } else {
    window.open(`${baseUrl}/v/${video.external_id}`);
  }
};

export const redirectToCoursesPage = (course) => {
  let urlUsername = getUsernameFromUrl();

  if (reservedDomainName.includes(urlUsername)) {
    urlUsername = 'app';
  }

  const baseUrl = generateUrlFromUsername(course.creator_username || urlUsername);

  if (isWidgetUrl()) {
    const { isWidget, authCode } = parseQueryString(window.location.search);

    window.open(`${baseUrl}/c/${course.id}?isWidget=${isWidget}${authCode ? `&authCode=${authCode}` : ''}`, '_self');
  } else {
    window.open(`${baseUrl}/c/${course.id}`);
  }
};
