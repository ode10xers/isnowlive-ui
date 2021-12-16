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
