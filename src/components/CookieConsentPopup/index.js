import React from 'react';

import { Modal, Typography } from 'antd';

import CookieConsent, { Cookies } from 'react-cookie-consent';

import { isMobileDevice } from 'utils/device';
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

  const handleDecline = () => {
    Modal.confirm({
      mask: true,
      closable: false,
      maskClosable: false,
      title: 'Need your attention',
      content: (
        <>
          <Paragraph>
            Our website requires the use of certain cookies in order to fully function and give you the best possible
            service. Some of these cookies are <Text strong> third party cookies </Text> that we use to enable us to:
          </Paragraph>
          <ul>
            <li className={styles.cookieUsageList}> provide realtime chat to support you whenever needed, </li>
            <li className={styles.cookieUsageList}> give a smoother payment experience, and </li>
            <li className={styles.cookieUsageList}> analyze the site's performance on your device </li>
          </ul>
          <Paragraph>
            In order to continue to the website, we need you to acknowledge and accept the use of these cookies.
          </Paragraph>
          <Paragraph>You can also choose not to use this website and we will take you to Google's homepage</Paragraph>
        </>
      ),
      cancelText: 'I Accept',
      cancelButtonProps: {
        type: 'text',
        style: {
          backgroundColor: '#52c41a',
          color: 'white',
        },
      },
      onCancel: () => {
        // Values from here are taken from default values of react-cookie-consent library
        // const cookieName = 'CookieConsent';
        const cookieOptions = {
          // 'CookieConsent' : true,
          expires: 365,
          path: '/',
          domain: DOMAIN[process.env.NODE_ENV],
          secure: window.location.protocol === 'https' || true,
          sameSite: 'lax',
        };

        Cookies.set('CookieConsent', 'true', cookieOptions);
        // const cookieString = Object.entries(cookieValues).map(([key, value]) => `${key}=${value}`).join(';');
        // document.cookie = cookieString;

        setCookieConsent(true);
      },
      okText: 'Not use this website',
      okButtonProps: {
        type: 'text',
        style: {
          backgroundColor: '#FF4D4F',
          color: 'white',
        },
      },
      onOk: () => (window.location.href = 'https://www.google.com'),
    });
  };

  return (
    <CookieConsent
      onAccept={() => setCookieConsent(true)}
      onDecline={handleDecline}
      extraCookieOptions={{
        domain: DOMAIN[process.env.NODE_ENV],
      }}
      buttonText="Yes, I understand"
      declineButtonText="No, I decline"
      location="bottom"
      overlay={true}
      enableDeclineButton={true}
      setDeclineCookie={false}
      flipButtons={true}
      buttonWrapperClasses={styles.btnWrapper}
      buttonStyle={{ margin: 8, backgroundColor: '#52c41a', color: 'white', fontWeight: 600 }}
      buttonClasses={`ant-btn ant-btn-text ${isMobileDevice ? styles.mobileBtn : 'ant-btn-block'}`}
      declineButtonStyle={{ margin: 8, fontWeight: 600 }}
      declineButtonClasses={`ant-btn ant-btn-danger ${isMobileDevice ? styles.mobileBtn : 'ant-btn-block'}`}
      disableButtonStyles={true}
    >
      <Paragraph className={styles.whiteText}>
        Our website requires the use of certain cookies in order to fully function and give you the best possible
        service. Some of these cookies are{' '}
        <Text strong className={styles.whiteText}>
          {' '}
          third party cookies{' '}
        </Text>
        that we use to enable us to provide realtime chat to support you whenever needed, give a smoother payment
        experience and analyze the site's performance on your device,
      </Paragraph>
      <Paragraph className={styles.whiteText}>
        In order to continue to the website, we need you to acknowledge and accept the use of these cookies.
      </Paragraph>
    </CookieConsent>
  );
};

export default CookieConsentPopup;
