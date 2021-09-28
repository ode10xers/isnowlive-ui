import apis from 'apis';

import {
  showPurchasePassAndGetVideoSuccessModal,
  showPurchasePassAndBookSessionSuccessModal,
  showAlreadyBookedModal,
  showErrorModal,
  showPurchaseSubscriptionAndGetVideoSuccessModal,
  showPurchaseSubscriptionAndBookSessionSuccessModal,
} from 'components/Modals/modals';

import { isAPISuccess, isUnapprovedUserError, paymentSource, productType } from 'utils/helper';

// These functions are for fetching the product details
// that is required to be shown in the confirmation modals
// using the product's order ID or their specific ID
export const getUserPassOrderDetails = async (passOrderId) => {
  try {
    const { status, data } = await apis.passes.getAttendeePasses();

    if (isAPISuccess(status) && data) {
      const foundPassOrder = data.active.find((passOrder) => passOrder.pass_order_id === passOrderId);

      return foundPassOrder || null;
    }
  } catch (error) {
    console.error('Failed to fetch user pass order details');
    console.error(error?.response?.data?.message);
  }

  return null;
};

export const getUserVideoOrderDetails = async (videoOrderId) => {
  try {
    const { status, data } = await apis.videos.getAttendeeVideos();

    if (isAPISuccess(status) && data) {
      const foundVideoOrder = data.active.find((videoOrder) => videoOrder.video_order_id === videoOrderId);

      return foundVideoOrder || null;
    }
  } catch (error) {
    console.error('Failed to fetch user video order details');
    console.error(error?.response?.data?.message);
  }

  return null;
};

export const getSessionInventoryDetails = async (inventoryId) => {
  try {
    const { status, data } = await apis.session.getPublicInventoryById(inventoryId);

    if (isAPISuccess(status) && data) {
      return data;
    }
  } catch (error) {
    console.error('Failed to fetch user video order details');
    console.error(error?.response?.data?.message);
  }

  return null;
};

export const followUpGetVideo = async (payload) => {
  try {
    // Continue to book the video after Pass Purchase is successful
    const followUpPurchase = await apis.videos.createOrderForUser(payload);

    if (isAPISuccess(followUpPurchase.status)) {
      if (payload.payment_source === paymentSource.PASS) {
        showPurchasePassAndGetVideoSuccessModal(payload.source_id);
      } else if (payload.payment_source === paymentSource.SUBSCRIPTION) {
        showPurchaseSubscriptionAndGetVideoSuccessModal();
      }
    }
  } catch (error) {
    if (error.response?.data?.message === 'user already has a confirmed order for this video') {
      showAlreadyBookedModal(productType.VIDEO);
    } else if (!isUnapprovedUserError(error.response)) {
      showErrorModal('Something went wrong', error.response?.data?.message);
    }
  }
};

export const followUpBookSession = async (payload) => {
  try {
    //Continue to book the class after Pass Purchase is successful
    const followUpBooking = await apis.session.createOrderForUser(payload);

    if (isAPISuccess(followUpBooking.status)) {
      if (payload.payment_source === paymentSource.PASS) {
        showPurchasePassAndBookSessionSuccessModal(payload.source_id, payload.inventory_id);
      } else if (payload.payment_source === paymentSource.SUBSCRIPTION) {
        showPurchaseSubscriptionAndBookSessionSuccessModal(payload.inventory_id);
      }
    }
  } catch (error) {
    if (
      error.response?.data?.message === 'It seems you have already booked this session, please check your dashboard'
    ) {
      showAlreadyBookedModal(productType.CLASS);
    } else if (!isUnapprovedUserError(error.response)) {
      showErrorModal('Something went wrong', error.response?.data?.message);
    }
  }
};

export const getCreatorProfileByUsername = async (creatorUsername) => {
  try {
    const { status, data } = await apis.user.getProfileByUsername(creatorUsername);

    if (isAPISuccess(status) && data) {
      return data;
    }
  } catch (error) {
    console.error('Failed fetching creator details');
  }
  return null;
};
