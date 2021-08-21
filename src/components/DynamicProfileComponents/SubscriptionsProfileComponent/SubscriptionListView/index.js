import React from 'react';
import { Row, Col } from 'antd';

import SubscriptionListItem from '../SubscriptionListItem';

const SubscriptionsListView = ({ subscriptions = [], isContained = false }) => {
  const renderSubscriptionsListItems = (subscription) => (
    <Col xs={24} md={12} lg={isContained ? 12 : 8} key={subscription.external_id}>
      <SubscriptionListItem subscription={subscription} />
    </Col>
  );

  return (
    <div>
      {subscriptions?.length > 0 && <Row gutter={[12, 16]}> {subscriptions.map(renderSubscriptionsListItems)} </Row>}
    </div>
  );
};

export default SubscriptionsListView;
