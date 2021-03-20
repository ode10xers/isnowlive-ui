export const getLocalUserDetails = () => {
  const userDetails = JSON.parse(localStorage.getItem('user-details'));
  if (userDetails) {
    return userDetails;
  }
  return null;
};

export const getRememberUserEmail = () => {
  const rememberUserDetails = JSON.parse(localStorage.getItem('remember-user'));
  if (rememberUserDetails) {
    return rememberUserDetails;
  }
  return null;
};

export const getLanguage = () => {
  const userLanguage = localStorage.getItem('user-language');
  return userLanguage || 'en';
};

export const setLanguage = (lang) => {
  localStorage.setItem('user-language', lang);
};
