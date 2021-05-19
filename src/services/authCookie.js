import { get, set } from 'cookie-toss';
import Routes from 'routes';

import { getUsernameFromUrl, isInCustomDomain } from 'utils/helper';

const AUTH_COOKIE = {
  NAME: '__passion_auth_code__',
  DOMAIN: {
    development: 'localhost',
    staging: '.stage.passion.do',
    production: '.passion.do',
  },
  EXPIRY_IN_DAYS: 7,
};

const TOSSED_AUTH_DATA_KEY = '__ls_passion_auth_token__';

const getCookieExpiryDate = (expiryDays = AUTH_COOKIE.EXPIRY_IN_DAYS) => {
  let d = new Date();
  d.setTime(d.getTime() + expiryDays * 24 * 60 * 60 * 1000);
  return d.toUTCString();
};

const setAuthCookie = (authCode, expiryDays) => {
  const domain = AUTH_COOKIE.DOMAIN[process.env.NODE_ENV];
  const expiryDate = getCookieExpiryDate(expiryDays);

  document.cookie = `${AUTH_COOKIE.NAME}=${authCode};expires=${expiryDate};path=/;domain=${domain}`;

  if (isInCustomDomain()) {
    const creatorUsername = getUsernameFromUrl();

    set({
      iframeUrl: `https://${creatorUsername}${AUTH_COOKIE.DOMAIN[process.env.REACT_APP_ENV]}${Routes.cookieHub}`,
      dataKey: TOSSED_AUTH_DATA_KEY,
      data: authCode,
    });
  }
};

const getAuthCookie = () => {
  const name = AUTH_COOKIE.NAME + '=';
  const decodedCookie = decodeURIComponent(document.cookie);
  const cookiesArray = decodedCookie.split(';');
  for (let i = 0; i < cookiesArray.length; i++) {
    let cookie = cookiesArray[i];
    while (cookie.charAt(0) === ' ') {
      cookie = cookie.substring(1);
    }
    if (cookie.indexOf(name) === 0) {
      return cookie.substring(name.length, cookie.length);
    }
  }
  return '';
};

const getCustomDomainAuthToken = async () => {
  const creatorUsername = getUsernameFromUrl();
  const customDomainAuthToken = await get({
    iframeUrl: `https://${creatorUsername}${AUTH_COOKIE.DOMAIN[process.env.REACT_APP_ENV]}${Routes.cookieHub}`,
    dataKey: TOSSED_AUTH_DATA_KEY,
  });

  return customDomainAuthToken || '';
};

const deleteAuthCookie = () => {
  setAuthCookie('', 0);
};

export { setAuthCookie, getAuthCookie, deleteAuthCookie, getCustomDomainAuthToken };
