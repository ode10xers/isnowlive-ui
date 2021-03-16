import React, { useState } from 'react';

import { Row, Col, Card, Typography, Button, Divider, List, Space, message } from 'antd';

import Loader from 'components/Loader';
import PurchaseModal from 'components/PurchaseModal';
import { showErrorModal, showSuccessModal } from 'components/Modals/modals';

import dateUtil from 'utils/date';

import { useGlobalContext } from 'services/globalContext';

import styles from './styles.module.scss';
import apis from 'apis';
import { isAPISuccess } from 'utils/helper';

const {
  timezoneUtils: { getTimezoneLocation },
} = dateUtil;

const { Text } = Typography;
const defaultBorderColor = '#f0f0f0';

const productTextMapping = {
  SESSION: 'Sessions',
  VIDEO: 'Videos',
  COURSE: 'Courses',
};

const accessTypeTextMapping = {
  PUBLIC: 'Public',
  MEMBERSHIP: 'Membership',
};

const CreatorSubscriptions = ({ subscriptions }) => {
  const { showPaymentPopup } = useGlobalContext();

  const [isLoading, setIsLoading] = useState(false);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState(null);

  const openPurchaseModal = (subscription) => {
    setSelectedSubscription(subscription);
    setShowPurchaseModal(true);
  };

  const closePurchaseModal = () => {
    setSelectedSubscription(null);
    setShowPurchaseModal(false);
  };

  const showConfirmPaymentPopup = () => {
    if (!selectedSubscription) {
      showErrorModal('Something went wrong', 'Invalid Course Selected');
      return;
    }

    console.log(selectedSubscription);

    let itemDescription = [];

    itemDescription.push(generateBaseCreditsText(selectedSubscription, false));

    if (selectedSubscription.products['COURSE']) {
      itemDescription.push(generateBaseCreditsText(selectedSubscription, true));
    }

    const paymentPopupData = {
      productId: selectedSubscription.external_id,
      itemList: [
        {
          name: selectedSubscription.name,
          description: itemDescription.join(', '),
          currency: selectedSubscription.currency,
          price: selectedSubscription.price,
        },
      ],
    };

    showPaymentPopup(paymentPopupData, createOrder);
  };

  //TODO: Integrate this once implemented
  const initiatePaymentForOrder = async (orderDetails) => {
    console.log(orderDetails);
    message.success('Order created!');
  };

  const createOrder = async (userEmail, couponCode = '') => {
    setIsLoading(true);

    console.log(couponCode);

    try {
      const payload = {
        subscription_id: selectedSubscription.external_id,
        user_timezone_location: getTimezoneLocation(),
      };

      const { status, data } = await apis.subscriptions.createSubscriptionOrder(payload);

      if (isAPISuccess(status) && data) {
        if (data.payment_required) {
          initiatePaymentForOrder(data);
        } else {
          //TODO: Confirm with Rahul about the content of confirmation popup
          showSuccessModal('Subscription Purchased');
        }
      }
    } catch (error) {
      if (error?.response?.status === 500 && error?.response?.data?.message === 'unable to apply discount to order') {
        showErrorModal(
          'Discount Code Not Applicable',
          'The discount code you entered is not applicable this product. Please try again with a different discount code'
        );
      } else {
        message.error(error.response?.data?.message || 'Something went wrong');
      }
    }

    setIsLoading(false);
  };

  const generateBaseCreditsText = (subscription, isCourse = false) => {
    let calculatedBaseCredits = 0;
    let productText = '';

    if (isCourse) {
      calculatedBaseCredits = subscription?.products['COURSE']?.credits || 0;
      productText = 'Course';
    } else {
      calculatedBaseCredits =
        (subscription?.products['SESSION']?.credits || 0) + (subscription?.products['VIDEO']?.credits || 0);

      let availableProducts = [];

      if (subscription?.products['SESSION']) {
        availableProducts.push('Sessions');
      }

      if (subscription?.products['VIDEO']) {
        availableProducts.push('Videos');
      }

      productText = availableProducts.join(' or ');
    }

    return `${calculatedBaseCredits} ${productText} credits/month`;
  };

  const generateIncludedProducts = (subscription, isCourse = false) => {
    let productTexts = [];

    if (isCourse) {
      productTexts =
        subscription?.products['COURSE']?.access_types?.map(
          (accessType) => `${accessTypeTextMapping[accessType]} ${productTextMapping['COURSE']}`
        ) || [];
    } else {
      const excludedProductKeys = ['COURSE'];
      Object.entries(subscription?.products).forEach(([key, val]) => {
        if (!excludedProductKeys.includes(key)) {
          productTexts = [
            ...productTexts,
            ...val.access_types.map((accessType) => `${accessTypeTextMapping[accessType]} ${productTextMapping[key]}`),
          ];
        }
      });
    }

    return (
      <Space size="small" direction="vertical" align="center" className={styles.includedProductsList}>
        {productTexts.map((productText) => (
          <Text strong> {productText} </Text>
        ))}
      </Space>
    );
  };

  const renderShowcaseSubscriptionCards = (subscription) => (
    <List.Item key={subscription?.external_id}>
      <Card
        hoverable={true}
        style={{ border: `1px solid ${subscription?.color_code || '#ffffff'}` }}
        headStyle={{ textAlign: 'center', borderBottom: `1px solid ${subscription?.color_code || defaultBorderColor}` }}
        title={
          <div className={styles.subscriptionNameWrapper}>
            <Text strong> {subscription?.name} </Text>
          </div>
        }
        bodyStyle={{ textAlign: 'center' }}
      >
        <Row gutter={[8, 8]} justify="center">
          <Col xs={24} className={styles.includedProductsWrapper}>
            <Row gutter={[8, 10]} justify="center">
              <Col xs={24}>
                <div className={styles.baseCreditsText}>{generateBaseCreditsText(subscription, false)}</div>
              </Col>
              <Col xs={24} className={styles.includeTextWrapper}>
                <Text disabled> Includes access to </Text>
              </Col>
              <Col xs={24}>{generateIncludedProducts(subscription)}</Col>
            </Row>
          </Col>
          <Col xs={24}>
            <Divider type="horizontal" />
          </Col>
          <Col xs={24} className={styles.includedCoursesWrapper}>
            <Row gutter={[8, 10]} justify="center">
              <Col xs={24}>
                <div className={styles.baseCreditsText}>{generateBaseCreditsText(subscription, true)}</div>
              </Col>
              <Col xs={24} className={styles.includeTextWrapper}>
                {subscription?.products['COURSE']?.access_types?.length > 0 && (
                  <Text disabled> Includes access to </Text>
                )}
              </Col>
              <Col xs={24}>{generateIncludedProducts(subscription, true)}</Col>
            </Row>
          </Col>
          <Col xs={24}>
            <div className={styles.subscriptionPriceWrapper} style={{ color: subscription?.color_code || '#000000' }}>
              <span className={styles.subscriptionPriceText}>
                {' '}
                {subscription?.currency?.toUpperCase()} {subscription?.price}{' '}
              </span>
              / month
            </div>
          </Col>
          <Col xs={24} className={styles.buyButtonWrapper}>
            <Button
              type="primary"
              style={{
                background: subscription?.color_code || '#1890ff',
                borderColor: subscription?.color_code || '#1890ff',
              }}
              onClick={() => openPurchaseModal(subscription)}
            >
              Buy Subscription
            </Button>
          </Col>
        </Row>
      </Card>
    </List.Item>
  );

  return (
    <div>
      <PurchaseModal
        visible={showPurchaseModal}
        closeModal={closePurchaseModal}
        createOrder={showConfirmPaymentPopup}
      />
      <Loader loading={isLoading} text="Processing payment" size="large">
        <Row gutter={[8, 10]}>
          <Col xs={24}>
            <List
              grid={{ gutter: 10, column: 3 }}
              dataSource={subscriptions}
              renderItem={renderShowcaseSubscriptionCards}
            />
          </Col>
        </Row>
      </Loader>
    </div>
  );
};

export default CreatorSubscriptions;
