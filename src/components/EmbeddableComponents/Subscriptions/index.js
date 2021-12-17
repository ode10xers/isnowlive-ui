import React, { useState, useEffect, useCallback } from 'react';
import classNames from 'classnames';
import { Row, Col, Spin, Button, Typography, Divider, message } from 'antd';
import { CaretRightOutlined, CheckCircleFilled, UserOutlined } from '@ant-design/icons';

import apis from 'apis';
import Routes from 'routes';

import AuthModal from 'components/AuthModal';
import { showErrorModal, showPurchaseSubscriptionSuccessModal } from 'components/Modals/modals';

import dateUtil from 'utils/date';
import { orderType, productType } from 'utils/constants';
import { isAPISuccess, isUnapprovedUserError } from 'utils/helper';
import { redirectToPluginMembershipDetailsPage } from 'utils/redirect';
import { getUsernameFromUrl, generateUrlFromUsername } from 'utils/url';
import { generateBaseCreditsText, generateSubscriptionDuration } from 'utils/subscriptions';
import { convertHexToHSL, formatHSLStyleString, convertHexToRGB, isBrightColorShade } from 'utils/colors';

import { getAuthCookie } from 'services/authCookie';
import { getAuthTokenFromLS } from 'services/localAuthToken';
import { useGlobalContext } from 'services/globalContext';

import styles from './style.module.scss';

const { Title } = Typography;

const {
  timezoneUtils: { getTimezoneLocation },
} = dateUtil;

const NewSubscriptionItem = ({ subscription = null, onBuy, onDetails }) => {
  const subscriptionColor = subscription?.color_code ?? '#1890ff';
  const [h, s, l] = convertHexToHSL(subscriptionColor);
  const lightnessMultiplier = l >= 50 ? 0.55 : 1;

  const colorObj = {
    '--primary-color': formatHSLStyleString(h, s, l),
    '--primary-color-light': formatHSLStyleString(h, s, l + 10),
    '--primary-color-lighter': formatHSLStyleString(h, s, l + 40 * lightnessMultiplier),
    '--primary-color-lightest': formatHSLStyleString(h, s, l + 50 * lightnessMultiplier),
    '--primary-color-dark': formatHSLStyleString(h, s, l - 20),
    '--primary-color-darkest': formatHSLStyleString(h, s, l - 35),
  };

  return (
    <div className={styles.subscriptionItem} style={colorObj}>
      <Row gutter={[8, 16]} align="middle" justify="center">
        <Col xs={24} className={styles.textAlignCenter}>
          <Title level={5} className={styles.subscriptionName}>
            {subscription?.name}
          </Title>
        </Col>
        <Col xs={24}>
          <Divider className={styles.subscriptionDivider} />
        </Col>
        <Col xs={24}>
          <Row gutter={[4, 4]} justify="center" className={styles.subscriptionDetailsContainer}>
            {subscription?.products['VIDEO'] || subscription?.products['SESSION'] ? (
              <Col xs={24}>
                <CheckCircleFilled className={styles.subscriptionIcon} />{' '}
                {generateBaseCreditsText(subscription, false).replace('/period', '')}
              </Col>
            ) : null}
            {subscription?.products['COURSE'] ? (
              <Col xs={24}>
                <CheckCircleFilled className={styles.subscriptionIcon} />{' '}
                {generateBaseCreditsText(subscription, true).replace('/period', '')}
              </Col>
            ) : null}
            <Col xs={24}>
              <CheckCircleFilled className={styles.subscriptionIcon} /> Renewed every{' '}
              {generateSubscriptionDuration(subscription, true)}
            </Col>
          </Row>
        </Col>
        <Col xs={24} className={styles.textAlignCenter}>
          <Button
            block
            size="large"
            className={classNames(
              styles.subscriptionBuyButton,
              isBrightColorShade(convertHexToRGB(subscriptionColor)) ? styles.darkText : styles.lightText
            )}
            type="primary"
            onClick={() => onBuy(subscription)}
          >
            BUY NOW <Divider type="vertical" className={styles.subscriptionBuyDivider} />{' '}
            {subscription?.currency?.toUpperCase() ?? ''} {subscription?.total_price}
          </Button>
        </Col>
        <Col xs={24} className={styles.textAlignCenter}>
          <Button className={styles.subscriptionDetailsButton} type="text" onClick={() => onDetails(subscription)}>
            View Details <CaretRightOutlined />
          </Button>
        </Col>
      </Row>
    </div>
  );
};

const Subscriptions = () => {
  const {
    state: { userDetails, paymentPopupVisible },
    showPaymentPopup,
  } = useGlobalContext();

  const [isLoading, setIsLoading] = useState(false);
  const [subscriptions, setSubscriptions] = useState([]);
  const [selectedSubscription, setSelectedSubscription] = useState(null);

  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isBuying, setIsBuying] = useState(false);

  const fetchCreatorSubscriptions = useCallback(async () => {
    setIsLoading(true);

    try {
      const { status, data } = await apis.subscriptions.getSubscriptionsByUsername();

      if (isAPISuccess(status) && data) {
        setSubscriptions(data.sort((a, b) => b.total_price - a.total_price));
      }
    } catch (error) {
      console.error(error);
      message.error(error?.response?.data?.message || 'Failed to fetch memberships');
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchCreatorSubscriptions();

    document.body.style.background = 'var(--membership-widget-background-color, transparent)';
  }, [fetchCreatorSubscriptions]);

  useEffect(() => {
    if (!paymentPopupVisible) {
      setSelectedSubscription(null);
    }
  }, [paymentPopupVisible]);

  useEffect(() => {
    if (selectedSubscription && isBuying) {
      showConfirmPaymentPopup();
    }

    // eslint-disable-next-line
  }, [selectedSubscription, isBuying]);

  //#region Start of UI Handlers

  const closeAuthModal = () => {
    setShowAuthModal(false);
  };

  const redirectToAttendeeDashboard = () => {
    const baseUrl = generateUrlFromUsername(getUsernameFromUrl()) || 'app';
    const authToken = getAuthTokenFromLS() || getAuthCookie() || userDetails?.auth_token || '';
    window.open(
      `${baseUrl}${Routes.attendeeDashboard.rootPath + Routes.attendeeDashboard.dashboardPage}${
        authToken ? `?signupAuthToken=${authToken}` : ''
      }`,
      '_blank'
    );
  };

  const handleSignInClicked = () => {
    setIsBuying(false);

    if (userDetails) {
      redirectToAttendeeDashboard();
    } else {
      setShowAuthModal(true);
    }
  };

  const handleBuyClicked = (subs) => {
    setSelectedSubscription(subs);

    if (!userDetails) {
      setShowAuthModal(true);
    } else {
      setIsBuying(true);
    }
  };

  const handleDetailsClicked = (subs) => {
    redirectToPluginMembershipDetailsPage(subs);
  };

  const authModalCallback = () => {
    if (selectedSubscription) {
      setIsBuying(true);
    } else {
      redirectToAttendeeDashboard();
    }
  };

  //#endregion End of UI Handlers

  //#region Start of Purchase Business Logic

  const showConfirmPaymentPopup = () => {
    setIsBuying(false);
    if (!selectedSubscription) {
      showErrorModal('Something went wrong', 'Invalid Subscription Selected');
      return;
    }

    let itemDescription = [];

    if (selectedSubscription.products['VIDEO'] || selectedSubscription.products['SESSION']) {
      itemDescription.push(generateBaseCreditsText(selectedSubscription, false));
    }

    if (selectedSubscription.products['COURSE']) {
      itemDescription.push(generateBaseCreditsText(selectedSubscription, true));
    }

    const paymentPopupData = {
      productId: selectedSubscription.external_id,
      productType: productType.SUBSCRIPTION,
      itemList: [
        {
          name: selectedSubscription.name,
          description: itemDescription.join(', '),
          currency: selectedSubscription.currency,
          price: selectedSubscription.total_price,
        },
      ],
    };

    showPaymentPopup(paymentPopupData, createOrder);
  };

  const createOrder = async (couponCode = '') => {
    setIsLoading(true);
    try {
      const payload = {
        subscription_id: selectedSubscription.external_id,
        coupon_code: couponCode,
        user_timezone_location: getTimezoneLocation(),
      };

      const { status, data } = await apis.subscriptions.createOrderForUser(payload);

      if (isAPISuccess(status) && data) {
        setIsLoading(false);

        if (data.payment_required) {
          return {
            ...data,
            is_successful_order: true,
            payment_order_type: orderType.SUBSCRIPTION,
            payment_order_id: data.subscription_order_id,
          };
        } else {
          showPurchaseSubscriptionSuccessModal();
          return {
            ...data,
            is_successful_order: false,
          };
        }
      }
    } catch (error) {
      setIsLoading(false);
      if (error?.response?.status === 500 && error?.response?.data?.message === 'unable to apply discount to order') {
        showErrorModal(
          'Discount Code Not Applicable',
          'The discount code you entered is not applicable this product. Please try again with a different discount code'
        );
      } else if (!isUnapprovedUserError(error.response)) {
        message.error(error.response?.data?.message || 'Something went wrong');
      }
    }

    return {
      is_successful_order: false,
    };
  };

  //#endregion End of Purchase Business Logic

  //#region Start of UI Components

  const subscriptionList = (
    <Row gutter={[8, 24]} align="stretch">
      {subscriptions.map((subs) => (
        <Col xs={24} sm={12} md={8} lg={6} key={subs.external_id}>
          <NewSubscriptionItem subscription={subs} onBuy={handleBuyClicked} onDetails={handleDetailsClicked} />
        </Col>
      ))}
    </Row>
  );

  //#endregion End of UI Components

  return (
    <div className={styles.subscriptionPluginContainer}>
      <div className={styles.subscriptionListContainer}>
        <Spin spinning={isLoading} tip="Fetching memberships...">
          <AuthModal visible={showAuthModal} closeModal={closeAuthModal} onLoggedInCallback={authModalCallback} />
          <Row gutter={[8, 12]} align="middle">
            <Col xs={24} className={styles.textAlignRight}>
              {userDetails ? (
                <Button className={styles.signupButton} type="primary" onClick={handleSignInClicked}>
                  My Dashboard
                </Button>
              ) : (
                <Button
                  type="primary"
                  icon={<UserOutlined />}
                  onClick={handleSignInClicked}
                  className={styles.signupButton}
                >
                  Sign In/Up
                </Button>
              )}
            </Col>
            <Col xs={24}>{subscriptionList}</Col>
          </Row>
        </Spin>
      </div>
    </div>
  );
};

export default Subscriptions;
