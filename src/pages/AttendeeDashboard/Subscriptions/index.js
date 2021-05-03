import React, { useState, useCallback, useEffect } from 'react';

import { Row, Col, Button, Typography, Space, Drawer, Collapse } from 'antd';
import { UpOutlined, DownOutlined } from '@ant-design/icons';

import apis from 'apis';

import Table from 'components/Table';
import VideoCard from 'components/VideoCard';
import SessionCards from 'components/SessionCards';
import { showErrorModal } from 'components/Modals/modals';

import { isAPISuccess } from 'utils/helper';
import { generateBaseCreditsText } from 'utils/subscriptions';
import { isMobileDevice } from 'utils/device';

import styles from './styles.module.scss';

const { Title, Text } = Typography;
const { Panel } = Collapse;

const Subscriptions = () => {
  const [isLoading, setIsLoading] = useState([]);
  const [subscriptionOrders, setSubscriptionOrders] = useState([]);
  const [expandedActiveRowKeys, setExpandedActiveRowKeys] = useState([]);
  const [expandedExpiredRowKeys, setExpandedExpiredRowKeys] = useState([]);

  const [detailsDrawerVisible, setDetailsDrawerVisible] = useState(false);
  const [selectedProductDetailsKey, setSelectedProductDetailsKey] = useState(null);
  const [selectedSubscription, setSelectedSubscription] = useState(null);

  const showProductsDetails = (subscription, productKey) => {
    console.log(subscription);
    setSelectedSubscription(subscription);
    setSelectedProductDetailsKey(productKey);
    setDetailsDrawerVisible(true);
  };

  const renderProductDetails = () => {
    if (selectedSubscription) {
      return selectedProductDetailsKey === 'SESSION' ? (
        <SessionCards
          sessions={selectedSubscription?.product_details['SESSION']}
          shouldFetchInventories={true}
          compactView={true}
        />
      ) : selectedProductDetailsKey === 'VIDEO' ? (
        <Row gutter={[8, 8]} justify="center">
          {selectedSubscription?.product_details['VIDEO'].map((video) => (
            <Col xs={24} key={video.external_id}>
              <VideoCard video={video} />
            </Col>
          ))}
        </Row>
      ) : (
        <Text disabled> No product details to show </Text>
      );
    } else {
      return null;
    }
  };

  const handleDrawerClose = (e) => {
    setSelectedSubscription(null);
    setSelectedProductDetailsKey(null);
    setDetailsDrawerVisible(false);
  };

  const fetchUserSubscriptionOrders = useCallback(async () => {
    setIsLoading(true);

    try {
      const { status, data } = await apis.subscriptions.getAttendeeSubscriptions();
      if (isAPISuccess(status) && data) {
        setSubscriptionOrders(data);
        if (data.active.length > 0) {
          setExpandedActiveRowKeys([data.active[0].subscription_order_id]);
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

  const toggleExpandAllActiveRow = () => {
    if (expandedActiveRowKeys.length > 0) {
      setExpandedActiveRowKeys([]);
    } else {
      setExpandedActiveRowKeys(
        subscriptionOrders.active.map((subscriptionOrder) => subscriptionOrder.subscription_order_id)
      );
    }
  };

  const expandActiveRow = (rowKey) => {
    const tempExpandedRowsArray = expandedActiveRowKeys;
    tempExpandedRowsArray.push(rowKey);
    setExpandedActiveRowKeys([...new Set(tempExpandedRowsArray)]);
  };

  const collapseActiveRow = (rowKey) => setExpandedActiveRowKeys(expandedActiveRowKeys.filter((key) => key !== rowKey));

  const toggleExpandAllExpiredRow = () => {
    if (expandedExpiredRowKeys.length > 0) {
      setExpandedExpiredRowKeys([]);
    } else {
      setExpandedExpiredRowKeys(
        subscriptionOrders.expired.map((subscriptionOrder) => subscriptionOrder.subscription_order_id)
      );
    }
  };

  const expandExpiredRow = (rowKey) => {
    const tempExpandedRowsArray = expandedExpiredRowKeys;
    tempExpandedRowsArray.push(rowKey);
    setExpandedExpiredRowKeys([...new Set(tempExpandedRowsArray)]);
  };

  const collapseExpiredRow = (rowKey) =>
    setExpandedExpiredRowKeys(expandedExpiredRowKeys.filter((key) => key !== rowKey));

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

  const generateSubscriptionColumns = (active) => [
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
        <Button
          block
          ghost
          type="primary"
          onClick={() => (active ? toggleExpandAllActiveRow() : toggleExpandAllExpiredRow())}
        >
          {(active && expandedActiveRowKeys.length > 0) || expandedExpiredRowKeys.length > 0 ? 'Collapse' : 'Expand'}{' '}
          All
        </Button>
      ),
      width: '200px',
      render: (text, record) => (
        <Row gutter={[8, 8]} justify="end">
          {active && (
            <Col>
              <Button danger type="link" onClick={() => cancelSubscription(record.subscription_order_id)}>
                Cancel
              </Button>
            </Col>
          )}
          <Col>
            <Button
              type="link"
              onClick={
                active
                  ? expandedActiveRowKeys.includes(record.subscription_order_id)
                    ? () => collapseActiveRow(record.subscription_order_id)
                    : () => expandActiveRow(record.subscription_order_id)
                  : expandedExpiredRowKeys.includes(record.subscription_order_id)
                  ? () => collapseExpiredRow(record.subscription_order_id)
                  : () => expandExpiredRow(record.subscription_order_id)
              }
            >
              Details{' '}
              {(active && expandedActiveRowKeys.includes(record.subscription_order_id)) ||
              expandedExpiredRowKeys.includes(record.subscription_order_id) ? (
                <UpOutlined />
              ) : (
                <DownOutlined />
              )}
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
                    <Button
                      onClick={() => showProductsDetails(subscription, key)}
                      key={`${subscription?.external_id}_${key}`}
                    >
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
          <Collapse defaultActiveKey="active">
            <Panel header={<Title level={5}> Active </Title>} key="active">
              <Table
                columns={generateSubscriptionColumns(true)}
                data={subscriptionOrders.active}
                loading={isLoading}
                rowKey={(record) => record.subscription_order_id}
                expandable={{
                  expandedRowRender: renderSubscriptionDetails,
                  expandRowByClick: true,
                  expandIconColumnIndex: -1,
                  expandedRowKeys: expandedActiveRowKeys,
                }}
              />
            </Panel>
            <Panel header={<Title level={5}> Expired </Title>} key="expired">
              <Table
                columns={generateSubscriptionColumns(false)}
                data={subscriptionOrders.expired}
                loading={isLoading}
                rowKey={(record) => record.subscription_order_id}
                expandable={{
                  expandedRowRender: renderSubscriptionDetails,
                  expandRowByClick: true,
                  expandIconColumnIndex: -1,
                  expandedRowKeys: expandedExpiredRowKeys,
                }}
              />
            </Panel>
          </Collapse>
        </Col>
      </Row>
      <Drawer
        title={`${selectedSubscription?.subscription_name} ${selectedProductDetailsKey?.toLowerCase()} details`}
        onClose={handleDrawerClose}
        visible={detailsDrawerVisible}
        width={isMobileDevice ? 320 : 520}
      >
        {renderProductDetails()}
      </Drawer>
    </div>
  );
};

export default Subscriptions;
