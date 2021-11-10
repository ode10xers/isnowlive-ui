import React, { useState, useEffect, useCallback } from 'react';

import { Row, Col, Empty, Spin, message } from 'antd';

import apis from 'apis';
import layouts from '../layouts';

import SubscriptionListItem from 'components/DynamicProfileComponents/SubscriptionsProfileComponent/SubscriptionListItem';

import { isAPISuccess } from 'utils/helper';

import styles from './styles.module.scss';

const SubscriptionList = ({ layout = layouts.GRID, padding = 8 }) => {
  const isGrid = layout === layouts.GRID;

  const [subscriptions, setSubscriptions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCreatorSubscriptions = useCallback(async () => {
    setIsLoading(true);

    try {
      const { status, data } = await apis.subscriptions.getSubscriptionsByUsername();

      if (isAPISuccess(status) && data) {
        setSubscriptions(data.sort((a, b) => a.total_price - b.total_price));
      }
    } catch (error) {
      console.error(error);
      message.error('Failed to load subscription details');
    }

    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchCreatorSubscriptions();
  }, [fetchCreatorSubscriptions]);

  const renderSubscriptionItems = (subs) => (
    <Col xs={isGrid ? 24 : 20} md={isGrid ? 12 : 14} lg={isGrid ? 8 : 7} key={subs.external_id}>
      <SubscriptionListItem subscription={subs} />
    </Col>
  );

  return (
    <div
      style={{
        padding: typeof padding === 'string' ? parseInt(padding) : padding,
      }}
    >
      <Spin spinning={isLoading} tip="Fetching subscriptions data...">
        {subscriptions.length > 0 ? (
          <Row gutter={[8, 8]} className={isGrid ? undefined : styles.horizontalScrollableListContainer}>
            {subscriptions.map(renderSubscriptionItems)}
          </Row>
        ) : (
          <Empty description="No subscriptions found" />
        )}
      </Spin>
    </div>
  );
};

export default SubscriptionList;
