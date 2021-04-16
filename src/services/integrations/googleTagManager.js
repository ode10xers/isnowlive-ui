export const gtmTriggerEvents = {
  CREATOR_SIGNUP: 'creator_signup',
  CREATOR_LOGIN: 'creator_login',
  CREATOR_PROFILE_COMPLETE: 'creator_profile_complete',
  CREATOR_ZOOM_CONNECTED: 'creator_zoom_connected',
  CREATOR_PAYMENT_SETUP: 'creator_payment_setup',
  CREATOR_CREATE_SESSION: 'creator_create_session',
  CREATOR_CREATE_VIDEO: 'creator_create_video',
};

// Note: for nulls/undefined in the code, we will send "NA"
// This is to make sure that our code are sending data correctly
// by differentiating our code's nulls/undefineds
export const customNullValue = 'NA';

export const pushToDataLayer = (eventName, eventData = {}) => {
  window.dataLayer.push({
    event: eventName,
    ...eventData,
  });
};
