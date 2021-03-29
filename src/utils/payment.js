import { message } from 'antd';

import apis from 'apis';

import { isAPISuccess } from 'utils/helper';

export const initiatePaymentForOrder = async (payload) => {
  try {
    const { data, status } = await apis.payment.createPaymentSessionForOrder(payload);

    if (isAPISuccess(status) && data) {
      return data;
    }
  } catch (error) {
    message.error(error.response?.data?.message || 'Something went wrong');
  }
};
