import { message } from 'antd';

import apis from 'apis';

import { getLocalUserDetails } from 'utils/storage';
import {
  generateQueryString,
  generateUrlFromUsername,
  getUsernameFromUrl,
  isAPISuccess,
  isUnapprovedUserError,
} from 'utils/helper';
import Routes from 'routes';

// User API now also gives currency info
// This function will fetch the creator currency from
// 1) Local Storage (if any exists)
// 2) User API when currency in Local Storage is missing
// 3) Return null if no currency is found in no. 2
export const fetchCreatorCurrency = async () => {
  try {
    // First we check if localUserDetails have the currency info
    const localUserDetails = getLocalUserDetails();

    // If there is, we return it
    if (localUserDetails?.currency) {
      return localUserDetails.currency;
    }

    // If no currency info is found, we fetch from user API
    const { status, data } = await apis.user.getProfile();

    // And update the user details in localStorage
    if (isAPISuccess(status) && data) {
      // TODO: this might cause inconsistency between context data and localStorage data
      // since it's not possible to call for context here
      // Find better solution for this
      localStorage.setItem('user-details', JSON.stringify(data));
      return data.currency || null;
    }
  } catch (error) {
    console.error(error?.response?.data?.message || 'Something went wrong');
  }

  return null;
};

export const createPaymentSessionForOrder = async (payload) => {
  try {
    const { data, status } = await apis.payment.createPaymentSessionForOrder(payload);

    if (isAPISuccess(status) && data) {
      return data;
    }
  } catch (error) {
    if (!isUnapprovedUserError(error.response)) {
      message.error(error.response?.data?.message || 'Something went wrong');
    }
    return null;
  }
};

export const verifyPaymentForOrder = async (payload) => {
  const { order_type } = payload;

  try {
    const { status } = await apis.payment.verifyPaymentForOrder(payload);

    if (isAPISuccess(status)) {
      return order_type;
    }
  } catch (error) {
    if (!isUnapprovedUserError(error.response)) {
      message.error(error.response?.data?.message || 'Something went wrong.');
    }
    return null;
  }
};

// NOTE: Currently the logic only handles non-nested primitive data (excl. array)
export const generateRedirectUrlForStripe = (paramsData) => {
  const baseUrl = generateUrlFromUsername(getUsernameFromUrl()) + Routes.paymentConfirm;

  return baseUrl + '?' + generateQueryString(paramsData);
};
