import React, { useState, useEffect, useCallback } from 'react';
import classNames from 'classnames';
import { Row, Col, Typography, Button, Card, Empty, message, Popconfirm, Collapse, Modal, Input } from 'antd';
import { useHistory } from 'react-router-dom';

import apis from 'apis';
import Routes from 'routes';
import dateUtil from 'utils/date';
import Table from 'components/Table';
import Loader from 'components/Loader';
import ShowAmount from 'components/ShowAmount';
import { resetBodyStyle, showErrorModal, showSuccessModal } from 'components/Modals/modals';
import { isMobileDevice } from 'utils/device';
import { paymentProvider } from 'utils/constants';
import { isAPISuccess, preventDefaults, StripeAccountStatus } from 'utils/helper';

import {
  mixPanelEventTags,
  trackSimpleEvent,
  trackSuccessEvent,
  trackFailedEvent,
} from 'services/integrations/mixpanel';
import { useGlobalContext } from 'services/globalContext';
import { customNullValue, gtmTriggerEvents, pushToDataLayer } from 'services/integrations/googleTagManager';

import styles from './styles.module.scss';

const cashIcon = require('assets/images/cash.png');
const checkIcon = require('assets/images/check.png');
const timerIcon = require('assets/images/timer.png');

const { Title, Text, Paragraph } = Typography;
const { Panel } = Collapse;
const {
  formatDate: { toLongDateWithDayTime },
} = dateUtil;
const { creator } = mixPanelEventTags;

const getEarningsAPIs = {
  sessions: apis.session.getCreatorInventoryEarnings,
  passes: apis.passes.getCreatorPassEarnings,
  videos: apis.videos.getCreatorVideosEarnings,
  courses: apis.courses.getCreatorCourseEarnings,
  subscriptions: apis.subscriptions.getSubscriptionEarnings,
};

// TODO: Refactor the header/top section into separate component
// as it seems to handle more and more business logic
const Earnings = () => {
  const history = useHistory();
  const {
    state: { userDetails },
    setUserDetails,
  } = useGlobalContext();

  const [isLoading, setIsLoading] = useState(false);
  const [balance, setBalance] = useState(null);
  const [isLoadingPayout, setIsLoadingPayout] = useState(false);
  const [paypalAccountModalVisible, setPaypalAccountModalVisible] = useState(false);
  const [creatorPaypalAccountDetails, setCreatorPaypalAccountDetails] = useState(null);
  const [creatorPaypalEmail, setCreatorPaypalEmail] = useState(null);

  const [earnings, setEarnings] = useState({
    sessions: [],
    passes: [],
    videos: [],
    courses: [],
    subscriptions: [],
  });
  const [showMore, setShowMore] = useState({
    sessions: false,
    passes: false,
    videos: false,
    courses: false,
    subscriptions: false,
  });
  const [currentPage, setCurrentPage] = useState({
    sessions: 1,
    passes: 1,
    videos: 1,
    courses: 1,
    subscriptions: 1,
  });
  const itemsPerPage = 10;

  const [expandedSection, setExpandedSection] = useState([]);

  const getCreatorBalance = useCallback(async () => {
    setIsLoading(true);

    try {
      const { status, data } = await apis.session.getCreatorBalance();

      if (isAPISuccess(status) && data) {
        setBalance(data);
      }
    } catch (error) {
      message.error(error.response?.data?.message || 'Something went wrong.');
    }

    setIsLoading(false);
  }, []);

  const getCreatorEarnings = useCallback(() => {
    setIsLoading(true);

    Object.entries(getEarningsAPIs).map(async ([key, getEarningAPI]) => {
      try {
        const { status, data } = await getEarningAPI(1, itemsPerPage);

        if (isAPISuccess(status) && data) {
          setEarnings((currEarningsData) => ({
            ...currEarningsData,
            [key]: data.earnings || [],
          }));

          setShowMore((currShowMoreData) => ({
            ...currShowMoreData,
            [key]: data.next_page || false,
          }));
        }
      } catch (error) {
        message.error(error.response?.data?.message || `Something went wrong when fetching ${key} earning info`);
      }
    });

    setIsLoading(false);
  }, []);

  const handleShowMore = async (productName) => {
    const eventTag = creator.click.payment.showMoreEarnings;

    try {
      setIsLoading(true);
      let pageNo = currentPage[productName] + 1;
      const { status, data } = await getEarningsAPIs[productName](pageNo, itemsPerPage);
      if (isAPISuccess(status)) {
        trackSuccessEvent(eventTag);
        setIsLoading(false);

        setEarnings({
          ...earnings,
          [productName]: [...earnings[productName], ...data.earnings],
        });

        setCurrentPage({
          ...currentPage,
          [productName]: pageNo,
        });

        setShowMore({
          ...showMore,
          [productName]: data.next_page || false,
        });
      }
    } catch (error) {
      trackFailedEvent(eventTag, error);
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
      console.error(error);
      if (
        error.response?.data?.code === 500 &&
        error.response?.data?.message === 'error while generating dashboard URL from stripe'
      ) {
        // TODO: Add special handler here if selected country === IN (for India)

        relinkStripe();
      } else {
        message.error(error.response?.data?.message || 'Something went wrong.');
      }
      setIsLoading(false);
    }
  };

  const checkAndSendCreatorConversionEvent = useCallback(async () => {
    const userState = userDetails;

    if (userState.profile?.ga_data && userState.profile?.ga_data?.payment_verified === false) {
      try {
        const { status } = await apis.user.confirmCreatorPaymentStatusUpdated({
          payment_verified: true,
        });

        if (isAPISuccess(status)) {
          pushToDataLayer(gtmTriggerEvents.CREATOR_PAY_VERIFIED, {
            creator_payment_account_status: userDetails.profile?.payment_account_status,
          });
          userState.profile.ga_data.payment_verified = true;
          setUserDetails(userState);
        }
      } catch (error) {
        console.error(error?.response?.data?.message);
      }
    }
  }, [userDetails, setUserDetails]);

  const fetchCreatorPaypalDetails = useCallback(async () => {
    setIsLoading(true);

    try {
      const { status, data } = await apis.payment.paypal.getCreatorPayPalAccountDetails();

      if (isAPISuccess(status) && data) {
        setCreatorPaypalAccountDetails(data);
        setCreatorPaypalEmail(data?.email);
      }
    } catch (error) {
      console.error(error);
      showErrorModal(
        'Failed to fetch creator PayPal account details',
        error?.response?.data?.message || 'Something went wrong.'
      );
    }

    setIsLoading(false);
  }, []);

  useEffect(() => {
    getCreatorBalance();
    getCreatorEarnings();

    if (userDetails.profile?.payment_account_status === StripeAccountStatus.CONNECTED) {
      checkAndSendCreatorConversionEvent();
    } else {
      pushToDataLayer(gtmTriggerEvents.CREATOR_PAY_STATUS, {
        creator_payment_account_status: userDetails.profile?.payment_account_status || customNullValue,
      });
    }
  }, [getCreatorBalance, getCreatorEarnings, checkAndSendCreatorConversionEvent, userDetails]);

  useEffect(() => {
    if (userDetails.profile?.payment_provider === paymentProvider.PAYPAL) {
      fetchCreatorPaypalDetails();
    }
  }, [userDetails.profile.payment_provider, fetchCreatorPaypalDetails]);

  const confirmPayout = async () => {
    if (balance?.currency === 'inr') {
      message.error('Unable to request payout for indian account');
      return;
    }

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

  const availableForPayout = (
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
            danger={
              userDetails.profile?.payment_account_status === StripeAccountStatus.VERIFICATION_PENDING ? true : false
            }
            type="primary"
            onClick={() => openStripeDashboard()}
          >
            {userDetails.profile?.payment_account_status === StripeAccountStatus.VERIFICATION_PENDING
              ? 'Verify Bank Account'
              : 'Edit Bank Account'}
          </Button>
        </Col>
        {balance &&
          balance?.currency === 'inr' &&
          userDetails.profile?.payment_provider === paymentProvider.STRIPE &&
          userDetails.profile?.payment_account_status === StripeAccountStatus.VERIFICATION_PENDING && (
            <Col xs={24}>
              <Text type="secondary" className={styles.tipText}>
                Tip: Check your email and verify your stripe account to access and receive updates from Stripe
              </Text>
            </Col>
          )}
      </Row>
    </div>
  );

  const handleEditPaypalEmailClicked = (e) => {
    preventDefaults(e);
    setPaypalAccountModalVisible(true);
  };

  const updatePaypalAccount = async () => {
    setIsLoading(true);

    if (!creatorPaypalAccountDetails) {
      showErrorModal('Invalid PayPal Account detected!');
      return;
    }

    try {
      const payload = {
        country: creatorPaypalAccountDetails.country,
        currency: creatorPaypalAccountDetails.currency,
        email: creatorPaypalEmail,
      };

      const { status, data } = await apis.payment.paypal.updateCreatorPayPalAccount(payload);

      if (isAPISuccess(status) && data) {
        setPaypalAccountModalVisible(false);
        showSuccessModal('PayPal account updated successfully!');
        setTimeout(() => window.location.reload(), 1000);
      }
    } catch (error) {
      console.error(error);
      showErrorModal(
        'Failed to update creator PayPal account',
        error?.response?.data?.message || 'Something went wrong.'
      );
    }

    setIsLoading(false);
  };

  const handleConnectPaypalAccountClicked = () => {
    Modal.confirm({
      title: 'Confirm your PayPal email',
      content: (
        <>
          <Paragraph>Are you sure you want to use this email below to receive PayPal payments?</Paragraph>
          <Paragraph strong>{creatorPaypalEmail}</Paragraph>
        </>
      ),
      okText: 'Confirm',
      onOk: updatePaypalAccount,
    });
  };

  const paypalEditEmail = (
    <div className={styles.box2}>
      <Row>
        <Col xs={24}>
          <Text>Edit PayPal Email</Text>
        </Col>
        <Col xs={24}>
          <Button className={styles.mt10} type="primary" onClick={handleEditPaypalEmailClicked}>
            Edit Email
          </Button>
        </Col>
      </Row>
      <Modal
        centered={true}
        closable={true}
        visible={paypalAccountModalVisible}
        onCancel={() => setPaypalAccountModalVisible(false)}
        afterClose={resetBodyStyle}
        footer={null}
        title="Update your PayPal Email"
      >
        <Row gutter={[8, 8]}>
          <Col xs={24}>
            <Text>Please enter the new email to use with your PayPal Account.</Text>
          </Col>
          <Col xs={24}>
            <Text strong> Current Email : {creatorPaypalAccountDetails?.email} </Text>
          </Col>
          <Col xs={24}>
            <Input
              placeholder="The email associated with your PayPal Account"
              maxLength={50}
              onChange={(e) => setCreatorPaypalEmail(e.target.value)}
              value={creatorPaypalEmail}
            />
          </Col>
          <Col xs={24}>
            <Row justify="end">
              <Col>
                <Button type="primary" loading={isLoading} onClick={handleConnectPaypalAccountClicked}>
                  Update PayPal Account
                </Button>
              </Col>
            </Row>
          </Col>
        </Row>
      </Modal>
    </div>
  );

  const openSessionDetails = (item) => {
    trackSimpleEvent(creator.click.payment.sessionEarnings, { session_data: item });
    if (item?.inventory_id) {
      history.push(`${Routes.creatorDashboard.rootPath}/payments/session/${item.inventory_id}`);
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

  const openSubscriptionDetails = (item) => {
    if (item?.subscription_id) {
      history.push(`${Routes.creatorDashboard.rootPath}/payments/subscription/${item.subscription_id}`);
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

  const productEarningsItems = [
    {
      name: 'Pass',
      key: 'pass_id',
      stateKey: 'passes',
      redirectMethod: openPassDetails,
      showMoreMethod: () => handleShowMore('passes'),
    },
    {
      name: 'Video',
      key: 'video_id',
      stateKey: 'videos',
      redirectMethod: openVideoDetails,
      showMoreMethod: () => handleShowMore('videos'),
    },
    {
      name: 'Course',
      key: 'course_id',
      stateKey: 'courses',
      redirectMethod: openCourseDetails,
      showMoreMethod: () => handleShowMore('courses'),
    },
    {
      name: 'Membership',
      key: 'subscription_id',
      stateKey: 'subscriptions',
      redirectMethod: openSubscriptionDetails,
      showMoreMethod: () => handleShowMore('subscriptions'),
    },
  ];

  return (
    <Loader loading={isLoading} size="large" text="Loading Earning Details">
      <div className={styles.box}>
        <Row>
          <Col xs={24} lg={8}>
            <Title level={2}>Your Earnings</Title>
          </Col>
          <Col xs={24} lg={8}>
            {userDetails?.profile?.payment_provider === paymentProvider.PAYPAL
              ? paypalEditEmail
              : stripePaymentDashboard}
          </Col>
          <Col xs={24} lg={8}>
            {balance?.currency &&
              balance?.currency !== 'inr' &&
              userDetails?.profile?.payment_provider === paymentProvider.STRIPE &&
              availableForPayout}
          </Col>
        </Row>
        <Row className={styles.mt20}>
          <Col xs={24} lg={8}>
            {totalAmountEarned}
          </Col>
          <Col xs={24} lg={8}>
            {paidOut}
          </Col>
          <Col xs={24} lg={8}>
            {inProcess}
          </Col>
        </Row>
        {userDetails?.profile?.payment_provider === paymentProvider.PAYPAL && (
          <Row className={styles.mt10}>
            <Col xs={24}>
              <Paragraph type="secondary">
                The amount shown above might be different from the amount you can see for each product below. This is
                because it takes time (around 24 hours) to process the total amount from PayPal, which will be shown
                above.
              </Paragraph>
            </Col>
          </Row>
        )}
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
                          onClick={() => handleShowMore('sessions')}
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
