import React, { useState, useEffect, useCallback } from 'react';
import classNames from 'classnames';
import { Row, Col, Typography, Button, Card, Empty, message, Popconfirm } from 'antd';
import { useHistory } from 'react-router-dom';

import apis from 'apis';
import Routes from 'routes';
import dateUtil from 'utils/date';
import Table from 'components/Table';
import Loader from 'components/Loader';
import ShowAmount from 'components/ShowAmount';
import { useGlobalContext } from 'services/globalContext';
import { isMobileDevice } from 'utils/device';
import { isAPISuccess, StripeAccountStatus } from 'utils/helper';

import {
  mixPanelEventTags,
  trackSimpleEvent,
  trackSuccessEvent,
  trackFailedEvent,
} from 'services/integrations/mixpanel';

import styles from './styles.module.scss';

const cashIcon = require('assets/images/cash.png');
const checkIcon = require('assets/images/check.png');
const timerIcon = require('assets/images/timer.png');

const { Title, Text } = Typography;
const {
  formatDate: { toLongDateWithDay },
} = dateUtil;
const { creator } = mixPanelEventTags;

const Earnings = () => {
  const history = useHistory();
  const [isLoading, setIsLoading] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [balance, setBalance] = useState(null);
  const [isLoadingPayout, setIsLoadingPayout] = useState(false);
  const {
    state: {
      userDetails: { payment_account_status = StripeAccountStatus.NOT_CONNECTED },
    },
  } = useGlobalContext();

  const [showMore, setShowMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const sessionPerPage = 10;

  const getEarningData = useCallback(async () => {
    try {
      setIsLoading(true);
      let [creatorEarningResponse, creatorBalanceResponse] = await Promise.all([
        apis.session.getCreatorEarnings(1, sessionPerPage), // did not add currentPage to remove the dependency else it will endup in infinite loop
        apis.session.getCreatorBalance(),
      ]);
      if (isAPISuccess(creatorEarningResponse.status) && isAPISuccess(creatorBalanceResponse.status)) {
        setIsLoading(false);
        setSessions(creatorEarningResponse.data.earnings);
        setShowMore(creatorEarningResponse.data.next_page || false);
        setBalance(creatorBalanceResponse.data);
      }
    } catch (error) {
      message.error(error.response?.data?.message || 'Something went wrong.');
      setIsLoading(false);
    }
  }, []);

  const handleShowMoreSession = async () => {
    const eventTag = creator.click.payment.showMoreEarnings;
    try {
      setIsLoading(true);
      let pageNo = currentPage + 1;
      const { status, data } = await apis.session.getCreatorEarnings(pageNo, sessionPerPage);
      if (isAPISuccess(status)) {
        trackSuccessEvent(eventTag);
        setIsLoading(false);
        setSessions([...sessions, ...data.earnings]);
        setCurrentPage(pageNo);
        setShowMore(data.next_page || false);
      }
    } catch (error) {
      trackFailedEvent(eventTag, error);
      message.error(error.response?.data?.message || 'Something went wrong.');
      setIsLoading(false);
    }
  };

  const openStripeDashboard = async () => {
    const eventTag = creator.click.payment.verifyBankAccount;

    try {
      setIsLoading(true);
      const { status, data } = await apis.payment.stripe.getDashboard();
      if (isAPISuccess(status) && data) {
        setIsLoading(false);
        trackSuccessEvent(eventTag);
        window.open(data.url, '_self');
      }
    } catch (error) {
      trackFailedEvent(eventTag, error);
      message.error(error.response?.data?.message || 'Something went wrong.');
      setIsLoading(false);
    }
  };

  useEffect(() => {
    getEarningData();
  }, [getEarningData]);

  const confirmPayout = async () => {
    const eventTag = creator.click.payment.requestPayout;
    try {
      setIsLoadingPayout(true);
      const { status } = await apis.session.createCreatorBalancePayout();
      if (isAPISuccess(status)) {
        trackSuccessEvent(eventTag);
        setIsLoadingPayout(false);
      }
    } catch (error) {
      trackFailedEvent(eventTag, error);
      message.error(error.response?.data?.message || 'Something went wrong.');
      setIsLoadingPayout(false);
    }
  };

  const availabeForPayout = (
    <div className={styles.box1}>
      <Row>
        <Col xs={24}>
          <Text className={styles.box1Text}>Availabe for Payout</Text>
        </Col>
        <Col xs={24} sm={12}>
          <ShowAmount amount={balance?.available} currency={balance?.currency} />
        </Col>
        <Col xs={24} xl={12}>
          {balance === null || balance?.available === 0 ? (
            <Button disabled type="primary">
              Request Payout
            </Button>
          ) : (
            <Popconfirm
              title="Are you sure to request payout?"
              onConfirm={confirmPayout}
              okText="Yes, Request Payout"
              cancelText="No"
            >
              <Button className={styles.box1Button} loading={isLoadingPayout}>
                {isLoadingPayout ? '...Requesting' : 'Request Payout'}
              </Button>
            </Popconfirm>
          )}
        </Col>
      </Row>
    </div>
  );

  const paymentBoxLayout = (title, titleClassName = null, titleType = 'default', amount, image) => (
    <div className={styles.box2}>
      <Row>
        <Col xs={24}>
          <Text className={titleClassName} type={titleType}>
            {title}
          </Text>
        </Col>
        <Col xs={18}>
          <ShowAmount amount={amount} currency={balance?.currency} />
        </Col>
        <Col xs={6}>
          <img src={image} height={40} alt="" />
        </Col>
      </Row>
    </div>
  );

  const totalAmountEarned = paymentBoxLayout(
    'Total Amount Earned ',
    styles.box2Text,
    'default',
    balance?.total_earned,
    cashIcon
  );

  const paidOut = paymentBoxLayout('Paid Out', null, 'success', balance?.paid_out, checkIcon);

  const inProcess = paymentBoxLayout('In Process', null, 'default', balance?.in_process, timerIcon);

  const stripePaymentDashboard = (
    <div className={styles.box2}>
      <Row>
        <Col xs={24}>
          <Text>Edit Bank Account</Text>
        </Col>
        <Col xs={24}>
          <Button
            className={styles.mt10}
            danger={payment_account_status === StripeAccountStatus.VERIFICATION_PENDING ? true : false}
            type="primary"
            onClick={() => openStripeDashboard()}
          >
            {payment_account_status === StripeAccountStatus.VERIFICATION_PENDING
              ? 'Verify Bank Account'
              : 'Edit Bank Account'}
          </Button>
        </Col>
      </Row>
    </div>
  );

  const openSessionDetails = (item) => {
    trackSimpleEvent(creator.click.payment.sessionEarnings, { session_data: item });
    if (item.inventory_id) {
      history.push(`${Routes.creatorDashboard.rootPath}/payments/${item.inventory_id}`);
    }
  };

  let sessionColumns = [
    {
      title: 'Session Name',
      key: 'name',
      width: '12%',
      render: (record) => <Text className={styles.textAlignLeft}>{record.name}</Text>,
    },
    {
      title: 'Session Date',
      dataIndex: 'session_date',
      key: 'session_date',
      width: '12%',
      render: (text, record) => <Text>{toLongDateWithDay(record.session_date)}</Text>,
    },
    {
      title: 'Earnings',
      dataIndex: 'total_earned',
      key: 'total_earned',
      width: '5%',
      render: (text, record) => (
        <Text>
          {record.currency} {record.total_earned}
        </Text>
      ),
    },
    {
      title: '',
      width: '10%',
      render: (text, record) => (
        <Row justify="start">
          <Col>
            <Button type="link" className={styles.detailsButton} onClick={() => openSessionDetails(record)}>
              Details
            </Button>
          </Col>
        </Row>
      ),
    },
  ];

  const renderSessionItem = (item) => {
    const layout = (label, value) => (
      <Row>
        <Col span={9}>
          <Text strong>{label}</Text>
        </Col>
        <Col span={15}>: {value}</Col>
      </Row>
    );

    return (
      <Card
        className={styles.card}
        title={
          <div onClick={() => openSessionDetails(item)}>
            <Text>{item.name}</Text>
          </div>
        }
        actions={[
          <Button type="link" className={styles.detailsButton} onClick={() => openSessionDetails(item)}>
            Details
          </Button>,
        ]}
      >
        {layout('Date', <Text>{toLongDateWithDay(item.session_date)}</Text>)}

        {layout(
          'Earnings',
          <Text>
            {item.currency} {item.total_earned}
          </Text>
        )}
      </Card>
    );
  };

  return (
    <Loader loading={isLoading} size="large" text="Loading Earning Details">
      <div className={styles.box}>
        <Row>
          <Col xs={24} md={8}>
            <Title level={2}>Your Earnings</Title>
          </Col>
          <Col xs={24} md={8}>
            {stripePaymentDashboard}
          </Col>
          <Col xs={24} md={8}>
            {availabeForPayout}
          </Col>
        </Row>
        <Row className={styles.mt20}>
          <Col xs={24} md={8}>
            {totalAmountEarned}
          </Col>
          <Col xs={24} md={8}>
            {paidOut}
          </Col>
          <Col xs={24} md={8}>
            {inProcess}
          </Col>
        </Row>
        <Row className={styles.mt20}>
          <Col span={24}>
            {isMobileDevice ? (
              <Loader loading={isLoading} size="large" text="Loading sessions">
                {sessions.length > 0 ? (
                  sessions.map(renderSessionItem)
                ) : (
                  <div className={classNames(styles.textAlignCenter, 'text-empty')}>
                    Sessions List
                    <Empty />
                  </div>
                )}
              </Loader>
            ) : (
              <Table columns={sessionColumns} data={sessions} loading={isLoading} />
            )}
          </Col>
          <Col span={24}>
            <Row justify="center" className={styles.mt50}>
              <Col>
                <Button onClick={() => handleShowMoreSession()} disabled={!showMore} className={styles.ml20}>
                  Show More
                </Button>
              </Col>
            </Row>
          </Col>
        </Row>
      </div>
    </Loader>
  );
};

export default Earnings;
