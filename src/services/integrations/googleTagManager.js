export const gtmTriggerEvents = {
  CREATOR_SIGNUP: 'creator_signup',
  CREATOR_LOGIN: 'creator_login',
  CREATOR_PROFILE_COMPLETE: 'creator_profile_complete',
  CREATOR_ZOOM_CONNECTED: 'creator_zoom_connected',
  CREATOR_PAY_INITIATED: 'creator_pay_initiated',
  CREATOR_PAY_STATUS: 'creator_pay_status',
  CREATOR_PAY_VERIFIED: 'creator_pay_verified',
  CREATOR_CREATE_SESSION: 'creator_create_session',
  CREATOR_CREATE_VIDEO: 'creator_create_video',
  CREATOR_UPLOAD_VIDEO: 'creator_upload_video',
  STRIPE_CONNECT_FAILED: 'stripe_connect_failed',
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

// This method is to push user attributes if the user lands
// in the website already logged in
// That way the next events can have these user data accurately
export const setGTMUserAttributes = async (userDetails) => {
  window.dataLayer.push({
    creator_external_id: userDetails.external_id,
    creator_email: userDetails.email,
    creator_email_verified: userDetails.email_verified,
    is_creator: userDetails.is_creator,
    creator_first_name: userDetails.first_name,
    creator_last_name: userDetails.last_name,
    creator_username: userDetails.username || customNullValue,
    creator_profile_complete: userDetails.profile_complete,
    creator_payment_account_status: userDetails.profile?.payment_account_status || customNullValue,
    creator_payment_currency: userDetails.profile?.currency || customNullValue,
    creator_zoom_connected: userDetails.profile?.zoom_connected || customNullValue,
  });
};

// Method to clear user attributes from the data layer
// Need to test whether or not this is breaking stuffs
export const clearGTMUserAttributes = () => {
  window.dataLayer.push({
    creator_external_id: undefined,
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

export const trackUserLoginInGTM = async (userDetails) => {
  pushToDataLayer(gtmTriggerEvents.CREATOR_LOGIN, {
    creator_external_id: userDetails.external_id,
    creator_email: userDetails.email,
    creator_email_verified: userDetails.email_verified,
    is_creator: userDetails.is_creator,
    creator_first_name: userDetails.first_name,
    creator_last_name: userDetails.last_name,
    creator_username: userDetails.username || customNullValue,
    creator_profile_complete: userDetails.profile_complete,
    creator_payment_account_status: userDetails.profile?.payment_account_status || customNullValue,
    creator_payment_currency: userDetails.profile?.currency || customNullValue,
    creator_zoom_connected: userDetails.profile?.zoom_connected || customNullValue,
  });
};
