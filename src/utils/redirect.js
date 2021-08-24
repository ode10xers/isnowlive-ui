import Routes from 'routes';
import { getUsernameFromUrl, generateUrlFromUsername, reservedDomainName } from 'utils/helper';
// import { isInIframeWidget, isWidgetUrl } from 'utils/widgets';
import { getLocalUserDetails } from 'utils/storage';

export const redirectToInventoryPage = (inventory) => {
  let urlUsername = getUsernameFromUrl();

  if (reservedDomainName.includes(urlUsername)) {
    urlUsername = 'app';
  }

  const baseUrl = generateUrlFromUsername(inventory.creator_username || inventory.username || urlUsername);
  const targetUrl = `${baseUrl}${inventory.is_dummy ? Routes.previewPages.root : ''}/e/${inventory.inventory_id}`;

  window.open(targetUrl);
  // if (isInIframeWidget() || isWidgetUrl()) {
  //   window.open(targetUrl, '_self');
  // } else {
  //   window.open(targetUrl);
  // }
};

export const redirectToSessionsPage = (session) => {
  let urlUsername = getUsernameFromUrl();

  if (reservedDomainName.includes(urlUsername)) {
    urlUsername = 'app';
  }

  const baseUrl = generateUrlFromUsername(session.creator_username || urlUsername);
  const isAvailability = session.type === 'AVAILABILITY';
  const targetUrl = `${baseUrl}${session.is_dummy ? Routes.previewPages.root : ''}/${isAvailability ? 'a' : 's'}/${
    session.session_id
  }`;

  window.open(targetUrl);
  // if (isInIframeWidget() || isWidgetUrl()) {
  //   window.open(targetUrl, '_self');
  // } else {
  //   window.open(targetUrl);
  // }
};

export const redirectToVideosPage = (video) => {
  let urlUsername = getUsernameFromUrl();

  if (reservedDomainName.includes(urlUsername)) {
    urlUsername = 'app';
  }

  const baseUrl = generateUrlFromUsername(video.creator_username || urlUsername);

  const targetUrl = `${baseUrl}${video.is_dummy ? Routes.previewPages.root : ''}/v/${video.external_id}`;

  window.open(targetUrl);
  // if (isInIframeWidget() || isWidgetUrl()) {
  //   window.open(targetUrl, '_self');
  // } else {
  //   window.open(targetUrl);
  // }
};

export const redirectToCoursesPage = (course) => {
  let urlUsername = getUsernameFromUrl();

  if (reservedDomainName.includes(urlUsername)) {
    urlUsername = 'app';
  }

  const baseUrl = generateUrlFromUsername(course.creator_username || urlUsername);
  const targetUrl = `${baseUrl}${course.is_dummy ? Routes.previewPages.root : ''}/c/${course.id}`;

  window.open(targetUrl);
  // if (isInIframeWidget() || isWidgetUrl()) {
  //   window.open(targetUrl, '_self');
  // } else {
  //   window.open(targetUrl);
  // }
};

export const redirectToPassesPage = (pass) => {
  let urlUsername = getUsernameFromUrl();

  if (reservedDomainName.includes(urlUsername)) {
    urlUsername = 'app';
  }

  const baseUrl = generateUrlFromUsername(pass.creator_username || urlUsername);
  const targetUrl = `${baseUrl}${pass.is_dummy ? Routes.previewPages.root : ''}/p/${pass.id}`;

  window.open(targetUrl);
  // if (isInIframeWidget() || isWidgetUrl()) {
  //   window.open(targetUrl, '_self');
  // } else {
  //   window.open(targetUrl);
  // }
};

export const redirectToMembershipPage = (subscription) => {
  let urlUsername = getUsernameFromUrl();

  if (reservedDomainName.includes(urlUsername)) {
    const localUserDetails = getLocalUserDetails();

    if (localUserDetails?.is_creator) {
      urlUsername = localUserDetails.username;
    } else {
      urlUsername = 'app';
    }
  }

  const baseUrl = generateUrlFromUsername(subscription.creator_username || urlUsername);
  const targetUrl = `${baseUrl}${subscription.is_dummy ? Routes.previewPages.root : ''}/m/${subscription.external_id}`;

  window.open(targetUrl);
  // if (isInIframeWidget() || isWidgetUrl()) {
  //   window.open(targetUrl, '_self');
  // } else {
  //   window.open(targetUrl);
  // }
};
