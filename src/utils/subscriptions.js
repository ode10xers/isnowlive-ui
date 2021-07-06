const productTextMapping = {
  SESSION: 'Sessions',
  VIDEO: 'Videos',
  COURSE: 'Courses',
};

const accessTypeTextMapping = {
  PUBLIC: 'Public',
  MEMBERSHIP: 'Membership',
};

export const generateBaseCreditsText = (subscription, isCourse = false) => {
  let calculatedBaseCredits = 0;
  let productText = '';

  if (isCourse) {
    calculatedBaseCredits = subscription?.products['COURSE']?.credits || 0;
    productText = 'Course';
  } else {
    calculatedBaseCredits =
      (subscription?.products['SESSION']?.credits || 0) + (subscription?.products['VIDEO']?.credits || 0);

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

export const generateIncludedProducts = (subscription, isCourse = false) => {
  let productTexts = [];

  if (isCourse) {
    productTexts =
      subscription?.products['COURSE']?.access_types?.map(
        (accessType) => `${accessTypeTextMapping[accessType]} ${productTextMapping['COURSE']}`
      ) || [];
  } else {
    const excludedProductKeys = ['COURSE'];
    Object.entries(subscription?.products).forEach(([key, val]) => {
      if (!excludedProductKeys.includes(key)) {
        productTexts = [
          ...productTexts,
          ...val.access_types.map((accessType) => `${accessTypeTextMapping[accessType]} ${productTextMapping[key]}`),
        ];
      }
    });
  }

  return productTexts;
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
