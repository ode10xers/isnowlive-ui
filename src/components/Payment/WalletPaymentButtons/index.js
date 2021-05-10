import React, { useEffect, useState, useCallback } from 'react';

import { Tabs, Typography } from 'antd';

import { PaymentRequestButtonElement, useStripe } from '@stripe/react-stripe-js';

import Loader from 'components/Loader';
import { showErrorModal } from 'components/Modals/modals';

import { createPaymentSessionForOrder, verifyPaymentForOrder } from 'utils/payment';

/*
  Here, creatorDetails is required because PaymentRequest 
  requires country and currency, below is a sample format

  creatorDetails = {
    country: 'US',
    currency: 'usd',
  }
*/
const { TabPane } = Tabs;
const { Text } = Typography;

const WalletPaymentButtons = ({ onBeforePayment, onAfterPayment, creatorDetails, amount = 1 }) => {
  const stripe = useStripe();

  const [isLoading, setIsLoading] = useState(false);
  const [paymentRequest, setPaymentRequest] = useState(null);

  const onConfirmPaymentDetails = async (ev) => {
    setIsLoading(true);
    console.log('Payment Method Event Object', ev);

    // Create Order here
    const orderResponse = await onBeforePayment();
    let verifyOrderRes = null;

    if (orderResponse && orderResponse.payment_required) {
      // Create Payment Session Here
      const paymentSessionRes = await createPaymentSessionForOrder({
        order_id: orderResponse.payment_order_id,
        order_type: orderResponse.payment_order_type,
        payment_method_type: ev.paymentMethod?.card?.wallet?.type,
      });

      // This response should contain client secret
      // as payment_gateway_session_token
      if (paymentSessionRes) {
        const clientSecret = paymentSessionRes.payment_gateway_session_token;

        // We use the client secret here to confirm the payment
        const { paymentIntent, error: confirmError } = await stripe.confirmCardPayment(clientSecret, {
          payment_method: ev.paymentMethod.id,
        });

        // Stripe JS Docs mentions that ev.complete() must be called within 30 secs
        if (confirmError) {
          // Report to the browser that the payment failed, prompting it to
          // re-show the payment interface, or show an error message and close
          // the payment interface.
          showErrorModal('Failed to Confirm Payment for Payment Request');
          console.log(confirmError);
          ev.complete('fail');
        } else {
          // Report to the browser that the confirmation was successful, prompting
          // it to close the browser payment method collection interface.
          ev.complete('success');
          // Check if the PaymentIntent requires any actions and if so let Stripe.js
          // handle the flow. If using an API version older than "2019-02-11" instead
          // instead check for: `paymentIntent.status === "requires_source_action"`.
          if (paymentIntent.status === 'requires_action') {
            // Let Stripe.js handle the rest of the payment flow.
            const { error } = await stripe.confirmCardPayment(clientSecret);
            if (error) {
              // The payment failed -- ask your customer for a new payment method.
              showErrorModal('Additional steps required to finish payment failed', error);
              console.error(error);
            } else {
              // Payment requires next steps, but is successful
              verifyOrderRes = await verifyPaymentForOrder({
                order_id: orderResponse.payment_order_id,
                transaction_id: paymentSessionRes.transaction_id,
                order_type: orderResponse.payment_order_type,
              });
            }
          } else {
            // Payment is successful and don't require next step
            verifyOrderRes = await verifyPaymentForOrder({
              order_id: orderResponse.payment_order_id,
              transaction_id: paymentSessionRes.transaction_id,
              order_type: orderResponse.payment_order_type,
            });
          }
        }
      }
    }

    onAfterPayment(orderResponse, verifyOrderRes);
    setIsLoading(false);
  };

  const setupStripePaymentRequest = useCallback(async () => {
    try {
      if (stripe && creatorDetails) {
        // Create Payment Request
        const paymentReq = stripe.paymentRequest({
          country: creatorDetails.country,
          currency: creatorDetails.currency,
          total: {
            label: 'Sub-Total',
            // It seems that this amount includes sub-unit (e.g cents),
            // so we need to * 100 for this to show correctly
            amount: amount * 100,
          },
          requestPayerName: true,
          // disableWallets: ['browserCard'],
          // requestPayerEmail: true,
        });

        // Check availability of Payment Request API
        // See more about the availability here
        // https://stripe.com/docs/stripe-js/elements/payment-request-button?html-or-react=react#react-prerequisites
        const result = await paymentReq.canMakePayment();

        if (result) {
          paymentReq.on('paymentmethod', onConfirmPaymentDetails);
          setPaymentRequest(paymentReq);
        }
      }
    } catch (error) {
      console.error('Failed to create Payment Request');
    }

    //eslint-disable-next-line
  }, [stripe]);

  useEffect(() => {
    setupStripePaymentRequest();
  }, [setupStripePaymentRequest]);

  useEffect(() => {
    if (paymentRequest) {
      paymentRequest.update({
        total: {
          label: 'Sub-Total',
          amount: amount * 100,
        },
      });
    }
  }, [paymentRequest, amount]);

  return paymentRequest ? (
    <TabPane forceRender={true} key="wallet_payment" tab={<Text strong> Pay with E-Wallet </Text>}>
      <Loader loading={isLoading} text="Processing payment..." size="small">
        <PaymentRequestButtonElement options={{ paymentRequest }} />
      </Loader>
    </TabPane>
  ) : null;
};

export default WalletPaymentButtons;
