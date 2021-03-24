import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import countryList from 'react-select-country-list';
import { Select, Typography, Button, message, Row, Col } from 'antd';
import { useTranslation } from 'react-i18next';

import Section from 'components/Section';
import { useGlobalContext } from 'services/globalContext';
import { mixPanelEventTags, trackSuccessEvent, trackFailedEvent } from 'services/integrations/mixpanel';
import { isAPISuccess, StripeAccountStatus } from 'utils/helper';
import apis from 'apis';
import Earnings from 'pages/CreatorDashboard/Earnings';

import styles from './styles.module.scss';

const { Title, Paragraph } = Typography;
const { Option } = Select;
const { creator } = mixPanelEventTags;

const PaymentAccount = () => {
  const { t: translate } = useTranslation();
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

  const openStripeConnect = (url) => {
    window.open(url, '_self');
  };

  const relinkStripe = useCallback(async () => {
    try {
      const { data, status } = await apis.payment.stripe.relinkAccount();
      if (isAPISuccess(status)) {
        setIsLoading(false);
        openStripeConnect(data.onboarding_url);
      }
    } catch (error) {
      message.error(error.response?.data?.message || translate('SOMETHING_WENT_WRONG'));
      setIsLoading(false);
    }
  }, [translate]);

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
        error.response?.data?.message === 'error while generating dashboard URL from stripe' // do not translate this(BE hardcoded)
      ) {
        relinkStripe();
      } else {
        message.error(error.response?.data?.message || translate('SOMETHING_WENT_WRONG'));
      }
      setIsLoading(false);
    }
  }, [relinkStripe, translate]);

  useEffect(() => {
    if (validateAccount) {
      const validateStripeAccount = async () => {
        try {
          const { status } = await apis.payment.stripe.validate();
          if (isAPISuccess(status)) {
            message.success(translate('STRIPE_ACCOUNT_CONNECTED_SUCCESS'));
            setPaymentConnected(StripeAccountStatus.VERIFICATION_PENDING);
          }
        } catch (error) {
          // do not translate this(BE hardcoded)
          if (error.response?.data?.message !== 'unable to find payment credentials') {
            openStripeDashboard();
          }
        }
      };
      validateStripeAccount();
    }
  }, [validateAccount, openStripeDashboard, translate]);

  const handleChange = (value) => {
    setSelectedCountry(value);
  };

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
        error.response?.data?.message === 'user already registered for account, trigger relink' // do not translate this(BE hardcoded)
      ) {
        relinkStripe();
      } else {
        trackFailedEvent(eventTag, error, { country: selectedCountry });
        message.error(error.response?.data?.message || translate('SOMETHING_WENT_WRONG'));
        setIsLoading(false);
      }
    }
  };

  let view = null;
  if (paymentConnected === StripeAccountStatus.NOT_CONNECTED) {
    view = (
      <>
        <Title level={2}>{translate('GET_PAID')}</Title>

        <Row className={styles.mt50}>
          <Col xs={24} md={12}>
            <Paragraph>{translate('GET_PAID_TEXT')}</Paragraph>
          </Col>
        </Row>

        <Row>
          <Col className={styles.stripeContainer} sm={24} md={18} lg={14} xl={12}>
            <Row>
              <Col>{translate('YOUR_COUNTRY')}</Col>
            </Row>

            <Row className={styles.mt10}>
              <Col sm={24} md={12}>
                <Select
                  value={selectedCountry}
                  showSearch
                  style={{ width: 200 }}
                  onChange={handleChange}
                  placeholder={translate('SELECT_COUNTRY')}
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
                  {translate('CONNECT_STRIPE')}
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
