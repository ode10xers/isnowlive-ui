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
    getProfileByUsername: (username) => http.get(`/creator/${username}/profile`),
    getProfile: (payload) => http.get('/secure/user', payload),
    updateProfile: (payload) => http.patch('/secure/user', payload),
    validUsernameCheck: (payload) => http.post('/secure/user/username', payload),
    convertUserToCreator: () => http.post('/secure/user/convert'),
    uploadImage: (payload) => http.post('/secure/upload?type=image', payload),
    uploadFile: (payload) => http.post('/secure/upload?type=document', payload),
    getSessionsByUsername: (type) => http.get(`/sessions/${type}`),
    getZoomCredentials: () => http.get('/secure/creator/profile/zoom'),
    storeZoomCredentials: (payload) => http.post('/secure/creator/profile/zoom', payload),
    authZoom: (code) => http.post(`/secure/creator/profile/zoom/${code}`),
    setCreatorUserPreferences: (payload) => http.put('/secure/creator/settings', payload),
    upsertCreatorUserTags: (payload) => http.put('/secure/creator/settings/tags', payload),
    getCreatorSettings: () => http.get('/secure/creator/settings'),
    sendProductEmailToCustomers: (payload) => http.post('/secure/creator/products/email', payload),
    confirmCreatorPaymentStatusUpdated: (payload) => http.put('/secure/creator/settings/ga', payload),
    getCreatorDetailsByCustomDomain: (customDomain) => http.get(`/domain/${customDomain}/creator-profile`),
    updateCustomDomainForCreator: (payload) => http.post('/secure/creator/profile/custom-domain', payload),
    updateCreatorFeeSettings: (payload) => http.post('/secure/creator/settings/platform-fee', payload),
  },
  payment: {
    stripe: {
      onboardUser: (payload) => http.post('/secure/creator/profile/stripe', payload),
      relinkAccount: () => http.post('/secure/creator/profile/stripe/relink'),
      validate: () => http.post('/secure/creator/profile/stripe/validate'),
      getDashboard: () => http.get('/secure/creator/profile/stripe/dashboard'),
    },
    getCreatorPaymentProvider: () => http.get('/secure/creator/config/payment'),
    getCreatorPaymentCountries: () => http.get('/secure/creator/config/payment'),
    getAvailablePaymentMethods: (currency) =>
      http.get(`/secure/customer/payment/available-method-types?currency=${currency}`),
    createPaymentSessionForOrder: (payload) => http.post('/secure/customer/payment/session', payload),
    verifyPaymentForOrder: (payload) => http.post('/secure/customer/payment/verify', payload),
    getUserSavedCards: () => http.get('/secure/customer/payment/methods'),
    retryPayment: (payload) => http.post('/secure/customer/payment/retry', payload),
    paypal: {
      initiateCreatorPayPalAccount: (payload) => http.post('/secure/creator/profile/paypal', payload),
    },
  },
  session: {
    getDetails: (sessionId, startDate, endDate) =>
      http.get(`/secure/creator/sessions/${sessionId}?start_date=${startDate}&end_date=${endDate}`),
    create: (payload) => http.post('/secure/creator/sessions', payload),
    update: (sessionId, payload) => http.patch(`/secure/creator/sessions/${sessionId}`, payload),
    getSession: () => http.get('/secure/creator/sessions'),
    delete: (payload) => http.delete('secure/creator/inventories/bulk', payload),
    getPastSession: () => http.get('/secure/creator/inventories/past'),
    getUpcomingSession: () => http.get('/secure/creator/inventories/upcoming'),
    getAttendeePastSession: () => http.get('/secure/customer/orders/past'),
    getAttendeeUpcomingSession: () => http.get('/secure/customer/orders/upcoming'),
    getSessionDetails: (sessionId) => http.get(`/session/${sessionId}`),
    getRescheduleableSessionsByPrice: (price) => http.get(`/sessions/reschedulable?price=${price}`),
    getPublicInventoryById: (inventoryId) => http.get(`/inventories/internal/${inventoryId}`),
    getInventoryDetailsByExternalId: (inventoryExternalId) => http.get(`/inventories/external/${inventoryExternalId}`),
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
    updateOfflineEventAddress: (inventoryExternalId, payload) =>
      http.patch(`/secure/creator/inventories/id/${inventoryExternalId}/address`, payload),
  },
  passes: {
    getPassById: (passId) => http.get(`/passes/${passId}`),
    getPassesBySessionId: (sessionId) => http.get(`/passes?session_id=${sessionId}`),
    getPassesByVideoId: (videoId) => http.get(`/passes?video_id=${videoId}`),
    getPassesByUsername: () => http.get(`/passes`),
    getEarningsByPassId: (passId) => http.get(`/secure/creator/payments/earnings/passes/id/${passId}`),
    getCreatorPasses: () => http.get(`/secure/creator/passes`),
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
    getVideoById: (videoId) => http.get(`/videos/${videoId}`),
    getVideosByUsername: () => http.get(`/videos`),
    getCreatorVideosEarnings: (pageNo, perPage) =>
      http.get(`/secure/creator/payments/earnings/videos?page_no=${pageNo}&per_page=${perPage}`),
    getEarningsByVideoId: (videoId) => http.get(`/secure/creator/payments/earnings/videos/id/${videoId}`),
    getCreatorVideos: () => http.get(`/secure/creator/videos`),
    createVideo: (payload) => http.post(`/secure/creator/videos`, payload),
    updateVideo: (videoId, payload) => http.put(`/secure/creator/videos/${videoId}`, payload),
    deleteVideo: (videoId) => http.delete(`/secure/creator/videos/${videoId}`),
    uploadVideo: (videoId, payload) => http.post(`/secure/creator/videos/${videoId}/upload`, payload),
    getVideoToken: (videoId) => http.get(`/secure/creator/videos/${videoId}/token`),
    cloneVideo: (videoId) => http.post(`/secure/creator/videos/${videoId}/clone`),
    unlinkVideo: (videoId) => http.post(`/secure/creator/videos/${videoId}/unlink`),
    createOrderForUser: (payload) => http.post('/secure/customer/videos/orders', payload),
    getAttendeeVideos: () => http.get('/secure/customer/videos/orders'),
    getAttendeeVideoOrderDetails: (orderId) => http.get(`/secure/customer/videos/orders/${orderId}`),
    getAttendeeVideoToken: (orderId) => http.post(`/secure/customer/videos/orders/${orderId}/token`),
    publishVideo: (videoId) => http.post(`/secure/creator/videos/${videoId}/publish`),
    unpublishVideo: (videoId) => http.post(`/secure/creator/videos/${videoId}/unpublish`),
  },
  courses: {
    getCoursesByUsername: () => http.get(`/courses`),
    getCoursesBySessionId: (sessionId) => http.get(`/courses?session_id=${sessionId}`),
    getVideoCoursesByVideoId: (videoId) => http.get(`/courses?video_id=${videoId}&mixed=false`),
    getDetails: (courseId) => http.get(`/courses/${courseId}`),
    getCreatorCourses: () => http.get('/secure/creator/courses'),
    getCreatorCourseDetailsById: (courseId) => http.get(`/secure/creator/courses/${courseId}`),
    createCourse: (payload) => http.post('/secure/creator/courses', payload),
    updateCourse: (courseId, payload) => http.put(`/secure/creator/courses/${courseId}`, payload),
    createOrderForUser: (payload) => http.post('/secure/customer/courses/orders', payload),
    publishCourse: (courseId) => http.post(`/secure/creator/courses/${courseId}/publish`),
    unpublishCourse: (courseId) => http.post(`/secure/creator/courses/${courseId}/unpublish`),
    getAttendeeCourses: () => http.get('/secure/customer/courses/orders'),
    getEarningsByCourseId: (courseId) => http.get(`/secure/creator/payments/earnings/courses/id/${courseId}`),
    getCreatorCourseEarnings: (pageNo, perPage) =>
      http.get(`/secure/creator/payments/earnings/courses?page_no=${pageNo}&per_page${perPage}`),
  },
  coupons: {
    getCreatorCoupons: () => http.get('/secure/creator/coupons'),
    createCoupon: (payload) => http.post('/secure/creator/coupons', payload),
    updateCoupon: (couponId, payload) => http.put(`/secure/creator/coupons/${couponId}`, payload),
    publishCoupon: (couponId) => http.post(`/secure/creator/coupons/${couponId}/publish`),
    unpublishCoupon: (couponId) => http.post(`/secure/creator/coupons/${couponId}/unpublish`),
    validateCourseCoupon: (payload) => http.post('/secure/customer/promotions/validate/course', payload),
    validateSessionCoupon: (payload) => http.post('/secure/customer/promotions/validate/session', payload),
    validateVideoCoupon: (payload) => http.post('/secure/customer/promotions/validate/video', payload),
    validatePassCoupon: (payload) => http.post('/secure/customer/promotions/validate/pass', payload),
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
    getSubscriptionEarnings: (pageNo, perPage) =>
      http.get(`/secure/creator/payments/earnings/subscriptions?page_no=${pageNo}&per_page${perPage}`),
    getEarningsBySubscriptionId: (subscriptionId) =>
      http.get(`/secure/creator/payments/earnings/subscriptions/id/${subscriptionId}`),
    getSubscriptionsByUsername: () => http.get(`/subscriptions`),
    getSubscriptionsForSession: (sessionId) => http.get(`/subscriptions?session_id=${sessionId}`),
    getSubscriptionsForVideo: (videoId) => http.get(`/subscriptions?video_id=${videoId}`),
    getSubscriptionsForCourse: (courseId) => http.get(`/subscriptions?course_id=${courseId}`),
    createOrderForUser: (payload) => http.post('/secure/customer/subscriptions/orders', payload),
    cancelSubscriptionOrder: (subscriptionOrderId) =>
      http.post(`/secure/customer/subscriptions/orders/${subscriptionOrderId}/cancel`),
    getSubscriptionOrderUsageDetails: (productOrderType, subscriptionOrderId) =>
      http.get(
        `/secure/customer/orders/universal?type=${productOrderType}&source=SUBSCRIPTION&source_id=${subscriptionOrderId}`
      ),
    getAttendeeSubscriptions: () => http.get('/secure/customer/subscriptions/orders/'),
    getUserSubscriptionForSession: (sessionId) =>
      http.get(`/secure/customer/subscriptions/orders/?session_id=${sessionId}`),
    getUserSubscriptionForVideo: (videoId) => http.get(`/secure/customer/subscriptions/orders/?video_id=${videoId}`),
    getUserSubscriptionForCourse: (courseId) =>
      http.get(`/secure/customer/subscriptions/orders/?course_id=${courseId}`),
  },
  audiences: {
    getCreatorMembers: (pageNo, perPage) =>
      http.get(`/secure/creator/audience?user_type=MEMBER&page_no=${pageNo}&per_page=${perPage}`),
    getCreatorAudiences: (pageNo, perPage) =>
      http.get(`/secure/creator/audience?page_no=${pageNo}&per_page=${perPage}`),
    addAudienceList: (payload) => http.post('/secure/creator/audience', payload),
    deleteAudienceFromList: (payload) => http.delete('/secure/creator/audience', payload),
    updateMemberTag: (payload) => http.put('secure/creator/audience', payload),
    approveCreatorMemberRequest: (payload) => http.put('/secure/creator/audience', payload),
    uploadAudienceCSVFile: (payload) => http.post('/secure/creator/audience/upload', payload),
    sendEmailToAudiences: (payload) => http.post('/secure/creator/audience/email', payload),
    sendNewletterSignupDetails: (payload) => http.post('/audience/signup', payload),
  },
  newsletter: {
    getCreatorEmailTemplates: () => http.get('/secure/creator/newsletter/templates'),
    getEmailTemplateDetails: (templateId) => http.get(`/secure/creator/newsletter/templates/${templateId}`),
    createEmailTemplate: (payload) => http.post('/secure/creator/newsletter/templates', payload),
    updateEmailTemplate: (templateId, payload) =>
      http.patch(`/secure/creator/newsletter/templates/${templateId}`, payload),
    deleteEmailTemplate: (templateId) => http.delete(`/secure/creator/newsletter/templates/${templateId}`),
    getCreatorEmailList: () => http.get('/secure/creator/mailing-lists'),
    getEmailListDetails: (emailListId, pageNo, perPage) =>
      http.get(`/secure/creator/mailing-lists/${emailListId}/audience?page_no=${pageNo}&per_page=${perPage}`),
    deleteEmailList: (emailListId) => http.delete(`/secure/creator/mailing-lists/${emailListId}`),
    createEmailList: (payload) => http.post('/secure/creator/mailing-lists', payload),
    updateEmailList: (emailListId, payload) =>
      http.put(`/secure/creator/mailing-lists/${emailListId}/audience`, payload),
    deleteEmailListAudience: (emailListId, payload) =>
      http.delete(`/secure/creator/mailing-lists/${emailListId}/audience`, payload),
    sendEmailToEmailList: (emailListId, payload) =>
      http.post(`/secure/creator/mailing-lists/${emailListId}/email`, payload),
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
  referrals: {
    getCustomerRefCode: () => http.get('/secure/customer/referral/code'),
    getCustomerRefData: () => http.get('/secure/customer/referral'),
    getCreatorRefData: () => http.get('/secure/creator/referral'),
    getCreatorAffiliatesData: () => http.get('/secure/creator/referral/creators-referred'),
  },
};
