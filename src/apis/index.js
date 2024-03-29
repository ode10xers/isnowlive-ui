import http from 'services/http';
import { CREATOR_SUBSCRIPTION_API_PER_PAGE_COUNT } from 'utils/constants';
import { generateQueryString } from 'utils/url';

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
    getAvailabilitiesByUsername: (type) => http.get(`/sessions/${type}?type=AVAILABILITY`),
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
    sendGiftMessage: (payload) => http.post('/secure/customer/email', payload),
  },
  waitlist: {
    joinCourseWaitlist: (courseId) => http.post(`/secure/customer/waitlist/courses/${courseId}`),
    closeCourseWaitlist: (courseId) => http.post(`/secure/creator/courses/${courseId}/close-waitlist`),
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
    setupUserCard: () => http.post('/secure/customer/payment/setup-card'),
    saveCustomerCard: (payload) => http.post('/secure/customer/payment/save-card', payload),
    retryPayment: (payload) => http.post('/secure/customer/payment/retry', payload),
    paypal: {
      initiateCreatorPayPalAccount: (payload) => http.post('/secure/creator/profile/paypal', payload),
      updateCreatorPayPalAccount: (payload) => http.patch('/secure/creator/profile/paypal', payload),
      getCreatorPayPalAccountDetails: () => http.get('/secure/creator/profile/paypal'),
    },
  },
  availabilities: {
    getAvailabilities: () => http.get('/secure/creator/sessions?type=AVAILABILITY'),
    getAvailabilityDetails: (sessionId) => http.get(`/session/${sessionId}`),
    getDetails: (sessionId, startDate, endDate) =>
      http.get(`/secure/creator/sessions/${sessionId}?type=AVAILABILITY&start_date=${startDate}&end_date=${endDate}`),
    create: (payload) => http.post('/secure/creator/sessions', payload),
    update: (sessionId, payload) => http.patch(`/secure/creator/sessions/${sessionId}`, payload),
    getPastAvailability: (bookingType = undefined) =>
      http.get(
        `/secure/creator/inventories/past?type=AVAILABILITY${
          typeof bookingType === typeof true ? `&booked=${bookingType}` : ''
        }`
      ),
    getUpcomingAvailability: (bookingType = undefined) =>
      http.get(
        `/secure/creator/inventories/upcoming?type=AVAILABILITY${
          typeof bookingType === typeof true ? `&booked=${bookingType}` : ''
        }`
      ),
    publishAvailability: (sessionId) => http.post(`/secure/creator/sessions/${sessionId}/enable`),
    unpublishAvailability: (sessionId) => http.post(`/secure/creator/sessions/${sessionId}/disable`),
  },
  session: {
    getDetails: (sessionId, startDate, endDate) =>
      http.get(`/secure/creator/sessions/${sessionId}?start_date=${startDate}&end_date=${endDate}`),
    create: (payload) => http.post('/secure/creator/sessions', payload),
    update: (sessionId, payload) => http.patch(`/secure/creator/sessions/${sessionId}`, payload),
    getSession: () => http.get('/secure/creator/sessions'),
    delete: (payload) => http.delete('secure/creator/inventories/bulk', payload),
    getPastSession: (bookingType = undefined) =>
      http.get(`/secure/creator/inventories/past${typeof bookingType === typeof true ? `?booked=${bookingType}` : ''}`),
    getUpcomingSession: (bookingType = undefined) =>
      http.get(
        `/secure/creator/inventories/upcoming${typeof bookingType === typeof true ? `?booked=${bookingType}` : ''}`
      ),
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
    submitMeetingInfo: (inventoryId, payload) =>
      http.patch(`/secure/creator/inventories/id/${inventoryId}/custom-meeting`, payload),
    getMeetingInfo: (inventoryId) => http.get(`/secure/creator/inventories/id/${inventoryId}/meeting-details`),
    updateSessionInventory: (inventoryId, payload) =>
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
    deleteCourse: (courseId) => http.delete(`/secure/creator/courses/${courseId}`),
    getCoursesByUsername: () => http.get(`/courses`),
    // TODO: This is currently unused since courses now contains inventories instead of sessions
    getCoursesBySessionId: (sessionId) => http.get(`/courses?session_id=${sessionId}`),
    getCoursesByVideoId: (videoId) => http.get(`/courses?video_id=${videoId}`),
    getCoursesByInventoryId: (inventoryId) => http.get(`/courses?inventory_id=${inventoryId}`),
    getDetailsByInternalId: (courseInternalId) => http.get(`/courses/internal/${courseInternalId}`),
    getDetailsByExternalId: (courseExternalId) => http.get(`/courses/external/${courseExternalId}`),
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
    validateCoupon: (payload) => http.post(`/secure/customer/promotions/validate`, payload),
    // validateCourseCoupon: (payload) => http.post('/secure/customer/promotions/validate/course', payload),
    // validateSessionCoupon: (payload) => http.post('/secure/customer/promotions/validate/session', payload),
    // validateVideoCoupon: (payload) => http.post('/secure/customer/promotions/validate/video', payload),
    // validatePassCoupon: (payload) => http.post('/secure/customer/promotions/validate/pass', payload),
  },
  subscriptions: {
    getSubscriptionMembers: (subscriptionId) => http.get(`/secure/creator/subscription/${subscriptionId}/members`),
    createSubscription: (payload) => http.post('/secure/creator/subscription', payload),
    publishSubscription: (subscriptionId) => http.post(`/secure/creator/subscription/${subscriptionId}/publish`),
    unpublishSubscription: (subscriptionId) => http.post(`/secure/creator/subscription/${subscriptionId}/unpublish`),
    updateSubscription: (subscriptionId, payload) =>
      http.patch(`/secure/creator/subscription/${subscriptionId}`, payload),
    //TODO: The API is paginated, but in order to provide a normal experience we're hardcoding the per_page to 25
    getCreatorSubscriptions: (pageNo = 1, perPage = CREATOR_SUBSCRIPTION_API_PER_PAGE_COUNT) =>
      http.get(`/secure/creator/subscription?page=${pageNo}&per_page=${perPage}`),
    getSubscriptionDetails: (subscriptionId) => http.get(`/secure/creator/subscription/${subscriptionId}`),
    deleteSubscription: (subscriptionId) => http.delete(`/secure/creator/subscription/${subscriptionId}`),
    getSubscriptionEarnings: (pageNo, perPage) =>
      http.get(`/secure/creator/payments/earnings/subscriptions?page_no=${pageNo}&per_page${perPage}`),
    getEarningsBySubscriptionId: (subscriptionId) =>
      http.get(`/secure/creator/payments/earnings/subscriptions/id/${subscriptionId}`),
    getSubscriptionById: (subscriptionId) => http.get(`/subscriptions/${subscriptionId}`),
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
    reactivateCreatorMembers: (payload) => http.post('/secure/creator/audience/archive/reset', payload),
    searchCreatorMembers: ({
      pageNo,
      perPage,
      fetchArchived = false,
      searchText,
      productType = null,
      startDate = null,
      endDate = null,
    }) => {
      const queryData = Object.fromEntries(
        Object.entries({
          user_type: 'MEMBER',
          show_details: true,
          page_no: pageNo,
          per_page: perPage,
          archived: fetchArchived,
          text: searchText,
          product_type: productType,
          inactivity_start: startDate,
          inactivity_end: endDate,
        }).filter(([_, v]) => v != null)
      );

      return http.get(`/secure/creator/audience?${generateQueryString(queryData)}`);
    },
    getCreatorMembers: ({
      pageNo,
      perPage,
      fetchArchived = false,
      productType = null,
      startDate = null,
      endDate = null,
    }) => {
      const queryData = Object.fromEntries(
        Object.entries({
          user_type: 'MEMBER',
          show_details: true,
          page_no: pageNo,
          per_page: perPage,
          archived: fetchArchived,
          product_type: productType,
          inactivity_start: startDate,
          inactivity_end: endDate,
        }).filter(([_, v]) => v != null)
      );

      return http.get(`/secure/creator/audience?${generateQueryString(queryData)}`);
    },
    getCreatorAudiences: (pageNo, perPage, userType = null, emailList = null) =>
      http.get(
        `/secure/creator/audience?page_no=${pageNo}&per_page=${perPage}${userType ? `&user_type=${userType}` : ''}${
          emailList ? `&mailing_list=${emailList}` : ''
        }`
      ),
    addAudienceList: (payload) => http.post('/secure/creator/audience', payload),
    deleteAudienceFromList: (payload) => http.delete('/secure/creator/audience', payload),
    updateMemberTag: (payload) => http.put('secure/creator/audience', payload),
    setCreatorMemberRequestApproval: (payload) => http.put('/secure/creator/audience', payload),
    uploadAudienceCSVFile: (payload) => http.post('/secure/creator/audience/upload', payload),
    sendEmailToAudiences: (payload) => http.post('/secure/creator/audience/email', payload),
    sendNewsletterSignupDetails: (payload) => http.post('/audience/signup', payload),
  },
  newsletter: {
    getCreatorEmailTemplates: () => http.get('/secure/creator/newsletter/templates'),
    getEmailTemplateDetails: (templateId) => http.get(`/secure/creator/newsletter/templates/${templateId}`),
    createEmailTemplate: (payload) => http.post('/secure/creator/newsletter/templates', payload),
    updateEmailTemplate: (templateId, payload) =>
      http.patch(`/secure/creator/newsletter/templates/${templateId}`, payload),
    deleteEmailTemplate: (templateId) => http.delete(`/secure/creator/newsletter/templates/${templateId}`),
    getCreatorEmailList: () => http.get('/secure/creator/mailing-lists'),
    // getEmailListDetails: (emailListId, pageNo, perPage) =>
    // http.get(`/secure/creator/mailing-lists/${emailListId}/audience?page_no=${pageNo}&per_page=${perPage}`),
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
    updateDocument: (documentId, payload) => http.patch(`/secure/creator/documents/${documentId}`, payload),
    deleteDocument: (documentId) => http.delete(`/secure/creator/documents/${documentId}`),
    getAttendeeDocumentDetailsForCourse: (courseOrderId, documentId) =>
      http.get(`/secure/customer/courses/orders/${courseOrderId}/documents/${documentId}`),
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
