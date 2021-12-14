import { couponProductTypes } from './constants';

export const isAvailabilityCoupon = (coupon) =>
  coupon.product_type === couponProductTypes.SESSION &&
  coupon.products?.some((product) => product.type === 'AVAILABILITY');
