import React, { useMemo, useState, useEffect, useCallback } from 'react';
import classNames from 'classnames';

import { useStripe, useElements, CardElement } from '@stripe/react-stripe-js';
import { Button, Row, Col, message } from 'antd';

import apis from 'apis';

import SavedCards from 'components/Payment/SavedCards';
import { showErrorModal } from 'components/Modals/modals';

import { createPaymentSessionForOrder, verifyPaymentForOrder } from 'utils/payment';
import { isAPISuccess, StripePaymentStatus } from 'utils/helper';

import { useGlobalContext } from 'services/globalContext';

import styles from './styles.module.scss';

// Additional CardOptions Reference:
// https://stripe.com/docs/stripe-js/react#customization-and-styling
// https://codesandbox.io/s/react-stripe-js-card-detailed-omfb3?file=/src/App.js:410-877
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

// NOTE: isFree is a flag sent from PaymentPopup in case the user does not need to pay
// It can be used to bypass button disable condition, hide the card form, etc
const CardForm = ({ btnProps, onBeforePayment, onAfterPayment, isFree }) => {
  const { text = 'PAY' } = btnProps;
  const {
    state: { paymentPopupVisible },
  } = useGlobalContext();

  const stripe = useStripe();
  const elements = useElements();
  const options = useOptions();
  const [isButtonDisabled, setIsButtonDisabled] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [disableSavedCards, setDisableSavedCards] = useState(false);
  const [savedUserCards, setSavedUserCards] = useState([]);
  const [selectedCard, setSelectedCard] = useState(null);

  const fetchUserCards = useCallback(async () => {
    try {
      const { status, data } = await apis.payment.getUserSavedCards();

      if (isAPISuccess(status) && data) {
        setSavedUserCards(data);
      }
    } catch (error) {
      if (error?.response?.status !== 404) {
        message.error('Failed fetching previously used payment methods');
      }
    }
  }, []);

  // Here we need to refetch the user cards if the payment popup is closed
  // Might need to find a better implementation or place to put this

  useEffect(() => {
    if (paymentPopupVisible) {
      if (!isFree) {
        fetchUserCards();
      } else {
        setSavedUserCards([]);
        setSelectedCard(null);
        setDisableSavedCards(false);
      }
    }
  }, [isFree, fetchUserCards, paymentPopupVisible]);

  const makePayment = async (secret, paymentPayload) => {
    try {
      const result = await stripe.confirmCardPayment(secret, paymentPayload);

      if (result.error) {
        return false;
      } else {
        if (result.paymentIntent) {
          return true;
        }
      }
    } catch (e) {
      return false;
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    if (!stripe || !elements) {
      // Stripe.js has not loaded yet. Make sure to disable
      // form submission until Stripe.js has loaded.
      setIsSubmitting(false);
      return;
    }

    const cardEl = elements.getElement(CardElement);

    const orderResponse = await onBeforePayment();
    let verifyOrderRes = null;
    // The case below is when payment is required
    if (orderResponse && orderResponse.payment_required) {
      if (!selectedCard) {
        // Flow for when using new card
        // We will take the card details and save in the BE
        const paymentSessionRes = await createPaymentSessionForOrder({
          order_id: orderResponse.payment_order_id,
          order_type: orderResponse.payment_order_type,
        });

        if (paymentSessionRes) {
          const paymentRes = await makePayment(paymentSessionRes.payment_gateway_session_token, {
            payment_method: {
              card: cardEl,
            },
            setup_future_usage: 'off_session',
          });

          if (paymentRes) {
            verifyOrderRes = await verifyPaymentForOrder({
              order_id: orderResponse.payment_order_id,
              transaction_id: paymentSessionRes.transaction_id,
              order_type: orderResponse.payment_order_type,
            });
          } else {
            showErrorModal('Something went wrong', 'Failed to confirm payment with card details');
          }
        } else {
          showErrorModal('Something went wrong', 'Failed to create payment session');
        }
      } else {
        // Flow for when using saved card
        // The payload for createPaymentSession API will have additional info attached
        const paymentSessionRes = await createPaymentSessionForOrder({
          order_id: orderResponse.payment_order_id,
          order_type: orderResponse.payment_order_type,
          payment_method_id: selectedCard.external_id,
          direct_charge: true,
        });

        if (paymentSessionRes) {
          if (paymentSessionRes.status === StripePaymentStatus.AUTHORIZATION_REQUIRED) {
            // If the status is AUTHORIZATION_REQUIRED, we need to re-auth
            // The paymentSessionRes should contain the payment_method_id (beginning with pm_****)
            // We use that to re-auth the card
            const paymentRes = await makePayment(paymentSessionRes.payment_gateway_session_token, {
              payment_method: paymentSessionRes.payment_method_id,
            });

            if (paymentRes) {
              verifyOrderRes = await verifyPaymentForOrder({
                order_id: orderResponse.payment_order_id,
                transaction_id: paymentSessionRes.transaction_id,
                order_type: orderResponse.payment_order_type,
              });
            } else {
              showErrorModal('Something went wrong', 'Failed to confirm payment with card details');
            }
          } else {
            // If the status is SUCCESS or AWAITING_CAPTURE
            // We can directly hit the verification API
            verifyOrderRes = await verifyPaymentForOrder({
              order_id: orderResponse.payment_order_id,
              transaction_id: paymentSessionRes.transaction_id,
              order_type: orderResponse.payment_order_type,
            });
          }
        } else {
          showErrorModal('Something went wrong', 'Failed to create payment session');
        }
      }
    }

    if (cardEl) {
      cardEl.clear();
    }

    setSelectedCard(null);
    onAfterPayment(orderResponse, verifyOrderRes);
    setIsSubmitting(false);
  };

  const changeSelectedCard = (userCard) => {
    const cardEl = elements.getElement(CardElement);
    cardEl.update({
      disabled: userCard ? true : false,
    });
    setSelectedCard(userCard);
  };

  return (
    <Row gutter={[8, 8]} justify="center">
      {!isFree && (
        <>
          {savedUserCards.length > 0 && (
            <Col xs={24}>
              <SavedCards
                disabled={disableSavedCards}
                userCards={savedUserCards}
                selectedCard={selectedCard}
                setSelectedCard={changeSelectedCard}
              />
            </Col>
          )}
          <Col xs={24} className={styles.inlineCardForm}>
            <CardElement
              options={options}
              onChange={(event) => {
                console.log(event.empty);
                setDisableSavedCards(!event.empty);

                if (event.complete) {
                  setIsButtonDisabled(false);
                } else {
                  setIsButtonDisabled(true);
                }
              }}
            />
          </Col>
        </>
      )}

      <Col xs={8} lg={6}>
        <Button
          block
          size="middle"
          type="primary"
          disabled={!isFree && isButtonDisabled && !selectedCard}
          onClick={handleSubmit}
          className={classNames(
            styles.buyButton,
            !isFree && isButtonDisabled && !selectedCard ? styles.disabledBtn : undefined
          )}
          loading={isSubmitting}
        >
          {text}
        </Button>
      </Col>
    </Row>
  );
};

export default CardForm;
