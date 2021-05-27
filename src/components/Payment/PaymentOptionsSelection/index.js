import React from 'react';
import classNames from 'classnames';

import { Card, Typography, Row, Col, Space } from 'antd';

import VisaLogo from 'assets/icons/visa/VisaLogo';
import AmexLogo from 'assets/icons/amex/AmexLogo';
import MastercardLogo from 'assets/icons/mastercard/MastercardLogo';
import GooglePayLogo from 'assets/icons/gpay/GooglePayLogo';
import ApplePayLogo from 'assets/icons/apple_pay/ApplePayLogo';
import GiropayLogo from 'assets/icons/giropay/GiropayLogo';
import IdealLogo from 'assets/icons/ideal/IdealLogo';
import KlarnaLogo from 'assets/icons/klarna/KlarnaLogo';
import SepaLogo from 'assets/icons/sepa/SepaLogo';

import styles from './styles.module.scss';

// NOTE: Change this if the supported payment method constants
// is changed in the BE

export const BANK_REDIRECT_OPTIONS = {
  BANCONTACT: {
    key: 'bancontact',
    label: 'Bancontact',
    icon: null,
  },
  GIROPAY: {
    key: 'giropay',
    label: 'Giropay',
    icon: <GiropayLogo className={styles.paymentIcon} />,
  },
  SOFORT: {
    key: 'sofort',
    label: 'SoFort',
    icon: <KlarnaLogo className={styles.paymentIcon} />,
  },
  IDEAL: {
    key: 'ideal',
    label: 'iDeal',
    icon: <IdealLogo className={styles.paymentIcon} />,
  },
  EPS: {
    key: 'eps',
    label: 'EPS',
    icon: null,
  },
  FPX: {
    key: 'fpx',
    label: 'FPX',
    icon: null,
  },
  P24: {
    key: 'p24',
    label: 'P24',
    icon: null,
  },
};

export const paymentMethodOptions = {
  CARD: {
    key: 'card_payment',
    options: ['card'],
  },
  WALLET: {
    key: 'wallet_payment',
    options: ['google_pay', 'apple_pay', 'alipay'],
  },
  ONLINE_BANKING: {
    key: 'online_banking_payment',
    options: Object.entries(BANK_REDIRECT_OPTIONS).map(([key, val]) => val.key),
  },
  DEBIT: {
    key: 'debit_payment',
    options: ['bacs_debit', 'sepa_debit'],
  },
};

const paymentOptionsData = {
  [paymentMethodOptions.CARD.key]: {
    icons: (
      <>
        <VisaLogo className={styles.paymentIcon} />
        <MastercardLogo className={styles.paymentIcon} />
        <AmexLogo className={styles.paymentIcon} />
      </>
    ),
    label: 'Credit/Debit card',
  },
  [paymentMethodOptions.WALLET.key]: {
    icons: (
      <>
        <GooglePayLogo className={styles.paymentIcon} />
        <ApplePayLogo className={styles.paymentIcon} />
      </>
    ),
    label: 'E-wallet',
  },
  [paymentMethodOptions.ONLINE_BANKING.key]: {
    icons: (
      <>
        <IdealLogo className={styles.paymentIcon} />
        {/* <GiropayLogo className={styles.paymentIcon} />
        <KlarnaLogo className={styles.paymentIcon} /> */}
      </>
    ),
    label: 'Online Banking',
  },
  [paymentMethodOptions.DEBIT.key]: {
    icons: (
      <>
        <SepaLogo className={styles.paymentIcon} />
      </>
    ),
    label: 'Bank Debit',
  },
};

const { Text } = Typography;

export const PaymentOptionsSelection = ({ paymentOptionKey, isActive = false, disabled = false }) => {
  return (
    <Card
      className={classNames(
        styles.paymentOptionCard,
        disabled ? styles.disabled : isActive ? styles.active : undefined
      )}
      size="small"
      hoverable={!disabled}
    >
      <Row gutter={[8, 4]}>
        <Col xs={24}>
          <Space direction="horizontal" size="small">
            {paymentOptionsData[paymentOptionKey].icons}
          </Space>
        </Col>
        <Col xs={24}>
          <Text className={styles.paymentOptionName}> {paymentOptionsData[paymentOptionKey].label} </Text>
        </Col>
      </Row>
    </Card>
  );
};

export const BankRedirectOptionsSelection = ({ optionKey, isActive = false, disabled = false }) => {
  const bankOption = Object.entries(BANK_REDIRECT_OPTIONS).find(([key, val]) => val.key === optionKey);

  if (!bankOption) {
    return null;
  }

  return (
    <Card
      className={classNames(
        styles.paymentOptionCard,
        disabled ? styles.disabled : isActive ? styles.active : undefined
      )}
      size="small"
      hoverable={!disabled}
    >
      <Row gutter={[8, 4]} justify="space-around">
        {!!bankOption[1].icon && <Col xs={6}>{bankOption[1].icon}</Col>}
        <Col xs={18}>{bankOption[1].label}</Col>
      </Row>
    </Card>
  );
};
