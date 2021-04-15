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
    setCreatorUserPreferences: (payload) => http.patch('/secure/user/preferences', payload),
    getCreatorUserPreferences: () => http.get('/secure/user/preferences'),
    sendProductEmailToCustomers: (payload) => http.post('/secure/creator/products/email', payload),
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
    getUserSavedCards: () => http.get('/secure/customer/payment/methods'),
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
    getSessionDetails: (sessionId) => http.get(`/session/${sessionId}`),
    getRescheduleableSessionsByPrice: (creatorName, price) =>
      http.get(`/sessions/${creatorName}/reschedulable?price=${price}`),
    getPublicInventoryById: (inventoryId) => http.get(`/inventories/${inventoryId}`),
    getPrivateInventoryById: (inventoryId) => http.get(`/secure/creator/inventories/id/${inventoryId}`),
    createOrderForUser: (payload) => http.post('/secure/customer/orders', payload),
    getCreatorInventoryEarnings: (pageNo, perPage) =>
      http.get(`/secure/creator/payments/earnings/inventories?page_no=${pageNo}&per_page=${perPage}`),
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
    generateZoomMeetingInfo: (inventoryId) => http.post(`/secure/creator/inventories/id/${inventoryId}/zoom`),
    submitZoomMeetingInfo: (inventoryId, payload) =>
      http.patch(`/secure/creator/inventories/id/${inventoryId}/zoom`, payload),
    getZoomMeetingInfo: (inventoryId) => http.get(`/secure/creator/inventories/id/${inventoryId}/zoom`),
    updateSessionInventoryDocument: (inventoryId, payload) =>
      http.patch(`/secure/creator/inventories/id/${inventoryId}`, payload),
  },
  passes: {
    getPassById: (passId) => http.get(`/passes/${passId}`),
    getPassesBySessionId: (sessionId) => http.get(`/passes?session_id=${sessionId}`),
    getPassesByVideoId: (videoId) => http.get(`/passes?video_id=${videoId}`),
    getPassesByUsername: (creatorUsername) => http.get(`/passes?creator_username=${creatorUsername}`),
    getCreatorPasses: () => http.get(`/secure/creator/passes`),
    getEarningsByPassId: (passId) => http.get(`/secure/creator/payments/earnings/passes/id/${passId}`),
    createClassPass: (payload) => http.post(`/secure/creator/passes`, payload),
    updateClassPass: (passId, payload) => http.put(`/secure/creator/passes/${passId}`, payload),
    createOrderForUser: (payload) => http.post('/secure/customer/passes/orders', payload),
    getAttendeePasses: () => http.get('/secure/customer/passes/orders'),
    getAttendeePassesForSession: (sessionId) => http.get(`/secure/customer/passes/orders?session_id=${sessionId}`),
    getAttendeePassesForVideo: (videoId) => http.get(`/secure/customer/passes/orders?video_id=${videoId}`),
    publishPass: (passId) => http.post(`/secure/creator/passes/${passId}/publish`),
    unpublishPass: (passId) => http.post(`/secure/creator/passes/${passId}/unpublish`),
    getCreatorPassEarnings: (pageNo, perPage) =>
      http.get(`/secure/creator/payments/earnings/passes?page_no=${pageNo}&per_page=${perPage}`),
  },
  videos: {
    getEarningsByVideoId: (videoId) => http.get(`/secure/creator/payments/earnings/videos/id/${videoId}`),
    getCreatorVideosEarnings: (pageNo, perPage) =>
      http.get(`/secure/creator/payments/earnings/videos?page_no=${pageNo}&per_page=${perPage}`),
    getVideoById: (videoId) => http.get(`/videos/${videoId}`),
    getCreatorVideos: () => http.get(`/secure/creator/videos`),
    getVideosByUsername: (creatorUsername) => http.get(`/videos?creator_username=${creatorUsername}`),
    createVideo: (payload) => http.post(`/secure/creator/videos`, payload),
    updateVideo: (videoId, payload) => http.put(`/secure/creator/videos/${videoId}`, payload),
    deleteVideo: (videoId) => http.delete(`/secure/creator/videos/${videoId}`),
    uploadVideo: (videoId, payload) => http.post(`/secure/creator/videos/${videoId}/upload`, payload),
    cloneVideo: (videoId) => http.post(`/secure/creator/videos/${videoId}/clone`),
    unlinkVideo: (videoId) => http.post(`/secure/creator/videos/${videoId}/unlink`),
    createOrderForUser: (payload) => http.post('/secure/customer/videos/orders', payload),
    getAttendeeVideos: () => http.get('/secure/customer/videos/orders'),
    getAttendeeVideoToken: (orderId) => http.post(`/secure/customer/videos/orders/${orderId}/token`),
    publishVideo: (videoId) => http.post(`/secure/creator/videos/${videoId}/publish`),
    unpublishVideo: (videoId) => http.post(`/secure/creator/videos/${videoId}/unpublish`),
  },
  courses: {
    getCreatorCourses: () => http.get('/secure/creator/courses'),
    createCourse: (payload) => http.post('/secure/creator/courses', payload),
    updateCourse: (courseId, payload) => http.put(`/secure/creator/courses/${courseId}`, payload),
    getCoursesByUsername: (creatorUsername) => http.get(`/courses?creator_username=${creatorUsername}`),
    getCoursesBySessionId: (sessionId) => http.get(`/courses?session_id=${sessionId}`),
    getVideoCoursesByVideoId: (videoId) => http.get(`/courses?video_id=${videoId}&mixed=false`),
    createOrderForUser: (payload) => http.post('/secure/customer/courses/orders', payload),
    publishCourse: (courseId) => http.post(`/secure/creator/courses/${courseId}/publish`),
    unpublishCourse: (courseId) => http.post(`/secure/creator/courses/${courseId}/unpublish`),
    getDetails: (courseId) => http.get(`/courses/${courseId}`),
    getAttendeeCourses: () => http.get('/secure/customer/courses/orders'),
    getEarningsByCourseId: (courseId) => http.get(`/secure/creator/payments/earnings/courses/id/${courseId}`),
    getCreatorCourseEarnings: (pageNo, perPage) =>
      http.get(`/secure/creator/payments/earnings/courses?page_no=${pageNo}&per_page${perPage}`),
  },
  coupons: {
    createCoupon: (payload) => http.post('/secure/creator/coupons', payload),
    updateCoupon: (couponId, payload) => http.put(`/secure/creator/coupons/${couponId}`, payload),
    publishCoupon: (couponId) => http.post(`/secure/creator/coupons/${couponId}/publish`),
    unpublishCoupon: (couponId) => http.post(`/secure/creator/coupons/${couponId}/unpublish`),
    getCreatorCoupons: () => http.get('/secure/creator/coupons'),
    validateCourseCoupon: (payload) => http.post('/secure/customer/promotions/validate/course', payload),
  },
  subscriptions: {
    createSubscription: (payload) => http.post('/secure/creator/subscription', payload),
    publishSubscription: (subscriptionId) => http.post(`/secure/creator/subscription/${subscriptionId}/publish`),
    unpublishSubscription: (subscriptionId) => http.post(`/secure/creator/subscription/${subscriptionId}/unpublish`),
    updateSubscription: (subscriptionId, payload) =>
      http.patch(`/secure/creator/subscription/${subscriptionId}`, payload),
    getCreatorSubscriptions: (pageNo, perPage = 3) =>
      http.get(`/secure/creator/subscription?page=${pageNo}&per_page=${perPage}`),
    getSubscriptionDetails: (subscriptionId) => http.get(`/secure/creator/subscription/${subscriptionId}`),
    deleteSubscription: (subscriptionId) => http.delete(`/secure/creator/subscription/${subscriptionId}`),
    getSubscriptionEarnings: () => http.get('/secure/creator/payments/earnings/subscriptions'),
    getSubscriptionsByUsername: (creatorUsername) => http.get(`/subscriptions?creator_username=${creatorUsername}`),
    getSubscriptionsForSession: (sessionId) => http.get(`/subscriptions?session_id=${sessionId}`),
    getSubscriptionsForVideo: (videoId) => http.get(`/subscriptions?video_id=${videoId}`),
    getSubscriptionsForCourse: (courseId) => http.get(`/subscriptions?course_id=${courseId}`),
    createSubscriptionOrder: (payload) => http.post('/secure/customer/subscriptions/orders', payload),
    getAttendeeSubscriptions: () => http.get('/secure/customer/subscriptions/orders/'),
    getUserSubscriptionForSession: (sessionId) =>
      http.get(`/secure/customer/subscriptions/orders/?session_id=${sessionId}`),
    getUserSubscriptionForVideo: (videoId) => http.get(`/secure/customer/subscriptions/orders/?video_id=${videoId}`),
    getUserSubscriptionForCourse: (courseId) =>
      http.get(`/secure/customer/subscriptions/orders/?course_id=${courseId}`),
  },
  audiences: {
    getCreatorAudiences: (pageNo, perPage) =>
      http.get(`/secure/creator/audience?page_no=${pageNo}&per_page=${perPage}`),
    uploadAudienceCSVFile: (payload) => http.post('/secure/creator/audience/upload', payload),
    addAudienceList: (payload) => http.post('/secure/creator/audience', payload),
    deleteAudienceFromList: (payload) => http.delete('/secure/creator/audience', payload),
    sendEmailToAudiences: (payload) => http.post('/secure/creator/audience/email', payload),
  },
  documents: {
    getCreatorDocuments: () => http.get('/secure/creator/documents'),
    createDocument: (payload) => http.post('/secure/creator/documents', payload),
  },
  legals: {
    createLegals: (payload) => http.post('/secure/creator/legal', payload),
    updateLegals: (payload) => http.patch('/secure/creator/legal', payload),
    getCreatorLegals: () => http.get('/secure/creator/legal'),
    getLegalsByCreatorUsername: (creatorUsername) => http.get(`/creator/${creatorUsername}/legal`),
  },
};
