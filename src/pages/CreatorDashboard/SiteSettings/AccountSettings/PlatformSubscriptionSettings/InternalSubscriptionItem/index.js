import React, { useCallback } from 'react';
import classNames from 'classnames';

import { Row, Col, Button, List, Typography, Divider } from 'antd';

import { CheckCircleOutlined } from '@ant-design/icons';

import styles from './style.module.scss';

const { Text } = Typography;

const InternalSubscriptionItem = ({ internalSubscription = null, isYearly = false, isActive = false }) => {
  const handlePlanClicked = useCallback(() => {
    if (isYearly && internalSubscription?.yearlyLink) {
      window.open(internalSubscription?.yearlyLink);
    } else if (!isYearly && internalSubscription?.monthlyLink) {
      window.open(internalSubscription?.monthlyLink);
    } else {
      window.open('https://passion.do/features-pricing', '_blank');
    }
  }, [internalSubscription, isYearly]);

  return internalSubscription ? (
    <div className={classNames(styles.internalSubscriptionItem, isActive ? styles.active : undefined)}>
      {isActive && <div className={styles.activeMarker}>● CURRENTLY ACTIVE ●</div>}
      <Row gutter={[8, 8]}>
        <Col xs={24} className={styles.textAlignCenter}>
          <Text className={styles.internalSubscriptionName}>{internalSubscription?.name}</Text>
          <Text className={styles.internalSubscriptionPrice}>
            ${(isYearly ? internalSubscription?.yearlyPrice : internalSubscription?.monthlyPrice) ?? 0}
          </Text>
        </Col>
        <Col xs={24}>
          <Divider className={styles.compactDivider} />
        </Col>
        <Col xs={24}>
          <Text strong className={styles.internalSubscriptionDesc}>
            {internalSubscription.serviceFee}% service fee paid by your buyers.
          </Text>
        </Col>
        <Col xs={24}>
          <Button
            ghost
            block
            type="primary"
            className={styles.ctaButton}
            onClick={handlePlanClicked}
            disabled={isActive}
          >
            {isActive ? 'Currently Active Plan' : internalSubscription.buttonText}
          </Button>
        </Col>
        {internalSubscription?.inclusiveBanner && (
          <Col xs={24}>
            <div className={styles.bannerText}>{internalSubscription.inclusiveBanner}</div>
          </Col>
        )}
        <Col xs={24}>
          <List
            size="small"
            split={false}
            className={styles.featureList}
            dataSource={internalSubscription?.featuresList ?? []}
            renderItem={(item) => (
              <List.Item className={styles.featureListItem}>
                <CheckCircleOutlined className={styles.checkIcon} />
                <Text className={styles.featureListItemText}>{item}</Text>
              </List.Item>
            )}
          />
        </Col>
      </Row>
    </div>
  ) : null;
};

export default InternalSubscriptionItem;
