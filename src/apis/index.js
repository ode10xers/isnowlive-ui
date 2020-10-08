import http from 'services/http';

export default {
  user: {
    login: (payload) => http.post('/client/login', payload),
    signup: (payload) => http.post('/client', payload),
    getProfile: (payload) => http.get('secure/client', payload),
    updateProfile: (payload) => http.put('secure/client', payload),
    upcomingSession: (payload) => http.get('session/upcoming', payload),
  },
  session: {
    create: (payload) => http.post('/secure/staff/sessions/', payload),
  },
};
