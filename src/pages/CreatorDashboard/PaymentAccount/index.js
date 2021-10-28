import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useHistory } from 'react-router-dom';
import { Select, Typography, Button, message, Row, Col, Modal, Input, List } from 'antd';
import { CheckCircleTwoTone, LeftOutlined } from '@ant-design/icons';

import apis from 'apis';
import Routes from 'routes';

import Section from 'components/Section';
import { resetBodyStyle, showErrorModal, showSuccessModal } from 'components/Modals/modals';

import Earnings from 'pages/CreatorDashboard/Earnings';

import { getLocalUserDetails } from 'utils/storage';
import { isAPISuccess, preventDefaults } from 'utils/helper';
import { paymentProvider, StripeAccountStatus } from 'utils/constants';

import { useGlobalContext } from 'services/globalContext';
import { mixPanelEventTags, trackSuccessEvent, trackFailedEvent } from 'services/integrations/mixpanel';
import { gtmTriggerEvents, pushToDataLayer } from 'services/integrations/googleTagManager';
import { openFreshChatWidget } from 'services/integrations/fresh-chat';

import StripeLogo from 'assets/icons/stripe/StripeLogo';
import PaypalLogo from 'assets/icons/paypal/PaypalLogo';
import styles from './styles.module.scss';

const { Title, Paragraph, Text, Link } = Typography;
const { Option } = Select;
const { creator } = mixPanelEventTags;

const PaymentAccount = () => {
  const location = useLocation();
  const history = useHistory();

  const {
    state: { userDetails },
    setUserDetails,
  } = useGlobalContext();

  const payment_account_status = userDetails?.profile?.payment_account_status ?? StripeAccountStatus.NOT_CONNECTED;

  const validateAccount = location?.state?.validateAccount;

  const [selectedCountry, setSelectedCountry] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [countries, setCountries] = useState([]);
  const [paypalAccountModalVisible, setPaypalAccountModalVisible] = useState(false);
  const [creatorPaypalEmail, setCreatorPaypalEmail] = useState(getLocalUserDetails().email);

  const [paymentConnected, setPaymentConnected] = useState(payment_account_status);

  const [showComparePaymentProvider, setShowComparePaymentProvider] = useState(false);

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

    const selectedCountryPaymentProviders = countries.find(
      ([countryName, countryData]) => countryData.country_code === selectedCountry
    )[1].provider;

    const supportsPaypal = selectedCountryPaymentProviders.includes(paymentProvider.PAYPAL);
    const supportsStripe = selectedCountryPaymentProviders.includes(paymentProvider.STRIPE);

    if (supportsPaypal && supportsStripe) {
      setShowComparePaymentProvider(true);
    } else if (supportsStripe) {
      onboardUserToStripe();
    } else if (supportsPaypal) {
      setPaypalAccountModalVisible(true);
    } else {
      message.info('That country is not supported by our payment providers.');
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
        showSuccessModal('Your PayPal Account has been successfully connected!');
        setPaypalAccountModalVisible(false);
        setTimeout(() => window.location.reload(), 1500);
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

  const generatePaypalFeesLink = () => {
    if (!selectedCountry) {
      return '#';
    }

    const selectedCountryCode = countries.find(
      ([countryName, countryData]) => countryData.country_code === selectedCountry
    )[1].country_code;

    return `https://www.paypal.com/${selectedCountryCode.toLowerCase()}/webapps/mpp/merchant-fees`;
  };

  const paypalModal = (
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
            onChange={(e) => setCreatorPaypalEmail(e.target.value)}
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
  );

  let view = null;
  if (paymentConnected === StripeAccountStatus.NOT_CONNECTED) {
    if (showComparePaymentProvider) {
      const listData = [
        {
          key: 'logo',
          rowDetails: 'Payment Provider',
          stripeInfo: <StripeLogo height={64} width={128} />,
          paypalInfo: <PaypalLogo height={64} width={128} />,
        },
        {
          key: 'currency',
          rowDetails: 'Your offering currency',
          stripeInfo: <Text>All offering priced in your bank account's local currency (EUR, CAD, AUD, etc)</Text>,
          paypalInfo: (
            <Text>
              Check support for your currency{' '}
              <Link
                href="https://developer.paypal.com/docs/reports/reference/paypal-supported-currencies/"
                target="_blank"
              >
                here
              </Link>
            </Text>
          ),
        },
        {
          key: 'local_fees',
          rowDetails: 'Local Payment Fees',
          stripeInfo: <Text>1.4% + €0.25 (0.30 USD equivalent in your currency)</Text>,
          paypalInfo: (
            <div>
              <Paragraph>Usually 4.4% + 0.30 USD</Paragraph>
              <Link href={generatePaypalFeesLink()} target="_blank">
                See exact fees on PayPal's site
              </Link>
            </div>
          ),
        },
        {
          key: 'international_fees',
          rowDetails: 'International Payment Fees',
          stripeInfo: <Text>2.9% + €0.25 (0.30 USD equivalent in your currency)</Text>,
          paypalInfo: (
            <div>
              <Paragraph>Usually 4.4% + 0.30 USD</Paragraph>
              <Link href={generatePaypalFeesLink()} target="_blank">
                See exact fees on PayPal's site
              </Link>
            </div>
          ),
        },
        {
          key: 'subscriptions',
          rowDetails: 'Sell auto renewing memberships',
          stripeInfo: <Text>Possible right now</Text>,
          paypalInfo: (
            <Text>
              Not right now,{' '}
              <Button style={{ padding: 0 }} type="link" onClick={openFreshChatWidget}>
                Express your interest
              </Button>
            </Text>
          ),
        },
        {
          key: 'payment_options',
          rowDetails: 'Payment options for your customers',
          stripeInfo: (
            <div>
              <ul>
                <li>All Debit & Credit Cards</li>
                <li>Apple Pay</li>
                <li>Google Pay</li>
                <li>Online Banking (European banks only)</li>
                <li>Bank Debits (European banks only)</li>
              </ul>
            </div>
          ),
          paypalInfo: (
            <div>
              <ul>
                <li>All Debit & Credit Cards</li>
                <li>PayPal Wallet</li>
              </ul>
            </div>
          ),
        },
        {
          key: 'account_exists',
          rowDetails: 'Already have an account?',
          stripeInfo: (
            <Button type="primary" onClick={onboardUserToStripe}>
              Connect existing Stripe account
            </Button>
          ),
          paypalInfo: (
            <Button type="primary" onClick={() => setPaypalAccountModalVisible(true)}>
              Connect existing PayPal account
            </Button>
          ),
        },
        {
          key: 'account_new',
          rowDetails: 'Create & Connect a new account',
          stripeInfo: (
            <Button type="primary" onClick={onboardUserToStripe}>
              Create a free Stripe account
            </Button>
          ),
          paypalInfo: (
            <Button type="primary" onClick={() => window.open('https://www.paypal.com/us/welcome/signup')}>
              Create a free PayPal account
            </Button>
          ),
        },
      ];

      view = (
        <div className={styles.comparisonContainer}>
          {paypalModal}
          <Row gutter={[8, 12]}>
            <Col xs={24}>
              <Button icon={<LeftOutlined />} onClick={() => setShowComparePaymentProvider(false)}>
                Back to select country
              </Button>
            </Col>
            <Col xs={24}>
              <Paragraph>
                You can only select either Stripe OR PayPal to receive money from your customers into your bank account.
              </Paragraph>
              <Paragraph>
                Passion.Do Team recommends you to use Stripe because of the benefits listed below. Though you are free
                to integrate PayPal if you want to. Our platform works well with both and it's our responsibility to
                highlight the differences and recommend the best for your business.
              </Paragraph>
            </Col>
            <Col xs={24}>
              <List
                dataSource={listData}
                itemLayout="vertical"
                size="large"
                rowKey={(data) => data.key}
                renderItem={(data) => (
                  <List.Item>
                    <Row gutter={[8, 12]} align="stretch">
                      <Col xs={data.key === 'logo' ? 0 : 24} md={8}>
                        <Text strong className={styles.listDescription}>
                          {data.rowDetails}
                        </Text>
                      </Col>
                      <Col xs={12} md={8}>
                        {data.stripeInfo}
                      </Col>
                      <Col xs={12} md={8}>
                        {data.paypalInfo}
                      </Col>
                    </Row>
                  </List.Item>
                )}
              />
            </Col>
          </Row>
        </div>
      );
    } else {
      view = (
        <Section>
          {paypalModal}

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
        </Section>
      );
    }
  } else {
    view = (
      <Section>
        <Earnings />
      </Section>
    );
  }

  return view;
};

export default PaymentAccount;
