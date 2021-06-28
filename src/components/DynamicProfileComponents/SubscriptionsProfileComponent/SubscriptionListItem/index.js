import React from 'react';

import { Row, Col, Typography, Space } from 'antd';
import { CaretRightOutlined } from '@ant-design/icons';

import { generateBaseCreditsText } from 'utils/subscriptions';

import styles from './style.module.scss';

const { Text } = Typography;

const SubscriptionListItem = ({ subscription }) => {
  const getSubscriptionColorCode = () => subscription.color_code ?? '#1890ff';

  return (
    <div
      className={styles.subscriptionItem}
      style={{
        '--primary-color': getSubscriptionColorCode(),
        '--primary-color-07': `${getSubscriptionColorCode()}70`,
        '--primary-color-05': `${getSubscriptionColorCode()}50`,
        '--primary-color-03': `${getSubscriptionColorCode()}30`,
        '--primary-color-01': `${getSubscriptionColorCode()}10`,
      }}
    >
      <Row>
        <Col xs={23} className={styles.subscriptionDetailsContainer}>
          <Row gutter={[8, 16]}>
            <Col xs={24} className={styles.subscriptionTitleContainer}>
              <div className={styles.subscriptionTitle}>{subscription?.name}</div>
              <div className={styles.subscriptionPrice}>
                {subscription?.currency?.toUpperCase()} {subscription?.price} / month
              </div>
            </Col>
            <Col xs={24}>
              <Text className={styles.subscriptionDetails}> {generateBaseCreditsText(subscription, false)} </Text>
              {/* <Row gutter={8} className={styles.subscriptionDetails}>
                <Col xs={11} className={styles.textAlignCenter}>
                  <Text className={styles.subscriptionDetailItem}> {generateBaseCreditsText(subscription, false)} </Text>
                </Col>
                <Col xs={2} className={styles.textAlignCenter}>
                  <Divider type="vertical" className={styles.subscriptionDivider} />
                </Col>
                <Col xs={11} className={styles.textAlignCenter}>
                  <Text className={styles.subscriptionDetailItem}> {generateBaseCreditsText(subscription, true)} </Text>
                </Col> 
              </Row>*/}
            </Col>
          </Row>
        </Col>
        <Col xs={1} className={styles.subscriptionDetailsArrowContainer}>
          <Space align="center" className={styles.subscriptionDetailsArrow}>
            <CaretRightOutlined />
          </Space>
        </Col>
      </Row>
    </div>
  );
};

export default SubscriptionListItem;
