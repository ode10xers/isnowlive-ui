import React, { useState, useEffect, useMemo } from 'react';
import { useStripe, useElements, IdealBankElement } from '@stripe/react-stripe-js';

import { Row, Col, Form, Input, Button, Spin } from 'antd';

import { showErrorModal } from 'components/Modals/modals';

import validationRules from 'utils/validation';
import { orderType } from 'utils/constants';
import { createPaymentSessionForOrder, generateRedirectUrlForStripe } from 'utils/payment';

import { useGlobalContext } from 'services/globalContext';

import styles from './styles.module.scss';

const useOptions = () => {
  const options = useMemo(
    () => ({
      classes: {
        base: styles.StripeCustomElement,
        invalid: styles.StripeCustomElementInvalid,
        focus: styles.StripeCustomElementFocus,
        complete: styles.StripeCustomElementComplete,
      },
      style: {
        base: {
          padding: '10px 12px',
          iconColor: '#1890ff',
          fontWeight: 400,
          fontSize: '14px',
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji'",
        },
        // Ant Design's Red danger color
        invalid: {
          iconColor: '#ff4d4f',
          color: '#ff4d4f',
        },
        // Our KellyGreen in colors.scss
        complete: {
          iconColor: '#52c41a',
          color: '#52c41a',
        },
      },
    }),
    []
  );

  return options;
};

const formInitialValue = { name: null };

// TODO: Can try to refactor along with other redirect payment methods
// Since the flow is pretty similar if we're using payment intents
// It's just that sometimes the required data and the method used is different
const IDealPayment = ({ disabled = false, onBeforePayment, onAfterPayment, paymentMethodType = 'ideal' }) => {
  const {
    state: { userDetails, paymentPopupVisible, paymentPopupData },
  } = useGlobalContext();

  const [form] = Form.useForm();

  const stripe = useStripe();
  const elements = useElements();
  const options = useOptions();

  const [isLoadingStripeComponent, setIsLoadingStripeComponent] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isButtonDisabled, setIsButtonDisabled] = useState(true);

  const buyerName = useMemo(() => (userDetails ? `${userDetails.first_name} ${userDetails.last_name}` : ''), [
    userDetails,
  ]);

  useEffect(() => {
    if (paymentPopupVisible) {
      form.setFieldsValue({
        name: buyerName,
      });
    } else {
      form.resetFields();
      setIsSubmitting(false);

      if (elements) {
        const idealBankElement = elements.getElement(IdealBankElement);
        if (idealBankElement) {
          idealBankElement.clear();
        }
      }
    }
  }, [buyerName, paymentPopupVisible, form, elements]);

  const handleIdealBankChange = (event) => {
    setIsButtonDisabled(event.empty || !event.complete);
  };

  const handleFinish = async (values) => {
    setIsSubmitting(true);

    if (!stripe || !elements) {
      // Stripe.js has not loaded yet. Make sure to disable
      // form submission until Stripe.js has loaded.
      setIsSubmitting(false);
      return;
    }

    const idealBank = elements.getElement(IdealBankElement);

    const orderResponse = await onBeforePayment();

    if (orderResponse && orderResponse?.is_successful_order && orderResponse?.payment_required) {
      // Create Payment Session Here
      const paymentSessionRes = await createPaymentSessionForOrder({
        order_id: orderResponse.payment_order_id,
        order_type: orderResponse.payment_order_type,
        payment_method_type: paymentMethodType,
      });

      // This response should contain client secret
      // as payment_gateway_session_token
      if (paymentSessionRes) {
        const clientSecret = paymentSessionRes.payment_gateway_session_token;

        // Here we specify a simple JSON Object with some data
        // These data will be kept in the query params so we can use it
        // later after redirecting
        let paramsData = {
          order_type: orderResponse.payment_order_type,
          order_id: orderResponse.payment_order_id,
          transaction_id: paymentSessionRes.transaction_id,
          is_gift: paymentPopupData?.isGiftPurchase ?? false,
        };

        if (orderResponse.payment_order_type === orderType.CLASS) {
          paramsData = { ...paramsData, inventory_id: orderResponse.inventory_id };
        }

        // In the case of pass purchase, we might also need to
        // do followup booking, so we need to pass additional data
        const followUpBookingInfo = orderResponse.follow_up_booking_info;

        if (followUpBookingInfo) {
          paramsData = {
            ...paramsData,
            additional_product: followUpBookingInfo.productType,
            additional_product_id: followUpBookingInfo.productId,
          };
        }

        const returnUrl = generateRedirectUrlForStripe(paramsData);

        const { error } = await stripe.confirmIdealPayment(clientSecret, {
          payment_method: {
            ideal: idealBank,
            billing_details: {
              name: values.name,
            },
          },
          return_url: returnUrl,
        });

        // If an error occurs, there will be an error object returned
        // by the Stripe method

        if (error) {
          // Show error to your customer.
          console.error(error);
          showErrorModal('An error occurred!', error.message);
        }

        // Otherwise the customer will be redirected away from your
        // page to complete the payment with their bank.
      }
    }

    // In case this component handles free product payment
    // (which ideally shouldn't happen)
    setTimeout(() => {
      onAfterPayment(orderResponse, null);
      setIsSubmitting(false);
    }, 3000);
  };

  const handleStripeComponentReady = (element) => {
    setIsLoadingStripeComponent(false);
  };

  const shouldDisableButton = () => isButtonDisabled || !stripe || disabled;

  return (
    <Form
      layout="vertical"
      form={form}
      scrollToFirstError={true}
      onFinish={handleFinish}
      initialValues={formInitialValue}
    >
      <Row gutter={[8, 16]} justify="center">
        <Col xs={24}>
          {/* Stripe Component */}
          <Spin spinning={isLoadingStripeComponent}>
            <IdealBankElement
              disabled={!stripe}
              options={options}
              onChange={handleIdealBankChange}
              onReady={handleStripeComponentReady}
            />
          </Spin>
        </Col>
        <Col xs={24}>
          {/* Name input component  */}
          <Form.Item
            label="Name"
            name="name"
            rules={validationRules.requiredValidation}
            className={styles.compactFormItem}
          >
            <Input placeholder="Enter your name here" />
          </Form.Item>
        </Col>
        <Col xs={14} lg={8}>
          <Button
            block
            size="large"
            type="primary"
            disabled={shouldDisableButton()}
            className={shouldDisableButton() ? styles.disabledBuyBtn : styles.greenBtn}
            loading={isSubmitting}
            htmlType="submit"
          >
            Pay with iDeal
          </Button>
        </Col>
      </Row>
    </Form>
  );
};

export default IDealPayment;
