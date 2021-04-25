import axios from 'axios';
import config from 'config';

import { getUsernameFromUrl, reservedDomainName } from 'utils/helper';

import { setAuthCookie, getAuthCookie, deleteAuthCookie } from './authCookie';

import { showMemberUnapprovedJoinModal } from 'components/Modals/modals';

import { clearGTMUserAttributes } from './integrations/googleTagManager';

const UNAUTHORIZED = 401;
// Will occur if a member that is not yet approved tries to access secure APIS
const FORBIDDEN = 403;
const UNAPPROVED_USER_ERROR_MESSAGE = 'user needs approval before performing this action';

class HttpService {
  constructor() {
    this.baseURL = config.server.baseURL;
    this.authToken = getAuthCookie() || '';

    // Expected Behavior: Sends creator-username header when in username.passion.do
    // Sends empty string in the creator-username if the detected username is localhost/app
    const creatorUsername = getUsernameFromUrl();
    this.creatorUsername = reservedDomainName.includes(creatorUsername) ? '' : creatorUsername;
    console.log('HTTP **** Creator Username Detected in HTTP Service: ', this.creatorUsername);

    this.axios = axios.create({
      baseURL: this.baseURL,
      headers: {
        'auth-token': this.authToken,
        'creator-username': this.creatorUsername,
      },
    });

    this.axios.interceptors.response.use(
      (response) => response,
      (error) => {
        console.log(error.response);
        const { status, data } = error.response;
        if (status === UNAUTHORIZED) {
          localStorage.removeItem('user-details');
          deleteAuthCookie();
          clearGTMUserAttributes();
          window.open(`${window.location.origin}/login?ref=${window.location.pathname}`, '_self');
        } else if (status === FORBIDDEN && data.message === UNAPPROVED_USER_ERROR_MESSAGE) {
          showMemberUnapprovedJoinModal();
        } else {
          return Promise.reject(error);
        }
      }
    );
  }

  setAuthToken(authToken) {
    setAuthCookie(authToken);
    this.authToken = authToken;

    // Expected Behavior: Sends creator-username header when in username.passion.do
    // Sends empty string in the creator-username if the detected username is localhost/app
    const creatorUsername = getUsernameFromUrl();
    this.creatorUsername = reservedDomainName.includes(creatorUsername) ? '' : creatorUsername;
    console.log('HTTP **** Creator Username Detected in HTTP Service: ', this.creatorUsername);

    this.axios = axios.create({
      baseURL: this.baseURL,
      headers: {
        'auth-token': this.authToken,
        'creator-username': this.creatorUsername,
      },
    });

    this.axios.interceptors.response.use(
      (response) => response,
      (error) => {
        const { status, data } = error.response;
        if (status === UNAUTHORIZED) {
          localStorage.removeItem('user-details');
          deleteAuthCookie();
          clearGTMUserAttributes();
          window.open(`${window.location.origin}/login?ref=${window.location.pathname}`, '_self');
        } else if (status === FORBIDDEN && data.message === UNAPPROVED_USER_ERROR_MESSAGE) {
          showMemberUnapprovedJoinModal();
        } else {
          return Promise.reject(error);
        }
      }
    );
  }

  get(url) {
    return this.axios.get(url);
  }

  post(url, payload) {
    return this.axios.post(url, payload);
  }

  put(url, payload) {
    return this.axios.put(url, payload);
  }

  patch(url, payload) {
    return this.axios.patch(url, payload);
  }

  delete(url, payload) {
    return this.axios.delete(url, {
      baseURL: this.baseURL,
      headers: {
        'auth-token': this.authToken,
        'creator-username': this.creatorUsername,
      },
      data: payload,
    });
  }
}

const http = new HttpService();

export default http;
