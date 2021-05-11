import React, { useEffect, useState } from 'react';

import { PaymentRequestButtonElement, useStripe } from '@stripe/react-stripe-js';

import Loader from 'components/Loader';
import { showErrorModal } from 'components/Modals/modals';

import { createPaymentSessionForOrder, verifyPaymentForOrder } from 'utils/payment';

const WalletPaymentButtons = ({ onBeforePayment, onAfterPayment, paymentRequest }) => {
  const stripe = useStripe();

  const [isLoading, setIsLoading] = useState(false);

  const onConfirmPaymentDetails = async (ev) => {
    setIsLoading(true);
    console.log('Payment Method Event Object', ev);

    // Create Order here
    const orderResponse = await onBeforePayment();
    let verifyOrderRes = null;

    if (orderResponse && orderResponse?.is_successful_order) {
      if (!orderResponse?.payment_required) {
        ev.complete('success');
      } else {
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
    } else {
      ev.complete('fail');
    }

    onAfterPayment(orderResponse, verifyOrderRes);
    setIsLoading(false);
  };

  useEffect(() => {
    if (paymentRequest) {
      paymentRequest.on('paymentmethod', onConfirmPaymentDetails);
    }
    //eslint-disable-next-line
  }, [paymentRequest]);

  return paymentRequest ? (
    <Loader loading={isLoading} text="Processing payment..." size="small">
      <PaymentRequestButtonElement options={{ paymentRequest }} />
    </Loader>
  ) : null;
};

export default WalletPaymentButtons;
