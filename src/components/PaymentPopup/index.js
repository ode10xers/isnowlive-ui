import React, { useState, useEffect } from 'react';

import { Row, Col, Typography, Input, List, Modal, Button, Image } from 'antd';

import apis from 'apis';

import { isAPISuccess } from 'utils/helper';

import { useGlobalContext } from 'services/globalContext';

import styles from './styles.module.scss';

const PaymentSupportImage = require('../../assets/images/payment_support_image.png');

const { Text, Title } = Typography;

const PaymentPopup = () => {
  const {
    state: { userDetails, paymentPopupVisible, paymentPopupCallback, paymentPopupData },
    hidePaymentPopup,
  } = useGlobalContext();

  const [couponCode, setCouponCode] = useState('');
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [discountedPrice, setDiscountedPrice] = useState(null);
  const [couponErrorText, setCouponErrorText] = useState(null);
  const [couponApplied, setCouponApplied] = useState(false);

  const { itemList, productId } = paymentPopupData || { itemList: [], productId: null };
  const totalPrice = itemList?.reduce((acc, product) => acc + product.price, 0);

  useEffect(() => {
    if (!paymentPopupVisible) {
      setCouponCode('');
      setCouponApplied(false);
      setCouponErrorText(null);
      setDiscountedPrice(null);
      setIsApplyingCoupon(false);
    }
  }, [paymentPopupVisible]);

  const handleCouponCodeChange = (e) => {
    if (couponErrorText) {
      setCouponErrorText(null);
    }

    setCouponCode(e.target.value.toLowerCase());
    setCouponApplied(false);
    setDiscountedPrice(null);
  };

  const handleInitiatePayment = () => {
    const appliedCouponCode = couponApplied ? couponCode : '';

    paymentPopupCallback(userDetails.email, appliedCouponCode);
    closePaymentPopup();
  };

  const applyCouponCode = async (value) => {
    setIsApplyingCoupon(true);

    try {
      //TODO: MAKE SURE TO REMIND THIS
      const payload = {
        coupon_code: couponCode.toLowerCase() || value.toLowerCase(),
        course_id: productId,
      };

      const { status, data } = await apis.coupons.validateCourseCoupon(payload);

      if (isAPISuccess(status) && data) {
        setDiscountedPrice(data.discounted_amount);
        setCouponErrorText(<Text type="success"> Coupon Applied! </Text>);
        setCouponApplied(true);
      }
    } catch (error) {
      setCouponErrorText(<Text type="danger"> Invalid coupon entered </Text>);
      setCouponApplied(false);
    }
    setIsApplyingCoupon(false);
  };

  const closePaymentPopup = () => {
    setCouponCode('');
    setDiscountedPrice(null);
    setCouponApplied(false);

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
      onCancel={() => closePaymentPopup()}
    >
      <Row gutter={[8, 32]} justify="center">
        <Col xs={24}>
          <List
            rowKey={(record) => record.name}
            dataSource={itemList || []}
            renderItem={(item) => (
              <List.Item
                actions={[
                  <Text strong>
                    {' '}
                    {item?.currency?.toUpperCase()} {item?.price}{' '}
                  </Text>,
                ]}
              >
                <List.Item.Meta
                  title={item?.name}
                  description={<Text className={styles.blueText}>{item?.description}</Text>}
                />
              </List.Item>
            )}
          />
        </Col>
        <Col xs={24}>
          <Row gutter={10}>
            <Col xs={14}>
              <Text strong>Total payable amount</Text>
            </Col>
            <Col xs={10} className={styles.paymentTotalText}>
              {itemList &&
                itemList.length > 0 &&
                (discountedPrice !== null ? (
                  <>
                    <Text delete className={styles.discounted}>
                      {itemList[0].currency?.toUpperCase()} {totalPrice}
                    </Text>{' '}
                    <Text>
                      {itemList[0].currency?.toUpperCase()} {discountedPrice}
                    </Text>
                  </>
                ) : (
                  <Text>
                    {itemList[0].currency?.toUpperCase()} {totalPrice}
                  </Text>
                ))}
            </Col>
          </Row>
        </Col>
        <Col xs={24} className={styles.topBorder}>
          <Row justify="start">
            <Col xs={24}>
              <Input.Search
                value={couponCode}
                disabled={isApplyingCoupon}
                loading={isApplyingCoupon}
                enterButton={
                  <Button block type="primary" disabled={couponCode === ''}>
                    {' '}
                    Apply{' '}
                  </Button>
                }
                placeholder="Input discount code here"
                onChange={handleCouponCodeChange}
                onSearch={applyCouponCode}
              />
            </Col>
            <Col xs={24}>{couponErrorText}</Col>
          </Row>
        </Col>
        <Col xs={24} className={styles.topBorder}>
          <Row gutter={[8, 10]} justify="center">
            <Col>
              <Image className={styles.paymentSupportImage} preview={false} src={PaymentSupportImage} alt="" />
            </Col>
            <Col xs={24} md={10}>
              <Button
                block
                className={styles.greenBtn}
                type="primary"
                onClick={handleInitiatePayment}
                disabled={itemList?.length <= 0}
              >
                Pay Now
              </Button>
            </Col>
          </Row>
        </Col>
      </Row>
    </Modal>
  );
};

export default PaymentPopup;
