export const getLocalUserDetails = () => {
  const userDetails = JSON.parse(localStorage.getItem('user-details'));
  if (userDetails) {
    return userDetails;
  }
  return null;
};

export const getRememberUserEmail = () => {
  const rememberUserDetails = JSON.parse(localStorage.getItem('remember-user'));
  if (rememberUserDetails) {
    return rememberUserDetails;
  }
  return null;
};

// Since local storage works on an origin basis, we can store
// each creator's username or details in that domain's local storage
// and fetch it later when needed
const CREATOR_DETAILS_LS_KEY = 'passion-creator-details';

export const getCreatorDetailsInLS = () => {
  const creatorDetails = JSON.parse(localStorage.getItem(CREATOR_DETAILS_LS_KEY));
  return creatorDetails ?? null;
};

export const storeCreatorDetailsToLS = (creatorDetails) => {
  if (creatorDetails) {
    localStorage.setItem(CREATOR_DETAILS_LS_KEY, JSON.stringify(creatorDetails));
  }
};

// TODO: Can also opt to temporarily store receiver auth token in LS
const GIFT_RECEIVER_AUTH_TOKEN_LS_KEY = 'gift-receiver-auth-token';

export const saveReceiverAuthToken = (authToken) => {
  if (authToken) {
    localStorage.setItem(GIFT_RECEIVER_AUTH_TOKEN_LS_KEY, authToken);
  }
};

export const getReceiverAuthToken = () => {
  const authToken = localStorage.getItem(GIFT_RECEIVER_AUTH_TOKEN_LS_KEY);
  return authToken ?? null;
};
