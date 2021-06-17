import React from 'react';

import { Row, Col, Typography, Divider } from 'antd';

import { generateBaseCreditsText } from 'utils/subscriptions';

import styles from './style.module.scss';

const { Text } = Typography;

// TODO: Implement color shades
const SubscriptionListItem = ({ subscription }) => {
  return (
    <div
      className={styles.subscriptionItem}
      style={{
        '--primary-color': '#1890ff',
        '--primary-color-07': '#1890ff70',
        '--primary-color-05': '#1890ff50',
        '--primary-color-03': '#1890ff30',
        '--primary-color-01': '#1890ff10',
      }}
    >
      <Row gutter={[8, 16]}>
        <Col xs={24}>
          <div className={styles.subscriptionTitle}>{subscription?.name}</div>
          <div className={styles.subscriptionPrice}>
            {subscription?.currency?.toUpperCase()} {subscription?.price} / month
          </div>
        </Col>
        <Col xs={24}>
          <Row gutter={8} className={styles.subscriptionDetails}>
            <Col xs={11} className={styles.textAlignCenter}>
              <Text className={styles.subscriptionDetailItem}> {generateBaseCreditsText(subscription, false)} </Text>
            </Col>
            <Col xs={2} className={styles.textAlignCenter}>
              <Divider type="vertical" className={styles.subscriptionDivider} />
            </Col>
            <Col xs={11} className={styles.textAlignCenter}>
              <Text className={styles.subscriptionDetailItem}> {generateBaseCreditsText(subscription, true)} </Text>
            </Col>
          </Row>
        </Col>
      </Row>
    </div>
  );
};

export default SubscriptionListItem;
