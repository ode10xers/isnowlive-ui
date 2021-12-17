import React from 'react';

import { Row, Col, Typography } from 'antd';

import { preventDefaults } from 'utils/helper';
import { getShadeForHexColor } from 'utils/colors';
import { redirectToMembershipPage } from 'utils/redirect';
import { generateBaseCreditsText, generateSubscriptionDuration } from 'utils/subscriptions';

import styles from './style.module.scss';

const { Text } = Typography;

const SubscriptionListItem = ({ subscription }) => {
  const getSubscriptionColorCode = () => subscription?.color_code ?? '#1890ff';

  const handleMembershipItemClicked = (e) => {
    preventDefaults(e);
    redirectToMembershipPage(subscription);
  };

  let subscriptionContentText = [];

  if (subscription?.products['COURSE']) {
    subscriptionContentText.push(generateBaseCreditsText(subscription, true));
  }

  if (subscription?.products['VIDEO'] || subscription?.products['SESSION']) {
    subscriptionContentText.push(generateBaseCreditsText(subscription, false));
  }

  return (
    <div
      className={styles.subscriptionItem}
      style={{
        '--primary-color': `${getSubscriptionColorCode()}25`,
        '--secondary-color': `${getSubscriptionColorCode()}60`,
        '--ternary-color': getShadeForHexColor(getSubscriptionColorCode(), 3),
      }}
      onClick={handleMembershipItemClicked}
    >
      <Row gutter={[8, 8]} align="middle">
        <Col xs={24}>
          <div className={styles.subscriptionName}>{subscription?.name}</div>
        </Col>
        <Col xs={24}>
          <Row align="middle">
            <Col xs={18}>
              <Text className={styles.durationText}>
                {generateSubscriptionDuration(subscription, true)} access for up to
              </Text>
              <Text className={styles.contentText}>
                {subscriptionContentText.join(' and ').replaceAll(' credits/period', '')}
              </Text>
            </Col>
            <Col xs={6} className={styles.textAlignRight}>
              <Text className={styles.subscriptionPrice}>
                {subscription?.total_price > 0
                  ? `${subscription?.currency?.toUpperCase()} ${subscription?.total_price}`
                  : 'Free'}
              </Text>
            </Col>
          </Row>
        </Col>
      </Row>
    </div>
  );
};

export default SubscriptionListItem;
