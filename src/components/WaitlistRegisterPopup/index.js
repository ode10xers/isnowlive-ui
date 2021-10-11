import React, { useState, useEffect, useCallback } from 'react';

import { Modal, Spin, Typography } from 'antd';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

import apis from 'apis';
import config from 'config';

import WaitlistCardForm from './WaitlistCardForm';
import { resetBodyStyle } from 'components/Modals/modals';

import { paymentProvider } from 'utils/constants';
import { getLocalUserDetails } from 'utils/storage';
import { isAPISuccess, getUsernameFromUrl, reservedDomainName, isInCreatorDashboard } from 'utils/helper';

import { useGlobalContext } from 'services/globalContext';

const { Title } = Typography;

const WaitlistRegisterPopup = () => {
  const {
    state: { waitlistPopupVisible },
    hideWaitlistPopup,
  } = useGlobalContext();

  const [isLoading, setIsLoading] = useState(false);

  const [creatorCountry, setCreatorCountry] = useState('SG');
  const [creatorStripeAccountID, setCreatorStripeAccountID] = useState(null);
  const [creatorPaymentProvider, setCreatorPaymentProvider] = useState(null);
  const [stripePromise, setStripePromise] = useState(null);

  const fetchCreatorDetailsForPayment = useCallback(async () => {
    setIsLoading(true);
    let creatorUsername = 'app';

    if (isInCreatorDashboard()) {
      const localUserDetails = getLocalUserDetails();

      if (localUserDetails.is_creator) {
        creatorUsername = localUserDetails.username;
      }
    } else {
      creatorUsername = getUsernameFromUrl();
    }

    if (reservedDomainName.includes(creatorUsername)) {
      return;
    }

    try {
      const { status, data } = await apis.user.getProfileByUsername(creatorUsername);

      if (isAPISuccess(status) && data) {
        if (data.profile?.country) {
          setCreatorCountry(data.profile?.country);
        }

        if (data.profile?.payment_provider) {
          setCreatorPaymentProvider(data.profile?.payment_provider);
        }

        if (data.profile?.connect_account_id) {
          setCreatorStripeAccountID(data.profile?.connect_account_id);
        }
      }
    } catch (error) {
      console.error('Failed fetching creator details for payment', error?.response);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchCreatorDetailsForPayment();
  }, [fetchCreatorDetailsForPayment]);

  useEffect(() => {
    let stripeKey = config.stripe.secretKey;

    if (creatorCountry && creatorCountry === 'IN') {
      stripeKey = config.stripe.indianSecretKey;
      console.log('Using indian stripe key for this creator');
    }

    if (creatorPaymentProvider === paymentProvider.STRIPE) {
      if (creatorStripeAccountID) {
        setStripePromise(
          loadStripe(stripeKey, {
            stripeAccount: creatorStripeAccountID,
          })
        );
      } else {
        setStripePromise(loadStripe(stripeKey));
      }
    }
  }, [creatorCountry, creatorPaymentProvider, creatorStripeAccountID]);

  return (
    <Modal
      visible={waitlistPopupVisible}
      closable={true}
      maskClosable={true}
      centered={true}
      footer={null}
      title={<Title level={4}>Reserve Your Spot</Title>}
      onCancel={hideWaitlistPopup}
      afterClose={resetBodyStyle}
    >
      <Spin spinning={isLoading} tip="Fetching waitlist details">
        <Elements stripe={stripePromise}>
          <WaitlistCardForm />
        </Elements>
      </Spin>
    </Modal>
  );
};

export default WaitlistRegisterPopup;
