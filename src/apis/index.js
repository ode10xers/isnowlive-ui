import http from 'services/http';

export default {
  user: {
    login: (payload) => http.service.post('/auth/login', payload),
    signup: (payload) => http.mockService.post('/client', payload),
    getProfile: (payload) => http.service.get('/secure/user', payload),
    validUsernameCheck: (payload) => http.service.post('/secure/user/username', payload),
    uploadImage: (payload) => http.service.post('/secure/upload?type=image', payload),
    uploadFile: (payload) => http.service.post('/secure/upload?type=document', payload),
    updateProfile: (payload) => http.service.patch('secure/user', payload),
    upcomingSession: (payload) => http.mockService.get('session/upcoming', payload),
  },
  session: {
    getDetails: (sessionId, startDate, endDate) =>
      http.service.get(`/secure/creator/sessions/${sessionId}?start_date=${startDate}&end_date=${endDate}`),
    create: (payload) => http.service.post('/secure/creator/sessions', payload),
    update: (sessionId, payload) => http.service.patch(`/secure/creator/sessions/${sessionId}`, payload),
    delete: (payload) => http.service.delete('secure/creator/sessions/inventories/bulk', payload),
    // Mock data for past and upcoming session is same. They have same response
    getSession: () => http.mockService.get('/secure/order/past'),
    getPastSession: () => http.mockService.get('/secure/order/past'),
    getUpcomingSession: () => http.mockService.get('/secure/order/past'),
  },
};
