import React, { useState, useCallback, useEffect } from 'react';
import classNames from 'classnames';

import { Row, Col, Spin, Typography, Button, Space, Popconfirm, Empty, message } from 'antd';

import apis from 'apis';

import { showErrorModal } from 'components/Modals/modals';

import dateUtil from 'utils/date';
import { isAPISuccess } from 'utils/helper';

import styles from './styles.module.scss';

const { Title, Text } = Typography;
const {
  formatDate: { toLocaleDate },
} = dateUtil;

const platformSubscriptionStatuses = {
  ACTIVE: 'ACTIVE',
  CANCELLED: 'CANCELLED',
  TRIAL: 'TRIALLING',
};

const PlatformSubscriptionItem = ({ platformSubscription = null }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCancelSubscriptionClicked = useCallback(async () => {
    setIsSubmitting(true);

    try {
      const { status } = await apis.platform_subscriptions.cancelCreatorPlatformSubscription(
        platformSubscription.subscription_id
      );

      if (isAPISuccess(status)) {
        // TODO: Confirm the flow after cancel
        message.success('Plan has been cancelled!');
        window.location.reload();
      }
    } catch (error) {
      console.error(error);
      showErrorModal('Failed to cancel plan', error?.response?.data?.message || 'Something went wrong');
    }

    setIsSubmitting(false);
  }, [platformSubscription]);

  const getStatusClass = (status) => {
    switch (status) {
      case platformSubscriptionStatuses.ACTIVE:
        return styles.active;
      case platformSubscriptionStatuses.CANCELLED:
        return styles.inactive;
      case platformSubscriptionStatuses.TRIAL:
        return undefined;
      default:
        return undefined;
    }
  };

  return platformSubscription ? (
    <div className={styles.platformSubscriptionItem}>
      <Spin spinning={isSubmitting}>
        <div className={classNames(styles.statusTag, getStatusClass(platformSubscription.status))}>
          {platformSubscription.status?.toUpperCase() ?? ''}
        </div>
        <Row gutter={[8, 12]}>
          <Col xs={24}>
            <Row gutter={[8, 8]} align="middle">
              <Col flex="1 1 auto">
                <Title level={5} className={styles.itemName}>
                  {platformSubscription.product_name}
                </Title>
              </Col>
              <Col flex="0 0 140px" className={styles.textAlignRight}>
                <Text className={styles.itemHelpText}>Valid up to </Text>
                <Text strong className={styles.itemDurationText}>
                  {toLocaleDate(platformSubscription.end_date)}
                </Text>
              </Col>
            </Row>
          </Col>
          <Col xs={24}>
            <Space>
              <Popconfirm
                title="Are you sure about cancelling the plan?"
                okText="Yes, I'm sure"
                okType="danger"
                onConfirm={handleCancelSubscriptionClicked}
              >
                <Button danger size="small" type="link">
                  Cancel Plan
                </Button>
              </Popconfirm>
            </Space>
          </Col>
        </Row>
      </Spin>
    </div>
  ) : null;
};

const PlatformSubscriptionSettings = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [creatorPlatformSubscriptions, setCreatorPlatformSubscriptions] = useState([]);

  const fetchCreatorPlatformSubscription = useCallback(async () => {
    setIsLoading(true);

    try {
      const { status, data } = await apis.platform_subscriptions.getCreatorPlatformSubscriptions();

      if (isAPISuccess(status) && data) {
        setCreatorPlatformSubscriptions(data);
      }
    } catch (error) {
      console.error(error);
      showErrorModal(
        'Failed to fetch platform subscription',
        error?.response?.data?.message || 'Something went wrong.'
      );
    }

    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchCreatorPlatformSubscription();
  }, [fetchCreatorPlatformSubscription]);

  const handleChoosePlanClicked = useCallback(() => {
    const isStage =
      window.location.hostname.includes('.stage.passion.do') || window.location.hostname.includes('localhost');
    const pagePath = '/features-pricing';

    const targetUrl = `https://${isStage ? 'passion-do.webflow.io' : 'passion.do'}${pagePath}`;
    window.open(targetUrl, '_blank');
  }, []);

  // TODO: Confirm what to show if no subscription
  return (
    <div>
      <Spin spinning={isLoading} size="large">
        <Row gutter={[8, 8]}>
          {creatorPlatformSubscriptions.length > 0 ? (
            creatorPlatformSubscriptions.map((subs) => (
              <Col xs={24} md={12} xl={8} key={subs.subsription_id}>
                <PlatformSubscriptionItem platformSubscription={subs} />
              </Col>
            ))
          ) : (
            <Col xs={24}>
              <Empty description="You currently have no active plan">
                <Button type="primary" onClick={handleChoosePlanClicked}>
                  Choose a plan
                </Button>
              </Empty>
            </Col>
          )}
        </Row>
      </Spin>
    </div>
  );
};

export default PlatformSubscriptionSettings;
