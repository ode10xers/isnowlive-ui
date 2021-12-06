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

const GIFT_RECEIVER_AUTH_TOKEN_LS_KEY = 'gift-receiver-auth-token';

export const saveGiftReceiverData = (userData) => {
  if (userData) {
    localStorage.setItem(GIFT_RECEIVER_AUTH_TOKEN_LS_KEY, JSON.stringify(userData));
  }
};

export const getGiftReceiverData = () => {
  const minimalUserData = JSON.parse(localStorage.getItem(GIFT_RECEIVER_AUTH_TOKEN_LS_KEY));
  return minimalUserData ?? null;
};

export const removeGiftReceiverData = () => {
  localStorage.removeItem(GIFT_RECEIVER_AUTH_TOKEN_LS_KEY);
};

const GIFT_ORDER_DATA_KEY = 'gift-order-data';

export const saveGiftOrderData = (orderData) => {
  if (orderData) {
    localStorage.setItem(GIFT_ORDER_DATA_KEY, JSON.stringify(orderData));
  }
};

export const getGiftOrderData = () => {
  const orderData = JSON.parse(localStorage.getItem(GIFT_ORDER_DATA_KEY));
  return orderData ?? null;
};

export const removeGiftOrderData = () => {
  localStorage.removeItem(GIFT_ORDER_DATA_KEY);
};
