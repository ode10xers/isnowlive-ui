import axios from 'axios';
import config from 'config';
import { getUsernameFromUrl, reservedDomainName } from 'utils/helper';
import { setAuthCookie, getAuthCookie, deleteAuthCookie } from './authCookie';
import { clearGTMUserAttributes } from './integrations/googleTagManager';

const UNAUTHORIZED = 401;

class HttpService {
  constructor() {
    this.baseURL = config.server.baseURL;
    this.authToken = getAuthCookie() || '';
    // TODO: Check whether this is working correctly
    // Expected Behavior: Sends creator-username header when in username.passion.do
    // Sends empty string in the creator-username if the detected username is localhost/app
    const creatorUsername = getUsernameFromUrl();
    console.log('HTTP **** Creator Username Detected in HTTP Service: ', creatorUsername);
    this.creatorUsername = reservedDomainName.includes(creatorUsername) ? '' : creatorUsername;

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
      },
    });
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
      },
      data: payload,
    });
  }
}

const http = new HttpService();

export default http;
