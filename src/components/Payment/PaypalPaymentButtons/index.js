import React, { useState, useEffect, useRef, useCallback } from 'react';

import { Spin } from 'antd';

import config from 'config';

import { showErrorModal } from 'components/Modals/modals';

import { createPaymentSessionForOrder, verifyPaymentForOrder } from 'utils/payment';

const PaypalPaymentButtons = ({ onBeforePayment, onAfterPayment, creatorCurrency = 'USD' }) => {
  const buttonContainerRef = useRef();

  const [isLoading, setIsLoading] = useState(false);

  const renderPaypalButtons = useCallback(() => {
    if (window.paypal) {
      let orderData = null;

      window.paypal
        .Buttons({
          createOrder: async (paypalData, actions) => {
            setIsLoading(true);
            try {
              const orderResponse = await onBeforePayment();

              if (orderResponse && orderResponse?.is_successful_order && orderResponse?.payment_required) {
                const paymentSessionResponse = await createPaymentSessionForOrder({
                  order_id: orderResponse.payment_order_id,
                  order_type: orderResponse.payment_order_type,
                });

                orderData = { ...orderResponse, transaction_id: paymentSessionResponse.transaction_id };

                if (paymentSessionResponse && paymentSessionResponse?.pg_transaction_ref_id) {
                  setIsLoading(false);
                  return paymentSessionResponse?.pg_transaction_ref_id;
                }
              }
            } catch (error) {
              console.error(error);
              showErrorModal(
                'Failed to create PayPal order',
                error?.response?.data?.message || 'Something went wrong.'
              );
            }
            setIsLoading(false);
            return null;
          },
          onApprove: async (paypalData, actions) => {
            setIsLoading(true);

            try {
              if (orderData) {
                const verifyOrderResponse = await verifyPaymentForOrder({
                  order_id: orderData.order_id,
                  transaction_id: orderData.transaction_id,
                  order_type: orderData.payment_order_type,
                });

                onAfterPayment(orderData, verifyOrderResponse);
              } else {
                showErrorModal('Invalid order data!');
              }
            } catch (error) {
              console.error(error);
              showErrorModal(
                'Failed to verify PayPal order',
                error?.response?.data?.message || 'Something went wrong.'
              );
            }

            setIsLoading(false);
          },
        })
        .render(buttonContainerRef.current);
    }

    //eslint-disable-next-line
  }, []);

  const loadScript = (url, callback) => {
    const script = document.createElement('script');
    script.type = 'text/javascript';
    if (script.readyState) {
      // only required for IE <9
      script.onreadystatechange = function () {
        if (script.readyState === 'loaded' || script.readyState === 'complete') {
          script.onreadystatechange = null;
          callback();
        }
      };
    } else {
      //Others
      script.onload = function () {
        callback();
      };
    }

    script.src = url;
    document.getElementsByTagName('head')[0].appendChild(script);
  };

  useEffect(() => {
    loadScript(
      `https://www.paypal.com/sdk/js?currency=${creatorCurrency.toUpperCase()}&client-id=${
        config.paypal.clientID
      }&commit=true`,
      renderPaypalButtons
    );
  }, [creatorCurrency, renderPaypalButtons]);

  return (
    <Spin spinning={isLoading}>
      <div id="paypal-button-container" ref={buttonContainerRef}></div>
    </Spin>
  );
};

export default PaypalPaymentButtons;
