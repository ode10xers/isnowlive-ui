import axios from 'axios';
import config from 'config';
import { setAuthCookie, getAuthCookie, deleteAuthCookie } from './authCookie';

const UNAUTHORIZED = 401;

class HttpService {
  constructor() {
    this.baseURL = config.server.baseURL;
    this.authToken = getAuthCookie() || '';
    this.axios = axios.create({
      baseURL: this.baseURL,
      headers: {
        'auth-token': this.authToken,
      },
    });

    this.axios.interceptors.response.use(
      response => response,
      error => {
        const { status } = error.response;
        if (status === UNAUTHORIZED) {
          localStorage.removeItem('user-details');
          deleteAuthCookie();
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
