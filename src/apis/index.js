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
    getZoomCredentials: () => http.get('/secure/creator/profile/zoom'),
    storeZoomCredentials: (payload) => http.post('/secure/creator/profile/zoom', payload),
    convertUserToCreator: () => http.post('/secure/user/convert'),
    authZoom: (code) => http.post(`/secure/creator/profile/zoom/${code}`),
  },
  payment: {
    stripe: {
      onboardUser: (payload) => http.post('/secure/creator/profile/stripe', payload),
      relinkAccount: () => http.post('/secure/creator/profile/stripe/relink'),
      validate: () => http.post('/secure/creator/profile/stripe/validate'),
      getDashboard: () => http.get('/secure/creator/profile/stripe/dashboard'),
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
    getInventoriesForSession: (sessionId) => http.get(`/session/${sessionId}`),
    getRescheduleableSessionsByPrice: (creatorName, price) =>
      http.get(`/sessions/${creatorName}/reschedulable?price=${price}`),
    getPublicInventoryById: (inventoryId) => http.get(`/inventories/${inventoryId}`),
    getPrivateInventoryById: (inventoryId) => http.get(`/secure/creator/inventories/id/${inventoryId}`),
    createOrderForUser: (payload) => http.post('/secure/customer/orders', payload),
    getCreatorInventoryEarnings: (pageNo, perPage) =>
      http.get(`/secure/creator/payments/earnings/inventories?page_no=${pageNo}&per_page=${perPage}`),
    getCreatorPassEarnings: (pageNo, perPage) =>
      http.get(`/secure/creator/payments/earnings/passes?page_no=${pageNo}&per_page=${perPage}`),
    getEarningsByInventoryId: (inventoryId) =>
      http.get(`/secure/creator/payments/earnings/inventories/id/${inventoryId}`),
    getEarningsByPassId: (passId) => http.get(`/secure/creator/payments/earnings/passes/id/${passId}`),
    getCreatorBalance: () => http.get('/secure/creator/payments/earnings/balance'),
    createCreatorBalancePayout: () => http.post('/secure/creator/payments/payouts'),
    cancelCustomerOrder: (orderId, payload) => http.post(`/secure/customer/orders/${orderId}/cancel`, payload),
    publishSession: (sessionId) => http.post(`/secure/creator/sessions/${sessionId}/enable`),
    unpublishSession: (sessionId) => http.post(`/secure/creator/sessions/${sessionId}/disable`),
    deleteSession: (sessionId) => http.delete(`/secure/creator/sessions/${sessionId}`),
    rescheduleSession: (orderId, payload) => http.post(`secure/customer/orders/${orderId}/reschedule`, payload),
  },
  passes: {
    getPassById: (passId) => http.get(`/passes/${passId}`),
    getPassesBySessionId: (sessionId) => http.get(`/passes?session_id=${sessionId}`),
    getPassesByUsername: (creatorUsername) => http.get(`/passes?creator_username=${creatorUsername}`),
    getCreatorPasses: () => http.get(`/secure/creator/passes`),
    getEarningsByPassId: (passId) => http.get(`/secure/creator/payments/earnings/passes/id/${passId}`),
    createClassPass: (payload) => http.post(`/secure/creator/passes`, payload),
    updateClassPass: (passId, payload) => http.put(`/secure/creator/passes/${passId}`, payload),
    createOrderForUser: (payload) => http.post('/secure/customer/passes/orders', payload),
    getAttendeePasses: () => http.get('/secure/customer/passes/orders'),
    getAttendeePassesForSession: (sessionId) => http.get(`/secure/customer/passes/orders?session_id=${sessionId}`),
    publishPass: (passId) => http.post(`/secure/creator/passes/${passId}/publish`),
    unpublishPass: (passId) => http.post(`/secure/creator/passes/${passId}/unpublish`),
  },
};
