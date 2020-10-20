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
    getDetails: (sessionId) => http.get(`/secure/sessions/${sessionId}`),
    create: (payload) => http.post('/secure/sessions/', payload),
    update: (sessionId, payload) => http.put(`/secure/sessions/${sessionId}`, payload),
    delete: (sessionId) => http.delete(`/secure/sessions/${sessionId}`),
    // Mock data for past and upcoming session is same. They have same response
    getSessionForPast: () => http.get('/secure/order/past'),
    getSessionForUpcoming: () => http.get('/secure/order/past'),
  },
};
