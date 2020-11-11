import http from 'services/http';

export default {
  user: {
    login: (payload) => http.service.post('/auth/login', payload),
    signup: (payload) => http.service.post('/user', payload),
    sendNewPasswordEmail: (payload) => http.service.post('/user/password/new', payload),
    setNewPassword: (payload) => http.service.post('/user/password/set', payload),
    getProfile: (payload) => http.service.get('/secure/user/', payload),
    getProfileByUsername: (username) => http.service.get(`/creator/${username}/profile`),
    validUsernameCheck: (payload) => http.service.post('/secure/user/username', payload),
    uploadImage: (payload) => http.service.post('/secure/upload?type=image', payload),
    uploadFile: (payload) => http.service.post('/secure/upload?type=document', payload),
    updateProfile: (payload) => http.service.patch('/secure/user/', payload),
    upcomingSession: (payload) => http.mockService.get('/session/upcoming', payload),
    getSessionsByUsername: (username, type) => http.service.get(`/sessions/${username}/${type}/`),
    storeZoomCredentials: (payload) => http.service.post('/secure/creator/profile/zoom', payload),
  },
  session: {
    getDetails: (sessionId, startDate, endDate) =>
      http.service.get(`/secure/creator/sessions/${sessionId}?start_date=${startDate}&end_date=${endDate}`),
    create: (payload) => http.service.post('/secure/creator/sessions', payload),
    update: (sessionId, payload) => http.service.patch(`/secure/creator/sessions/${sessionId}`, payload),
    delete: (payload) => http.service.delete('secure/creator/sessions/inventories/bulk', payload),
    getSession: () => http.service.get('/secure/creator/sessions/'),
    getPastSession: () => http.service.get('/secure/creator/inventories/past'),
    getUpcomingSession: () => http.service.get('/secure/creator/inventories/upcoming'),
    getPublicInventoryById: (inventoryId) => http.service.get(`/inventories/${inventoryId}`),
  },
};
