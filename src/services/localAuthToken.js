/* This is for Iframe mode only when we do not have access to store the auth token in cookies
  because of security restrictions. */

const tokenPrefix = '__passion_';
const tokenSuffix = '_token__';

const getLSTokenNameForSite = () => {
  const siteDomain = window.location.hostname;
  return `${tokenPrefix}${siteDomain}${tokenSuffix}`;
};

const setAuthTokenInLS = (auth_token) => {
  localStorage.setItem(getLSTokenNameForSite(), auth_token);
};

const getAuthTokenFromLS = () => {
  return localStorage.getItem(getLSTokenNameForSite());
};

const deleteAuthTokenFromLS = () => {
  localStorage.removeItem(getLSTokenNameForSite());
};

// const safeDeleteAuthTokenFromLS = () => {
//   // This is to make sure if the same site is opened in new window, then existing local storage token gets destroyed
//   const value = localStorage.getItem(getLSTokenNameForSite());
//   if (value) {
//     localStorage.removeItem(getLSTokenNameForSite())
//   }
// }

export { getAuthTokenFromLS, setAuthTokenInLS, deleteAuthTokenFromLS };
