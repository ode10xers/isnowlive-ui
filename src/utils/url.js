import { getCreatorDetailsInLS } from './storage';

export const isInCustomDomain = () =>
  !window.location.hostname.includes('passion.do') && !window.location.hostname.includes('localhost');

export const generateQueryString = (data) => {
  return Object.entries(data)
    .map(([key, val]) => `${key}=${val}`)
    .join('&');
};

export const generateMailToLink = (creatorProfileData) => {
  const passionEmail = 'friends@passion.do';
  return `mailto:${creatorProfileData.email}?cc=${passionEmail}&subject=I%20would%20like%20to%20join%20your%20community&body=Hi%20${creatorProfileData.first_name}`;
};

export const getExternalLink = (link = null) => {
  if (link) {
    if (link.includes('//')) {
      return link;
    } else {
      return '//' + link;
    }
  } else {
    return '';
  }
};

export const getUsernameFromUrl = () => {
  if (isInCustomDomain()) {
    // If in a custom domain
    return getCreatorDetailsInLS()?.username || 'app';
  }

  return window.location.hostname.split('.')[0] || 'app';
};

export const generateUrlFromUsername = (username) => {
  if (isInCustomDomain()) {
    return window.location.origin;
  }

  let newUrl = '';
  if (process.env.NODE_ENV === 'development') {
    newUrl = 'http://' + username + '.localhost:' + window.location.port;
  } else if (window.location.origin.includes('stage')) {
    newUrl = 'https://' + username + '.stage.passion.do';
  } else {
    newUrl = 'https://' + username + '.passion.do';
  }
  return newUrl;
};

export const generateUrl = (targetDomain = 'app') => {
  let newUrl = '';
  if (process.env.NODE_ENV === 'development') {
    newUrl = `http://${targetDomain === 'app' ? '' : targetDomain + '.'}localhost:` + window.location.port;
  } else if (window.location.origin.includes('stage')) {
    newUrl = `https://${targetDomain}.stage.passion.do`;
  } else {
    newUrl = `https://${targetDomain}.passion.do`;
  }
  return newUrl;
};
