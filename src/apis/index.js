import http from 'services/http';

export default {
  user: {
    login: (payload) => http.post('/client/login', payload),
    signup: (payload) => http.post('/client', payload),
  },
};
