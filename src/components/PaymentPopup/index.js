import React, { useState, useEffect } from 'react';

import { Row, Col, Typography, Input, List, Modal, Button, Image, InputNumber, Tooltip } from 'antd';

import apis from 'apis';

import PaymentCard from 'components/Payment/PaymentCard';
import TermsAndConditionsText from 'components/TermsAndConditionsText';
import {
  resetBodyStyle,
  showPurchaseSingleCourseSuccessModal,
  showBookSingleSessionSuccessModal,
  showPurchaseSingleVideoSuccessModal,
  showPurchasePassSuccessModal,
  showPurchaseSubscriptionSuccessModal,
} from 'components/Modals/modals';

import dateUtil from 'utils/date';
import { followUpGetVideo, followUpBookSession } from 'utils/orderHelper';
import { orderType, paymentSource, isAPISuccess, isUnapprovedUserError } from 'utils/helper';

import { useGlobalContext } from 'services/globalContext';

import styles from './styles.module.scss';

const PaymentSupportImage = require('../../assets/images/payment_support_image.png');

const { Text, Title } = Typography;
const {
  timezoneUtils: { getCurrentLongTimezone, getTimezoneLocation },
} = dateUtil;

/* 
  NOTE: Here's the expected format for paymentPopupData

  paymentPopupData : {
    productId: String | Integer, -> integer is for inventories, since we pass inventory_id
    productType: String, -> used for coupons and accessing subscription products, 
    itemList: [ -> Array of products that will be listed in the popup
      {
        name: String,
        description: String,
        currency: String,
        price: Integer,
        pay_what_you_want: Boolean | undefined, -> can be undefined since PWYW is not yet supported for all
      },
    ],
    paymentInstrumentDetails: { -> Optional, can be null
      type: String, -> can be 'SUBSCRIPTION' or 'PASS', we use it to show additional UI 
      ...{ paymentInstrumentOrderData }
    },
    flexiblePaymentDetails: { -> Optional, can be null
      enabled: Boolean,
      minimumPrice: Integer,
    },
  }

  Possible Product Type values : 'SESSION' | 'VIDEO' | 'PASS' | 'COURSE' | 'SUBSCRIPTION'
  paymentInstrumentOrderData will be a Pass Order Object (for type 'PASS') 
    or Subscription Order Object (for type 'SUBSCRIPTION')
*/

const PaymentPopup = () => {
  const {
    state: { paymentPopupVisible, paymentPopupCallback, paymentPopupData },
    hidePaymentPopup,
  } = useGlobalContext();

  const [couponCode, setCouponCode] = useState('');
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [discountedPrice, setDiscountedPrice] = useState(null);
  const [couponErrorText, setCouponErrorText] = useState(null);
  const [couponApplied, setCouponApplied] = useState(false);
  const [showCouponField, setShowCouponField] = useState(false);
  const [priceAmount, setPriceAmount] = useState(0);

  const {
    itemList = [],
    productId = null,
    productType = null,
    paymentInstrumentDetails = null,
    flexiblePaymentDetails = null,
  } = paymentPopupData || {};
  const totalPrice = itemList?.reduce((acc, product) => acc + product.price, 0);

  useEffect(() => {
    if (!paymentPopupVisible) {
      setCouponCode('');
      setCouponApplied(false);
      setCouponErrorText(null);
      setDiscountedPrice(null);
      setIsApplyingCoupon(false);
      setPriceAmount(0);
    }
  }, [paymentPopupVisible, totalPrice]);

  useEffect(() => {
    if (flexiblePaymentDetails?.enabled) {
      setPriceAmount(flexiblePaymentDetails?.minimumPrice || 5);
    } else {
      setPriceAmount(0);
    }
  }, [flexiblePaymentDetails]);

  const handleCouponCodeChange = (e) => {
    if (couponErrorText) {
      setCouponErrorText(null);
    }

    setCouponCode(e.target.value.toLowerCase());
    setCouponApplied(false);
    setDiscountedPrice(null);
  };

  const applyCouponCode = async (value) => {
    setIsApplyingCoupon(true);

    try {
      //TODO: Use productType here to adjust the payload
      // e.g. if productType === PASS it should be pass_id (match the BE implementation)

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
      if (!isUnapprovedUserError(error.response)) {
        setCouponErrorText(<Text type="danger"> Invalid coupon entered </Text>);
        setCouponApplied(false);
      }
    }
    setIsApplyingCoupon(false);
  };

  const closePaymentPopup = () => {
    setCouponCode('');
    setCouponApplied(false);
    setCouponErrorText(null);
    setDiscountedPrice(null);
    setIsApplyingCoupon(false);
    resetBodyStyle();

    hidePaymentPopup();
  };

  const toggleCouponFieldVisibility = () => {
    if (showCouponField) {
      setCouponCode('');
      setCouponApplied(false);
      setCouponErrorText(null);
      setDiscountedPrice(null);
    }

    setShowCouponField(!showCouponField);
  };

  const handleBeforePayment = async () => {
    let result = null;
    const appliedCouponCode = couponApplied ? couponCode : '';

    if (!flexiblePaymentDetails?.enabled) {
      result = await paymentPopupCallback(appliedCouponCode);
    } else {
      // TODO: Confirm if Pay What you want can use coupons
      result = await paymentPopupCallback(appliedCouponCode, priceAmount);
    }

    return result;
  };

  const handleAfterPayment = async (orderResponse = null, verifyOrderRes = null) => {
    if (orderResponse) {
      if (verifyOrderRes === orderType.PASS) {
        /*
          In pass order, there can be follow up bookings
          If a follow up booking is required, orderResponse 
          will contain the required info in follow_up_booking_info
        */

        const followUpBookingInfo = orderResponse.follow_up_booking_info;

        if (followUpBookingInfo) {
          if (followUpBookingInfo.productType === 'VIDEO') {
            const payload = {
              video_id: followUpBookingInfo.productId,
              payment_source: paymentSource.PASS,
              source_id: orderResponse.payment_order_id,
              user_timezone_location: getTimezoneLocation(),
            };

            await followUpGetVideo(payload);
          } else if (followUpBookingInfo.productType === 'SESSION') {
            const payload = {
              inventory_id: followUpBookingInfo.productId,
              user_timezone_offset: new Date().getTimezoneOffset(),
              user_timezone_location: getTimezoneLocation(),
              user_timezone: getCurrentLongTimezone(),
              payment_source: paymentSource.PASS,
              source_id: orderResponse.payment_order_id,
            };

            await followUpBookSession(payload);
          }
        } else {
          // If no followup booking info is attached, then it's only a simple pass purchase
          showPurchasePassSuccessModal(orderResponse.payment_order_id);
        }
      } else if (verifyOrderRes === orderType.COURSE) {
        showPurchaseSingleCourseSuccessModal();
      } else if (verifyOrderRes === orderType.CLASS) {
        // Showing confirmation for Single Session Booking
        // inventory_id is attached for session orders
        showBookSingleSessionSuccessModal(orderResponse.inventory_id);
      } else if (verifyOrderRes === orderType.VIDEO) {
        // Showing confirmation for Single Session Booking
        showPurchaseSingleVideoSuccessModal(orderResponse.payment_order_id);
      } else if (verifyOrderRes === orderType.SUBSCRIPTION) {
        showPurchaseSubscriptionSuccessModal();
      }
    }

    closePaymentPopup();
  };

  const generatePaymentInstrumentDetails = () => {
    if (!paymentInstrumentDetails) {
      return null;
    }

    let textContent = '';

    if (paymentInstrumentDetails.type === 'PASS') {
      const passDetails = paymentInstrumentDetails;
      textContent = `Will use ${passDetails.pass_name} to book this ${
        passDetails.limited
          ? `and you'll be left with ${passDetails.classes_remaining - 1}/${passDetails.class_count} credits`
          : ''
      }`;
    } else if (paymentInstrumentDetails.type === 'SUBSCRIPTION') {
      const subscriptionDetails = paymentInstrumentDetails;

      textContent = `Will use ${subscriptionDetails.subscription_name} to book this and you'll be left with ${
        subscriptionDetails.products[productType].credits - subscriptionDetails.products[productType].credits_used - 1
      }/${subscriptionDetails.products[productType].credits} credits`;
    }

    return (
      <Text strong className={styles.blueText}>
        {textContent}
      </Text>
    );
  };

  const isFree = () =>
    flexiblePaymentDetails?.enabled
      ? false
      : discountedPrice
      ? discountedPrice === 0
      : paymentInstrumentDetails || totalPrice === 0;

  const getMinimumPrice = () => flexiblePaymentDetails?.minimumPrice || 5;

  const checkMinimumPriceRequirement = () =>
    flexiblePaymentDetails?.enabled ? priceAmount < getMinimumPrice() : false;

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
                    {item?.pay_what_you_want ? 'Your Fair Price' : `${item?.currency?.toUpperCase()} ${item?.price}`}
                  </Text>,
                ]}
              >
                <List.Item.Meta
                  title={item?.name}
                  description={<Text className={styles.descriptionText}>{item?.description}</Text>}
                />
              </List.Item>
            )}
            footer={generatePaymentInstrumentDetails()}
          />
        </Col>
        <Col xs={24} className={styles.topBorder}>
          <Row gutter={10}>
            <Col xs={14}>
              <Text strong>{flexiblePaymentDetails?.enabled ? 'Your Fair Price' : 'Total payable amount'}</Text>
            </Col>
            <Col xs={10} className={styles.paymentTotalText}>
              {itemList &&
                itemList.length > 0 &&
                (flexiblePaymentDetails?.enabled ? (
                  <Tooltip title={`Input your fair price (min. ${getMinimumPrice()})`}>
                    <InputNumber onChange={setPriceAmount} min={getMinimumPrice()} value={priceAmount} />
                    <span className="ant-form-text"> {itemList[0]?.currency.toUpperCase()} </span>
                  </Tooltip>
                ) : discountedPrice !== null ? (
                  <>
                    <Text delete className={styles.discounted}>
                      {itemList[0].currency?.toUpperCase()} {totalPrice}
                    </Text>{' '}
                    <Text>
                      {itemList[0].currency?.toUpperCase()} {discountedPrice}
                    </Text>
                  </>
                ) : paymentInstrumentDetails ? (
                  <>
                    <Text delete className={styles.discounted}>
                      {itemList[0].currency?.toUpperCase()} {totalPrice}
                    </Text>{' '}
                    <Text>{itemList[0].currency?.toUpperCase()} 0</Text>
                  </>
                ) : (
                  <Text>
                    {itemList[0].currency?.toUpperCase()} {totalPrice}
                  </Text>
                ))}
            </Col>
            {!paymentInstrumentDetails && totalPrice > 0 && (
              <Col xs={24}>
                <Button className={styles.linkBtn} type="link" onClick={() => toggleCouponFieldVisibility()}>
                  {showCouponField ? `Don't use ` : 'Use '} a coupon
                </Button>
              </Col>
            )}
          </Row>
        </Col>
        {showCouponField && totalPrice > 0 && (
          <Col xs={24} className={styles.topBorder}>
            <Row justify="start">
              <Col xs={24} md={14} lg={12}>
                <Input.Search
                  value={couponCode}
                  disabled={isApplyingCoupon}
                  loading={isApplyingCoupon}
                  enterButton={
                    <Button block type="primary" disabled={couponCode === ''}>
                      Apply
                    </Button>
                  }
                  placeholder="Input discount code"
                  onChange={handleCouponCodeChange}
                  onSearch={applyCouponCode}
                />
              </Col>
              <Col xs={24}>{couponErrorText}</Col>
            </Row>
          </Col>
        )}

        <Col xs={24} className={styles.topBorder}>
          <Row gutter={8} justify="center">
            <Col xs={24} className={styles.mb10}>
              <PaymentCard
                btnProps={{ text: isFree() ? 'Get' : 'Buy', disableButton: checkMinimumPriceRequirement() }}
                isFree={isFree()}
                onBeforePayment={handleBeforePayment}
                onAfterPayment={handleAfterPayment}
              />
            </Col>
            <Col xs={14}>
              <Image className={styles.paymentSupportImage} preview={false} src={PaymentSupportImage} alt="" />
            </Col>
            <Col xs={24} className={styles.tncText}>
              <TermsAndConditionsText shouldCheck={false} />
            </Col>
          </Row>
        </Col>
      </Row>
    </Modal>
  );
};

export default PaymentPopup;
