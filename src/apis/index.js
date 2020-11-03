import http from 'services/http';

export default {
  user: {
    login: (payload) => http.service.post('/auth/login', payload),
    signup: (payload) => http.service.post('/user', payload),
    sendNewPasswordEmail: (payload) => http.service.post('/user/password/new', payload),
    setNewPassword: (payload) => http.service.post('/user/password/set', payload),
    getProfile: (payload) => http.service.get('/secure/user/', payload),
    validUsernameCheck: (payload) => http.service.post('/secure/user/username', payload),
    uploadImage: (payload) => http.service.post('/secure/upload?type=image', payload),
    updateProfile: (payload) => http.service.patch('secure/user/', payload),
    upcomingSession: (payload) => http.mockService.get('session/upcoming', payload),
  },
  session: {
    getDetails: (sessionId) => http.mockService.get(`/secure/sessions/${sessionId}`),
    create: (payload) => http.mockService.post('/secure/sessions/', payload),
    update: (sessionId, payload) => http.mockService.put(`/secure/sessions/${sessionId}`, payload),
    delete: (sessionId) => http.mockService.delete(`/secure/sessions/${sessionId}`),
    // Mock data for past and upcoming session is same. They have same response
    getSession: () => http.service.get('/secure/creator/sessions/'),
    getPastSession: () => http.service.get('/secure/creator/inventories/past'),
    getUpcomingSession: () => http.service.get('/secure/creator/inventories/upcoming'),
  },
};
