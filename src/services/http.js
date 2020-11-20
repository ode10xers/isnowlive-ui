import axios from 'axios';
import config from 'config';

class MockHttpService {
  constructor() {
    this.baseURL = config.server.mockBaseURL;
    this.authToken = localStorage.getItem('session-token') || '';
    this.axios = axios.create({
      baseURL: this.baseURL,
      headers: {
        'auth-token': this.authToken,
      },
    });
  }

  setAuthToken(authToken) {
    localStorage.setItem('session-token', authToken);
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

  delete(url) {
    return this.axios.delete(url);
  }
}

class HttpService {
  constructor() {
    this.baseURL = config.server.baseURL;
    this.authToken = localStorage.getItem('session-token') || '';
    this.axios = axios.create({
      baseURL: this.baseURL,
      headers: {
        'auth-token': this.authToken,
      },
    });
  }

  setAuthToken(authToken) {
    localStorage.setItem('session-token', authToken);
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

const http = {
  service: new HttpService(),
  mockService: new MockHttpService(),
};

export default http;
