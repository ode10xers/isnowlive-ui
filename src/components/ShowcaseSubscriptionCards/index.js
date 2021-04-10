import React from 'react';

import { Row, Col, Card, Typography, Button, Divider, Space } from 'antd';

import { generateBaseCreditsText, generateIncludedProducts } from 'utils/subscriptions';

import styles from './styles.module.scss';

const { Text } = Typography;
const defaultBorderColor = '#f0f0f0';

const ShowcaseSubscriptionCards = ({ subscription, openPurchaseModal = () => {} }) => {
  return (
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
            <Col xs={24}>
              <Space size="small" direction="vertical" align="center" className={styles.includedProductsList}>
                {generateIncludedProducts(subscription).map((productText) => (
                  <Text key={productText} strong>
                    {' '}
                    {productText}{' '}
                  </Text>
                ))}
              </Space>
            </Col>
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
              {subscription?.products['COURSE']?.access_types?.length > 0 && <Text disabled> Includes access to </Text>}
            </Col>
            <Col xs={24}>{generateIncludedProducts(subscription, true)}</Col>
          </Row>
        </Col>
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
            Buy Subscription
          </Button>
        </Col>
      </Row>
    </Card>
  );
};

export default ShowcaseSubscriptionCards;
