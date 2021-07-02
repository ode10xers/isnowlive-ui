import React, { useState, useEffect } from 'react';
import { Row, Col, Typography } from 'antd';

import apis from 'apis';

import Loader from 'components/Loader';
import CreatorSubscriptions from 'components/CreatorSubscriptions';

import { isAPISuccess } from 'utils/helper';

import styles from './style.module.scss';
const logo = require('assets/images/Logo-passion-transparent.png');

const { Title } = Typography;

const Subscriptions = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [subscriptions, setSubscriptions] = useState([]);

  useEffect(() => {
    const getSubscriptionDetails = async () => {
      setIsLoading(true);

      try {
        const { status, data } = await apis.subscriptions.getSubscriptionsByUsername();

        if (isAPISuccess(status) && data) {
          setSubscriptions(data.sort((a, b) => a.total_price - b.total_price));
        }
      } catch (error) {
        console.error('Failed to load subscription details');
      }
      setIsLoading(false);
    };

    getSubscriptionDetails();
  }, []);

  return (
    <div className={styles.subscriptionPluginContainer}>
      <Row className={styles.mt20} gutter={[8, 16]}>
        <Col span={14}>
          <Title level={5}> Monthly Memberships </Title>
        </Col>
        <Col span={10}>
          <img src={logo} alt="Passion.do" className={styles.passionLogo} />
        </Col>
        <Col span={24}>
          <Loader loading={isLoading} size="large" text="Loading memberships...">
            <CreatorSubscriptions subscriptions={subscriptions} />
          </Loader>
        </Col>
      </Row>
    </div>
  );
};

export default Subscriptions;
