import React, { useState, useEffect, useCallback } from 'react';
import classNames from 'classnames';
import { Row, Col, Typography, Button, Card, Empty, message, Popconfirm, Collapse } from 'antd';
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
const { Panel } = Collapse;
const {
  formatDate: { toLongDateWithDayTime },
} = dateUtil;
const { creator } = mixPanelEventTags;

const Earnings = () => {
  const history = useHistory();
  const {
    state: {
      userDetails: { payment_account_status = StripeAccountStatus.NOT_CONNECTED },
    },
  } = useGlobalContext();

  const [isLoading, setIsLoading] = useState(false);
  const [balance, setBalance] = useState(null);
  const [isLoadingPayout, setIsLoadingPayout] = useState(false);

  const [earnings, setEarnings] = useState({
    sessions: [],
    passes: [],
    videos: [],
    courses: [],
  });
  const [showMore, setShowMore] = useState({
    sessions: false,
    passes: false,
    videos: false,
    courses: false,
  });
  const [currentPage, setCurrentPage] = useState({
    sessions: 1,
    passes: 1,
    videos: 1,
    courses: 1,
  });
  const itemsPerPage = 10;

  const [expandedSection, setExpandedSection] = useState([]);

  const getEarningData = useCallback(async () => {
    try {
      setIsLoading(true);
      //TODO: Might want to separate them so that one failed call does not effect the other
      let [
        creatorInventoryEarningResponse,
        creatorVideoEarningResponse,
        creatorPassEarningResponse,
        creatorCourseEarningResponse,
        creatorBalanceResponse,
      ] = await Promise.all([
        apis.session.getCreatorInventoryEarnings(1, itemsPerPage), // did not add currentPage to remove the dependency else it will endup in infinite loop
        apis.videos.getCreatorVideosEarnings(1, itemsPerPage), // did not add currentPage to remove the dependency else it will endup in infinite loop
        apis.passes.getCreatorPassEarnings(1, itemsPerPage), // did not add currentPage to remove the dependency else it will endup in infinite loop
        apis.courses.getCreatorCourseEarnings(1, itemsPerPage), // did not add currentPage to remove the dependency else it will endup in infinite loop
        apis.session.getCreatorBalance(),
      ]);
      if (
        isAPISuccess(creatorInventoryEarningResponse.status) &&
        isAPISuccess(creatorVideoEarningResponse.status) &&
        isAPISuccess(creatorPassEarningResponse.status) &&
        isAPISuccess(creatorCourseEarningResponse.status) &&
        isAPISuccess(creatorBalanceResponse.status)
      ) {
        setIsLoading(false);
        setEarnings({
          sessions: creatorInventoryEarningResponse.data.earnings || [],
          passes: creatorPassEarningResponse.data.earnings || [],
          videos: creatorVideoEarningResponse.data.earnings || [],
          courses: creatorCourseEarningResponse.data.earnings || [],
        });

        setShowMore({
          sessions: creatorInventoryEarningResponse.data.next_page || false,
          passes: creatorPassEarningResponse.data.next_page || false,
          videos: creatorVideoEarningResponse.data.next_page || false,
          courses: creatorCourseEarningResponse.data.next_page || false,
        });

        setBalance(creatorBalanceResponse.data);
      }
    } catch (error) {
      if (error.response?.status !== 404) {
        message.error(error.response?.data?.message || 'Something went wrong.');
      }

      setIsLoading(false);
    }
  }, []);

  const handleShowMoreSession = async () => {
    const eventTag = creator.click.payment.showMoreEarnings;
    try {
      setIsLoading(true);
      let pageNo = currentPage['sessions'] + 1;
      const { status, data } = await apis.session.getCreatorInventoryEarnings(pageNo, itemsPerPage);
      if (isAPISuccess(status)) {
        trackSuccessEvent(eventTag);
        setIsLoading(false);

        setEarnings({
          ...earnings,
          sessions: [...earnings.sessions, ...data.earnings],
        });

        setCurrentPage({
          ...currentPage,
          sessions: pageNo,
        });

        setShowMore({
          ...showMore,
          sessions: data.next_page || false,
        });
      }
    } catch (error) {
      trackFailedEvent(eventTag, error);
      message.error(error.response?.data?.message || 'Something went wrong.');
      setIsLoading(false);
    }
  };

  const handleShowMorePasses = async () => {
    const eventTag = creator.click.payment.showMoreEarnings;
    try {
      setIsLoading(true);
      let pageNo = currentPage['passes'] + 1;
      const { status, data } = await apis.passes.getCreatorPassEarnings(pageNo, itemsPerPage);
      if (isAPISuccess(status)) {
        trackSuccessEvent(eventTag);
        setIsLoading(false);

        setEarnings({
          ...earnings,
          passes: [...earnings.passes, ...data.earnings],
        });

        setCurrentPage({
          ...currentPage,
          passes: pageNo,
        });

        setShowMore({
          ...showMore,
          passes: data.next_page || false,
        });
      }
    } catch (error) {
      trackFailedEvent(eventTag, error);
      message.error(error.response?.data?.message || 'Something went wrong.');
      setIsLoading(false);
    }
  };

  const handleShowMoreVideos = async () => {
    const eventTag = creator.click.payment.showMoreEarnings;

    try {
      setIsLoading(true);
      let pageNo = currentPage['videos'] + 1;
      const { status, data } = await apis.videos.getCreatorVideosEarnings(pageNo, itemsPerPage);
      if (isAPISuccess(status)) {
        trackSuccessEvent(eventTag);
        setIsLoading(false);

        setEarnings({
          ...earnings,
          videos: [...earnings.videos, ...data.earnings],
        });

        setCurrentPage({
          ...currentPage,
          videos: pageNo,
        });

        setShowMore({
          ...showMore,
          videos: data.next_page || false,
        });
      }
    } catch (error) {
      trackFailedEvent(eventTag, error);
      message.error(error.response?.data?.message || 'Something went wrong.');
      setIsLoading(false);
    }
  };

  const handleShowMoreCourses = async () => {
    try {
      setIsLoading(true);
      let pageNo = currentPage['courses'] + 1;
      const { status, data } = await apis.courses.getCreatorCourseEarnings(pageNo, itemsPerPage);
      if (isAPISuccess(status)) {
        setIsLoading(false);

        setEarnings({
          ...earnings,
          courses: [...earnings.courses, ...data.earnings],
        });

        setCurrentPage({
          ...currentPage,
          courses: pageNo,
        });

        setShowMore({
          ...showMore,
          courses: data.next_page || false,
        });
      }
    } catch (error) {
      message.error(error.response?.data?.message || 'Something went wrong.');
      setIsLoading(false);
    }
  };

  const relinkStripe = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data, status } = await apis.payment.stripe.relinkAccount();

      if (isAPISuccess(status) && data) {
        setIsLoading(false);
        window.open(data?.onboarding_url, '_self');
      }
    } catch (error) {
      message.error(error.response?.data?.message || 'Something went wrong.');
      setIsLoading(false);
    }
  }, []);

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
      if (
        error.response?.data?.code === 500 &&
        error.response?.data?.message === 'error while generating dashboard URL from stripe'
      ) {
        relinkStripe();
      } else {
        message.error(error.response?.data?.message || 'Something went wrong.');
      }
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
          <Text className={styles.box1Text}>Available for Payout</Text>
        </Col>
        <Col xs={24} sm={12}>
          <ShowAmount amount={balance?.available} currency={balance?.currency.toUpperCase()} />
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
          <ShowAmount amount={amount} currency={balance?.currency.toUpperCase()} />
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
    if (item?.inventory_id) {
      history.push(`${Routes.creatorDashboard.rootPath}/payments/inventory/${item.inventory_id}`);
    }
  };

  const openPassDetails = (item) => {
    if (item?.pass_id) {
      history.push(`${Routes.creatorDashboard.rootPath}/payments/pass/${item.pass_id}`);
    }
  };

  const openVideoDetails = (item) => {
    if (item?.video_id) {
      history.push(`${Routes.creatorDashboard.rootPath}/payments/video/${item.video_id}`);
    }
  };

  const openCourseDetails = (item) => {
    if (item?.course_id) {
      history.push(`${Routes.creatorDashboard.rootPath}/payments/course/${item.course_id}`);
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
      title: 'Session Date and Time',
      dataIndex: 'session_date',
      key: 'session_date',
      width: '12%',
      render: (text, record) => <Text>{toLongDateWithDayTime(record.session_date)}</Text>,
    },
    {
      title: 'Earnings',
      dataIndex: 'total_earned',
      key: 'total_earned',
      width: '5%',
      render: (text, record) => (
        <Text>
          {record.currency.toUpperCase()} {record.total_earned}
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
        {layout('Date', <Text>{toLongDateWithDayTime(item.session_date)}</Text>)}

        {layout(
          'Earnings',
          <Text>
            {item.currency.toUpperCase()} {item.total_earned}
          </Text>
        )}
      </Card>
    );
  };

  const generateEarningsColumns = (productName = 'Product', redirectToDetailsMethod = () => {}) => [
    {
      title: `${productName} Name`,
      key: 'name',
      dataIndex: 'name',
      align: 'left',
      width: '50%',
    },
    {
      title: 'Total Earned',
      key: 'total_earned',
      dataIndex: 'total_earned',
      align: 'right',
      width: '40%',
      render: (text, record) => `${record.currency?.toUpperCase()} ${record.total_earned}`,
    },
    {
      title: '',
      width: '10%',
      render: (text, record) => (
        <Row justify="start">
          <Col>
            <Button type="link" className={styles.detailsButton} onClick={() => redirectToDetailsMethod(record)}>
              Details
            </Button>
          </Col>
        </Row>
      ),
    },
  ];

  const renderMobileEarningsItem = (product, redirectToDetailsMethod = () => {}) => {
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
          <div onClick={() => redirectToDetailsMethod(product)}>
            <Text>{product?.name}</Text>
          </div>
        }
        actions={[
          <Button type="link" className={styles.detailsButton} onClick={() => redirectToDetailsMethod(product)}>
            Details
          </Button>,
        ]}
      >
        {layout(
          'Earnings',
          <Text>
            {product?.currency?.toUpperCase()} {product?.total_earned}
          </Text>
        )}
      </Card>
    );
  };
  /*
  let passColumns = [
    {
      title: 'Pass Name',
      key: 'name',
      dataIndex: 'name',
      align: 'left',
      width: '50%',
    },
    {
      title: 'Total Earned',
      key: 'total_earned',
      dataIndex: 'total_earned',
      align: 'right',
      width: '40%',
      render: (text, record) => `${record.total_earned} ${record.currency?.toUpperCase()}`,
    },
    {
      title: '',
      width: '10%',
      render: (text, record) => (
        <Row justify="start">
          <Col>
            <Button type="link" className={styles.detailsButton} onClick={() => openPassDetails(record)}>
              Details
            </Button>
          </Col>
        </Row>
      ),
    },
  ];
  const renderPassItem = (item) => {
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
          <div onClick={() => openPassDetails(item)}>
            <Text>{item.name}</Text>
          </div>
        }
        actions={[
          <Button type="link" className={styles.detailsButton} onClick={() => openPassDetails(item)}>
            Details
          </Button>,
        ]}
      >
        {layout(
          'Earnings',
          <Text>
            {item.currency.toUpperCase()} {item.total_earned}
          </Text>
        )}
      </Card>
    );
  };

  let videoColumns = [
    {
      title: 'Video Name',
      key: 'name',
      dataIndex: 'name',
      align: 'left',
      width: '50%',
    },
    {
      title: 'Total Earned',
      key: 'total_earned',
      dataIndex: 'total_earned',
      align: 'right',
      width: '40%',
      render: (text, record) => `${record.total_earned} ${record.currency?.toUpperCase()}`,
    },
    {
      title: '',
      width: '10%',
      render: (text, record) => (
        <Row justify="start">
          <Col>
            <Button type="link" className={styles.detailsButton} onClick={() => openVideoDetails(record)}>
              Details
            </Button>
          </Col>
        </Row>
      ),
    },
  ];

  const renderVideoItem = (item) => {
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
          <div onClick={() => openVideoDetails(item)}>
            <Text>{item.name}</Text>
          </div>
        }
        actions={[
          <Button type="link" className={styles.detailsButton} onClick={() => openVideoDetails(item)}>
            Details
          </Button>,
        ]}
      >
        {layout(
          'Earnings',
          <Text>
            {item.currency.toUpperCase()} {item.total_earned}
          </Text>
        )}
      </Card>
    );
  };
*/

  const productEarningsItems = [
    {
      name: 'Pass',
      key: 'pass_id',
      stateKey: 'passes',
      redirectMethod: openPassDetails,
      showMoreMethod: handleShowMorePasses,
    },
    {
      name: 'Video',
      key: 'video_id',
      stateKey: 'videos',
      redirectMethod: openVideoDetails,
      showMoreMethod: handleShowMoreVideos,
    },
    {
      name: 'Course',
      key: 'course_id',
      stateKey: 'courses',
      redirectMethod: openCourseDetails,
      showMoreMethod: handleShowMoreCourses,
    },
  ];

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
          <Col xs={24}>
            <Collapse activeKey={expandedSection} onChange={setExpandedSection}>
              <Panel header={<Title level={5}> Sessions Earnings </Title>} key="Sessions">
                <Row className={styles.mt10}>
                  <Col span={24}>
                    {isMobileDevice ? (
                      <Loader loading={isLoading} size="large" text="Loading sessions">
                        {earnings['sessions']?.length > 0 ? (
                          earnings['sessions']?.map(renderSessionItem)
                        ) : (
                          <div className={classNames(styles.textAlignCenter, 'text-empty')}>
                            Sessions List
                            <Empty />
                          </div>
                        )}
                      </Loader>
                    ) : (
                      <Table columns={sessionColumns} data={earnings['sessions']} loading={isLoading} />
                    )}
                  </Col>
                  <Col span={24}>
                    <Row justify="center" className={styles.mt50}>
                      <Col>
                        <Button
                          onClick={() => handleShowMoreSession()}
                          disabled={!showMore['sessions']}
                          className={styles.ml20}
                        >
                          Show More
                        </Button>
                      </Col>
                    </Row>
                  </Col>
                </Row>
              </Panel>
              {productEarningsItems?.map((productEarningsItem) => (
                <Panel
                  header={<Title level={5}> {productEarningsItem.name} Earnings </Title>}
                  key={productEarningsItem.name}
                >
                  <Row className={styles.mt10}>
                    <Col span={24}>
                      {isMobileDevice ? (
                        <Loader loading={isLoading} size="large" text={`Loading ${productEarningsItem?.name}`}>
                          {earnings[productEarningsItem?.stateKey]?.length > 0 ? (
                            earnings[productEarningsItem?.stateKey].map((productEarnings) =>
                              renderMobileEarningsItem(productEarnings, productEarningsItem?.redirectMethod)
                            )
                          ) : (
                            <div className={classNames(styles.textAlignCenter, 'text-empty')}>
                              {productEarningsItem?.name} List
                              <Empty />
                            </div>
                          )}
                        </Loader>
                      ) : (
                        <Table
                          columns={generateEarningsColumns(
                            productEarningsItem?.name,
                            productEarningsItem?.redirectMethod
                          )}
                          data={earnings[productEarningsItem?.stateKey]}
                          loading={isLoading}
                          rowKey={(record) => record[productEarningsItem?.key || 'id']}
                        />
                      )}
                    </Col>
                    <Col span={24}>
                      <Row justify="center" className={styles.mt50}>
                        <Col>
                          <Button
                            onClick={() => productEarningsItem?.showMoreMethod()}
                            disabled={!showMore[productEarningsItem?.stateKey]}
                            className={styles.ml20}
                          >
                            Show More
                          </Button>
                        </Col>
                      </Row>
                    </Col>
                  </Row>
                </Panel>
              ))}
            </Collapse>
          </Col>
        </Row>
      </div>
    </Loader>
  );
};

export default Earnings;

/*
              <Panel header={<Title level={5}> Pass </Title>} key="Pass">
                <Row className={styles.mt10}>
                  <Col span={24}>
                    {isMobileDevice ? (
                      <Loader loading={isLoading} size="large" text="Loading passes">
                        {passes.length > 0 ? (
                          passes.map(renderPassItem)
                        ) : (
                          <div className={classNames(styles.textAlignCenter, 'text-empty')}>
                            Pass List
                            <Empty />
                          </div>
                        )}
                      </Loader>
                    ) : (
                      <Table columns={passColumns} data={passes} loading={isLoading} />
                    )}
                  </Col>
                  <Col span={24}>
                    <Row justify="center" className={styles.mt50}>
                      <Col>
                        <Button
                          onClick={() => handleShowMorePasses()}
                          disabled={!showMorePasses}
                          className={styles.ml20}
                        >
                          Show More
                        </Button>
                      </Col>
                    </Row>
                  </Col>
                </Row>
              </Panel>
              <Panel header={<Title level={5}> Videos </Title>} key="Videos">
                <Row className={styles.mt10}>
                  <Col span={24}>
                    {isMobileDevice ? (
                      <Loader loading={isLoading} size="large" text="Loading videos">
                        {videos.length > 0 ? (
                          videos.map(renderVideoItem)
                        ) : (
                          <div className={classNames(styles.textAlignCenter, 'text-empty')}>
                            Videos List
                            <Empty />
                          </div>
                        )}
                      </Loader>
                    ) : (
                      <Table columns={videoColumns} data={videos} loading={isLoading} />
                    )}
                  </Col>
                  <Col span={24}>
                    <Row justify="center" className={styles.mt50}>
                      <Col>
                        <Button
                          onClick={() => handleShowMoreVideos()}
                          disabled={!showMoreVideos}
                          className={styles.ml20}
                        >
                          Show More
                        </Button>
                      </Col>
                    </Row>
                  </Col>
                </Row>
              </Panel>
*/
