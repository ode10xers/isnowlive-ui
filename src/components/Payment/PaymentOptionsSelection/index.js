import React from 'react';
import classNames from 'classnames';

import { Card, Typography, Row, Col, Space } from 'antd';

import VisaLogo from 'assets/icons/visa/VisaLogo';
// import AmexLogo from 'assets/icons/amex/AmexLogo';
import MastercardLogo from 'assets/icons/mastercard/MastercardLogo';
import GooglePayLogo from 'assets/icons/gpay/GooglePayLogo';
import ApplePayLogo from 'assets/icons/apple_pay/ApplePayLogo';
import GiropayLogo from 'assets/icons/giropay/GiropayLogo';
import IdealLogo from 'assets/icons/ideal/IdealLogo';
// import KlarnaLogo from 'assets/icons/klarna/KlarnaLogo';
import SepaLogo from 'assets/icons/sepa/SepaLogo';

import styles from './styles.module.scss';

// NOTE: Change this if the supported payment method constants
// is changed in the BE
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
    options: ['bancontact', 'eps', 'fpx', 'giropay', 'ideal', 'sofort', 'p24'],
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
        <VisaLogo />
        <MastercardLogo />
        {/* <AmexLogo /> */}
      </>
    ),
    label: 'Credit/Debit card',
  },
  [paymentMethodOptions.WALLET.key]: {
    icons: (
      <>
        <GooglePayLogo />
        <ApplePayLogo />
      </>
    ),
    label: 'E-wallet',
  },
  [paymentMethodOptions.ONLINE_BANKING.key]: {
    icons: (
      <>
        <IdealLogo />
        <GiropayLogo />
        {/* <KlarnaLogo /> */}
      </>
    ),
    label: 'Online Banking',
  },
  [paymentMethodOptions.DEBIT.key]: {
    icons: (
      <>
        <SepaLogo />
      </>
    ),
    label: 'Bank Debit',
  },
};

const { Text } = Typography;

const PaymentOptionsSelection = ({ paymentOptionKey, isActive = false, disabled = false }) => {
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

export default PaymentOptionsSelection;
