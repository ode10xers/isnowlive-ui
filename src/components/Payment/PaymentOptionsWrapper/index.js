import React, { useEffect, useState, useCallback } from 'react';

import { Tabs } from 'antd';

import { useStripe } from '@stripe/react-stripe-js';

import CardForm from 'components/Payment/CardForm';
import WalletPaymentButtons from 'components/Payment/WalletPaymentButtons';
import PaymentOptionsSelection, { paymentMethodOptions } from 'components/Payment/PaymentOptionsSelection';

const { TabPane } = Tabs;

/*
  Here, creatorDetails is required because PaymentRequest 
  requires country and currency, below is a sample format

  creatorDetails = {
    country: 'US',
    currency: 'usd',
  }
*/

// NOTE: Payment Request won't work on local
const PaymentOptionsWrapper = ({
  handleAfterPayment,
  handleBeforePayment,
  isFreeProduct = false,
  minimumPriceRequirementFulfilled = true,
  creatorDetails,
  amount,
}) => {
  const stripe = useStripe();
  const [paymentRequest, setPaymentRequest] = useState(null);
  const [selectedPaymentOption, setSelectedPaymentOption] = useState('card_payment');

  // The Payment Request Object is loaded here
  // Because there can be a case where user don't have any
  // supported payment options for Wallet Payment
  // In that case we will not render that option
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
          setPaymentRequest(paymentReq);
        } else {
          setPaymentRequest(null);
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

  // This use effect logic is to update the amount in the payment request
  // for dynamic amounts (Pay What You Want)
  useEffect(() => {
    console.log(paymentRequest);
    if (paymentRequest) {
      paymentRequest.update({
        total: {
          label: 'Sub-Total',
          // Need to * 100 because it's counting in sub-units (e.g, cents)
          amount: amount * 100,
        },
      });
    }
  }, [amount, paymentRequest]);

  return (
    <Tabs activeKey={selectedPaymentOption} onChange={setSelectedPaymentOption} tabBarGutter={4} size="small">
      <TabPane
        forceRender={true}
        key={paymentMethodOptions.CARD}
        tab={
          <PaymentOptionsSelection
            paymentOptionKey={paymentMethodOptions.CARD}
            isActive={selectedPaymentOption === paymentMethodOptions.CARD}
          />
        }
      >
        <CardForm
          btnProps={{ text: isFreeProduct ? 'Get' : 'Buy', disableButton: minimumPriceRequirementFulfilled }}
          isFree={isFreeProduct}
          onBeforePayment={handleBeforePayment}
          onAfterPayment={handleAfterPayment}
        />
      </TabPane>
      <TabPane
        forceRender={true}
        key={paymentMethodOptions.WALLET}
        disabled={!paymentRequest}
        tab={
          <PaymentOptionsSelection
            paymentOptionKey={paymentMethodOptions.WALLET}
            isActive={selectedPaymentOption === paymentMethodOptions.WALLET}
            disabled={!paymentRequest}
          />
        }
      >
        {paymentRequest && (
          <WalletPaymentButtons
            paymentRequest={paymentRequest}
            onBeforePayment={handleBeforePayment}
            onAfterPayment={handleAfterPayment}
          />
        )}
      </TabPane>
    </Tabs>
  );
};

export default PaymentOptionsWrapper;
