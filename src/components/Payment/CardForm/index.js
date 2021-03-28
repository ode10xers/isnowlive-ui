import React, { useMemo } from "react";

import { useStripe, useElements, CardElement } from "@stripe/react-stripe-js";
import { Button, Row, Col } from "antd";
import { useHistory } from "react-router-dom";

const useOptions = () => {
  const options = useMemo(
    () => ({
      hidePostalCode: true
    }),
    []
  );

  return options;
};

const CardForm = ({ btnProps, onBeforePayment, form }) => {

  const { text = 'PAY' } = btnProps;

  const stripe = useStripe();
  const elements = useElements();
  const options = useOptions();
  const history = useHistory();

  const makePayment = async (secret, cardEl) => {

    try {
      const result = await stripe.confirmCardPayment(secret, {
        payment_method: {
          card: cardEl,
        },
        setup_future_usage: 'off_session'
      });


      console.log("SavedCardCheckout", result)
      if (result.error) {
        // Show error to your customer
        console.log("SavedCardCheckout Error", result.error.message);
        return false;
      } else {
        if (result.paymentIntent) {
          console.log("SavedCardCheckout Success", result.paymentIntent)
          return true;
          // Show a success message to your customer
          // There's a risk of the customer closing the window before callback execution
          // Set up a webhook or plugin to listen for the payment_intent.succeeded event
          // to save the card to a Customer

          // The PaymentMethod ID can be found on result.paymentIntent.payment_method
        }
      }

    } catch (e) {
      console.log("SavedCardCheckout Error", e);
      return false;
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements) {
      // Stripe.js has not loaded yet. Make sure to disable
      // form submission until Stripe.js has loaded.
      return;
    }

    const cardEl = elements.getElement(CardElement);

    const value = await onBeforePayment(form.getFieldsValue());

    const res = await makePayment(value.payment_gateway_session_token, cardEl);
    console.log('makePayment Completed');

    if (res) {
      history.push(`/stripe/payment/success?order_id=${value.order_id}&transaction_id=${value.transaction_id}&order_type=${'SESSION_ORDER'}`)
    } else {
      alert('error in payment');
    }

  };

  // const disableBtn = () => {
  //   if (!stripe) {
  //     return true;
  //   }

  //   if (disableCondition !== null) {
  //     return disableCondition;
  //   }
  // }

  return (
    <Row>
      <Col xs={24}>
        <CardElement
          options={options}
          onReady={() => {
            console.log("CardElement [ready]");
          }}
          onChange={event => {
            console.log("CardElement [change]", event);
          }}
          onBlur={() => {
            console.log("CardElement [blur]");
          }}
          onFocus={() => {
            console.log("CardElement [focus]");
          }}
        />
      </Col>
      <Col xs={24} style={{ marginTop: '30px' }}>
        <Button block size="middle" type="primary" onClick={handleSubmit}>
          {text}
        </Button>
      </Col>
    </Row>

  );
};

export default CardForm;
