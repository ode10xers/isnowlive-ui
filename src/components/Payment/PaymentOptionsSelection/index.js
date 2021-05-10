import React from 'react';
import classNames from 'classnames';

import { Card, Typography, Row, Col, Space } from 'antd';

import VisaLogo from 'assets/icons/visa/VisaLogo';
import AmexLogo from 'assets/icons/amex/AmexLogo';
import MastercardLogo from 'assets/icons/mastercard/MastercardLogo';
import GooglePayLogo from 'assets/icons/gpay/GooglePayLogo';
import ApplePayLogo from 'assets/icons/apple_pay/ApplePayLogo';

import styles from './styles.module.scss';

export const paymentMethodOptions = {
  CARD: 'card_payment',
  WALLET: 'wallet_payment',
};

const paymentOptionsData = {
  [paymentMethodOptions.CARD]: {
    icons: (
      <>
        <VisaLogo />
        <MastercardLogo />
        <AmexLogo />
      </>
    ),
    label: 'Pay with card',
  },
  [paymentMethodOptions.WALLET]: {
    icons: (
      <>
        <GooglePayLogo />
        <ApplePayLogo />
      </>
    ),
    label: 'Pay with e-wallet',
  },
};

const { Text } = Typography;

const PaymentOptionsSelection = ({ paymentOptionKey, isActive = false }) => {
  return (
    <Card
      className={classNames(styles.paymentOptionCard, isActive ? styles.active : undefined)}
      size="small"
      hoverable={true}
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
