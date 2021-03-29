import React from 'react';

import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

import config from 'config';

import CardForm from 'components/Payment/CardForm';

const PaymentCard = (props) => {
  const stripePromise = loadStripe(config.stripe.secretKey);

  if (!stripePromise) {
    return null;
  }

  return (
    <Elements stripe={stripePromise}>
      <CardForm {...props} />
    </Elements>
  );
};

export default PaymentCard;
