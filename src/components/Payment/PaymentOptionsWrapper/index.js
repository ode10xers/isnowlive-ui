import React, { useEffect, useState, useCallback } from 'react';

import { Tabs, Row, Col, Typography, Divider } from 'antd';

import { useStripe } from '@stripe/react-stripe-js';

import apis from 'apis';

import Loader from 'components/Loader';
import CardForm from 'components/Payment/CardForm';
import WalletPaymentButtons from 'components/Payment/WalletPaymentButtons';
// import RedirectToStripeCheckoutButton from 'components/Payment/RedirectToStripeCheckoutButton';
import { PaymentOptionsSelection, paymentMethodOptions } from 'components/Payment/PaymentOptionsSelection';

import { isAPISuccess } from 'utils/helper';

import { useGlobalContext } from 'services/globalContext';

import styles from './styles.module.scss';
import BankRedirectPayments from '../BankRedirectPayments';

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
  handleAfterPayment,
  handleBeforePayment,
  minimumPriceRequirementFulfilled = true,
  shouldSavePaymentDetails = false,
  creatorDetails,
  amount,
}) => {
  const stripe = useStripe();

  const {
    state: { paymentPopupVisible },
  } = useGlobalContext();

  const [isLoading, setIsLoading] = useState(false);
  const [paymentRequest, setPaymentRequest] = useState(null);
  const [availablePaymentOptions, setAvailablePaymentOptions] = useState(defaultAvailablePaymentOptions);
  const [selectedPaymentOption, setSelectedPaymentOption] = useState(paymentMethodOptions.CARD.key);

  // The Payment Request Object is loaded here
  // Because there can be a case where user don't have any
  // supported payment options for Wallet Payment
  // In that case we will not render that option
  const setupStripePaymentRequest = useCallback(
    async (paymentAmount) => {
      try {
        if (stripe && creatorDetails) {
          console.log('Setup');
          console.log(paymentAmount);
          // Create Payment Request
          const paymentReq = stripe.paymentRequest({
            country: creatorDetails.country,
            currency: creatorDetails.currency,
            total: {
              label: 'Sub-Total',
              // It seems that this amount includes sub-unit (e.g cents),
              // so we need to * 100 for this to show correctly
              amount: paymentAmount * 100,
            },
            requestPayerName: true,
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
    },
    [stripe, creatorDetails]
  );

  const fetchAvailablePaymentMethods = useCallback(async (currency) => {
    setIsLoading(true);

    try {
      const { status, data } = await apis.payment.getAvailablePaymentMethods(currency);

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
    if (paymentPopupVisible) {
      fetchAvailablePaymentMethods(creatorDetails.currency);
      if (!paymentRequest) {
        setupStripePaymentRequest(amount);
      }
    } else {
      setAvailablePaymentOptions(defaultAvailablePaymentOptions);
      setPaymentRequest(null);
      setSelectedPaymentOption(paymentMethodOptions.CARD.key);
    }
    //eslint-disable-next-line
  }, [paymentPopupVisible, paymentRequest, fetchAvailablePaymentMethods, creatorDetails, setupStripePaymentRequest]);

  // This use effect logic is to update the amount in the payment request
  // for dynamic amounts (Pay What You Want)
  useEffect(() => {
    console.log(amount);
    if (paymentRequest) {
      paymentRequest.update({
        total: {
          label: 'Sub-Total',
          // Need to * 100 because it's counting in sub-units (e.g, cents)
          amount: amount * 100,
        },
      });
      setPaymentRequest(paymentRequest);
    }
    //eslint-disable-next-line
  }, [amount]);

  // TODO: Rename minimumPriceRequirementFulfilled for better context
  // We don't handle wallet payments here since it has a client side requirement check
  const paymentMethodsData = {
    [paymentMethodOptions.CARD.key]: {
      children: (
        <CardForm
          btnProps={{ text: 'Buy', disableButton: minimumPriceRequirementFulfilled }}
          onBeforePayment={handleBeforePayment}
          onAfterPayment={handleAfterPayment}
        />
      ),
    },
    [paymentMethodOptions.ONLINE_BANKING.key]: {
      children: (
        <BankRedirectPayments
          disabled={minimumPriceRequirementFulfilled}
          options={availablePaymentOptions.filter((payOption) =>
            paymentMethodOptions.ONLINE_BANKING.options.includes(payOption)
          )}
          onBeforePayment={handleBeforePayment}
          onAfterPayment={handleAfterPayment}
        />
      ),
    },
    [paymentMethodOptions.DEBIT.key]: {
      children: (
        <div></div>
        //     <RedirectToStripeCheckoutButton
        //       onBeforePayment={handleBeforePayment}
        //       methodName="Bank Debit"
        //       helperText="You’ll be redirected to a Stripe page to select between SEPA or Bacs Direct Debit options"
        //       paymentMethods={availablePaymentOptions.filter((payOption) =>
        //         paymentMethodOptions.DEBIT.options.includes(payOption)
        //       )}
        //     />
      ),
    },
  };

  const renderPaymentOptions = () => {
    const paymentOptionsToShow = Object.entries(paymentMethodOptions)
      .filter(
        ([key, val]) =>
          val.key !== paymentMethodOptions.WALLET.key &&
          val.options.some((option) => availablePaymentOptions.includes(option)) &&
          (shouldSavePaymentDetails ? val.can_save_payment_details : true)
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
    let panesArr = [];

    props.panes.forEach((pane) => {
      if (pane) {
        if (Array.isArray(pane) && pane.length > 0) {
          panesArr.push(...pane);
        } else {
          panesArr.push(pane);
        }
      }
    });

    return (
      <Row gutter={[8, 8]} className={styles.mb10}>
        {panesArr.map((pane) => (
          <Col xs={12} key={pane.key} onClick={() => setSelectedPaymentOption(pane.key)}>
            {pane.props.tab}
          </Col>
        ))}
        <Col xs={24}>
          <Divider className={styles.compactDivider} />
        </Col>
      </Row>
    );
  };

  return (
    <Loader loading={isLoading} text="Fetching available payment methods...">
      <Row gutter={[8, 8]} className={styles.mb10}>
        <Col xs={24}>
          <Text strong> Pay with </Text>
        </Col>
        <Col xs={24}>
          <Tabs
            className={styles.paymentOptionsContainer}
            activeKey={selectedPaymentOption}
            onChange={setSelectedPaymentOption}
            renderTabBar={handleCustomTabBarRender}
          >
            {renderPaymentOptions()}
            {/* Wallet payments only depends on client side requirements, so we process it separately */}
            {paymentRequest && !shouldSavePaymentDetails && (
              <TabPane
                forceRender={true}
                key={paymentMethodOptions.WALLET.key}
                tab={
                  <PaymentOptionsSelection
                    paymentOptionKey={paymentMethodOptions.WALLET.key}
                    isActive={selectedPaymentOption === paymentMethodOptions.WALLET.key}
                  />
                }
              >
                {paymentRequest && (
                  <WalletPaymentButtons
                    disabled={minimumPriceRequirementFulfilled}
                    paymentRequest={paymentRequest}
                    onBeforePayment={handleBeforePayment}
                    onAfterPayment={handleAfterPayment}
                  />
                )}
              </TabPane>
            )}
          </Tabs>
        </Col>

        <Col xs={24}>
          <Divider className={styles.compactDivider} />
        </Col>
      </Row>
    </Loader>
  );
};

export default PaymentOptionsWrapper;
