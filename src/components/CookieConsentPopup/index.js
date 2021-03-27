import React from 'react';
import classNames from 'classnames';
import { useTranslation } from 'react-i18next';

import { Modal, Typography } from 'antd';

import CookieConsent, { Cookies } from 'react-cookie-consent';

import { isMobileDevice } from 'utils/device';
import { useGlobalContext } from 'services/globalContext';

import styles from './styles.module.scss';

const { Paragraph, Text } = Typography;

const DOMAIN = {
  development: '.localhost',
  staging: '.stage.passion.do',
  production: '.passion.do',
};

const CookieConsentPopup = () => {
  const { t: translate } = useTranslation();
  const { setCookieConsent } = useGlobalContext();

  // Since for some reason the cookies are not settable in dev environment, disable on dev
  if (window.location.hostname.split('.').includes('localhost')) {
    return null;
  }

  const handleDecline = () => {
    Modal.confirm({
      mask: true,
      closable: false,
      maskClosable: false,
      title: translate('COOKIES_CONSENT_TITLE'),
      content: (
        <>
          <Paragraph>
            {translate('COOKIES_CONCENT_TEXT_1')}
            <Text strong>{translate('COOKIES_CONCENT_TEXT_2')}</Text>
            {translate('COOKIES_CONCENT_TEXT_3')}
          </Paragraph>
          <ul>
            <li className={styles.cookieUsageList}>{translate('COOKIES_CONCENT_TEXT_4')}</li>
            <li className={styles.cookieUsageList}>{translate('COOKIES_CONCENT_TEXT_5')}</li>
            <li className={styles.cookieUsageList}>{translate('COOKIES_CONCENT_TEXT_6')}</li>
          </ul>
          <Paragraph>{translate('COOKIES_CONCENT_TEXT_7')}</Paragraph>
          <Paragraph>{translate('COOKIES_CONCENT_TEXT_8')}</Paragraph>
        </>
      ),
      okText: translate('I_ACCEPT'),
      okButtonProps: {
        type: 'text',
        style: {
          backgroundColor: '#52c41a',
          color: 'white',
        },
      },
      onOk: () => {
        // Values from here are taken from default values of react-cookie-consent library
        const cookieOptions = {
          expires: 365,
          path: '/',
          domain: DOMAIN[process.env.NODE_ENV],
          secure: window.location.protocol === 'https' || true,
          sameSite: 'lax',
        };

        Cookies.set('CookieConsent', 'true', cookieOptions);
        setCookieConsent(true);
      },
      cancelText: translate('NOT_USE_THIS_WEBSITE'),
      cancelButtonProps: {
        type: 'text',
        style: {
          backgroundColor: '#FF4D4F',
          color: 'white',
        },
      },
      onCancel: () => (window.location.href = 'https://www.google.com'),
    });
  };

  return (
    <CookieConsent
      onAccept={() => setCookieConsent(true)}
      onDecline={handleDecline}
      extraCookieOptions={{
        domain: DOMAIN[process.env.NODE_ENV],
      }}
      buttonText={translate('YES_I_UNDERSTAND')}
      declineButtonText={translate('NO_I_DECLINE')}
      location="bottom"
      overlay={true}
      enableDeclineButton={true}
      setDeclineCookie={false}
      flipButtons={true}
      buttonWrapperClasses={styles.btnWrapper}
      buttonStyle={{ margin: 8, backgroundColor: '#52c41a', color: 'white', fontWeight: 600 }}
      buttonClasses={`ant-btn ant-btn-text ${isMobileDevice ? styles.mobileBtn : 'ant-btn-block'}`}
      declineButtonStyle={{ margin: 8, fontWeight: 600 }}
      declineButtonClasses={`ant-btn ant-btn-danger ${
        isMobileDevice ? classNames(styles.mobileBtn, styles.decline) : 'ant-btn-block'
      }`}
      disableButtonStyles={true}
    >
      <Paragraph className={styles.whiteText}>
        {translate('COOKIES_CONCENT_TEXT_1')}
        <Text strong className={styles.whiteText}>
          {translate('COOKIES_CONCENT_TEXT_2')}
        </Text>
        {translate('COOKIES_CONCENT_TEXT_9')}
      </Paragraph>
      <Paragraph className={styles.whiteText}>{translate('COOKIES_CONCENT_TEXT_7')}</Paragraph>
    </CookieConsent>
  );
};

export default CookieConsentPopup;
