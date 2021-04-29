import { getUsernameFromUrl, generateUrlFromUsername, reservedDomainName } from 'utils/helper';

export const redirectToSessionsPage = (session) => {
  let urlUsername = getUsernameFromUrl();

  if (reservedDomainName.includes(urlUsername)) {
    urlUsername = 'app';
  }

  const baseUrl = generateUrlFromUsername(session.creator_username || urlUsername);
  window.open(`${baseUrl}/s/${session.session_id}`);
};

export const redirectToVideosPage = (video) => {
  let urlUsername = getUsernameFromUrl();

  if (reservedDomainName.includes(urlUsername)) {
    urlUsername = 'app';
  }

  const baseUrl = generateUrlFromUsername(video.creator_username || urlUsername);
  window.open(`${baseUrl}/v/${video.external_id}`);
};

export const redirectToCoursesPage = (course) => {
  let urlUsername = getUsernameFromUrl();

  if (reservedDomainName.includes(urlUsername)) {
    urlUsername = 'app';
  }

  const baseUrl = generateUrlFromUsername(course.creator_username || urlUsername);
  window.open(`${baseUrl}/c/${course.id}`);
};
