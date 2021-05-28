import React, { useState, useEffect, useCallback, useMemo } from 'react';

import { Row, Col, Typography, Input, List, Modal, Button, InputNumber, Tooltip } from 'antd';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

import config from 'config';
import apis from 'apis';

import PaymentOptionsWrapper from 'components/Payment/PaymentOptionsWrapper';
import SupportedPayments from 'components/SupportedPayments/SupportedPayments';
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
import {
  orderType,
  productType as productTypeConstants,
  paymentSource,
  isAPISuccess,
  isUnapprovedUserError,
  getUsernameFromUrl,
} from 'utils/helper';

import { useGlobalContext } from 'services/globalContext';

import styles from './styles.module.scss';

const stripePromise = loadStripe(config.stripe.secretKey);

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
  // TODO: Defaults to SG, confirm with Rahul what should be the default here
  const [creatorCountry, setCreatorCountry] = useState('SG');
  const [creatorCurrency, setCreatorCurrency] = useState('SGD');

  const {
    itemList = [],
    productId = null,
    productType = null,
    paymentInstrumentDetails = null,
    flexiblePaymentDetails = null,
  } = paymentPopupData || {};
  const totalPrice = itemList?.reduce((acc, product) => acc + product.price, 0) || 0;

  const fetchCreatorCountry = useCallback(async () => {
    try {
      const { status, data } = await apis.user.getProfileByUsername(getUsernameFromUrl());

      if (isAPISuccess(status) && data) {
        setCreatorCountry(data.country);
        setCreatorCurrency(data.currency);
      }
    } catch (error) {
      console.error('Failed fetching creator profile for country', error?.response);
    }
  }, []);

  useEffect(() => {
    fetchCreatorCountry();
    //eslint-disable-next-line
  }, []);

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
      let couponStatus = null;
      let couponData = null;
      switch (productType) {
        case productTypeConstants.COURSE:
          const coursePayload = {
            coupon_code: couponCode.toLowerCase() || value.toLowerCase(),
            course_id: productId,
          };
          const { status: statusCourse, data: dataCourse } = await apis.coupons.validateCourseCoupon(coursePayload);
          couponStatus = statusCourse;
          couponData = dataCourse;
          break;
        case productTypeConstants.CLASS:
          const sessionPayload = {
            coupon_code: couponCode.toLowerCase() || value.toLowerCase(),
            session_id: productId,
          };
          const { status: statusSession, data: dataSession } = await apis.coupons.validateSessionCoupon(sessionPayload);
          couponStatus = statusSession;
          couponData = dataSession;
          break;
        case productTypeConstants.PASS:
          const passPayload = {
            coupon_code: couponCode.toLowerCase() || value.toLowerCase(),
            pass_id: productId,
          };
          const { status: statusPass, data: dataPass } = await apis.coupons.validatePassCoupon(passPayload);
          couponStatus = statusPass;
          couponData = dataPass;
          break;
        case productTypeConstants.VIDEO:
          const videoPayload = {
            coupon_code: couponCode.toLowerCase() || value.toLowerCase(),
            video_id: productId,
          };
          const { status: statusVideo, data: dataVideo } = await apis.coupons.validateVideoCoupon(videoPayload);
          couponStatus = statusVideo;
          couponData = dataVideo;
          break;
        default:
          break;
      }

      if (isAPISuccess(couponStatus) && couponData) {
        setDiscountedPrice(couponData.discounted_amount);
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

  // This will run the callback (we will populate this with order creation functions)
  // and return the order response object
  const handleBeforePayment = async () => {
    let result = null;
    const appliedCouponCode = couponApplied ? couponCode : '';

    if (!flexiblePaymentDetails?.enabled) {
      result = await paymentPopupCallback(appliedCouponCode);
    } else {
      // PWYW can't be used with coupons
      result = await paymentPopupCallback('', priceAmount);
    }

    return result;
  };

  const handleAfterPayment = async (orderResponse = null, verifyOrderRes = null) => {
    if (orderResponse && orderResponse?.is_successful_order) {
      if (verifyOrderRes === orderType.PASS) {
        /*
          In pass order, there can be follow up bookings
          If a follow up booking is required, orderResponse 
          will contain the required info in follow_up_booking_info
        */

        const followUpBookingInfo = orderResponse.follow_up_booking_info;

        if (followUpBookingInfo) {
          if (followUpBookingInfo.productType === productTypeConstants.VIDEO) {
            const payload = {
              video_id: followUpBookingInfo.productId,
              payment_source: paymentSource.PASS,
              source_id: orderResponse.payment_order_id,
              user_timezone_location: getTimezoneLocation(),
            };

            await followUpGetVideo(payload);
          } else if (followUpBookingInfo.productType === productTypeConstants.CLASS) {
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

    if (!orderResponse?.is_successful_order) {
      closePaymentPopup();
    }
  };

  const generatePaymentInstrumentDetails = () => {
    if (!paymentInstrumentDetails) {
      return null;
    }

    let textContent = '';

    if (paymentInstrumentDetails.type === paymentSource.PASS) {
      const passDetails = paymentInstrumentDetails;
      textContent = `Will use ${passDetails.pass_name} to book this ${
        passDetails.limited
          ? `and you'll be left with ${passDetails.classes_remaining - 1}/${passDetails.class_count} credits`
          : ''
      }`;
    } else if (paymentInstrumentDetails.type === paymentSource.SUBSCRIPTION) {
      const subscriptionDetails = paymentInstrumentDetails;

      textContent = `Will use ${subscriptionDetails.subscription_name} to book this and you'll be left with ${
        subscriptionDetails.products[productType.toUpperCase()].credits -
        subscriptionDetails.products[productType.toUpperCase()].credits_used -
        1
      }/${subscriptionDetails.products[productType.toUpperCase()].credits} credits`;
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

  const getAmountForPaymentRequest = () => {
    if (flexiblePaymentDetails?.enabled) {
      const minimumPrice = getMinimumPrice();

      return priceAmount < minimumPrice ? minimumPrice : priceAmount;
    } else {
      return totalPrice;
    }
  };

  // TODO: Check for selected and available Payment method here
  // Based on the selected payment method, render the correct components

  const creatorDetails = useMemo(() => ({ country: creatorCountry, currency: creatorCurrency }), [
    creatorCountry,
    creatorCurrency,
  ]);

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
                    {item?.pay_what_you_want ? 'Your Fair Price' : `${creatorCurrency.toUpperCase()} ${item?.price}`}
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
                    <span className="ant-form-text"> {creatorCurrency.toUpperCase()} </span>
                  </Tooltip>
                ) : discountedPrice !== null ? (
                  <>
                    <Text delete className={styles.discounted}>
                      {creatorCurrency.toUpperCase()} {totalPrice}
                    </Text>{' '}
                    <Text>
                      {creatorCurrency.toUpperCase()} {discountedPrice}
                    </Text>
                  </>
                ) : paymentInstrumentDetails ? (
                  <>
                    <Text delete className={styles.discounted}>
                      {creatorCurrency.toUpperCase()} {totalPrice}
                    </Text>{' '}
                    <Text>{creatorCurrency.toUpperCase()} 0</Text>
                  </>
                ) : (
                  <Text>
                    {creatorCurrency.toUpperCase()} {totalPrice}
                  </Text>
                ))}
            </Col>
            {!flexiblePaymentDetails?.enabled && !paymentInstrumentDetails && totalPrice > 0 && (
              <Col xs={24}>
                <Button className={styles.linkBtn} type="link" onClick={toggleCouponFieldVisibility}>
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
          <Row gutter={[8, 12]} justify="center">
            <Col xs={24}>
              <Elements stripe={stripePromise}>
                <PaymentOptionsWrapper
                  shouldFetchAvailablePaymentMethods={paymentPopupVisible}
                  handleAfterPayment={handleAfterPayment}
                  handleBeforePayment={handleBeforePayment}
                  isFreeProduct={isFree()}
                  // Currently, only subscriptions need payment details to be saved
                  // so we can use the saved details to charge them offline for recurring payment
                  shouldSavePaymentDetails={productType === productTypeConstants.SUBSCRIPTION}
                  minimumPriceRequirementFulfilled={checkMinimumPriceRequirement()}
                  creatorDetails={creatorDetails}
                  amount={getAmountForPaymentRequest()}
                />
              </Elements>
            </Col>
            <Col xs={24}>
              {/* <Image className={styles.paymentSupportImage} preview={false} src={PaymentSupportImage} alt="" /> */}
              <SupportedPayments />
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
