import React from 'react';
import classNames from 'classnames';

import { Row, Col } from 'antd';
import { ArrowRightOutlined } from '@ant-design/icons';

import { getShadeForHexColor, preventDefaults } from 'utils/helper';
import { generateBaseCreditsText } from 'utils/subscriptions';

import styles from './style.module.scss';
import { redirectToMembershipPage } from 'utils/redirect';

const SubscriptionListItem = ({ subscription }) => {
  const getSubscriptionColorCode = () => subscription.color_code ?? '#1890ff';

  const handleMembershipItemClicked = (e) => {
    preventDefaults(e);
    redirectToMembershipPage(subscription);
  };

  return (
    <div
      className={styles.membershipItem}
      style={{
        '--primary-color': `${getSubscriptionColorCode()}80`,
        '--secondary-color': getShadeForHexColor(getSubscriptionColorCode(), 1),
        '--ternary-color': getShadeForHexColor(getSubscriptionColorCode(), 2),
      }}
      onClick={handleMembershipItemClicked}
    >
      <Row gutter={[8, 12]}>
        <Col xs={24}>
          <Row gutter={8}>
            <Col xs={22}>
              <div
                className={classNames(
                  styles.membershipName,
                  subscription?.name?.length > 25 ? styles.textLength50 : styles.textLength25
                )}
              >
                {subscription?.name}
              </div>
            </Col>
            <Col xs={2}>
              <div className={styles.arrowSignContainer}>
                <ArrowRightOutlined className={styles.arrowSign} />
              </div>
            </Col>
          </Row>
        </Col>
        <Col xs={24}>
          <Row gutter={8}>
            <Col xs={14}>
              <div className={styles.membershipDetails}>
                {generateBaseCreditsText(subscription, false).replace(' credits/period', '')}
                <br />
                per {subscription?.validity} days
              </div>
            </Col>
            <Col xs={10}>
              <div className={styles.membershipPrice}>
                {subscription?.currency?.toUpperCase()} {subscription?.total_price} / {subscription?.validity} days
              </div>
            </Col>
          </Row>
        </Col>
      </Row>
    </div>
  );
};

export default SubscriptionListItem;
