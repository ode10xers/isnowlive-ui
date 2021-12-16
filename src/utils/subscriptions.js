import { message } from 'antd';
import apis from 'apis';
import { isAPISuccess } from './helper';
import { getLocalUserDetails } from './storage';

export const generateBaseCreditsText = (subscription, isCourse = false) => {
  let calculatedBaseCredits = 0;
  let productText = '';

  if (isCourse) {
    calculatedBaseCredits = subscription?.course_credits || 0;
    productText = 'Courses';
  } else {
    calculatedBaseCredits = subscription?.product_credits;

    let availableProducts = [];

    if (subscription?.products['SESSION']) {
      availableProducts.push('Sessions');
    }

    if (subscription?.products['VIDEO']) {
      availableProducts.push('Videos');
    }

    productText = availableProducts.join(' or ');
  }

  return `${calculatedBaseCredits} ${productText} credits/period`;
};

export const generateSubscriptionDuration = (subscription, showNum = false) => {
  const subscriptionPeriodInDays = subscription?.validity ?? 0;

  const divisibleBy365 = subscriptionPeriodInDays % 365 === 0;

  if (divisibleBy365) {
    const yearCount = subscriptionPeriodInDays / 365;

    return yearCount > 1 ? `${yearCount} years` : showNum ? '1 year' : 'year';
  }

  const divisibleBy30 = subscriptionPeriodInDays % 30 === 0;
  if (divisibleBy30) {
    const monthCount = subscriptionPeriodInDays / 30;
    return monthCount > 1 ? `${monthCount} months` : showNum ? '1 month' : 'month';
  }

  const divisibleBy7 = subscriptionPeriodInDays % 7 === 0;
  if (divisibleBy7) {
    const weekCount = subscriptionPeriodInDays / 7;
    return weekCount > 1 ? `${weekCount} weeks` : showNum ? '1 week' : 'week';
  }

  return subscriptionPeriodInDays > 1 ? `${subscriptionPeriodInDays} days` : showNum ? '1 day' : 'day';
};

export const fetchUsableSubscriptionForSession = async (sessionInventory) => {
  try {
    const loggedInUserData = getLocalUserDetails();

    if (!loggedInUserData) {
      return null;
    }

    const { status, data } = await apis.subscriptions.getUserSubscriptionForSession(
      sessionInventory.session_external_id
    );

    if (isAPISuccess(status) && data) {
      if (data.active.length <= 0) {
        return null;
      }

      const usableSubscription =
        data.active.find(
          (subs) =>
            subs.product_credits > subs.product_credits_used &&
            subs.product_details['SESSION'] &&
            subs.product_details['SESSION'].find(
              (includedSession) => includedSession.session_external_id === sessionInventory.session_external_id
            )
        ) ?? null;

      return usableSubscription;
    }
  } catch (error) {
    console.error(error);
    message.error(error.response?.data?.message || 'Failed fetching usable membership for session');
  }

  return null;
};

export const fetchUsableSubscriptionForVideo = async (video) => {
  try {
    const loggedInUserData = getLocalUserDetails();

    if (!loggedInUserData) {
      return null;
    }

    const { status, data } = await apis.subscriptions.getUserSubscriptionForVideo(video.external_id);

    if (isAPISuccess(status) && data) {
      if (data.active.length <= 0) {
        return null;
      }

      const usableSubscription =
        data.active.find(
          (subs) =>
            subs.product_credits > subs.product_credits_used &&
            subs.product_details['VIDEO'] &&
            subs.product_details['VIDEO'].find((includedVideo) => includedVideo.external_id === video.external_id)
        ) ?? null;

      return usableSubscription;
    }
  } catch (error) {
    console.error(error);
    message.error(error.response?.data?.message || 'Failed fetching usable membership for video');
  }

  return null;
};

export const fetchUsableSubscriptionForCourse = async (course) => {
  try {
    const loggedInUserData = getLocalUserDetails();

    if (!loggedInUserData) {
      return null;
    }

    const { status, data } = await apis.subscriptions.getUserSubscriptionForCourse(course.id);

    if (isAPISuccess(status) && data) {
      if (data.active.length <= 0) {
        return null;
      }

      const usableSubscription =
        data.active.find(
          (subs) =>
            subs.course_credits > subs.course_credits_used &&
            subs.product_details['COURSE'] &&
            subs.product_details['COURSE'].find((includedCourse) => includedCourse.id === course.id)
        ) ?? null;

      return usableSubscription;
    }
  } catch (error) {
    console.error(error);
    message.error(error.response?.data?.message || 'Failed fetching usable membership for course');
  }

  return null;
};
