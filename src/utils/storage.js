import { getAuthCookie } from "services/authCookie";
import apis from "apis";
import { isAPISuccess } from "./helper";

const getUserDetails = async () => {
  try {
    const {data, status} = await apis.user.getProfile();
    if (isAPISuccess(status) && data) {
      return data;
    }
  } catch (error) {
    return null;
  }
}

export const getLocalUserDetails = async () => {
  // compare auth tokens
  const authToken = getAuthCookie();

  let userDetails = JSON.parse(localStorage.getItem('user-details'));
  if (userDetails && authToken) {
    if (authToken === userDetails.auth_token) {
      const expiry = new Date(userDetails.expiry);
      if (expiry.getTime() > new Date().getTime()) {
        return userDetails;
      }
      return null;
    } else {
      //
      userDetails = await getUserDetails();
      return userDetails;
    }

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