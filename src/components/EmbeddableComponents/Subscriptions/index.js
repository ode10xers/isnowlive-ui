import React, { useState, useEffect } from 'react';
import { Row, Col, Spin, Button, Typography, Divider, message } from 'antd';
import { CaretRightOutlined, CheckCircleFilled, UserOutlined } from '@ant-design/icons';

import apis from 'apis';
import Routes from 'routes';

import AuthModal from 'components/AuthModal';

import { isAPISuccess, getUsernameFromUrl, generateUrlFromUsername } from 'utils/helper';

import { useGlobalContext } from 'services/globalContext';

import styles from './style.module.scss';
import { generateBaseCreditsText } from 'utils/subscriptions';

const { Title } = Typography;

const NewSubscriptionItem = ({ subscription = null, onBuy, onDetails }) => {
  const subscriptionColor = subscription?.color_code ?? '#1890ff';

  const colorObj = {};

  return (
    <div className={styles.subscriptionItem}>
      <Row gutter={[8, 8]}>
        <Col xs={24}>
          <Title level={5} className={styles.subscriptionName}>
            {subscription?.name}
          </Title>
        </Col>
        <Col xs={24}>
          <Divider className={styles.subscriptionDivider} />
        </Col>
        <Col xs={24}>
          <Row gutter={[4, 4]}>
            <Col xs={24}>
              <CheckCircleFilled /> {subscription?.product_credits ?? 0} Credits
            </Col>
            <Col xs={24}>
              <CheckCircleFilled /> {generateBaseCreditsText(subscription, false)}
            </Col>
            <Col xs={24}>
              <CheckCircleFilled /> {subscription?.product_credits ?? 0} Credits
            </Col>
          </Row>
        </Col>
        <Col xs={24}>
          <Button className={styles.subscriptionBuyButton} type="primary" onClick={() => onBuy(subscription)}>
            BUY NOW | {subscription?.currency?.toUpperCase() ?? ''} {subscription?.total_price}
          </Button>
        </Col>
        <Col xs={24}>
          <Button className={styles.subscriptionDetailsButton} type="text" onClick={() => onDetails(subscription)}>
            View Details <CaretRightOutlined />
          </Button>
        </Col>
      </Row>
    </div>
  );
};

const Subscriptions = () => {
  const {
    state: { userDetails },
  } = useGlobalContext();

  const [isLoading, setIsLoading] = useState(false);
  const [subscriptions, setSubscriptions] = useState([]);

  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    const getSubscriptionDetails = async () => {
      setIsLoading(true);

      try {
        const { status, data } = await apis.subscriptions.getSubscriptionsByUsername();

        if (isAPISuccess(status) && data) {
          setSubscriptions(data.sort((a, b) => a.total_price - b.total_price));
        }
      } catch (error) {
        console.error(error);
        message.error(error?.response?.data?.message || 'Failed to fetch memberships');
      }
      setIsLoading(false);
    };

    getSubscriptionDetails();
  }, []);

  const closeAuthModal = () => {
    setShowAuthModal(false);
  };

  const redirectToAttendeeDashboard = () => {
    const baseUrl = generateUrlFromUsername(getUsernameFromUrl()) || 'app';
    window.open(`${baseUrl}${Routes.attendeeDashboard.rootPath + Routes.attendeeDashboard.dashboardPage}`, '_self');
  };

  const handleSignInClicked = () => {
    if (userDetails) {
      redirectToAttendeeDashboard();
    } else {
      setShowAuthModal(true);
    }
  };

  const subscriptionList = (
    <Row gutter={[8, 8]}>
      {subscriptions.map((subs) => (
        <Col xs={24} sm={12} md={8} lg={4} key={subs.external_id}>
          <NewSubscriptionItem subscription={subs} />
        </Col>
      ))}
    </Row>
  );

  return (
    <div className={styles.subscriptionPluginContainer}>
      <div className={styles.subscriptionListContainer}>
        <Spin spinning={isLoading} tip="Fetching memberships...">
          <AuthModal
            visible={showAuthModal}
            closeModal={closeAuthModal}
            onLoggedInCallback={redirectToAttendeeDashboard}
          />
          <Row gutter={[8, 12]} align="middle">
            <Col xs={24} className={styles.textAlignRight}>
              <Button
                className={styles.signupButton}
                type="primary"
                icon={<UserOutlined />}
                onClick={handleSignInClicked}
              >
                Sign In/Up
              </Button>
            </Col>
            <Col xs={24}>{subscriptionList}</Col>
          </Row>
        </Spin>
      </div>
    </div>
  );
};

export default Subscriptions;

/*
    <div className={styles.subscriptionPluginContainer}>
      <Row className={styles.mt20} gutter={[8, 16]}>
        <Col span={14}>
          <Title level={5}> Memberships </Title>
        </Col>
        <Col span={10}>
          <img src={logo} alt="Passion.do" className={styles.passionLogo} />
        </Col>
        <Col span={24}>
          <Loader loading={isLoading} size="large" text="Loading memberships...">
            <CreatorSubscriptions subscriptions={subscriptions} />
          </Loader>
        </Col>
      </Row>
    </div>
*/
