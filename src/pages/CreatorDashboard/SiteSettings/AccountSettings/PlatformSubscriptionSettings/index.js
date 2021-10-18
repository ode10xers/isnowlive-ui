import React, { useState, useCallback, useEffect, useMemo } from 'react';

import { Row, Col, Spin, Radio, Typography, Empty, Badge } from 'antd';

import apis from 'apis';
import internalSubscriptionsData from './data.js';

import { showErrorModal } from 'components/Modals/modals';
import InternalSubscriptionItem from './InternalSubscriptionItem/index.js';
import PlatformSubscriptionItem from './PlatformSubscriptionItem/index.js';

import dateUtil from 'utils/date';
import { isAPISuccess } from 'utils/helper';
import { platformSubscriptionStatuses } from 'utils/constants.js';

import styles from './styles.module.scss';

const {
  timeCalculation: { isBeforeDate },
} = dateUtil;

const { Title } = Typography;
const { Ribbon } = Badge;

const PlatformSubscriptionSettings = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isYearly, setIsYearly] = useState(true);
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

  const handlePlanChanged = useCallback((e) => {
    setIsYearly(e.target.value);
  }, []);

  const anyActiveSubscriptions = useMemo(() => {
    const activeSubscription =
      creatorPlatformSubscriptions.filter(
        (subs) =>
          subs.status !== platformSubscriptionStatuses.CANCELLED && isBeforeDate(subs.end_date) && !subs.cancelled_at
      ) ?? [];

    if (activeSubscription.length > 0) {
      return true;
    }

    return false;
  }, [creatorPlatformSubscriptions]);

  return (
    <div>
      <Spin spinning={isLoading} size="large">
        <Row gutter={[8, 8]}>
          {creatorPlatformSubscriptions.length > 0 ? (
            creatorPlatformSubscriptions.map((subs) => (
              <Col xs={24} md={12} xl={8} key={subs.subscription_id}>
                <PlatformSubscriptionItem platformSubscription={subs} />
              </Col>
            ))
          ) : (
            <Col xs={24}>
              <Empty description="You currently don't have any active paid subscription plan" />
            </Col>
          )}
        </Row>
        {(creatorPlatformSubscriptions.length === 0 || !anyActiveSubscriptions) && (
          <>
            <Row gutter={[8, 8]} align="middle" className={styles.mt20}>
              <Col xs={24} md={14}>
                <Title level={4}>Available Plans</Title>
              </Col>
              <Col xs={24} md={10} className={styles.toggleContainer}>
                <Ribbon className={styles.saveRibbon} text="Save 30%" color="green">
                  <Radio.Group size="large" value={isYearly} onChange={handlePlanChanged} buttonStyle="solid">
                    <Radio.Button value={false}>Billed Monthly</Radio.Button>
                    <Radio.Button value={true}>Billed Yearly</Radio.Button>
                  </Radio.Group>
                </Ribbon>
              </Col>
            </Row>
            <Row gutter={[12, 12]} className={styles.internalSubscriptionList}>
              {internalSubscriptionsData.map((intSubs) => (
                <Col xs={24} md={8} key={intSubs.name}>
                  <InternalSubscriptionItem
                    internalSubscription={intSubs}
                    isYearly={isYearly}
                    isActive={intSubs.name === 'Free'}
                  />
                </Col>
              ))}
            </Row>
          </>
        )}
      </Spin>
    </div>
  );
};

export default PlatformSubscriptionSettings;
