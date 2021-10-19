import React, { useState, useCallback } from 'react';
import classNames from 'classnames';

import { Row, Col, Spin, Button, Space, Popconfirm, Typography, message } from 'antd';

import apis from 'apis';

import { showErrorModal } from 'components/Modals/modals';

import dateUtil from 'utils/date';
import { isAPISuccess } from 'utils/helper';
import { platformSubscriptionStatuses } from 'utils/constants.js';

import styles from './style.module.scss';

const { Title, Text } = Typography;
const {
  formatDate: { toLocaleDate },
} = dateUtil;

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
      case platformSubscriptionStatuses.SUCCESS:
        return styles.active;
      case platformSubscriptionStatuses.CANCELLED:
        return styles.inactive;
      case platformSubscriptionStatuses.TRIAL:
        return undefined;
      default:
        return undefined;
    }
  };

  const getSubscriptionStatus = (status) => {
    switch (status) {
      case platformSubscriptionStatuses.ACTIVE:
      case platformSubscriptionStatuses.SUCCESS:
        return 'Active';
      case platformSubscriptionStatuses.CANCELLED:
        return 'Cancelled';
      case platformSubscriptionStatuses.TRIAL:
        return 'In Trial';
      case platformSubscriptionStatuses.PENDING:
        return 'Payment Pending';
      default:
        return '';
    }
  };

  return platformSubscription ? (
    <div className={styles.platformSubscriptionItem}>
      <Spin spinning={isSubmitting}>
        <div className={classNames(styles.statusTag, getStatusClass(platformSubscription.status))}>
          {getSubscriptionStatus(platformSubscription.status)}
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
                <Text className={styles.itemHelpText}>{platformSubscription?.currency?.toUpperCase() ?? ''} </Text>
                <Text strong className={styles.itemPriceText}>
                  {platformSubscription?.total_price ?? ''}
                </Text>
                <Text className={styles.itemHelpText}>/{platformSubscription?.interval ?? ''}</Text>
              </Col>
            </Row>
          </Col>
          <Col xs={24}>
            <Row gutter={[8, 8]} align="middle">
              <Col flex="1 1 auto">
                <Space>
                  {platformSubscription?.status !== platformSubscriptionStatuses.CANCELLED ? (
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
                  ) : platformSubscription?.cancelled_at ? (
                    <Button disabled={true} size="small" type="text">
                      Cancelled at : {toLocaleDate(platformSubscription?.cancelled_at)}
                    </Button>
                  ) : null}
                </Space>
              </Col>
              <Col flex="0 0 140px" className={styles.textAlignRight}>
                <Text className={styles.itemHelpText}>Valid till </Text>
                <Text strong className={styles.itemDurationText}>
                  {toLocaleDate(platformSubscription.end_date)}
                </Text>
              </Col>
            </Row>
          </Col>
        </Row>
      </Spin>
    </div>
  ) : null;
};

export default PlatformSubscriptionItem;
