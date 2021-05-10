import React, { useEffect, useState, useCallback } from 'react';

import { PaymentRequestButtonElement, useStripe } from '@stripe/react-stripe-js';

import Loader from 'components/Loader';

const WalletPaymentButtons = () => {
  const stripe = useStripe();

  const [isLoading, setIsLoading] = useState(true);
  const [paymentRequest, setPaymentRequest] = useState(null);

  // For now it's hardcoded, but later need to fetch it from API after creating payment Intent
  const clientSecret = 'pi_1IpSJYHZtrrEElwYov94BpNP_secret_ZviThFN0ATCiQQe6jAn1bjzq7';

  // Flow will be, on paymentmethod event of PaymentRequest
  // We hit the usual create payment session API
  // after it returns successfully, we proceed to confirm the payment

  const setupStripePaymentRequest = useCallback(() => {
    setIsLoading(true);

    try {
      if (stripe) {
        // Create Payment Request
        const paymentReq = stripe.paymentRequest({
          country: 'NZ',
          currency: 'eur',
          total: {
            label: 'Sub-Total',
            amount: 122,
          },
          requestPayerName: true,
          // requestPayerEmail: true,
        });

        // Check availability of Payment Request API
        // See more about the availability here
        // https://stripe.com/docs/stripe-js/elements/payment-request-button?html-or-react=react#react-prerequisites
        paymentReq.canMakePayment().then((result) => {
          if (result) {
            paymentReq.on('paymentmethod', async (ev) => {
              // TODO: I think we hit the Create Payment Session API Here
              console.log('Payment Method Event Object', ev);

              // Confirm the PaymentIntent without handling potential next actions (yet).
              const { paymentIntent, error: confirmError } = await stripe.confirmCardPayment(clientSecret, {
                payment_method: ev.paymentMethod.id,
              });

              // Stripe JS Docs mentions that ev.complete() must be called within 30 secs
              if (confirmError) {
                // Report to the browser that the payment failed, prompting it to
                // re-show the payment interface, or show an error message and close
                // the payment interface.
                console.error('Failed to Confirm Payment for Payment Request');
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
                    alert('Payment Successful using this payment method and additional steps are done');
                    // The payment has succeeded.
                  }
                } else {
                  alert('Payment Successful! No additional steps required');

                  // The payment has succeeded.
                }
              }
            });

            setPaymentRequest(paymentReq);
          }
        });
      }
    } catch (error) {
      console.error('Failed to create Payment Request');
    }

    setIsLoading(false);
  }, [stripe]);

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
