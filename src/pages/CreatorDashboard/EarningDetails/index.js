import React, { useEffect, useState, useCallback } from 'react';
import classNames from 'classnames';

import { Row, Col, Typography, Button, Card, Empty, message } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useHistory } from 'react-router-dom';

import apis from 'apis';
import Routes from 'routes';

import Table from 'components/Table';
import Loader from 'components/Loader';
import ShowAmount from 'components/ShowAmount';
import { showErrorModal } from 'components/Modals/modals';

import dateUtil from 'utils/date';
import { isMobileDevice } from 'utils/device';
import { isAPISuccess, getPaymentStatus } from 'utils/helper';

import { mixPanelEventTags, trackSimpleEvent } from 'services/integrations/mixpanel';

import styles from './styles.module.scss';

const { creator } = mixPanelEventTags;
const { Title, Text } = Typography;
const {
  formatDate: { toLongDateWithTime, toLongDateWithDay },
} = dateUtil;

const productDetails = {
  session: {
    productName: 'Session',
    earningsApi: apis.session.getEarningsByInventoryId,
  },
  video: {
    productName: 'Video',
    earningsApi: apis.videos.getEarningsByVideoId,
  },
  pass: {
    productName: 'Pass',
    earningsApi: apis.passes.getEarningsByPassId,
  },
  course: {
    productName: 'Course',
    earningsApi: apis.courses.getEarningsByCourseId,
  },
  subscription: {
    productName: 'Subscription',
    earningsApi: apis.subscriptions.getEarningsBySubscriptionId,
  },
};

const EarningDetails = ({ match }) => {
  const history = useHistory();
  const [isLoading, setIsLoading] = useState(false);
  const [earnings, setEarnings] = useState(null);

  const productType = match.params.productType;
  const productId = match.params.productId;

  const getEarningData = useCallback(async () => {
    setIsLoading(true);

    try {
      const { status, data } = await productDetails[productType].earningsApi(productId);

      if (isAPISuccess(status) && data) {
        setEarnings(data);
      }
    } catch (error) {
      showErrorModal(`Unable to fetch ${productDetails[productType]} earning details`);
    }

    setIsLoading(false);
  }, [productType, productId]);

  useEffect(() => {
    if (productType && productId && productDetails[productType]) {
      getEarningData();
    } else {
      message.error('Unable to find product earning details');
      setTimeout(() => {
        history.push(Routes.creatorDashboard.rootPath + Routes.creatorDashboard.paymentAccount);
      }, 1500);
    }
  }, [productType, productId, history, getEarningData]);

  const trackAndNavigate = (destination, eventTag) => {
    trackSimpleEvent(eventTag);
    history.push(destination);
  };

  const showProductLayout = (title, details) => (
    <div className={styles.box2}>
      <Row>
        <Col xs={24}>
          {' '}
          <Text type="secondary"> {title} </Text>{' '}
        </Col>
        <Col xs={24}> {details} </Col>
      </Row>
    </div>
  );

  const renderEarningDetails = () => (
    <>
      <Col xs={24} md={productType === 'session' ? 8 : 16}>
        {showProductLayout(
          `${productDetails[productType].productName} Name`,
          <Title level={isMobileDevice ? 5 : 3}> {earnings?.name} </Title>
        )}
      </Col>
      {productType === 'session' && (
        <Col xs={24} md={8}>
          {showProductLayout(
            'Session Day and Date',
            <Title level={isMobileDevice ? 5 : 3}> {toLongDateWithDay(earnings?.session_date) || '-'} </Title>
          )}
        </Col>
      )}
      <Col xs={24} md={8}>
        {showProductLayout(
          'Total Earnings',
          <ShowAmount amount={earnings?.total_earned} currency={earnings?.currency.toUpperCase()} />
        )}
      </Col>
    </>
  );

  const detailsColumns = [
    {
      title: 'Attendee Name',
      key: 'name',
      render: (record) => <Text className={styles.textAlignLeft}>{record.name}</Text>,
    },
    {
      title: 'Date',
      dataIndex: 'booking_time',
      key: 'booking_time',
      width: '200px',
      render: (text, record) => <Text>{toLongDateWithTime(record.booking_time)}</Text>,
    },
    {
      title: 'Amount',
      dataIndex: 'total_price',
      key: 'total_price',
      width: '120px',
      render: (text, record) => (
        <Text>
          {record.currency.toUpperCase()} {record.total_price}
        </Text>
      ),
    },
    {
      title: 'Fees',
      dataIndex: 'platform_fees',
      key: 'platform_fees',
      width: '120px',
      render: (text, record) => (
        <Text>
          {record.currency.toUpperCase()} {record.platform_fees}
        </Text>
      ),
    },
    {
      title: 'Net',
      dataIndex: 'net_price',
      key: 'net_price',
      width: '120px',
      render: (text, record) => (
        <Text>
          {record.currency.toUpperCase()} {record.net_price}
        </Text>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: '90px',
      render: (text, record) => <Text>{getPaymentStatus(record.status)}</Text>,
    },
  ];

  const renderMobileDetailsItem = (item) => {
    const layout = (label, value) => (
      <Row>
        <Col span={9}>
          <Text strong>{label}</Text>
        </Col>
        <Col span={15}>: {value}</Col>
      </Row>
    );

    return (
      <Card className={styles.card} title={<Text>{item.name}</Text>}>
        {layout('Date', <Text>{toLongDateWithTime(item.booking_time)}</Text>)}
        {layout(
          'Amount',
          <Text>
            {item.currency.toUpperCase()} {item.total_price}
          </Text>
        )}
        {layout(
          'Fees',
          <Text>
            {item.currency.toUpperCase()} {item.platform_fees}
          </Text>
        )}
        {layout(
          'Net',
          <Text>
            {item.currency.toUpperCase()} {item.net_price}
          </Text>
        )}
        {layout('Status', <Text>{getPaymentStatus(item.status)}</Text>)}
      </Card>
    );
  };

  return (
    <Loader loading={isLoading} size="large" text="Loading Earning Details">
      <div className={styles.box}>
        <Row justify="start" className={classNames(styles.mt20, styles.mb20)}>
          <Col xs={24} md={4}>
            <Button
              className={styles.headButton}
              onClick={() =>
                trackAndNavigate(
                  Routes.creatorDashboard.rootPath + Routes.creatorDashboard.paymentAccount,
                  creator.click.payment.backToEarningDashboard
                )
              }
              icon={<ArrowLeftOutlined />}
            >
              All Earnings
            </Button>
          </Col>
        </Row>
        <Row className={styles.mt50}>
          <Col xs={24} md={24}>
            <Title level={5}> {productDetails[productType].productName} Earning Details</Title>
          </Col>
          {renderEarningDetails()}
        </Row>
        <Row className={styles.mt50}>
          <Col xs={24} md={24}>
            <Title level={5}>Attendee Details</Title>
          </Col>
          <Col xs={24} md={24}>
            {isMobileDevice ? (
              <>
                {earnings?.details?.length > 0 ? (
                  earnings.details.map(renderMobileDetailsItem)
                ) : (
                  <div className={classNames(styles.textAlignCenter, 'text-empty')}>
                    <Empty />
                  </div>
                )}
              </>
            ) : (
              <Table
                columns={detailsColumns}
                data={earnings?.details}
                loading={isLoading}
                rowKey={(record) => `${record.name}_${record.booking_time}`}
              />
            )}
          </Col>
        </Row>
      </div>
    </Loader>
  );
};

export default EarningDetails;
