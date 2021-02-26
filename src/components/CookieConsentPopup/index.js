import React from 'react';

import { Typography } from 'antd';

import CookieConsent from 'react-cookie-consent';

import { useGlobalContext } from 'services/globalContext';

import styles from './styles.module.scss';

const { Paragraph, Text } = Typography;

const DOMAIN = {
  development: 'localhost',
  staging: '.stage.passion.do',
  production: '.passion.do',
};

const CookieConsentPopup = () => {
  const { setCookieConsent } = useGlobalContext();

  const redirectToGoogle = () => {
    window.location.href = 'http://www.google.com';
  };

  return (
    <CookieConsent
      onAccept={() => setCookieConsent(true)}
      onDecline={redirectToGoogle}
      extraCookieOptions={{
        domain: DOMAIN[process.env.NODE_ENV],
      }}
      location="bottom"
      cookieName="cookieUsageConsent"
      overlay={true}
      enableDeclineButton={true}
      setDeclineCookie={false}
      flipButtons={true}
      buttonWrapperClasses={styles.btnWrapper}
      buttonStyle={{ margin: 8 }}
      buttonClasses="ant-btn ant-btn-primary ant-btn-block"
      declineButtonStyle={{ margin: 8 }}
      declineButtonClasses="ant-btn ant-btn-danger ant-btn-block"
      disableButtonStyles={true}
    >
      <Paragraph className={styles.whiteText}>
        Our website requires the use of certain cookies in order to fully function and give you the best possible
        service. Some of these cookies are{' '}
        <Text strong className={styles.whiteText}>
          {' '}
          third party cookies{' '}
        </Text>{' '}
        that we use to enable us to support you whenever needed.
      </Paragraph>
      <Paragraph className={styles.whiteText}>
        In order to continue to the website, we need you to acknowledge and accept the use of these cookies.
      </Paragraph>
    </CookieConsent>
  );
};

export default CookieConsentPopup;
