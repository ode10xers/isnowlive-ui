import { message } from 'antd';

import apis from 'apis';

import { isAPISuccess } from 'utils/helper';

export const fetchCreatorCurrency = async () => {
  try {
    // TODO: user API now gives currency info
    // Readjust codes that uses this API that can use the info from userDetails instead
    const { status, data } = await apis.session.getCreatorBalance();

    if (isAPISuccess(status) && data?.currency) {
      return data.currency;
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
    message.error(error.response?.data?.message || 'Something went wrong');
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
    message.error(error.response?.data?.message || 'Something went wrong.');
    return null;
  }
};
