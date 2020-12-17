import React, { useState, useEffect } from 'react';
import classNames from 'classnames';
import { Row, Col, Typography, Button, Card, Empty, message, Popconfirm } from 'antd';
import { useHistory } from 'react-router-dom';

import apis from 'apis';
import Routes from 'routes';
import dateUtil from 'utils/date';
import Table from 'components/Table';
import Loader from 'components/Loader';
import ShowAmount from 'components/ShowAmount';
import { isMobileDevice } from 'utils/device';
import { isAPISuccess } from 'utils/helper';

import styles from './styles.module.scss';

const cashIcon = require('assets/images/cash.png');
const checkIcon = require('assets/images/check.png');
const timerIcon = require('assets/images/timer.png');

const { Title, Text } = Typography;
const {
  formatDate: { toLongDateWithDay },
} = dateUtil;

const Earnings = () => {
  const history = useHistory();
  const [isLoading, setIsLoading] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [balance, setBalance] = useState(null);
  const [isLoadingPayout, setIsLoadingPayout] = useState(false);

  const getEarningData = async () => {
    try {
      const creatorEarningResponse = await apis.session.getCreatorEarnings(1, 50);
      const creatorBalanceResponse = await apis.session.getCreatorBalance();
      if (isAPISuccess(creatorEarningResponse.status) && isAPISuccess(creatorBalanceResponse.status)) {
        setIsLoading(false);
        setSessions(creatorEarningResponse.data);
        setBalance(creatorBalanceResponse.data);
      }
    } catch (error) {
      message.error(error.response?.data?.message || 'Something went wrong.');
      setIsLoading(false);
    }
  };

  useEffect(() => {
    getEarningData();
  }, []);

  const confirmPayout = async () => {
    try {
      setIsLoadingPayout(true);
      const { status } = await apis.session.createCreatorBalancePayout();
      if (isAPISuccess(status)) {
        setIsLoadingPayout(false);
      }
    } catch (error) {
      message.error(error.response?.data?.message || 'Something went wrong.');
      setIsLoadingPayout(false);
    }
  };

  const availabeForPayout = () => {
    return (
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
  };

  const totalAmountEarned = () => {
    return (
      <div className={styles.box2}>
        <Row>
          <Col xs={24}>
            <Text className={styles.box2Text}>Total Amount Earned </Text>
          </Col>
          <Col xs={18}>
            <ShowAmount amount={balance?.total_earned} currency={balance?.currency} />
          </Col>
          <Col xs={6}>
            <img src={cashIcon} height={40} alt="" />
          </Col>
        </Row>
      </div>
    );
  };

  const paidOut = () => {
    return (
      <div className={styles.box2}>
        <Row>
          <Col xs={24}>
            <Text type="success">Paid Out</Text>
          </Col>
          <Col xs={18}>
            <ShowAmount amount={balance?.paid_out} currency={balance?.currency} />
          </Col>
          <Col xs={6}>
            <img src={checkIcon} height={40} alt="" />
          </Col>
        </Row>
      </div>
    );
  };

  const inProcess = () => {
    return (
      <div className={styles.box2}>
        <Row>
          <Col xs={24}>
            <Text>In Process</Text>
          </Col>
          <Col xs={18}>
            <ShowAmount amount={balance?.in_process} currency={balance?.currency} />
          </Col>
          <Col xs={6}>
            <img src={timerIcon} height={40} alt="" />
          </Col>
        </Row>
      </div>
    );
  };

  const openSessionDetails = (item) => {
    if (item.inventory_id) {
      history.push(`${Routes.creatorDashboard.rootPath}/earnings/${item.inventory_id}`);
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
            <Button className={styles.detailsButton} onClick={() => openSessionDetails(record)} type="link">
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
          <Button className={styles.detailsButton} onClick={() => openSessionDetails(item)} type="link">
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
          <Col xs={24} md={8}></Col>
          <Col xs={24} md={8}>
            {availabeForPayout()}
          </Col>
        </Row>
        <Row className={styles.mt20}>
          <Col xs={24} md={8}>
            {totalAmountEarned()}
          </Col>
          <Col xs={24} md={8}>
            {paidOut()}
          </Col>
          <Col xs={24} md={8}>
            {inProcess()}
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
        </Row>
      </div>
    </Loader>
  );
};

export default Earnings;
