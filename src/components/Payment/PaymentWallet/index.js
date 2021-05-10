import React from 'react';

import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

import config from 'config';

import WalletPaymentButtons from 'components/Payment/WalletPaymentButtons';

const PaymentWallet = (props) => {
  //TODO: Try without stripe account key
  const stripePromise = loadStripe(config.stripe.secretKey);

  if (!stripePromise) {
    return null;
  }

  return (
    <Elements stripe={stripePromise}>
      <WalletPaymentButtons {...props} />
    </Elements>
  );
};

export default PaymentWallet;
