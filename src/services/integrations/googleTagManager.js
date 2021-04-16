export const gtmTriggerEvents = {
  CREATOR_SIGNUP: 'creator_signup',
  CREATOR_LOGIN: 'creator_login',
  CREATOR_PROFILE_COMPLETE: 'creator_profile_complete',
  CREATOR_ZOOM_CONNECTED: 'creator_zoom_connected',
  CREATOR_PAYMENT_SETUP: 'creator_payment_setup',
  CREATOR_CREATE_SESSION: 'creator_create_session',
  CREATOR_CREATE_VIDEO: 'creator_create_video',
  CREATOR_UPLOAD_VIDEO: 'creator_upload_video',
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

export const clearGTMUserAttributes = () => {
  window.dataLayer.push({
    creator_email: undefined,
    creator_email_verified: undefined,
    is_creator: undefined,
    creator_first_name: undefined,
    creator_last_name: undefined,
    creator_username: undefined,
    creator_profile_complete: undefined,
    creator_payment_account_status: undefined,
    creator_payment_currency: undefined,
    creator_zoom_connected: undefined,
  });
};
