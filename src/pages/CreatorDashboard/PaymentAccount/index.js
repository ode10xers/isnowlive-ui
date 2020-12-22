import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import countryList from 'react-select-country-list';
import { Select, Typography, Button, message, Row, Col } from 'antd';

import Section from 'components/Section';
import { useGlobalContext } from 'services/globalContext';
import { isAPISuccess, StripeAccountStatus } from 'utils/helper';
import apis from 'apis';
import Earnings from 'pages/CreatorDashboard/Earnings';

import styles from './styles.module.scss';

const { Title, Paragraph } = Typography;
const { Option } = Select;

const PaymentAccount = () => {
  const location = useLocation();
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const countries = countryList().getData();
  const {
    state: {
      userDetails: { payment_account_status = StripeAccountStatus.NOT_CONNECTED },
    },
  } = useGlobalContext();
  const validateAccount = location?.state?.validateAccount;
  const [paymentConnected, setPaymentConnected] = useState(payment_account_status);

  const openStripeDashboard = async () => {
    try {
      setIsLoading(true);
      const { status, data } = await apis.payment.stripe.getDashboard();
      if (isAPISuccess(status) && data) {
        setIsLoading(false);
        window.open(data.url, '_self');
      }
    } catch (error) {
      message.error(error.response?.data?.message || 'Something went wrong.');
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (validateAccount) {
      const validateStripeAccount = async () => {
        try {
          const { status } = await apis.payment.stripe.validate();
          if (isAPISuccess(status)) {
            message.success('Stripe Account Connected Succesfully!!');
            setPaymentConnected(StripeAccountStatus.VERIFICATION_PENDING);
          }
        } catch (error) {
          if (error.response?.data?.message !== 'unable to find payment credentials') {
            openStripeDashboard();
          }
        }
      };
      validateStripeAccount();
    }
  }, [validateAccount]);

  const handleChange = (value) => {
    setSelectedCountry(value);
  };

  const openStripeConnect = (url) => {
    window.open(url, '_self');
  };

  const relinkStripe = async () => {
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
  };

  const onboardUserToStripe = async () => {
    setIsLoading(true);
    try {
      const { data, status } = await apis.payment.stripe.onboardUser({ country: selectedCountry });
      if (isAPISuccess(status)) {
        setIsLoading(false);
        openStripeConnect(data.onboarding_url);
      }
    } catch (error) {
      if (
        error.response?.data?.code === 500 &&
        error.response?.data?.message === 'user already registered for account, trigger relink'
      ) {
        relinkStripe();
      } else {
        message.error(error.response?.data?.message || 'Something went wrong.');
        setIsLoading(false);
      }
    }
  };

  let view = null;
  if (paymentConnected === StripeAccountStatus.NOT_CONNECTED) {
    view = (
      <>
        <Title level={2}>Get Paid</Title>

        <Row className={styles.mt50}>
          <Col xs={24} md={12}>
            <Paragraph>
              We use Stripe as our payment processor. Stripe lets you accept credit/debit cards, Apple, Google and
              Micorsoft Pay. All charges will show up immediately in your account. You don't need an existing Stripe
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
                  onChange={handleChange}
                  placeholder="Select country"
                  optionFilterProp="children"
                  filterOption={(input, option) => option.children.toLowerCase().startsWith(input.toLowerCase())}
                >
                  {countries.map((country) => (
                    <Option value={country.value}>{country.label}</Option>
                  ))}
                </Select>
              </Col>
              <Col sm={24} md={12} className={styles.connectBtn}>
                <Button type="primary" loading={isLoading} onClick={onboardUserToStripe}>
                  Connect Stripe
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
