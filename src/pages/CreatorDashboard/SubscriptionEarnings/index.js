import React, { useState, useEffect, useCallback } from 'react';
import classNames from 'classnames';
import { Row, Col, Typography, Button, Card, Empty, message } from 'antd';
import { useHistory } from 'react-router-dom';
import { ArrowLeftOutlined } from '@ant-design/icons';

import apis from 'apis';
import Routes from 'routes';
import dateUtil from 'utils/date';
import Table from 'components/Table';
import Loader from 'components/Loader';
import ShowAmount from 'components/ShowAmount';
import { isMobileDevice } from 'utils/device';
import { isAPISuccess, getPaymentStatus } from 'utils/helper';

import styles from './styles.module.scss';

const { Title, Text } = Typography;
const {
  formatDate: { toLongDateWithTime },
} = dateUtil;

const SubscriptionEarnings = ({ match }) => {
  const history = useHistory();
  const [isLoading, setIsLoading] = useState(true);
  const [earnings, setEarnings] = useState(null);

  const getEarningData = useCallback(
    async (subscription_id) => {
      try {
        const { status, data } = await apis.subscriptions.getEarningsBySubscriptionId(subscription_id);
        if (isAPISuccess(status)) {
          setIsLoading(false);
          setEarnings(data);
        }
      } catch (error) {
        message.error('Unable to fetch the subscription earning details');
        setTimeout(() => {
          history.push(Routes.creatorDashboard.rootPath + Routes.creatorDashboard.paymentAccount);
        }, 1500);
      }
    },
    [history]
  );

  useEffect(() => {
    if (match?.params?.subscription_id) {
      getEarningData(match?.params?.subscription_id);
    } else {
      message.error('Unable to find the subscription.');
      setTimeout(() => {
        history.push(Routes.creatorDashboard.rootPath + Routes.creatorDashboard.paymentAccount);
      }, 1500);
    }
  }, [getEarningData, history, match.params.subscription_id]);

  const showSubscriptionLayout = (title, details) => (
    <div className={styles.box2}>
      <Row>
        <Col xs={24}>
          <Text type="secondary">{title}</Text>
        </Col>
        <Col xs={24}>{details}</Col>
      </Row>
    </div>
  );

  const showSubscriptionName = showSubscriptionLayout(
    'Subscription Name',
    <Title level={isMobileDevice ? 5 : 3}>{earnings?.name}</Title>
  );

  const showSubscriptionEarnings = showSubscriptionLayout(
    'Total Earning',
    <ShowAmount amount={earnings?.total_earned} currency={earnings?.currency?.toUpperCase()} />
  );

  let subscriptionColumns = [
    {
      title: 'Attendee Name',
      key: 'name',
      width: '12%',
      render: (record) => <Text className={styles.textAlignLeft}>{record.name}</Text>,
    },
    {
      title: 'Date',
      dataIndex: 'booking_time',
      key: 'booking_time',
      width: '5%',
      render: (text, record) => <Text>{toLongDateWithTime(record.booking_time)}</Text>,
    },
    {
      title: 'Amount',
      dataIndex: 'total_price',
      key: 'total_price',
      width: '5%',
      render: (text, record) => (
        <Text>
          {record.currency?.toUpperCase()} {record.total_price}
        </Text>
      ),
    },
    {
      title: 'Fees',
      dataIndex: 'platform_fees',
      key: 'platform_fees',
      width: '5%',
      render: (text, record) => (
        <Text>
          {record.currency?.toUpperCase()} {record.platform_fees}
        </Text>
      ),
    },
    {
      title: 'Net Price',
      dataIndex: 'net_price',
      key: 'net_price',
      width: '5%',
      render: (text, record) => (
        <Text>
          {record.currency?.toUpperCase()} {record.net_price}
        </Text>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: '5%',
      render: (text, record) => <Text>{getPaymentStatus(record.status)}</Text>,
    },
  ];

  const renderSubscriptionItem = (item) => {
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
            {item.currency?.toUpperCase()} {item.total_price}
          </Text>
        )}
        {layout(
          'Fees',
          <Text>
            {item.currency?.toUpperCase()} {item.platform_fees}
          </Text>
        )}
        {layout(
          'Net',
          <Text>
            {item.currency?.toUpperCase()} {item.net_price}
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
              onClick={() => history.push(Routes.creatorDashboard.rootPath + Routes.creatorDashboard.paymentAccount)}
              icon={<ArrowLeftOutlined />}
            >
              All Earnings
            </Button>
          </Col>
        </Row>
        <Row className={styles.mt50}>
          <Col xs={24} md={24}>
            <Title level={5}>Subscription Earning Details</Title>
          </Col>
          <Col xs={24} md={16}>
            {showSubscriptionName}
          </Col>
          <Col xs={24} md={8}>
            {showSubscriptionEarnings}
          </Col>
        </Row>
        <Row className={styles.mt50}>
          <Col xs={24} md={24}>
            <Title level={5}>Attendee Details</Title>
          </Col>
          <Col xs={24} md={24}>
            {isMobileDevice ? (
              <>
                {earnings?.details?.length > 0 ? (
                  earnings.details.map(renderSubscriptionItem)
                ) : (
                  <div className={classNames(styles.textAlignCenter, 'text-empty')}>
                    <Empty />
                  </div>
                )}
              </>
            ) : (
              <Table columns={subscriptionColumns} data={earnings?.details} loading={isLoading} />
            )}
          </Col>
        </Row>
      </div>
    </Loader>
  );
};

export default SubscriptionEarnings;
