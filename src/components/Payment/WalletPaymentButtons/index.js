import React, { useEffect, useState, useCallback } from 'react';

import { PaymentRequestButtonElement, useStripe } from '@stripe/react-stripe-js';

import Loader from 'components/Loader';
import { showErrorModal } from 'components/Modals/modals';

import { createPaymentSessionForOrder, verifyPaymentForOrder } from 'utils/payment';

/*
  Here, paymentDetails is required because PaymentRequest 
  requires country, currency, and total, below is a sample format

  paymentDetails = {
    country: 'US',
    currency: 'usd',
    total: 120,
  }
*/

// TODO: Try to find out a better way to support PWYW for this
// Currently disabled for PWYW
const WalletPaymentButtons = ({ onBeforePayment, onAfterPayment, paymentDetails }) => {
  const stripe = useStripe();

  const [isLoading, setIsLoading] = useState(true);
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
              alert('Payment Failed for this payment method that requires additional steps');
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
    setIsLoading(true);

    try {
      if (stripe && paymentDetails) {
        // Create Payment Request
        const paymentReq = stripe.paymentRequest({
          country: paymentDetails.country,
          currency: paymentDetails.currency,
          total: {
            label: 'Sub-Total',
            amount: paymentDetails.total,
          },
          requestPayerName: true,
          disableWallets: ['browserCard'],
          // requestPayerEmail: true,
        });

        // Check availability of Payment Request API
        // See more about the availability here
        // https://stripe.com/docs/stripe-js/elements/payment-request-button?html-or-react=react#react-prerequisites
        const result = await paymentReq.canMakePayment();

        if (result) {
          paymentReq.on('paymentmethod', onConfirmPaymentDetails);
          setPaymentRequest(paymentReq);
          setIsLoading(false);
        }
      }
    } catch (error) {
      console.error('Failed to create Payment Request');
      setIsLoading(false);
    }
    //eslint-disable-next-line
  }, [stripe, paymentDetails]);

  useEffect(() => {
    setupStripePaymentRequest();
  }, [setupStripePaymentRequest]);

  return (
    <Loader loading={isLoading} text="Checking available wallet payment methods...">
      {paymentRequest ? (
        <PaymentRequestButtonElement options={{ paymentRequest }} />
      ) : (
        <div>
          Default text to show when no wallet payment options are available. Do note that this also includes
          browser-saved cards, but we can choose to hide that option
        </div>
      )}
    </Loader>
  );
};

export default WalletPaymentButtons;
