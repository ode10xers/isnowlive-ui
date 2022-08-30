import React, { useCallback, useState, useEffect } from 'react';

import { Row, Col, PageHeader, Space, Typography } from 'antd';

import apis from 'apis';

import Loader from 'components/Loader';
import Table from 'components/Table';
import { showErrorModal } from 'components/Modals/modals';

import dateUtil from 'utils/date';
import { isAPISuccess } from 'utils/helper';
import { isUnlimitedMembership } from 'utils/subscriptions';

import styles from './styles.module.scss';

const { Text } = Typography;
const {
  formatDate: { toShortDateWithYear },
} = dateUtil;

const SubscriptionMembersList = ({ history, match }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [subscriptionMembers, setSubscriptionMembers] = useState([]);
  const [subscriptionDetails, setSubscriptionDetails] = useState(null);

  const subscriptionId = match.params.subscription_id;

  const fetchSubscriptionDetails = useCallback(async (subscriptionExtId) => {
    try {
      const { status, data } = await apis.subscriptions.getSubscriptionById(subscriptionExtId);
      if (isAPISuccess(status) && data) {
        setSubscriptionDetails(data);
      }
    } catch (error) {
      showErrorModal('Failed to fetch membership details', error?.response?.data?.message ?? 'Something went wrong');
    }
  }, []);

  const fetchSubscriptionMembers = useCallback(async (subscriptionExtId) => {
    try {
      const { status, data } = await apis.subscriptions.getSubscriptionMembers(subscriptionExtId);
      if (isAPISuccess(status) && data.subscriptions) {
        setSubscriptionMembers(data.subscriptions);
      }
    } catch (error) {
      showErrorModal('Failed to fetch membership members', error?.response?.data?.message ?? 'Something went wrong');
    }
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
    if (subscriptionId) {
      Promise.allSettled([fetchSubscriptionMembers(subscriptionId), fetchSubscriptionDetails(subscriptionId)])
        .then(() => {
          setIsLoading(false);
        })
        .catch(() => {
          setIsLoading(false);
        });
    }
  }, [subscriptionId, fetchSubscriptionMembers, fetchSubscriptionDetails]);

  const generateRemainingCreditsText = useCallback((subscription, isCourse = false) => {
    let remainingCredits = 0;
    let totalCredits = 0;
    let isUnlimited = isUnlimitedMembership(subscription, isCourse);
    let productText = '';

    if (isCourse) {
      totalCredits = subscription?.course_credits ?? 0;
      remainingCredits = totalCredits - (subscription?.course_credits_used ?? 0);
      productText = 'Course';
    } else {
      totalCredits = subscription?.product_credits ?? 0;
      remainingCredits = totalCredits - (subscription?.product_credits_used ?? 0);
      productText = 'Session or Video';
    }

    return isUnlimited ? (
      <Text>Unlimited {productText}</Text>
    ) : (
      <Text>
        {remainingCredits}/{totalCredits} {productText} credits left
      </Text>
    );
  }, []);

  const renderRemainingCreditsForSubscription = useCallback(
    (subscriptionOrder) => (
      <Space size="small" direction="vertical" align="left">
        {(subscriptionOrder.product_details['SESSION'] || subscriptionOrder.product_details['VIDEO']) &&
          generateRemainingCreditsText(subscriptionOrder, false)}
        {subscriptionOrder.product_details['COURSE'] && generateRemainingCreditsText(subscriptionOrder, true)}
      </Space>
    ),
    [generateRemainingCreditsText]
  );

  const memberColumns = [
    {
      title: 'First Name',
      dataIndex: ['user_details', 'first_name'],
      width: '150px',
    },
    {
      title: 'Last Name',
      dataIndex: ['user_details', 'last_name'],
      width: '150px',
    },
    {
      title: 'Purchase/Renew Date',
      dataIndex: ['subscription_order', 'purchase_date'],
      render: (text) => (text ? toShortDateWithYear(text) : '-'),
    },
    {
      title: 'Expiry Date',
      dataIndex: ['subscription_order', 'expiry'],
      render: (text) => toShortDateWithYear(text),
    },
    {
      title: 'Remaining Credits',
      dataIndex: ['subscription_order', 'subscription_order_id'],
      render: (text, record) => renderRemainingCreditsForSubscription(record.subscription_order),
    },
  ];

  return (
    <div className={styles.box}>
      <Loader loading={isLoading}>
        <PageHeader
          onBack={() => history.goBack()}
          title={`${subscriptionDetails ? subscriptionDetails.name : 'Subscription'} Members`}
        />

        <Row gutter={[12, 12]}>
          <Col xs={24}>
            <Table
              columns={memberColumns}
              data={subscriptionMembers}
              loading={isLoading}
              rowKey={(record) => record.user_details.external_id}
            />
          </Col>
        </Row>
      </Loader>
    </div>
  );
};

export default SubscriptionMembersList;
