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

    this.axios = axios.create({
      baseURL: this.baseURL,
      headers: {
        'auth-token': this.authToken,
        'creator-username': getCreatorUsernameForHeader(),
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
    this.axios = axios.create({
      baseURL: this.baseURL,
      headers: {
        'auth-token': this.authToken,
        'creator-username': getCreatorUsernameForHeader(),
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
    return this.axios.get(url, {
      baseURL: this.baseURL,
      headers: {
        'auth-token': this.authToken,
        'creator-username': getCreatorUsernameForHeader(),
      },
    });
  }

  post(url, payload) {
    return this.axios.post(url, payload, {
      baseURL: this.baseURL,
      headers: {
        'auth-token': this.authToken,
        'creator-username': getCreatorUsernameForHeader(),
      },
    });
  }

  put(url, payload) {
    return this.axios.put(url, payload, {
      baseURL: this.baseURL,
      headers: {
        'auth-token': this.authToken,
        'creator-username': getCreatorUsernameForHeader(),
      },
    });
  }

  patch(url, payload) {
    return this.axios.patch(url, payload, {
      baseURL: this.baseURL,
      headers: {
        'auth-token': this.authToken,
        'creator-username': getCreatorUsernameForHeader(),
      },
    });
  }

  delete(url, payload) {
    return this.axios.delete(url, {
      baseURL: this.baseURL,
      headers: {
        'auth-token': this.authToken,
        'creator-username': getCreatorUsernameForHeader(),
      },
      data: payload,
    });
  }
}

const http = new HttpService();

export default http;
