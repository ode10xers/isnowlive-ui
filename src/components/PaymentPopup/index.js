import React, { useState, useEffect, useCallback, useMemo } from 'react';

import { Row, Col, Typography, Input, List, Modal, Button, InputNumber, Tooltip, Form, message } from 'antd';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

import config from 'config';
import apis from 'apis';

import PaymentOptionsWrapper from 'components/Payment/PaymentOptionsWrapper';
import PaypalPaymentButtons from 'components/Payment/PaypalPaymentButtons';
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
import validationRules from 'utils/validation';
import { getUsernameFromUrl } from 'utils/url';
import { getGiftReceiverData, getLocalUserDetails, saveGiftReceiverData, saveGiftOrderData } from 'utils/storage';
import { followUpGetVideo, followUpBookSession } from 'utils/orderHelper';
import { isAPISuccess, isInCreatorDashboard, isUnapprovedUserError } from 'utils/helper';
import {
  orderType,
  productType as productTypeConstants,
  paymentSource,
  paymentProvider,
  reservedDomainName,
} from 'utils/constants';

import { useGlobalContext } from 'services/globalContext';
import http from 'services/http';

import styles from './styles.module.scss';

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
    isGiftPurchase: Boolean -> for triggering gift flow
  }

  Possible Product Type values : 'SESSION' | 'VIDEO' | 'PASS' | 'COURSE' | 'SUBSCRIPTION'
  paymentInstrumentOrderData will be a Pass Order Object (for type 'PASS') 
    or Subscription Order Object (for type 'SUBSCRIPTION')
*/

// TODO: Tidy things up here, context data doesn't need to be passed down since
// child components can access directly
const PaymentPopup = () => {
  const [form] = Form.useForm();
  const [giftForm] = Form.useForm();
  const {
    state: { paymentPopupVisible, paymentPopupCallback, paymentPopupData, userDetails },
    hidePaymentPopup,
    showGiftMessageModal,
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
  const [creatorStripeAccountID, setCreatorStripeAccountID] = useState(null);
  const [creatorPaymentProvider, setCreatorPaymentProvider] = useState(null);
  const [stripePromise, setStripePromise] = useState(null);

  const [giftFormValid, setGiftFormValid] = useState(false);

  const {
    itemList = [],
    productId = null,
    productType = null,
    paymentInstrumentDetails = null,
    flexiblePaymentDetails = null,
    isGiftPurchase = false,
  } = paymentPopupData || {};
  const totalPrice = itemList?.reduce((acc, product) => acc + product.price, 0) || 0;

  const fetchCreatorDetailsForPayment = useCallback(async () => {
    let creatorUsername = 'app';

    if (isInCreatorDashboard()) {
      const localUserDetails = getLocalUserDetails();

      if (localUserDetails.is_creator) {
        creatorUsername = localUserDetails.username;
      }
    } else {
      creatorUsername = getUsernameFromUrl();
    }

    if (reservedDomainName.includes(creatorUsername)) {
      return;
    }

    try {
      const { status, data } = await apis.user.getProfileByUsername(creatorUsername);

      if (isAPISuccess(status) && data) {
        if (data.profile?.country) {
          setCreatorCountry(data.profile?.country);
        }

        if (data.profile?.currency) {
          setCreatorCurrency(data.profile?.currency);
        }

        if (data.profile?.payment_provider) {
          setCreatorPaymentProvider(data.profile?.payment_provider);
        }

        if (data.profile?.connect_account_id) {
          setCreatorStripeAccountID(data.profile?.connect_account_id);
        }
      }
    } catch (error) {
      console.error('Failed fetching creator details for payment', error?.response);
    }
  }, []);

  useEffect(() => {
    fetchCreatorDetailsForPayment();
    //eslint-disable-next-line
  }, []);

  useEffect(() => {
    let stripeKey = config.stripe.secretKey;

    if (creatorCountry && creatorCountry === 'IN') {
      stripeKey = config.stripe.indianSecretKey;
      console.log('Using indian stripe key for this creator');
    }

    if (creatorPaymentProvider === paymentProvider.STRIPE) {
      if (creatorStripeAccountID) {
        setStripePromise(
          loadStripe(stripeKey, {
            stripeAccount: creatorStripeAccountID,
          })
        );
      } else {
        setStripePromise(loadStripe(stripeKey));
      }
    }

    //eslint-disable-next-line
  }, [creatorStripeAccountID, creatorPaymentProvider]);

  useEffect(() => {
    if (!paymentPopupVisible) {
      setCouponCode('');
      setCouponApplied(false);
      setCouponErrorText(null);
      setDiscountedPrice(null);
      setIsApplyingCoupon(false);
      setShowCouponField(false);
      setPriceAmount(0);
    }
  }, [paymentPopupVisible, totalPrice]);

  useEffect(() => {
    if (flexiblePaymentDetails?.enabled) {
      setPriceAmount(null);
    } else {
      setPriceAmount(0);
    }

    //eslint-disable-next-line
  }, [flexiblePaymentDetails]);

  useEffect(() => {
    setGiftFormValid(!isGiftPurchase);
  }, [isGiftPurchase]);

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
    setShowCouponField(false);
    setPriceAmount(0);
    setGiftFormValid(false);
    resetBodyStyle();

    form.resetFields();
    giftForm.resetFields();

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

  // This function is used to signup the receiver
  // in case this is a gift purchase
  const handleSignupReceiver = async () => {
    try {
      const values = giftForm.getFieldsValue();

      const payload = {
        first_name: values.first_name,
        last_name: values.last_name,
        email: values.email,
        is_creator: false,
        referrer: userDetails.external_id,
        timezone_info: getTimezoneLocation(),
      };

      const { status, data } = await apis.user.signup(payload);

      if (isAPISuccess(status) && data) {
        return data;
      }
    } catch (error) {
      console.error(error);
      message.error(error?.response?.data?.message || 'Failed to sign up receiver account!');
    }

    return null;
  };

  // This will run the callback (we will populate this with order creation functions)
  // and return the order response object
  const handleBeforePayment = async () => {
    let result = null;
    const appliedCouponCode = couponApplied ? couponCode : '';

    if (isGiftPurchase) {
      const receiverData = await handleSignupReceiver();

      if (receiverData) {
        http.setAuthToken(receiverData.auth_token, false);
        // NOTE: We save it in LS here in case we need to use is later
        // Most cases won't need it, except for ones where we redirect
        // and need to do followup booking (e.g. iDeal)
        saveGiftReceiverData(receiverData);

        if (flexiblePaymentDetails?.enabled) {
          // PWYW can't be used with coupons
          result = await paymentPopupCallback('', priceAmount);
        } else {
          result = await paymentPopupCallback(appliedCouponCode);
        }

        http.setAuthToken(userDetails.auth_token, false);
      }
    } else {
      if (flexiblePaymentDetails?.enabled) {
        // PWYW can't be used with coupons
        result = await paymentPopupCallback('', priceAmount);
      } else {
        result = await paymentPopupCallback(appliedCouponCode);
      }
    }

    if (result.is_successful_order) {
      saveGiftOrderData({
        ...result,
        order_type: result.payment_order_type ?? result.order_type,
        product_name: itemList[0]?.name,
      });
    }
    return result;
  };

  const handleAfterPayment = async (orderResponse = null, verifyOrderRes = null) => {
    // NOTE : is_successful_order can also be false if the product is a free product
    if (orderResponse && orderResponse?.is_successful_order) {
      if (isGiftPurchase) {
        const receiverData = getGiftReceiverData();

        if (receiverData) {
          showGiftMessageModal();
        } else {
          message.error('No Gift Receiver Data Found!');
        }
      } else if (verifyOrderRes === orderType.PASS) {
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
      } else if (verifyOrderRes === orderType.SUBSCRIPTION) {
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
              payment_source: paymentSource.SUBSCRIPTION,
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
              payment_source: paymentSource.SUBSCRIPTION,
              source_id: orderResponse.payment_order_id,
            };

            await followUpBookSession(payload);
          }
        } else {
          // If no followup booking info is attached, then it's only a simple subscription purchase
          showPurchaseSubscriptionSuccessModal();
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
      }
    }

    closePaymentPopup();
  };

  const onPriceAmountChanged = async (value) => {
    setPriceAmount(value);
    form.setFieldsValue({ ...form.getFieldsValue(), pwyw_price: value });
    await form.validateFields(['pwyw_price']);
  };

  const generatePaymentInstrumentDetails = () => {
    if (!paymentInstrumentDetails) {
      return null;
    }

    let textContent = '';

    if (paymentInstrumentDetails.type === paymentSource.PASS) {
      const passDetails = paymentInstrumentDetails;
      textContent = `Will use ${passDetails.pass_name} to book this ${
        passDetails.limited ? `. You currently have ${passDetails.classes_remaining} credits left.` : ''
      }`;
    } else if (paymentInstrumentDetails.type === paymentSource.SUBSCRIPTION) {
      const subscriptionDetails = paymentInstrumentDetails;

      textContent = `Will use ${subscriptionDetails.subscription_name} to book this. You currently have ${
        subscriptionDetails.product_credits - subscriptionDetails.product_credits_used
      } credits left`;
    }

    return (
      <Text strong className={styles.blueText}>
        {textContent}
      </Text>
    );
  };

  const getProductOrderType = () => {
    switch (productType) {
      case productTypeConstants.COURSE:
        return orderType.COURSE;
      case productTypeConstants.CLASS:
        return orderType.CLASS;
      case productTypeConstants.PASS:
        return orderType.PASS;
      case productTypeConstants.VIDEO:
        return orderType.VIDEO;
      default:
        return null;
    }
  };

  const handlePurchaseFreeProduct = async () => {
    const orderResponse = await handleBeforePayment();
    const orderType = getProductOrderType();
    await handleAfterPayment(orderResponse, orderType);
  };

  const isFree = () =>
    flexiblePaymentDetails?.enabled
      ? false
      : couponApplied
      ? discountedPrice === 0
      : paymentInstrumentDetails || totalPrice === 0;

  const getMinimumPrice = () => flexiblePaymentDetails?.minimumPrice || 5;

  const isPriceLessThanMinimum = () => (flexiblePaymentDetails?.enabled ? priceAmount < getMinimumPrice() : false);

  const handleGiftFormChanged = async (changedValues, allValues) => {
    try {
      const validatedValues = await giftForm.validateFields();
      console.log(validatedValues);
      setGiftFormValid(true);
    } catch (error) {
      console.error(error);
      setGiftFormValid(error.errorFields.length <= 0);
    }
  };

  const getAmountForPaymentRequest = () => {
    if (flexiblePaymentDetails?.enabled) {
      const minimumPrice = getMinimumPrice();
      return priceAmount < minimumPrice ? minimumPrice : priceAmount;
    } else {
      return totalPrice;
    }
  };

  const creatorDetails = useMemo(() => ({ country: creatorCountry, currency: creatorCurrency }), [
    creatorCountry,
    creatorCurrency,
  ]);

  return (
    <Modal
      visible={paymentPopupVisible}
      closable={true}
      maskClosable={false}
      centered={true}
      footer={null}
      title={<Title level={4}> Confirm your purchase </Title>}
      onCancel={closePaymentPopup}
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
            <Col xs={10} md={14}>
              <Text strong>
                {flexiblePaymentDetails?.enabled
                  ? `Pay what you value this ${productType?.toLowerCase()}`
                  : 'Total payable amount'}
              </Text>
            </Col>
            <Col xs={14} md={10} className={styles.paymentTotalText}>
              {itemList &&
                itemList.length > 0 &&
                (flexiblePaymentDetails?.enabled ? (
                  <Tooltip title="Input your fair price">
                    <Form form={form} scrollToFirstError>
                      <Form.Item
                        name="pwyw_price"
                        rules={validationRules.numberValidation(
                          `Please input the minimum value (min. ${getMinimumPrice()})`,
                          getMinimumPrice()
                        )}
                      >
                        <InputNumber
                          placeholder="Put your amount here"
                          className={priceAmount ? undefined : styles.redInputBorder}
                          onChange={onPriceAmountChanged}
                          min={1}
                          value={priceAmount}
                        />
                        <span className="ant-form-text"> {creatorCurrency.toUpperCase()} </span>
                      </Form.Item>
                    </Form>
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
                  <Text>{totalPrice > 0 ? `${creatorCurrency.toUpperCase()} ${totalPrice}` : 'Free'}</Text>
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

        {isGiftPurchase && (
          <Col xs={24} className={styles.topBorder}>
            <Form
              onValuesChange={handleGiftFormChanged}
              form={giftForm}
              layout="vertical"
              labelAlign="left"
              scrollToFirstError={true}
            >
              <Row gutter={[8, 8]}>
                <Col xs={24}>
                  <Text strong>Who are you gifting this to?</Text>
                </Col>
                <Col xs={12}>
                  <Form.Item label="Recipient First Name" name="first_name" rules={validationRules.requiredValidation}>
                    <Input placeholder="Recipient's First Name" disabled={!isGiftPurchase} />
                  </Form.Item>
                </Col>
                <Col xs={12}>
                  <Form.Item label="Recipient Last Name" name="last_name" rules={validationRules.requiredValidation}>
                    <Input placeholder="Recipient's Last Name" disabled={!isGiftPurchase} />
                  </Form.Item>
                </Col>
                <Col xs={24}>
                  <Form.Item label="Recipient Email" name="email" rules={validationRules.emailValidation}>
                    <Input type="email" placeholder="Recipient email address" disabled={!isGiftPurchase} />
                  </Form.Item>
                </Col>
              </Row>
            </Form>
          </Col>
        )}

        <Col xs={24} className={styles.topBorder}>
          <Row gutter={[8, 12]} justify="center">
            {isFree() ? (
              <Col xs={24} className={styles.p20}>
                <Row justify="center">
                  <Col xs={8} lg={6}>
                    <Button
                      block
                      size="large"
                      type="primary"
                      className={styles.greenBtn}
                      onClick={handlePurchaseFreeProduct}
                      disabled={isGiftPurchase && !giftFormValid}
                    >
                      Get
                    </Button>
                  </Col>
                </Row>
              </Col>
            ) : creatorPaymentProvider === paymentProvider.PAYPAL ? (
              <Col xs={24}>
                <PaypalPaymentButtons
                  onBeforePayment={handleBeforePayment}
                  onAfterPayment={handleAfterPayment}
                  creatorCurrency={creatorCurrency}
                  buttonDisabled={isPriceLessThanMinimum() || (isGiftPurchase && !giftFormValid)}
                />
              </Col>
            ) : (
              <>
                <Col xs={24}>
                  <Elements stripe={stripePromise}>
                    <PaymentOptionsWrapper
                      handleAfterPayment={handleAfterPayment}
                      handleBeforePayment={handleBeforePayment}
                      // Currently, only subscriptions need payment details to be saved
                      // so we can use the saved details to charge them offline for recurring payment
                      shouldSavePaymentDetails={productType === productTypeConstants.SUBSCRIPTION}
                      minimumPriceRequirementFulfilled={isPriceLessThanMinimum() || (isGiftPurchase && !giftFormValid)}
                      creatorDetails={creatorDetails}
                      amount={getAmountForPaymentRequest()}
                    />
                  </Elements>
                </Col>
                <Col xs={24}>
                  <SupportedPayments />
                </Col>
              </>
            )}

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
