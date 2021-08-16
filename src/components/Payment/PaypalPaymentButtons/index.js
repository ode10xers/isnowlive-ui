import React, { useState, useEffect, useRef, useCallback } from 'react';

import { Spin, Typography } from 'antd';

import config from 'config';

import { showErrorModal } from 'components/Modals/modals';

import { createPaymentSessionForOrder, verifyPaymentForOrder } from 'utils/payment';

import styles from './styles.module.scss';

const { Text } = Typography;

const PaypalPaymentButtons = ({ onBeforePayment, onAfterPayment, buttonDisabled = false, creatorCurrency = 'USD' }) => {
  const buttonContainerRef = useRef();

  const [isLoading, setIsLoading] = useState(true);

  const renderPaypalButtons = useCallback(() => {
    if (window.paypal) {
      let orderData = null;
      setIsLoading(true);

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

                orderData = {
                  ...orderResponse,
                  transaction_id: paymentSessionResponse.transaction_id,
                  order_id: paymentSessionResponse.order_id,
                };

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

      setIsLoading(false);
    }
  }, [onAfterPayment, onBeforePayment]);

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
    if (buttonDisabled) {
      document.getElementById('paypal-button-container').innerHTML = '';
    } else {
      loadScript(
        `https://www.paypal.com/sdk/js?currency=${creatorCurrency.toUpperCase()}&client-id=${
          config.paypal.clientID
        }&commit=true`,
        renderPaypalButtons
      );
    }
  }, [buttonDisabled, creatorCurrency, renderPaypalButtons]);

  return (
    <Spin spinning={isLoading}>
      <div className={styles.paypalContainer}>
        {buttonDisabled && (
          <Text type="danger" className={styles.disabledText}>
            Please confirm all the information above is correct before paying
          </Text>
        )}
        <div id="paypal-button-container" className={styles.paypalButtonContainer} ref={buttonContainerRef}></div>
      </div>
    </Spin>
  );
};

export default PaypalPaymentButtons;
