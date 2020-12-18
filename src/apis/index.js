import http from 'services/http';

export default {
  admin: {
    login: (payload) => http.post('/auth/login/admin', payload),
  },
  user: {
    login: (payload) => http.post('/auth/login', payload),
    signup: (payload) => http.post('/user', payload),
    sendNewPasswordEmail: (payload) => http.post('/user/password/new', payload),
    setNewPassword: (payload) => http.post('/user/password/set', payload),
    verifyEmail: (payload) => http.post('/user/email/verify', payload),
    getProfile: (payload) => http.get('/secure/user', payload),
    getProfileByUsername: (username) => http.get(`/creator/${username}/profile`),
    validUsernameCheck: (payload) => http.post('/secure/user/username', payload),
    uploadImage: (payload) => http.post('/secure/upload?type=image', payload),
    uploadFile: (payload) => http.post('/secure/upload?type=document', payload),
    updateProfile: (payload) => http.patch('/secure/user', payload),
    getSessionsByUsername: (username, type) => http.get(`/sessions/${username}/${type}`),
    storeZoomCredentials: (payload) => http.post('/secure/creator/profile/zoom', payload),
  },
  payment: {
    stripe: {
      onboardUser: (payload) => http.post('/secure/creator/profile/stripe', payload),
      relinkAccount: () => http.post('/secure/creator/profile/stripe/relink'),
      validate: () => http.post('/secure/creator/profile/stripe/validate'),
    },
    createPaymentSessionForOrder: (payload) => http.post('/secure/customer/payment/session', payload),
    verifyPaymentForOrder: (payload) => http.post('/secure/customer/payment/verify', payload),
  },
  session: {
    getDetails: (sessionId, startDate, endDate) =>
      http.get(`/secure/creator/sessions/${sessionId}?start_date=${startDate}&end_date=${endDate}`),
    create: (payload) => http.post('/secure/creator/sessions', payload),
    update: (sessionId, payload) => http.patch(`/secure/creator/sessions/${sessionId}`, payload),
    delete: (payload) => http.delete('secure/creator/inventories/bulk', payload),
    getSession: () => http.get('/secure/creator/sessions'),
    getPastSession: () => http.get('/secure/creator/inventories/past'),
    getUpcomingSession: () => http.get('/secure/creator/inventories/upcoming'),
    getAttendeePastSession: () => http.get('/secure/customer/orders/past'),
    getAttendeeUpcomingSession: () => http.get('/secure/customer/orders/upcoming'),
    getPublicInventoryById: (inventoryId) => http.get(`/inventories/${inventoryId}`),
    getPrivateInventoryById: (inventoryId) => http.get(`/secure/creator/inventories/id/${inventoryId}`),
    createOrderForUser: (payload) => http.post('/secure/customer/orders', payload),
  },
};
