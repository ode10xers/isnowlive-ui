import React, { useState, useCallback, useEffect } from 'react';

import { Row, Col, Button, Typography, Space } from 'antd';
import { UpOutlined, DownOutlined } from '@ant-design/icons';

import apis from 'apis';

import Table from 'components/Table';
import { showErrorModal } from 'components/Modals/modals';

import { isAPISuccess } from 'utils/helper';
import { generateBaseCreditsText } from 'utils/subscriptions';
import { isMobileDevice } from 'utils/device';

import styles from './styles.module.scss';

const { Title, Text } = Typography;

const Subscriptions = () => {
  const [isLoading, setIsLoading] = useState([]);
  const [subscriptionOrders, setSubscriptionOrders] = useState([]);
  const [expandedRowKeys, setExpandedRowKeys] = useState([]);

  const fetchUserSubscriptionOrders = useCallback(async () => {
    setIsLoading(true);

    try {
      const { status, data } = await apis.subscriptions.getAttendeeSubscriptions();
      if (isAPISuccess(status) && data) {
        setSubscriptionOrders(data.active);
        if (data.active.length > 0) {
          setExpandedRowKeys([data.active[0].subscription_order_id]);
        }
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

  const cancelSubscription = (subscriptionOrderId) => {
    console.log(subscriptionOrderId);
  };

  useEffect(() => {
    fetchUserSubscriptionOrders();
  }, [fetchUserSubscriptionOrders]);

  const toggleExpandAllRow = () => {
    if (expandedRowKeys.length > 0) {
      setExpandedRowKeys([]);
    } else {
      setExpandedRowKeys(subscriptionOrders.map((subscriptionOrder) => subscriptionOrder.subscription_order_id));
    }
  };

  const expandRow = (rowKey) => {
    const tempExpandedRowsArray = expandedRowKeys;
    tempExpandedRowsArray.push(rowKey);
    setExpandedRowKeys([...new Set(tempExpandedRowsArray)]);
  };

  const collapseRow = (rowKey) => setExpandedRowKeys(expandedRowKeys.filter((key) => key !== rowKey));

  const generateRemainingCreditsText = (subscription, isCourse = false) => {
    let remainingCredits = 0;
    let totalCredits = 0;

    if (isCourse) {
      remainingCredits = subscription?.products['COURSE']?.credits - subscription?.products['COURSE']?.credits_used;
      totalCredits = subscription?.products['COURSE']?.credits;
    } else {
      remainingCredits =
        (subscription?.products['SESSION']
          ? subscription?.products['SESSION']?.credits - subscription?.products['SESSION']?.credits_used
          : 0) +
        (subscription?.products['VIDEO']
          ? subscription?.products['VIDEO']?.credits - subscription?.products['VIDEO']?.credits_used
          : 0);
      totalCredits =
        (subscription?.products['SESSION']?.credits || 0) + (subscription?.products['VIDEO']?.credits || 0);
    }

    return (
      <Text>
        {remainingCredits}/{totalCredits} {isCourse ? 'Course' : 'Session or Video'} credits left
      </Text>
    );
  };

  const showProductsDetails = () => {};

  //TODO: Adjust the keys with the data format
  const generateSubscriptionColumns = () => [
    {
      title: 'Subscription Name',
      dataIndex: 'subscription_name',
      key: 'subscription_name',
      width: '200px',
    },
    {
      title: 'Status',
      width: '250px',
      render: (text, record) => (
        <Space size="small" direction="vertical" align="left">
          {generateRemainingCreditsText(record, false)}
          {record.products['COURSE'] && generateRemainingCreditsText(record, true)}
        </Space>
      ),
    },
    {
      title: (
        <Button block ghost type="primary" onClick={() => toggleExpandAllRow()}>
          {expandedRowKeys.length > 0 ? 'Collapse' : 'Expand'} All
        </Button>
      ),
      width: '200px',
      render: (text, record) => (
        <Row gutter={[8, 8]} justify="end">
          <Col>
            <Button danger type="link" onClick={() => cancelSubscription(record.subscription_order_id)}>
              Cancel
            </Button>
          </Col>
          <Col>
            <Button
              type="link"
              onClick={
                expandedRowKeys.includes(record.subscription_order_id)
                  ? () => collapseRow(record.subscription_order_id)
                  : () => expandRow(record.subscription_order_id)
              }
            >
              Details {expandedRowKeys.includes(record.subscription_order_id) ? <UpOutlined /> : <DownOutlined />}
            </Button>
          </Col>
        </Row>
      ),
    },
  ];

  const subscriptionUsageColumns = [
    {
      title: 'Product Type',
      dataIndex: 'type',
      key: 'type',
      width: '100px',
    },
    {
      title: 'Product Name',
      dataIndex: 'name',
      key: 'name',
      width: '220px',
    },
    {
      title: 'Date of Purchase',
      dataIndex: 'date_of_purchase',
      key: 'date_of_purchase',
      width: '150px',
    },
  ];

  // TODO: Confirm do we want to show it like in ShowcaseSubscriptionCards
  const renderSubscriptionDetails = (subscription) => {
    const subscriptionDetails = subscription;

    return (
      <div>
        <Row gutter={[8, 24]}>
          <Col xs={24}>
            <Title level={5}>Membership Details</Title>
          </Col>

          <Col xs={24}>
            <Text> Credits details: </Text>
          </Col>

          <Col xs={24} className={styles.subSection}>
            <Space align="left">
              <Row gutter={[8, 8]}>
                <Col xs={24}>
                  <div className={styles.baseCreditsText}>{generateBaseCreditsText(subscriptionDetails, false)}</div>
                </Col>
              </Row>
              {subscriptionDetails.products['COURSE'] && (
                <Row gutter={[8, 8]}>
                  <Col xs={24}>
                    <div className={styles.baseCreditsText}>{generateBaseCreditsText(subscriptionDetails, true)}</div>
                  </Col>
                </Row>
              )}
            </Space>
          </Col>

          <Col xs={24}>
            <Row gutter={[8, 4]}>
              <Col xs={24}>
                <Text> Usable for products: </Text>
              </Col>
              <Col xs={24} className={styles.subSection}>
                <Space direction={isMobileDevice ? 'vertical' : 'horizontal'}>
                  {Object.entries(subscription?.products).map(([key, val]) => (
                    <Button onClick={() => showProductsDetails(key)} key={`${subscription?.external_id}_${key}`}>
                      {' '}
                      {val.product_ids.length} {key.toLowerCase()}s{' '}
                    </Button>
                  ))}
                </Space>
              </Col>
            </Row>
          </Col>

          <Col xs={24}>
            <Row gutter={[8, 8]}>
              <Col xs={24}>
                <Title level={5}> Usage History </Title>
              </Col>
              <Col xs={24}>
                <Table
                  columns={subscriptionUsageColumns}
                  data={subscription.redemptions}
                  rowKey={(record) => `${record.name}_${record.date_of_purchase}`}
                />
              </Col>
            </Row>
          </Col>
        </Row>
      </div>
    );
  };

  return (
    <div className={styles.box}>
      <Row gutter={[8, 8]}>
        <Col xs={24}>
          <Title level={4}> My Membership </Title>
        </Col>
        <Col xs={24}>
          <Table
            columns={generateSubscriptionColumns()}
            data={subscriptionOrders}
            loading={isLoading}
            rowKey={(record) => record.subscription_order_id}
            expandable={{
              expandedRowRender: renderSubscriptionDetails,
              expandRowByClick: true,
              expandIconColumnIndex: -1,
              expandedRowKeys: expandedRowKeys,
            }}
          />
        </Col>
      </Row>
    </div>
  );
};

export default Subscriptions;
