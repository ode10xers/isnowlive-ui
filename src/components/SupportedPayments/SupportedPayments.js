import React from 'react';

import { SafetyCertificateOutlined } from '@ant-design/icons';

import { Space, Typography, Row, Col } from 'antd';

// import VisaLogo from '../../assets/icons/visa/VisaLogo';
// import MastercardLogo from '../../assets/icons/mastercard/MastercardLogo';
// import AmexLogo from '../../assets/icons/amex/AmexLogo';
// import GooglePayLogo from '../../assets/icons/gpay/GooglePayLogo';
// import ApplePayLogo from '../../assets/icons/apple_pay/ApplePayLogo';
import StripeLogo from 'assets/icons/stripe/StripeLogo';

import styles from './style.module.scss';

const { Text } = Typography;

const SupportedPayments = () => {
  return (
    <Row gutter={[8, 8]} justify="center">
      {/* <Col xs={24}>
        <Space direction="horizontal" size="middle" align="center">
          <VisaLogo height={32} width={32} />
          <MastercardLogo height={32} width={32} />
          <AmexLogo height={32} width={32} />
          <GooglePayLogo height={32} width={32} />
          <ApplePayLogo height={32} width={32} />
        </Space>
      </Col> */}
      <Col xs={24} className={styles.textAlignCenter}>
        <Space direction="horizontal" size="small" align="center">
          <SafetyCertificateOutlined className={styles.greenText} />
          <Text className={styles.helperText} type="success">
            {' '}
            100% safe and secure payment{' '}
          </Text>
          <Text className={styles.helperText}>Powered by</Text>
          <StripeLogo width={32} height={12} />
        </Space>
      </Col>
    </Row>
  );
};

export default SupportedPayments;
