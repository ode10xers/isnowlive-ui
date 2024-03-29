import React, { useState, useCallback, useEffect } from 'react';

import { Row, Col, Card, Button, Typography, Space, Drawer, Collapse, Grid, Popconfirm } from 'antd';
import { UpOutlined, DownOutlined } from '@ant-design/icons';

import apis from 'apis';

import Table from 'components/Table';
import SessionListCard from 'components/DynamicProfileComponents/SessionsProfileComponent/SessionListCard';
import VideoListCard from 'components/DynamicProfileComponents/VideosProfileComponent/VideoListCard';
import { showErrorModal, showSuccessModal } from 'components/Modals/modals';

import dateUtil from 'utils/date';
import { orderType } from 'utils/constants';
import { generateBaseCreditsText, isUnlimitedMembership } from 'utils/subscriptions';
import { isAPISuccess, isUnapprovedUserError, preventDefaults } from 'utils/helper';

import styles from './styles.module.scss';
import CourseListItem from 'components/DynamicProfileComponents/CoursesProfileComponent/CoursesListItem';

const { Title, Text, Paragraph } = Typography;
const { useBreakpoint } = Grid;
const { Panel } = Collapse;
const {
  formatDate: { toLongDateWithDayTime, toShortDateWithYear },
} = dateUtil;

const Subscriptions = () => {
  const { lg } = useBreakpoint();
  const [isLoading, setIsLoading] = useState([]);
  const [subscriptionOrders, setSubscriptionOrders] = useState({
    active: [],
    expired: [],
  });
  const [expandedActiveRowKeys, setExpandedActiveRowKeys] = useState([]);
  const [expandedExpiredRowKeys, setExpandedExpiredRowKeys] = useState([]);

  const [detailsDrawerVisible, setDetailsDrawerVisible] = useState(false);
  const [selectedProductDetailsKey, setSelectedProductDetailsKey] = useState(null);
  const [selectedSubscription, setSelectedSubscription] = useState(null);

  const showProductsDetails = (subscription, productKey) => {
    setSelectedSubscription(subscription);
    setSelectedProductDetailsKey(productKey);
    setDetailsDrawerVisible(true);
  };

  const renderSessionList = (sessions = []) => (
    <Row gutter={[8, 10]}>
      {sessions.map((session) => (
        <Col xs={24} key={session.session_external_id}>
          <SessionListCard session={session} />
        </Col>
      ))}
    </Row>
  );

  const renderVideoList = (videos = []) => (
    <Row gutter={[8, 10]}>
      {videos.map((video) => (
        <Col xs={24} key={video.external_id}>
          <VideoListCard video={video} />
        </Col>
      ))}
    </Row>
  );

  const renderCourseList = (courses = []) => (
    <Row gutter={[8, 10]}>
      {courses.map((course) => (
        <Col xs={24} key={course.id}>
          <CourseListItem course={course} />
        </Col>
      ))}
    </Row>
  );

  const renderProductDetails = () => {
    if (selectedSubscription) {
      return selectedProductDetailsKey === 'SESSION' ? (
        renderSessionList(selectedSubscription?.product_details['SESSION'])
      ) : selectedProductDetailsKey === 'VIDEO' ? (
        renderVideoList(selectedSubscription?.product_details['VIDEO'])
      ) : selectedProductDetailsKey === 'COURSE' ? (
        renderCourseList(selectedSubscription?.product_details['COURSE'])
      ) : (
        <Text disabled> No product details to show </Text>
      );
    } else {
      return null;
    }
  };

  const handleDrawerClose = (e) => {
    preventDefaults(e);
    setSelectedSubscription(null);
    setSelectedProductDetailsKey(null);
    setDetailsDrawerVisible(false);
  };

  // TODO: Can put this to a generic helper
  const fetchSubscriptionUsageDetails = useCallback(async (data) => {
    let subscriptionOrdersArr = data;

    await Promise.all([
      ...data.active.map(async (activeSubscriptionOrder, idx) => {
        try {
          const [sessionUsageResponse, videoUsageResponse, courseUsageResponse] = await Promise.all([
            apis.subscriptions.getSubscriptionOrderUsageDetails(
              orderType.CLASS,
              activeSubscriptionOrder.subscription_order_id
            ),
            apis.subscriptions.getSubscriptionOrderUsageDetails(
              orderType.VIDEO,
              activeSubscriptionOrder.subscription_order_id
            ),
            apis.subscriptions.getSubscriptionOrderUsageDetails(
              orderType.COURSE,
              activeSubscriptionOrder.subscription_order_id
            ),
          ]);

          if (
            isAPISuccess(sessionUsageResponse.status) &&
            isAPISuccess(videoUsageResponse.status) &&
            isAPISuccess(courseUsageResponse.status)
          ) {
            subscriptionOrdersArr.active[idx]['usage_details'] = [
              ...(sessionUsageResponse.data || []),
              ...(videoUsageResponse.data || []),
              ...(courseUsageResponse.data || []),
            ];
          }
        } catch (error) {
          console.error(
            'Failed to fetch subscription usage for active subscription ',
            activeSubscriptionOrder.subscription_order_id
          );
        }
      }),
      ...data.expired.map(async (expiredSubscriptionOrder, idx) => {
        try {
          const [sessionUsageResponse, videoUsageResponse, courseUsageResponse] = await Promise.all([
            apis.subscriptions.getSubscriptionOrderUsageDetails(
              orderType.CLASS,
              expiredSubscriptionOrder.subscription_order_id
            ),
            apis.subscriptions.getSubscriptionOrderUsageDetails(
              orderType.VIDEO,
              expiredSubscriptionOrder.subscription_order_id
            ),
            apis.subscriptions.getSubscriptionOrderUsageDetails(
              orderType.COURSE,
              expiredSubscriptionOrder.subscription_order_id
            ),
          ]);

          if (
            isAPISuccess(sessionUsageResponse.status) &&
            isAPISuccess(videoUsageResponse.status) &&
            isAPISuccess(courseUsageResponse.status)
          ) {
            subscriptionOrdersArr.expired[idx]['usage_details'] = [
              ...(sessionUsageResponse.data || []),
              ...(videoUsageResponse.data || []),
              ...(courseUsageResponse.data || []),
            ];
          }
        } catch (error) {
          console.error(
            'Failed to fetch subscription usage for expired subscription ',
            expiredSubscriptionOrder.subscription_order_id
          );
        }
      }),
    ]);

    return subscriptionOrdersArr;
  }, []);

  const fetchUserSubscriptionOrders = useCallback(async () => {
    setIsLoading(true);

    try {
      const { status, data } = await apis.subscriptions.getAttendeeSubscriptions();
      if (isAPISuccess(status) && data) {
        setSubscriptionOrders(await fetchSubscriptionUsageDetails(data));
        if (data.active.length > 0) {
          setExpandedActiveRowKeys([data.active[0].subscription_order_id]);
        }
      }
    } catch (error) {
      if (!isUnapprovedUserError(error.response)) {
        showErrorModal(
          'Failed to fetch subscription orders',
          error?.response?.data?.message || 'Something wrong happened'
        );
      }
    }

    setIsLoading(false);
  }, [fetchSubscriptionUsageDetails]);

  const cancelSubscription = async (subscriptionOrder) => {
    if (subscriptionOrder.cancellation_date) {
      showErrorModal(
        'Subscription already cancelled',
        'You cannot cancel this subscription as it is already cancelled.'
      );
      return;
    }

    setIsLoading(true);
    const subscriptionOrderId = subscriptionOrder.subscription_order_id;

    try {
      const { status } = await apis.subscriptions.cancelSubscriptionOrder(subscriptionOrderId);

      if (isAPISuccess(status)) {
        showSuccessModal(
          'Subscription has been cancelled',
          <>
            <Paragraph>By cancelling, the subscription won't be renewed when it finally expires.</Paragraph>
            <Paragraph>
              However you can still use it as long as it's not expired and there's still enough credits.
            </Paragraph>
          </>
        );
        fetchUserSubscriptionOrders();
      }
    } catch (error) {
      if (!isUnapprovedUserError(error.response)) {
        showErrorModal(
          'Failed to cancel subscription order',
          error?.response?.data?.message || 'Something wrong happened'
        );
      }
    }

    setIsLoading(false);
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
  };

  const renderProductOrderType = (productOrderType) => {
    switch (productOrderType) {
      case orderType.CLASS:
        return 'Session';
      case orderType.VIDEO:
        return 'Video';
      case orderType.COURSE:
        return 'Course';
      default:
        return '';
    }
  };

  const renderRemainingCreditsForSubscription = (subscriptionOrder) => (
    <Space size="small" direction="vertical" align="left">
      {(subscriptionOrder.product_details['SESSION'] || subscriptionOrder.product_details['VIDEO']) &&
        generateRemainingCreditsText(subscriptionOrder, false)}
      {subscriptionOrder.product_details['COURSE'] && generateRemainingCreditsText(subscriptionOrder, true)}
    </Space>
  );

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
      render: (text, record) => renderRemainingCreditsForSubscription(record),
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
      width: '250px',
      render: (text, record) => (
        <Row gutter={[8, 8]} justify="end">
          {active && (
            <Col>
              {record.cancellation_date ? (
                <Button danger className={styles.dangerBtn} type="text" disabled>
                  {' '}
                  Cancelled on {toShortDateWithYear(record.cancellation_date)}{' '}
                </Button>
              ) : (
                <Popconfirm
                  arrowPointAtCenter
                  title={
                    <>
                      {' '}
                      <Paragraph> Are you sure about cancelling this subscription? </Paragraph>{' '}
                      <Paragraph>By cancelling, the subscription won't be renewed when it finally expires.</Paragraph>
                      <Paragraph>
                        However you can still use it as long as it's not expired and there's still enough credits.
                      </Paragraph>{' '}
                    </>
                  }
                  onConfirm={() => cancelSubscription(record)}
                  okText="Yes, cancel this subscription"
                  okButtonProps={{ danger: true, type: 'primary' }}
                  cancelText="No"
                  disabled={Boolean(record.cancellation_date)}
                >
                  <Button danger type="link" disabled={Boolean(record.cancellation_date)}>
                    Cancel
                  </Button>
                </Popconfirm>
              )}
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
      render: renderProductOrderType,
    },
    {
      title: 'Product Name',
      dataIndex: 'name',
      key: 'name',
      width: '220px',
    },
    {
      title: 'Date of Purchase',
      dataIndex: 'booking_time',
      key: 'booking_time',
      width: '150px',
      render: (text) => toLongDateWithDayTime(text),
    },
  ];

  const renderMobileSubscriptionUsageList = (subscriptionUsageList) => {
    const layout = (label, value) => (
      <Row>
        <Col span={9}>
          <Text strong>{label}</Text>
        </Col>
        <Col span={15}>: {value}</Col>
      </Row>
    );

    return subscriptionUsageList.map((subscriptionUsage) => (
      <Col xs={24} key={subscriptionUsage.order_id}>
        <Card title={subscriptionUsage.name} bodyStyle={{ padding: 10 }}>
          {layout('Product', renderProductOrderType(subscriptionUsage.type))}
          {layout('Buy Date', toLongDateWithDayTime(subscriptionUsage.booking_time))}
        </Card>
      </Col>
    ));
  };

  const renderSubscriptionDetails = (subscription, isActive) => {
    return (
      <div>
        <Row gutter={[8, 24]}>
          <Col xs={24}>
            <Title level={5}>Membership Details</Title>
          </Col>

          <Col xs={24}>
            <Text> Credits details: </Text>
          </Col>

          <Col xs={24} className={!lg ? undefined : styles.subSection}>
            <Space align="left">
              {(subscription.product_details['SESSION'] || subscription.product_details['VIDEO']) && (
                <Row gutter={[8, 8]}>
                  <Col xs={24}>
                    <div className={styles.baseCreditsText}>
                      {generateBaseCreditsText({ ...subscription, products: subscription.product_details }, false)}
                    </div>
                  </Col>
                </Row>
              )}
              {subscription.product_details['COURSE'] && (
                <Row gutter={[8, 8]}>
                  <Col xs={24}>
                    <div className={styles.baseCreditsText}>
                      {generateBaseCreditsText({ ...subscription, products: subscription.product_details }, true)}
                    </div>
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
              <Col xs={24} className={!lg ? undefined : styles.subSection}>
                <Space direction="horizontal">
                  {Object.entries(subscription?.product_details).map(([key, val]) => (
                    <Button
                      onClick={() => showProductsDetails(subscription, key)}
                      key={`${subscription?.external_id}_${key}`}
                    >
                      {val.length ?? 0} {key.toLowerCase()}s
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
                {!lg ? (
                  <Row gutter={[8, 8]} justify="center">
                    {renderMobileSubscriptionUsageList(subscription.usage_details, isActive)}
                  </Row>
                ) : (
                  <Table
                    columns={subscriptionUsageColumns}
                    data={subscription.usage_details}
                    rowKey={(record) => `${record.name}_${record.booking_time}`}
                  />
                )}
              </Col>
            </Row>
          </Col>
        </Row>
      </div>
    );
  };

  const generateMobileActionButtons = (subscriptionOrderDetails, isActive) => {
    let buttonsArr = [];

    if (isActive) {
      if (!subscriptionOrderDetails.cancellation_date) {
        buttonsArr.push(
          <Popconfirm
            title={
              <>
                {' '}
                <Paragraph> Are you sure about cancelling this subscription? </Paragraph>{' '}
                <Paragraph>By cancelling, the subscription won't be renewed when it finally expires.</Paragraph>
                <Paragraph>
                  However you can still use it as long as it's not expired and there's still enough credits.
                </Paragraph>{' '}
              </>
            }
            onConfirm={() => cancelSubscription(subscriptionOrderDetails)}
            okText="Yes, cancel this subscription"
            okButtonProps={{ danger: true, type: 'primary' }}
            cancelText="No"
            disabled={Boolean(subscriptionOrderDetails.cancellation_date)}
          >
            <Button danger type="link" disabled={Boolean(subscriptionOrderDetails.cancellation_date)}>
              Cancel
            </Button>
          </Popconfirm>
        );
      }

      buttonsArr.push(
        expandedActiveRowKeys.includes(subscriptionOrderDetails.subscription_order_id) ? (
          <Button type="link" onClick={() => collapseActiveRow(subscriptionOrderDetails.subscription_order_id)}>
            Details <UpOutlined />
          </Button>
        ) : (
          <Button type="link" onClick={() => expandActiveRow(subscriptionOrderDetails.subscription_order_id)}>
            Details <DownOutlined />
          </Button>
        )
      );
    } else {
      buttonsArr.push(
        expandedExpiredRowKeys.includes(subscriptionOrderDetails.subscription_order_id) ? (
          <Button type="link" onClick={() => collapseExpiredRow(subscriptionOrderDetails.subscription_order_id)}>
            Details <UpOutlined />
          </Button>
        ) : (
          <Button type="link" onClick={() => expandExpiredRow(subscriptionOrderDetails.subscription_order_id)}>
            Details <DownOutlined />
          </Button>
        )
      );
    }

    return buttonsArr;
  };

  const renderMobileSubscriptionOrderList = (subscriptionOrdersList, isActive) => {
    return subscriptionOrdersList.map((subscriptionOrder) => (
      <Col xs={24} key={subscriptionOrder.subscription_order_id}>
        <Card
          title={subscriptionOrder.subscription_name}
          actions={generateMobileActionButtons(subscriptionOrder, isActive)}
        >
          <Row gutter={[8, 8]}>
            {subscriptionOrder.cancellation_date && (
              <Col xs={24}>
                {' '}
                <Text type="danger">
                  {' '}
                  Cancelled on: {toShortDateWithYear(subscriptionOrder.cancellation_date)}{' '}
                </Text>{' '}
              </Col>
            )}
            <Col xs={24}>Remaining Credits:</Col>
            <Col xs={24}>{renderRemainingCreditsForSubscription(subscriptionOrder)}</Col>
          </Row>
        </Card>
        {((isActive && expandedActiveRowKeys.includes(subscriptionOrder.subscription_order_id)) ||
          expandedExpiredRowKeys.includes(subscriptionOrder.subscription_order_id)) && (
          <div className={styles.mobileSubscriptionDetailsWrapper}>
            {renderSubscriptionDetails(subscriptionOrder, isActive)}
          </div>
        )}
      </Col>
    ));
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
              {!lg ? (
                <Row gutter={[8, 8]}>
                  <Col xs={24}>
                    <Button block ghost type="primary" onClick={() => toggleExpandAllActiveRow()}>
                      {expandedActiveRowKeys.length > 0 ? 'Collapse' : 'Expand'} All
                    </Button>
                  </Col>
                  <Col xs={24}>
                    <Row gutter={[8, 8]} justify="center">
                      {renderMobileSubscriptionOrderList(subscriptionOrders.active, true)}
                    </Row>
                  </Col>
                </Row>
              ) : (
                <Table
                  columns={generateSubscriptionColumns(true)}
                  data={subscriptionOrders.active}
                  loading={isLoading}
                  rowKey={(record) => record.subscription_order_id}
                  expandable={{
                    expandedRowRender: (record) => renderSubscriptionDetails(record, true),
                    expandRowByClick: true,
                    expandIconColumnIndex: -1,
                    expandedRowKeys: expandedActiveRowKeys,
                  }}
                />
              )}
            </Panel>
            <Panel header={<Title level={5}> Expired </Title>} key="expired">
              {!lg ? (
                <Row gutter={[8, 8]}>
                  <Col xs={24}>
                    <Col xs={24}>
                      <Button block ghost type="primary" onClick={() => toggleExpandAllExpiredRow()}>
                        {expandedExpiredRowKeys.length > 0 ? 'Collapse' : 'Expand'} All
                      </Button>
                    </Col>
                  </Col>
                  <Col xs={24}>
                    <Row gutter={[8, 8]} justify="center">
                      {renderMobileSubscriptionOrderList(subscriptionOrders.expired, false)}
                    </Row>
                  </Col>
                </Row>
              ) : (
                <Table
                  columns={generateSubscriptionColumns(false)}
                  data={subscriptionOrders.expired}
                  loading={isLoading}
                  rowKey={(record) => record.subscription_order_id}
                  expandable={{
                    expandedRowRender: (record) => renderSubscriptionDetails(record, false),
                    expandRowByClick: true,
                    expandIconColumnIndex: -1,
                    expandedRowKeys: expandedExpiredRowKeys,
                  }}
                />
              )}
            </Panel>
          </Collapse>
        </Col>
      </Row>
      <Drawer
        title={`${selectedSubscription?.subscription_name} ${selectedProductDetailsKey?.toLowerCase()} details`}
        onClose={handleDrawerClose}
        visible={detailsDrawerVisible}
        width={!lg ? 320 : 520}
      >
        {renderProductDetails()}
      </Drawer>
    </div>
  );
};

export default Subscriptions;
