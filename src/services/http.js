import axios from 'axios';
import config from 'config';

import { getCreatorUsernameForHeader, isUnapprovedUserError } from 'utils/helper';

import { setAuthCookie, getAuthCookie, deleteAuthCookie } from './authCookie';

import { showMemberUnapprovedJoinModal } from 'components/Modals/modals';

import { clearGTMUserAttributes } from './integrations/googleTagManager';

const UNAUTHORIZED = 401;

class HttpService {
  constructor() {
    this.baseURL = config.server.baseURL;
    this.authToken = getAuthCookie() || '';

    this.creatorUsername = getCreatorUsernameForHeader();

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
        const { status } = error.response;
        if (status === UNAUTHORIZED) {
          localStorage.removeItem('user-details');
          deleteAuthCookie();
          clearGTMUserAttributes();
          window.open(`${window.location.origin}/login?ref=${window.location.pathname}`, '_self');
        } else if (isUnapprovedUserError(error.response)) {
          showMemberUnapprovedJoinModal();
        }

        return Promise.reject(error);
      }
    );
  }

  setAuthToken(authToken) {
    setAuthCookie(authToken);
    this.authToken = authToken;

    // Expected Behavior: Sends creator-username header when in username.passion.do
    // Sends empty string in the creator-username if the detected username is localhost/app
    this.creatorUsername = getCreatorUsernameForHeader();

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
        const { status } = error.response;
        if (status === UNAUTHORIZED) {
          localStorage.removeItem('user-details');
          deleteAuthCookie();
          clearGTMUserAttributes();
          window.open(`${window.location.origin}/login?ref=${window.location.pathname}`, '_self');
        } else if (isUnapprovedUserError(error.response)) {
          showMemberUnapprovedJoinModal();
        }

        return Promise.reject(error);
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
