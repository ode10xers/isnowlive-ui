const AUTH_COOKIE = {
  NAME: '__passion_auth_code__',
  DOMAIN: {
    development: 'localhost',
    staging: '.stage.passion.do',
    production: '.passion.do',
  },
  EXPIRY_IN_DAYS: 7,
};

const getCookieExpiryDate = (expiryDays = AUTH_COOKIE.EXPIRY_IN_DAYS) => {
  let d = new Date();
  d.setTime(d.getTime() + (expiryDays * 24 * 60 * 60 * 1000));
  return d.toUTCString();
}

const setAuthCookie = (authCode, expiryDays) => {
  const domain = AUTH_COOKIE.DOMAIN[process.env.NODE_ENV];
  const expiryDate = getCookieExpiryDate(expiryDays);

  document.cookie = `${AUTH_COOKIE.NAME}=${authCode};expires=${expiryDate};path=/;domain=${domain}`;
}

const getAuthCookie = () => {
  const name = AUTH_COOKIE.NAME + "=";
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
  return "";
}

const deleteAuthCookie = () => {
  setAuthCookie('', 0);
}

export { setAuthCookie, getAuthCookie, deleteAuthCookie };