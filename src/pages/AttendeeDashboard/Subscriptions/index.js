import React, { useState, useCallback, useEffect } from 'react';

import { Row, Col, Button, Typography, Space } from 'antd';

import Table from 'components/Table';

import { showErrorModal } from 'components/Modals/modals';

import { isAPISuccess } from 'utils/helper';

import styles from './styles.module.scss';

const { Title } = Typography;

const Subscriptions = () => {
  const [isLoading, setIsLoading] = useState([]);
  const [subscriptionOrders, setSubscriptionOrders] = useState([]);

  const fetchUserSubscriptionOrders = useCallback(() => {
    setIsLoading(true);

    try {
      //TODO: Implement API Here later
      const { status, data } = {
        status: 200,
        data: [
          //TODO: Mock data here
          {
            subscription_order_id: 'qWeRtYuIoP',
            name: 'Mock membership name',
            credits: {
              SESSION: {
                remaining: 3,
                total: 10,
              },
              COURSE: {
                remaining: 2,
                total: 5,
              },
            },
          },
        ],
      };

      if (isAPISuccess(status) && data) {
        setSubscriptionOrders(data);
        setIsLoading(false);
      }
    } catch (error) {
      setIsLoading(false);
      showErrorModal(
        'Failed to fetch subscription orders',
        error?.response?.data?.message || 'Something wrong happened'
      );
    }

    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchUserSubscriptionOrders();
  }, [fetchUserSubscriptionOrders]);

  const cancelSubscription = (subscriptionOrderId) => {
    console.log(subscriptionOrderId);
  };

  const subscriptionColumns = [
    {
      title: 'Subscription Name',
      dataIndex: 'name',
      key: 'name',
      width: '200px',
    },
    {
      title: 'Status',
      dataIndex: 'credits',
      key: 'credits',
      width: '250px',
    },
    {
      title: '',
      width: '200px',
      render: (text, record) => (
        <Row gutter={[8, 8]} justify="end">
          <Col>
            <Button type="link" size="large">
              Details
            </Button>
          </Col>
          <Col>
            <Button danger type="link" size="large" onClick={() => cancelSubscription(record.subscription_order_id)}>
              Cancel
            </Button>
          </Col>
        </Row>
      ),
    },
  ];

  return (
    <div className={styles.box}>
      <Row gutter={[8, 8]}>
        <Col xs={24}>
          <Title level={4}> My Membership </Title>
        </Col>
        <Col xs={24}>
          <Table
            columns={subscriptionColumns}
            data={subscriptionOrders}
            loading={isLoading}
            rowKey={(record) => record.subscription_order_id}
          />
        </Col>
      </Row>
    </div>
  );
};

export default Subscriptions;
