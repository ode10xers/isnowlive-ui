import apis from 'apis';
import { isAPISuccess } from 'utils/helper';

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
