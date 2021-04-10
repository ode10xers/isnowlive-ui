import React, { useState, useCallback, useEffect } from 'react';

import { Row, Col, Button, Typography, Space } from 'antd';
import { UpOutlined, DownOutlined } from '@ant-design/icons';

import Table from 'components/Table';

import { showErrorModal } from 'components/Modals/modals';

import { isAPISuccess } from 'utils/helper';

import styles from './styles.module.scss';
import apis from 'apis';

const { Title, Text } = Typography;

//TODO: Might want to export to a helper file, since also used in CreatorSubscriptions
const productTextMapping = {
  SESSION: 'Sessions',
  VIDEO: 'Videos',
  COURSE: 'Courses',
};

const accessTypeTextMapping = {
  PUBLIC: 'Public',
  MEMBERSHIP: 'Membership',
};

const Subscriptions = () => {
  const [isLoading, setIsLoading] = useState([]);
  const [subscriptionOrders, setSubscriptionOrders] = useState([]);
  const [expandedRowKeys, setExpandedRowKeys] = useState([]);

  const fetchUserSubscriptionOrders = useCallback(async () => {
    setIsLoading(true);

    try {
      const { status, data } = await apis.subscriptions.getAttendeeSubscriptions();
      if (isAPISuccess(status) && data) {
        setSubscriptionOrders([]);
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

  //TODO: Implement when the API is done
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
      remainingCredits = subscription?.credits['COURSE']?.remaining;
      totalCredits = subscription?.credits['COURSE']?.total;
    } else {
      remainingCredits =
        (subscription?.credits['SESSION']?.remaining || 0) + (subscription?.credits['VIDEO']?.remaining || 0);
      totalCredits = (subscription?.credits['SESSION']?.total || 0) + (subscription?.credits['VIDEO']?.total || 0);
    }

    return (
      <Text>
        {remainingCredits}/{totalCredits} {isCourse ? 'Course' : 'Session or Video'} credits left
      </Text>
    );
  };

  //TODO: Consider exporting to helper, since also used in CreatorSubscriptions
  const generateBaseCreditsText = (subscription, isCourse = false) => {
    let calculatedBaseCredits = 0;

    if (isCourse) {
      calculatedBaseCredits = subscription?.products['COURSE']?.credits || 0;
    } else {
      calculatedBaseCredits =
        (subscription?.products['SESSION']?.credits || 0) + (subscription?.products['VIDEO']?.credits || 0);
    }

    return (
      <div className={styles.baseCreditsText}>
        {calculatedBaseCredits} {isCourse ? 'Course' : 'Session or Video'} credits / month
      </div>
    );
  };

  //TODO: Consider exporting to helper, since also used in CreatorSubscriptions
  const generateIncludedProducts = (subscription, isCourse = false) => {
    let productTexts = [];

    if (isCourse) {
      productTexts =
        subscription?.products['COURSE']?.access_types?.map(
          (accessType) => `${accessTypeTextMapping[accessType]} ${productTextMapping['COURSE']}`
        ) || [];
    } else {
      const excludedProductKeys = ['COURSE'];
      Object.entries(subscription?.products).forEach(([key, val]) => {
        if (!excludedProductKeys.includes(key)) {
          productTexts = [
            ...productTexts,
            ...val.access_types.map((accessType) => `${accessTypeTextMapping[accessType]} ${productTextMapping[key]}`),
          ];
        }
      });
    }

    return (
      <Space size="small" direction="vertical" align="left" className={styles.includedProductsList}>
        {productTexts.map((productText) => (
          <Text strong> {productText} </Text>
        ))}
      </Space>
    );
  };

  //TODO: Adjust the keys with the data format
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
      render: (text, record) => (
        <Space size="small" direction="vertical" align="left">
          {generateRemainingCreditsText(record, false)}
          {generateRemainingCreditsText(record, true)}
        </Space>
      ),
    },
    {
      title: '',
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

  const renderSubscriptionDetails = (subscription) => {
    const subscriptionDetails = subscription?.details;

    return (
      <div>
        <Row gutter={[8, 24]}>
          <Col xs={24}>
            <Title level={5}>Membership Details</Title>
          </Col>

          <Col xs={24}>
            <Space align="left">
              <Row gutter={[8, 8]}>
                <Col xs={24}>
                  <Text strong> {generateBaseCreditsText(subscriptionDetails, false)} </Text>
                </Col>
                <Col xs={24} className={styles.includeTextWrapper}>
                  <Text disabled> Includes access to </Text>
                </Col>
                <Col xs={24}>{generateIncludedProducts(subscriptionDetails, false)}</Col>
              </Row>
              {subscriptionDetails.products['COURSE'] && (
                <Row gutter={[8, 8]}>
                  <Col xs={24}>
                    <Text strong> {generateBaseCreditsText(subscriptionDetails, true)} </Text>
                  </Col>
                  <Col xs={24} className={styles.includeTextWrapper}>
                    <Text disabled> Includes access to </Text>
                  </Col>
                  <Col xs={24}>{generateIncludedProducts(subscriptionDetails, true)}</Col>
                </Row>
              )}
            </Space>
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
        <Col xs={24} md={12} lg={16}>
          <Title level={4}> My Membership </Title>
        </Col>
        <Col xs={24} md={12} lg={8}>
          <Button block type="primary" shape="round" onClick={() => toggleExpandAllRow()}>
            {expandedRowKeys.length > 0 ? 'Collapse' : 'Expand'} All
          </Button>
        </Col>
        <Col xs={24}>
          <Table
            columns={subscriptionColumns}
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
