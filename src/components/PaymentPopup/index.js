import React, { useState } from 'react';

import { Row, Col, Typography, Input, List, Modal, Button, Image } from 'antd';

import { useGlobalContext } from 'services/globalContext';

import styles from './styles.module.scss';

const PaymentSupportImage = require('../../assets/images/payment_support_image.png');

const { Text, Title } = Typography;

const PaymentPopup = () => {
  const {
    state: { userDetails, paymentPopupVisible, paymentPopupData, paymentPopupCallback },
    hidePaymentPopup,
  } = useGlobalContext();

  const [couponCode, setCouponCode] = useState('');

  const handleCouponCodeChange = (e) => {
    setCouponCode(e.target.value);
  };

  const handleInitiatePayment = () => {
    paymentPopupCallback(userDetails.email, couponCode);
    hidePaymentPopup();
  };

  return (
    <Modal
      visible={paymentPopupVisible}
      closable={true}
      maskClosable={true}
      centered={true}
      footer={null}
      title={<Title level={4}> Confirm your purchase </Title>}
      onCancel={() => hidePaymentPopup()}
    >
      <Row gutter={[8, 16]} justify="center">
        <Col xs={24}>
          <List
            dataSource={paymentPopupData || []}
            renderItem={(item) => (
              <List.Item
                actions={[
                  <Text strong>
                    {' '}
                    {item?.currency?.toUpperCase()} {item?.price}{' '}
                  </Text>,
                ]}
              >
                <List.Item.Meta title={item?.name} description={item?.description} />
              </List.Item>
            )}
          />
        </Col>
        <Col xs={24}>
          <Row gutter={10}>
            <Col xs={18}>
              <Title level={5}>Total payable amount</Title>
            </Col>
            <Col xs={6}>
              {paymentPopupData && paymentPopupData.length > 0 && (
                <Title level={5} className={styles.textAlignRight}>
                  {paymentPopupData[0].currency?.toUpperCase()}{' '}
                  {paymentPopupData.reduce((acc, product) => acc + product.price, 0)}
                </Title>
              )}
            </Col>
          </Row>
        </Col>
        <Col xs={24}>
          <Row gutter={[8, 8]} justify="start">
            <Col xs={24} md={10}>
              <Input placeholder="Input discount code here" onChange={handleCouponCodeChange} />
            </Col>
          </Row>
        </Col>
        <Col xs={24} className={styles.paymentBtnWrapper}>
          <Row gutter={[8, 10]} justify="center">
            <Col xs={24}>
              <Image className={styles.paymentSupportImage} preview={false} src={PaymentSupportImage} alt="" />
            </Col>
            <Col xs={24} md={10}>
              <Button
                block
                className={styles.greenBtn}
                type="primary"
                onClick={handleInitiatePayment}
                disabled={paymentPopupData?.length <= 0}
              >
                Make Payment
              </Button>
            </Col>
          </Row>
        </Col>
      </Row>
    </Modal>
  );
};

export default PaymentPopup;
