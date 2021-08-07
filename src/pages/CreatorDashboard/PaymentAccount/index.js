import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useHistory } from 'react-router-dom';
// import countryList from 'react-select-country-list';
import { Select, Typography, Button, message, Row, Col, Modal, Input } from 'antd';
import { CheckCircleTwoTone } from '@ant-design/icons';

import apis from 'apis';
import Routes from 'routes';

import Section from 'components/Section';
import { resetBodyStyle, showErrorModal, showSuccessModal } from 'components/Modals/modals';

import Earnings from 'pages/CreatorDashboard/Earnings';

import { isAPISuccess, preventDefaults, StripeAccountStatus } from 'utils/helper';
import { getLocalUserDetails } from 'utils/storage';
import { paymentProvider } from 'utils/constants';

import { useGlobalContext } from 'services/globalContext';
import { mixPanelEventTags, trackSuccessEvent, trackFailedEvent } from 'services/integrations/mixpanel';
import { gtmTriggerEvents, pushToDataLayer } from 'services/integrations/googleTagManager';

import styles from './styles.module.scss';

const { Title, Paragraph, Text } = Typography;
const { Option } = Select;
const { creator } = mixPanelEventTags;

const PaymentAccount = () => {
  const location = useLocation();
  const history = useHistory();
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  // const countries = countryList().getData();
  const [countries, setCountries] = useState([]);
  const [paypalAccountModalVisible, setPaypalAccountModalVisible] = useState(false);
  const [creatorPaypalEmail, setCreatorPaypalEmail] = useState(getLocalUserDetails().email);

  const {
    state: {
      userDetails: {
        profile: { payment_account_status = StripeAccountStatus.NOT_CONNECTED },
      },
      setUserDetails,
    },
  } = useGlobalContext();
  const validateAccount = location?.state?.validateAccount;
  const [paymentConnected, setPaymentConnected] = useState(payment_account_status);

  const openStripeConnect = useCallback(
    (url) => {
      pushToDataLayer(gtmTriggerEvents.CREATOR_PAY_INITIATED, {
        creator_payment_account_status: payment_account_status,
      });
      window.open(url, '_self');
    },
    // eslint-disable-next-line
    []
  );

  const relinkStripe = useCallback(async () => {
    try {
      const { data, status } = await apis.payment.stripe.relinkAccount();
      if (isAPISuccess(status)) {
        setIsLoading(false);
        openStripeConnect(data.onboarding_url);
      }
    } catch (error) {
      message.error(error.response?.data?.message || 'Something went wrong.');
      setIsLoading(false);
    }
  }, [openStripeConnect]);

  const openStripeDashboard = useCallback(async () => {
    try {
      setIsLoading(true);
      const { status, data } = await apis.payment.stripe.getDashboard();
      if (isAPISuccess(status) && data) {
        setIsLoading(false);
        window.open(data.url, '_self');
      }
    } catch (error) {
      if (
        error.response?.data?.code === 500 &&
        error.response?.data?.message === 'error while generating dashboard URL from stripe'
      ) {
        relinkStripe();
      } else {
        message.error(error.response?.data?.message || 'Something went wrong.');
      }
      setIsLoading(false);
    }
  }, [relinkStripe]);

  const fetchSupportedCountriesForPayment = useCallback(async () => {
    setIsLoading(true);

    try {
      const { status, data } = await apis.payment.getCreatorPaymentCountries();

      if (isAPISuccess(status) && data) {
        setCountries(Object.entries(data));
      }
    } catch (error) {
      console.error(error);
      message.error(error?.response?.data?.message || 'Something went wrong.');
    }

    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchSupportedCountriesForPayment();
  }, [fetchSupportedCountriesForPayment]);

  useEffect(() => {
    if (validateAccount && paymentConnected === StripeAccountStatus.VERIFICATION_PENDING) {
      const validateStripeAccount = async () => {
        try {
          const { status, data } = await apis.payment.stripe.validate();
          if (isAPISuccess(status) && data) {
            const paymentStatus = data?.status || StripeAccountStatus.VERIFICATION_PENDING;

            const localUserDetails = getLocalUserDetails();
            localUserDetails.profile.payment_account_status = paymentStatus;
            setUserDetails(localUserDetails);

            Modal.confirm({
              centered: true,
              title: 'Stripe account successfully connected',
              content: `Now you can start making paid products and earn money by selling them. You can now check your earnings in the "Get Paid" section of your dashboard.`,
              onOk: () => history.push(Routes.creatorDashboard.rootPath + Routes.creatorDashboard.createSessions),
              okText: 'Create Session',
              onCancel: () => history.push(Routes.creatorDashboard.rootPath),
              cancelText: 'Go to Dashboard',
              closable: true,
              icon: <CheckCircleTwoTone twoToneColor="#52c41a" />,
            });

            setPaymentConnected(paymentStatus);
          }
        } catch (error) {
          if (error.response?.data?.message && error.response?.data?.message !== 'unable to find payment credentials') {
            openStripeDashboard();
          }
        }
      };

      validateStripeAccount();
    }
    //eslint-disable-next-line
  }, [validateAccount, openStripeDashboard, setUserDetails]);

  const onboardUserToStripe = async () => {
    setIsLoading(true);
    const eventTag = creator.click.payment.connectStripe;

    try {
      const { data, status } = await apis.payment.stripe.onboardUser({ country: selectedCountry });
      if (isAPISuccess(status)) {
        setIsLoading(false);
        trackSuccessEvent(eventTag, { country: selectedCountry });
        openStripeConnect(data.onboarding_url);
      }
    } catch (error) {
      if (
        error.response?.data?.code === 500 &&
        error.response?.data?.message === 'user already registered for account, trigger relink'
      ) {
        // TODO: Add special handler here if selected country === IN (for India)
        relinkStripe();
      } else {
        pushToDataLayer(gtmTriggerEvents.STRIPE_CONNECT_FAILED, {
          selected_country: selectedCountry,
        });
        trackFailedEvent(eventTag, error, { country: selectedCountry });
        message.error(error.response?.data?.message || 'Something went wrong.');
        setIsLoading(false);
      }
    }
  };

  const connectPayment = (e) => {
    preventDefaults(e);

    const selectedCountryPaymentProvider = countries.find(
      ([countryName, countryData]) => countryData.country_code === selectedCountry
    ).provider;

    if (selectedCountryPaymentProvider === paymentProvider.STRIPE) {
      onboardUserToStripe();
    } else {
      setPaypalAccountModalVisible(true);
    }
  };

  // TODO: Implement analytics here later
  const connectPayPalAccount = async () => {
    const selectedCountryData = countries.find(
      ([countryName, countryData]) => countryData.country_code === selectedCountry
    );

    if (!selectedCountry || !selectedCountryData) {
      showErrorModal('Invalid country selected!');
    }

    setIsLoading(true);

    try {
      const payload = {
        country: selectedCountry,
        currency: selectedCountryData[1].currency,
        email: creatorPaypalEmail,
      };

      const { status, data } = await apis.payment.paypal.initiateCreatorPayPalAccount(payload);

      if (isAPISuccess(status) && data) {
        // TODO: Confirm what happens here
        showSuccessModal('Your PayPal Account has been successfully connected!');
        setTimeout(() => window.location.reload(), 2000);
      }
    } catch (error) {
      console.error(error);
      showErrorModal('Failed to initiate PayPal Account', error?.response?.data?.message || 'Something went wrong.');
    }

    setIsLoading(false);
  };

  const handleConnectPaypalAccountClicked = () => {
    Modal.confirm({
      title: 'Confirm your PayPal email',
      content: (
        <>
          <Paragraph>Are you sure you want to use this email below to receive PayPal payments?</Paragraph>
          <Paragraph strong>{creatorPaypalEmail}</Paragraph>
        </>
      ),
      okText: 'Confirm',
      onOk: connectPayPalAccount,
    });
  };

  let view = null;
  if (paymentConnected === StripeAccountStatus.NOT_CONNECTED) {
    view = (
      <>
        <Modal
          centered={true}
          closable={true}
          visible={paypalAccountModalVisible}
          onCancel={() => setPaypalAccountModalVisible(false)}
          afterClose={resetBodyStyle}
          footer={null}
          title="Enter your PayPal Email"
        >
          <Row gutter={[8, 8]}>
            <Col xs={24}>
              <Text>Please enter the email to use with your PayPal Account.</Text>
            </Col>
            <Col xs={24}>
              <Input
                placeholder="The email associated with your PayPal Account"
                maxLength={50}
                onChange={setCreatorPaypalEmail}
                value={creatorPaypalEmail}
              />
            </Col>
            <Col xs={24}>
              <Row justify="end">
                <Col>
                  <Button type="primary" loading={isLoading} onClick={handleConnectPaypalAccountClicked}>
                    Connect PayPal Account
                  </Button>
                </Col>
              </Row>
            </Col>
          </Row>
        </Modal>

        <Title level={2}>Get Paid</Title>

        <Row className={styles.mt50}>
          <Col xs={24} md={12}>
            <Paragraph>
              We use Stripe as our payment processor. Stripe lets you accept credit/debit cards, Apple, Google and
              Microsoft Pay. All charges will show up immediately in your account. You don't need an existing Stripe
              account to connect.
            </Paragraph>
          </Col>
        </Row>

        <Row>
          <Col className={styles.stripeContainer} sm={24} md={18} lg={14} xl={12}>
            <Row>
              <Col>Your Country</Col>
            </Row>

            <Row className={styles.mt10}>
              <Col sm={24} md={12}>
                <Select
                  value={selectedCountry}
                  showSearch
                  style={{ width: 200 }}
                  onChange={setSelectedCountry}
                  placeholder="Select country"
                  optionFilterProp="children"
                  filterOption={(input, option) => option.children.toLowerCase().startsWith(input.toLowerCase())}
                >
                  {countries.map(([countryName, countryData]) => (
                    <Option key={countryData.country_code} value={countryData.country_code}>
                      {countryName}
                    </Option>
                  ))}
                </Select>
              </Col>
              <Col sm={24} md={12} className={styles.connectBtn}>
                <Button type="primary" loading={isLoading} onClick={connectPayment}>
                  Connect Payment
                </Button>
              </Col>
            </Row>
          </Col>
        </Row>
      </>
    );
  } else {
    view = <Earnings />;
  }

  return <Section>{view}</Section>;
};

export default PaymentAccount;
