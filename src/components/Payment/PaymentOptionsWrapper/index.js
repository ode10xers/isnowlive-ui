import React, { useEffect, useState, useCallback } from 'react';

import { Tabs, Row, Col, Typography } from 'antd';

import { useStripe } from '@stripe/react-stripe-js';

import apis from 'apis';

import Loader from 'components/Loader';
import CardForm from 'components/Payment/CardForm';
import WalletPaymentButtons from 'components/Payment/WalletPaymentButtons';
import PaymentOptionsSelection, { paymentMethodOptions } from 'components/Payment/PaymentOptionsSelection';

import { isAPISuccess } from 'utils/helper';
import RedirectToStripeCheckoutButton from '../RedirectToStripeCheckoutButton';

const { TabPane } = Tabs;
const { Text } = Typography;

/*
  Here, creatorDetails is required because PaymentRequest 
  requires country and currency, below is a sample format

  creatorDetails = {
    country: 'US',
    currency: 'usd',
  }
*/

const defaultAvailablePaymentOptions = paymentMethodOptions.CARD.options;

// NOTE: Payment Request won't work on local
const PaymentOptionsWrapper = ({
  shouldFetchAvailablePaymentMethods,
  handleAfterPayment,
  handleBeforePayment,
  isFreeProduct = false,
  minimumPriceRequirementFulfilled = true,
  creatorDetails,
  amount,
}) => {
  const stripe = useStripe();
  const [isLoading, setIsLoading] = useState(false);
  const [paymentRequest, setPaymentRequest] = useState(null);
  const [availablePaymentOptions, setAvailablePaymentOptions] = useState(defaultAvailablePaymentOptions);
  const [selectedPaymentOption, setSelectedPaymentOption] = useState(paymentMethodOptions.CARD.key);

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

  const fetchAvailablePaymentMethods = useCallback(async () => {
    setIsLoading(true);

    try {
      const { status, data } = await apis.payment.getAvailablePaymentMethods();

      if (isAPISuccess(status) && data) {
        // The data here should map to paymentMethodOptions
        setAvailablePaymentOptions(data.method_types);
      }
    } catch (error) {
      console.error('Failed fetching payment methods for user', error);
    }

    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (shouldFetchAvailablePaymentMethods) {
      fetchAvailablePaymentMethods();
    } else {
      setAvailablePaymentOptions(defaultAvailablePaymentOptions);
    }
  }, [shouldFetchAvailablePaymentMethods, fetchAvailablePaymentMethods]);

  useEffect(() => {
    setupStripePaymentRequest();
  }, [setupStripePaymentRequest]);

  // This use effect logic is to update the amount in the payment request
  // for dynamic amounts (Pay What You Want)
  useEffect(() => {
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

  // We don't handle wallet payments here since it has a client side requirement check
  const paymentMethodsData = {
    [paymentMethodOptions.CARD.key]: {
      children: (
        <CardForm
          btnProps={{ text: isFreeProduct ? 'Get' : 'Buy', disableButton: minimumPriceRequirementFulfilled }}
          isFree={isFreeProduct}
          onBeforePayment={handleBeforePayment}
          onAfterPayment={handleAfterPayment}
        />
      ),
    },
    [paymentMethodOptions.ONLINE_BANKING.key]: {
      children: (
        <RedirectToStripeCheckoutButton
          onBeforePayment={handleBeforePayment}
          methodName="Online Banking"
          paymentMethods={availablePaymentOptions.filter((payOption) =>
            paymentMethodOptions.ONLINE_BANKING.options.includes(payOption)
          )}
        />
      ),
    },
    [paymentMethodOptions.DEBIT.key]: {
      children: (
        <RedirectToStripeCheckoutButton
          onBeforePayment={handleBeforePayment}
          methodName="Bank Debit"
          paymentMethods={availablePaymentOptions.filter((payOption) =>
            paymentMethodOptions.DEBIT.options.includes(payOption)
          )}
        />
      ),
    },
  };

  const renderPaymentOptions = () => {
    const paymentOptionsToShow = Object.entries(paymentMethodOptions)
      .filter(
        ([key, val]) =>
          key !== paymentMethodOptions.WALLET.key &&
          val.options.some((option) => availablePaymentOptions.includes(option))
      )
      .map(([key, val]) => val);

    return paymentOptionsToShow.map((optionToShow) => (
      <TabPane
        key={optionToShow.key}
        tab={
          <PaymentOptionsSelection
            paymentOptionKey={optionToShow.key}
            isActive={selectedPaymentOption === optionToShow.key}
          />
        }
      >
        {paymentMethodsData[optionToShow.key].children}
      </TabPane>
    ));
  };

  const handleCustomTabBarRender = (props, DefaultTabBar) => {
    console.log(props.panes);

    let panesArr = [];

    props.panes.forEach((pane) => {
      if (pane && pane.length > 0) {
        panesArr.push(...pane);
      }
    });

    return (
      <Row gutter={[8, 8]}>
        {panesArr.map((pane) => (
          <Col xs={12} key={pane.key} onClick={() => setSelectedPaymentOption(pane.key)}>
            {pane.props.tab}
          </Col>
        ))}
      </Row>
    );
  };

  return (
    <Loader loading={isLoading} text="Fetching available payment methods...">
      <Row gutter={[8, 8]}>
        <Col xs={24}>
          <Text strong> Pay with </Text>
        </Col>
        <Col xs={24}>
          <Tabs
            activeKey={selectedPaymentOption}
            onChange={setSelectedPaymentOption}
            tabBarGutter={4}
            size="small"
            renderTabBar={handleCustomTabBarRender}
          >
            {/* Wallet payments only depends on client side requirements, so we process it separately */}
            {paymentRequest && (
              <TabPane
                forceRender={true}
                key={paymentMethodOptions.WALLET.key}
                // disabled={!paymentRequest}
                tab={
                  <PaymentOptionsSelection
                    paymentOptionKey={paymentMethodOptions.WALLET.key}
                    isActive={selectedPaymentOption === paymentMethodOptions.WALLET.key}
                    // disabled={!paymentRequest}
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
            )}

            {renderPaymentOptions()}
          </Tabs>
        </Col>
      </Row>
    </Loader>
  );
};

export default PaymentOptionsWrapper;
