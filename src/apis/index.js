import http from 'services/http';

export default {
  user: {
    login: (payload) => http.service.post('/auth/login', payload),
    signup: (payload) => http.mockService.post('/client', payload),
    getProfile: (payload) => http.mockService.get('secure/client', payload),
    updateProfile: (payload) => http.mockService.put('secure/client', payload),
    upcomingSession: (payload) => http.mockService.get('session/upcoming', payload),
  },
  session: {
    getDetails: (sessionId) => http.mockService.get(`/secure/sessions/${sessionId}`),
    create: (payload) => http.mockService.post('/secure/sessions/', payload),
    update: (sessionId, payload) => http.mockService.put(`/secure/sessions/${sessionId}`, payload),
    delete: (sessionId) => http.mockService.delete(`/secure/sessions/${sessionId}`),
  },
};
