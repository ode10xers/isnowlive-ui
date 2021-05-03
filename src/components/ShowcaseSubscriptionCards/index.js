import React, { useState } from 'react';

import { Row, Col, Card, Typography, Button, Drawer, Divider } from 'antd';

import SessionCards from 'components/SessionCards';
import VideoCard from 'components/VideoCard';

import { generateBaseCreditsText } from 'utils/subscriptions';

import styles from './styles.module.scss';
import TagListPopup from 'components/TagListPopup';
import { isMobileDevice } from 'utils/device';

const { Text } = Typography;
const defaultBorderColor = '#f0f0f0';

const ShowcaseSubscriptionCards = ({ subscription, openPurchaseModal = () => {} }) => {
  const [detailsDrawerVisible, setDetailsDrawerVisible] = useState(false);
  const [selectedDetailsKey, setSelectedDetailsKey] = useState(null);

  const showProductsDetails = (productKey) => {
    setSelectedDetailsKey(productKey);
    setDetailsDrawerVisible(true);
  };

  const renderProductDetails = () => {
    return selectedDetailsKey === 'SESSION' ? (
      <SessionCards
        sessions={subscription?.product_details['SESSION']}
        shouldFetchInventories={true}
        compactView={true}
      />
    ) : selectedDetailsKey === 'VIDEO' ? (
      <Row gutter={[8, 8]} justify="center">
        {subscription?.product_details['VIDEO'].map((video) => (
          <Col xs={24} key={video.external_id}>
            <VideoCard video={video} />
          </Col>
        ))}
      </Row>
    ) : (
      <Text disabled> No product details to show </Text>
    );
  };

  const handleDrawerClose = (e) => {
    setSelectedDetailsKey(null);
    setDetailsDrawerVisible(false);
  };

  return (
    <>
      <Card
        hoverable={true}
        style={{ border: `1px solid ${subscription?.color_code || '#ffffff'}` }}
        headStyle={{ textAlign: 'center', borderBottom: `1px solid ${subscription?.color_code || defaultBorderColor}` }}
        bodyStyle={{ textAlign: 'center' }}
        title={
          <div className={styles.subscriptionNameWrapper}>
            <Text strong> {subscription?.name} </Text>
          </div>
        }
      >
        <Row gutter={[8, 8]} justify="center">
          <Col xs={24}>
            <Row gutter={[8, 10]} justify="center">
              <Col xs={24}>
                <div className={styles.baseCreditsText}>{generateBaseCreditsText(subscription, false)}</div>
              </Col>
              <Col xs={24} className={styles.includeTextWrapper}>
                <Text disabled> Purchasable By </Text>
              </Col>
              <Col xs={24}>
                <Text strong>
                  {' '}
                  <TagListPopup tags={[subscription?.tag].filter((tag) => tag.external_id)} />{' '}
                </Text>
              </Col>
            </Row>
          </Col>
          <Col xs={24}>
            <Divider type="horizontal" />
          </Col>
          <Col xs={24} className={styles.includedProductsWrapper}>
            <Row gutter={[8, 10]} justify="center">
              {Object.entries(subscription?.products).map(([key, val]) => (
                <Col xs={24} key={`${subscription?.external_id}_${key}`}>
                  <Button onClick={() => showProductsDetails(key)}>
                    {' '}
                    {val.product_ids.length} {key.toLowerCase()}s{' '}
                  </Button>
                </Col>
              ))}
            </Row>
          </Col>
          <Col xs={24}>
            <Divider type="horizontal" />
          </Col>
          {/* <Col xs={24} className={styles.includedCoursesWrapper}>
            <Row gutter={[8, 10]} justify="center">
              <Col xs={24}>
                <div className={styles.baseCreditsText}>{generateBaseCreditsText(subscription, true)}</div>
              </Col>
            </Row>
          </Col> */}
          <Col xs={24}>
            <div className={styles.subscriptionPriceWrapper} style={{ color: subscription?.color_code || '#000000' }}>
              <span className={styles.subscriptionPriceText}>
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
              Buy Membership
            </Button>
          </Col>
        </Row>
      </Card>
      <Drawer
        title={`${subscription?.name} ${selectedDetailsKey?.toLowerCase()} details`}
        onClose={handleDrawerClose}
        visible={detailsDrawerVisible}
        width={isMobileDevice ? 320 : 520}
      >
        {renderProductDetails()}
      </Drawer>
    </>
  );
};

export default ShowcaseSubscriptionCards;
