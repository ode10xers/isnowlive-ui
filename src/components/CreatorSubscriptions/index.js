import React, { useState } from 'react';

import { Row, Col, Card, Typography, Button, Divider, List, Space } from 'antd';

import Loader from 'components/Loader';
import PurchaseModal from 'components/PurchaseModal';
import { showErrorModal } from 'components/Modals/modals';

import styles from './styles.module.scss';

const { Text } = Typography;
const whiteColor = '#ffffff';

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

  //TODO: Implement payment popup here
  const showConfirmPaymentPopup = () => {
    if (!selectedSubscription) {
      showErrorModal('Something went wrong', 'Invalid Course Selected');
      return;
    }

    console.log(selectedSubscription);
    createOrder();
  };

  //TODO: Implement payment flow here
  const createOrder = () => {
    setIsLoading(true);
    console.log('Paying...');
    setIsLoading(false);
  };

  const generateBaseCreditsText = (subscription, isCourse = false) => {
    let calculatedBaseCredits = 0;

    if (isCourse) {
      calculatedBaseCredits = subscription?.products['COURSE']?.credits || 0;
    } else {
      calculatedBaseCredits =
        (subscription?.products['SESSION']?.credits || 0) + (subscription?.products['VIDEO']?.credits || 0);
    }

    return (
      <div className={styles.baseCreditsText}>
        {calculatedBaseCredits} {isCourse ? 'Course' : 'Session or Video'} credits / month
      </div>
    );
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
        headStyle={{ textAlign: 'center', borderBottom: `1px solid ${subscription?.color_code || whiteColor}` }}
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
              <Col xs={24}>{generateBaseCreditsText(subscription)}</Col>
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
              <Col xs={24}>{generateBaseCreditsText(subscription, true)}</Col>
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
              /month
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
