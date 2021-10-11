import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useStripe, useElements, CardElement } from '@stripe/react-stripe-js';

import { Row, Col, Button, Spin, Typography, List, message } from 'antd';

import apis from 'apis';

import { showErrorModal, showWaitlistJoinedModal } from 'components/Modals/modals';

import { isUnapprovedUserError, isAPISuccess, productType as productTypes } from 'utils/helper';

import { useGlobalContext } from 'services/globalContext';

import styles from './styles.module.scss';

const { Text, Paragraph } = Typography;

const useOptions = () => {
  const options = useMemo(
    () => ({
      hidePostalCode: true,
      iconStyle: 'solid',
      classes: {
        base: styles.StripeCustomElement,
        invalid: styles.StripeCustomElementInvalid,
        focus: styles.StripeCustomElementFocus,
        complete: styles.StripeCustomElementComplete,
      },
      style: {
        // Our DodgerBlue in colors.scss
        // Also adjusted the font to match our website
        base: {
          iconColor: '#1890ff',
          fontWeight: 400,
          fontSize: '14px',
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji'",
        },
        // Ant Design's Red danger color
        invalid: {
          iconColor: '#ff4d4f',
          color: '#ff4d4f',
        },
        // Our KellyGreen in colors.scss
        complete: {
          iconColor: '#52c41a',
          color: '#52c41a',
        },
      },
    }),
    []
  );

  return options;
};

/*
  Sample waitlistPopypdata:
  {
    productId : course?.id, -> String
    productName : course?.name, -> String
    productType : productType.COURSE, -> String
  };
*/

const WaitlistCardForm = () => {
  const {
    state: { waitlistPopupVisible, waitlistPopupData },
    hideWaitlistPopup,
  } = useGlobalContext();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingStripeComponent, setIsLoadingStripeComponent] = useState(true);

  const [isButtonDisabled, setIsButtonDisabled] = useState(true);

  const [savedUserCards, setSavedUserCards] = useState([]);

  const stripe = useStripe();
  const elements = useElements();
  const options = useOptions();

  const { productId = '', productName = '', productType = productTypes.COURSE } = waitlistPopupData ?? {};

  const fetchUserCards = useCallback(async () => {
    try {
      const { status, data } = await apis.payment.getUserSavedCards();

      if (isAPISuccess(status) && data) {
        setSavedUserCards(data);
      }
    } catch (error) {
      if (isUnapprovedUserError(error.response)) {
        hideWaitlistPopup();
      } else if (error?.response?.status !== 404) {
        message.error(error?.response?.data?.message || 'Failed fetching previously used payment methods');
      }
    }
  }, [hideWaitlistPopup]);

  useEffect(() => {
    if (waitlistPopupVisible) {
      fetchUserCards();
    } else {
      setSavedUserCards([]);

      if (elements) {
        const cardEl = elements.getElement(CardElement);
        if (cardEl) {
          cardEl.clear();
        }
      }
    }
  }, [waitlistPopupVisible, fetchUserCards, elements]);

  const handleStripeComponentReady = useCallback((element) => {
    setIsLoadingStripeComponent(false);
  }, []);

  const createSetupIntent = async () => {
    try {
      const { status, data } = await apis.payment.setupUserCard();

      if (isAPISuccess(status) && data) {
        return data;
      }
    } catch (error) {
      console.error(error);
      showErrorModal('Failed creating setup intent', error?.response?.data?.message || 'Something went wrong.');
    }

    return null;
  };

  const stripeSetupCard = async (clientSecret, payload) => {
    try {
      const result = await stripe.confirmCardSetup(clientSecret, payload);

      if (result.error) {
        return null;
      } else {
        if (result.setupIntent && result.setupIntent.payment_method && result.setupIntent.status === 'succeeded') {
          return result.setupIntent.payment_method;
        }
      }
    } catch (error) {
      console.error(error);
    }

    return null;
  };

  const joinWaitList = async () => {
    let targetAPI = null;

    switch (productType) {
      case productTypes.COURSE:
        targetAPI = apis.waitlist.joinCourseWaitlist;
        break;
      default:
        targetAPI = null;
        break;
    }

    try {
      const { status } = await targetAPI(productId);

      if (isAPISuccess(status)) {
        return true;
      }
    } catch (error) {
      console.error(error);
      showErrorModal('Failed to join course waitlist', error?.response?.data?.message || 'Something went wrong');
    }

    return false;
  };

  const handleJoinWaitlistClicked = async () => {
    setIsSubmitting(true);

    if (savedUserCards?.length > 0) {
      const joined = await joinWaitList();

      if (joined) {
        showWaitlistJoinedModal(productType?.toLowerCase() ?? 'product');
        hideWaitlistPopup();
      }
    } else {
      if (!stripe || !elements) {
        // Stripe.js has not loaded yet. Make sure to disable
        // form submission until Stripe.js has loaded.
        setIsSubmitting(false);
        return;
      }

      try {
        const cardEl = elements.getElement(CardElement);

        const setupIntentData = await createSetupIntent();
        if (setupIntentData) {
          const paymentMethodId = await stripeSetupCard(setupIntentData.payment_gateway_session_token, {
            payment_method: { card: cardEl },
          });

          if (paymentMethodId) {
            const { status } = await apis.payment.saveCustomerCard({ payment_method_id: paymentMethodId });

            if (isAPISuccess(status)) {
              const joined = await joinWaitList();

              if (joined) {
                showWaitlistJoinedModal(productType?.toLowerCase() ?? 'product');
                hideWaitlistPopup();
              }
            }
          }
        }
      } catch (error) {
        console.error(error);
        message.error('An error occurred while joining waitlist');
      }
    }

    setIsSubmitting(false);
  };

  if (!waitlistPopupData) {
    return null;
  }

  return (
    <Row gutter={[8, 12]}>
      <Col xs={24}>
        {savedUserCards?.length > 0 ? (
          <Paragraph>
            Click on the <Text strong>Join Waitlist</Text> button below to join the waitlist for this{' '}
            {productType?.toLowerCase()}.
          </Paragraph>
        ) : (
          <Paragraph>
            You will need to enter your card details below.{' '}
            <Text strong>Rest assured that you will not be charged anything.</Text>{' '}
          </Paragraph>
        )}
        <Paragraph>
          You will be notified via email when the creator opens the {productType?.toLowerCase()} for purchase.
        </Paragraph>
      </Col>
      <Col xs={24}>
        <List
          dataSource={[productName]}
          renderItem={(item) => (
            <List.Item>
              <List.Item.Meta title={item} description={<Text className={styles.greenText}>Spot Reservation</Text>} />
            </List.Item>
          )}
        />
      </Col>
      {savedUserCards?.length === 0 && (
        <Col xs={24}>
          <Spin spinning={isLoadingStripeComponent}>
            <CardElement
              options={options}
              onReady={handleStripeComponentReady}
              onChange={(event) => {
                if (event.complete) {
                  setIsButtonDisabled(false);
                } else {
                  setIsButtonDisabled(true);
                }
              }}
            />
          </Spin>
        </Col>
      )}
      <Col xs={24}>
        <Row justify="center">
          <Col xs={12} lg={8}>
            <Button
              block
              size="large"
              type="primary"
              onClick={handleJoinWaitlistClicked}
              disabled={savedUserCards?.length === 0 && isButtonDisabled}
              loading={isSubmitting}
            >
              Join Waitlist
            </Button>
          </Col>
        </Row>
      </Col>
    </Row>
  );
};

export default WaitlistCardForm;
