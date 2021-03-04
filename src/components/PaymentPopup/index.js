import React, { useState } from 'react';

import { Row, Col, Typography, Input, List, Modal, Button, Image } from 'antd';

import apis from 'apis';

import { showErrorModal } from 'components/Modals/modals';

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

  const { itemList, productId } = paymentPopupData || { itemList: [], productId: null };
  const totalPrice = itemList?.reduce((acc, product) => acc + product.price, 0);

  const handleCouponCodeChange = (e) => {
    if (couponErrorText) {
      setCouponErrorText(null);
    }

    setCouponCode(e.target.value.toLowerCase());
  };

  const handleInitiatePayment = () => {
    paymentPopupCallback(userDetails.email, couponCode);
    closePaymentPopup();
  };

  const applyCouponCode = async (value) => {
    setIsApplyingCoupon(true);

    try {
      //TODO: Readjust for other products whenever necessary
      const payload = {
        coupon_code: couponCode || value,
        course_id: productId,
      };

      const { status, data } = await apis.coupons.validateCourseCoupon(payload);

      if (isAPISuccess(status) && data) {
        setDiscountedPrice(data.discounted_amount);
      }
    } catch (error) {
      showErrorModal('Invalid Coupon Entered');
      setCouponErrorText(<Text type="danger"> Invalid coupon entered </Text>);
    }
    setIsApplyingCoupon(false);
  };

  const closePaymentPopup = () => {
    setCouponCode('');
    setDiscountedPrice(null);
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
              {itemList && itemList.length > 0 && (
                <>
                  <Text className={discountedPrice !== null ? styles.discounted : undefined}>
                    {itemList[0].currency?.toUpperCase()} {totalPrice}
                  </Text>{' '}
                  {discountedPrice !== null && (
                    <Text>
                      {itemList[0].currency?.toUpperCase()} {discountedPrice}
                    </Text>
                  )}
                </>
              )}
            </Col>
          </Row>
        </Col>
        <Col xs={24} className={styles.topBorder}>
          <Row justify="start">
            <Col xs={24}>
              <Input.Search
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
