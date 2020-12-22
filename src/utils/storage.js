export const getLocalUserDetails = () => {
  const userDetails = JSON.parse(localStorage.getItem('user-details'));
  if (userDetails) {
    const expiry = new Date(userDetails.expiry);
    if (expiry.getTime() > new Date().getTime()) {
      return userDetails;
    }
    return null;
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