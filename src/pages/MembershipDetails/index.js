import React, { useState, useEffect, useCallback } from 'react';

import { Row, Col, Button, Spin, Typography, Card, message, Affix } from 'antd';
import { ArrowLeftOutlined, ScheduleTwoTone, PlayCircleTwoTone } from '@ant-design/icons';

import apis from 'apis';
import Routes from 'routes';

import AuthModal from 'components/AuthModal';
import VideoListView from 'components/DynamicProfileComponents/VideosProfileComponent/VideoListView';
import SubscriptionsListView from 'components/DynamicProfileComponents/SubscriptionsProfileComponent/SubscriptionListView';
import { showErrorModal, showPurchaseSubscriptionSuccessModal } from 'components/Modals/modals';

import dateUtil from 'utils/date';
import { generateBaseCreditsText } from 'utils/subscriptions';
import {
  getShadeForHexColor,
  preventDefaults,
  isAPISuccess,
  orderType,
  isUnapprovedUserError,
  productType,
} from 'utils/helper';

import styles from './style.module.scss';
import { useGlobalContext } from 'services/globalContext';

const { Title, Text } = Typography;

const {
  timezoneUtils: { getTimezoneLocation },
} = dateUtil;

const ContainerTitle = ({ title = '', icon = null }) => (
  <Text style={{ color: '#0050B3' }}>
    {icon}
    {title}
  </Text>
);

// TODO : Later we might want these colors to be customized
const cardHeadingStyle = {
  background: '#F1FBFF',
  boxShadow: 'inset 0px -1px 0px #E6F5FB',
  color: '#0050B3',
  borderRadius: '12px 12px 0 0',
};

const CardContainer = ({ cardHeader, children }) => (
  <Card {...cardHeader} className={styles.profileComponentContainer} bodyStyle={{ padding: 12 }}>
    {children}
  </Card>
);

const generateCardHeader = (title, icon) => ({
  title: <ContainerTitle title={title} icon={icon} />,
  headStyle: cardHeadingStyle,
});

const MembershipDetails = ({ match, history }) => {
  const { showPaymentPopup } = useGlobalContext();

  const [isLoading, setIsLoading] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [otherSubscriptions, setOtherSubscriptions] = useState([]);
  const [selectedSubscription, setSelectedSubscription] = useState(null);

  const fetchCreatorSubscriptions = useCallback(async (subscriptionId) => {
    setIsLoading(true);

    try {
      const { status, data } = await apis.subscriptions.getSubscriptionsByUsername();

      if (isAPISuccess(status) && data) {
        const sortedSubs = data.sort((a, b) => a.price - b.price);

        const targetSubsIndex = sortedSubs.findIndex((subs) => subs.external_id === subscriptionId);

        if (targetSubsIndex) {
          const targetSubscription = sortedSubs.splice(targetSubsIndex, 1)[0];

          setSelectedSubscription(targetSubscription);
        }

        setOtherSubscriptions(sortedSubs);
      }
    } catch (error) {
      console.error(error);
      console.error('Failed to load subscription details');
    }

    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (match.params.membership_id) {
      fetchCreatorSubscriptions(match.params.membership_id);
    }
  }, [fetchCreatorSubscriptions, match.params.membership_id]);

  //#region Start of Purchase Business Logic

  const showConfirmPaymentPopup = () => {
    if (!selectedSubscription) {
      showErrorModal('Something went wrong', 'Invalid Subscription Selected');
      return;
    }

    let itemDescription = [];

    itemDescription.push(generateBaseCreditsText(selectedSubscription, false));

    if (selectedSubscription.products['COURSE']) {
      itemDescription.push(generateBaseCreditsText(selectedSubscription, true));
    }

    const paymentPopupData = {
      productId: selectedSubscription.external_id,
      productType: productType.SUBSCRIPTION,
      itemList: [
        {
          name: selectedSubscription.name,
          description: itemDescription.join(', '),
          currency: selectedSubscription.currency,
          price: selectedSubscription.price,
        },
      ],
    };

    showPaymentPopup(paymentPopupData, createOrder);
  };

  const createOrder = async (couponCode = '') => {
    setIsLoading(true);
    try {
      const payload = {
        subscription_id: selectedSubscription.external_id,
        coupon_code: couponCode,
        user_timezone_location: getTimezoneLocation(),
      };

      const { status, data } = await apis.subscriptions.createOrderForUser(payload);

      if (isAPISuccess(status) && data) {
        setIsLoading(false);

        if (data.payment_required) {
          return {
            ...data,
            is_successful_order: true,
            payment_order_type: orderType.SUBSCRIPTION,
            payment_order_id: data.subscription_order_id,
          };
        } else {
          showPurchaseSubscriptionSuccessModal();
          return {
            ...data,
            is_successful_order: true,
          };
        }
      }
    } catch (error) {
      setIsLoading(false);
      if (error?.response?.status === 500 && error?.response?.data?.message === 'unable to apply discount to order') {
        showErrorModal(
          'Discount Code Not Applicable',
          'The discount code you entered is not applicable this product. Please try again with a different discount code'
        );
      } else if (!isUnapprovedUserError(error.response)) {
        message.error(error.response?.data?.message || 'Something went wrong');
      }
    }

    return {
      is_successful_order: false,
    };
  };

  //#endregion End of Purchase Business Logic

  //#region Start of UI Handlers

  const handleBackClicked = (e) => {
    preventDefaults(e);
    history.push(Routes.root);
  };

  const openPurchaseModal = (e) => {
    preventDefaults(e);
    setShowAuthModal(true);
  };

  const closePurchaseModal = () => {
    setShowAuthModal(false);
  };

  //#endregion End of UI Handlers

  //#region Start of UI Components

  const renderVideosComponent = (videos = []) =>
    videos.length > 0 ? (
      <CardContainer
        cardHeader={generateCardHeader(
          'VIDEO INCLUDED',
          <PlayCircleTwoTone className={styles.mr10} twoToneColor="#0050B3" />
        )}
      >
        <VideoListView videos={videos} />
      </CardContainer>
    ) : null;

  const otherSubscriptionsComponent = (
    <CardContainer
      cardHeader={generateCardHeader(
        'OTHER MEMBERSHIPS',
        <ScheduleTwoTone className={styles.mr10} twoToneColor="#0050B3" />
      )}
    >
      <SubscriptionsListView subscriptions={otherSubscriptions} />
    </CardContainer>
  );

  //#endregion End of UI Components

  return (
    <div className={styles.membershipDetailsContainer}>
      <AuthModal visible={showAuthModal} closeModal={closePurchaseModal} onLoggedInCallback={showConfirmPaymentPopup} />
      <Spin spinning={isLoading} tip="Fetching membership details..." size="large">
        <Row className={styles.mb30} gutter={[8, 16]} justify="center">
          {/* Membership Card */}
          {selectedSubscription && (
            <Col
              xs={24}
              style={{
                '--primary-color': `${selectedSubscription?.color_code ?? '#1890ff'}80`,
                '--primary-color-pale': `${selectedSubscription?.color_code ?? '#1890ff'}40`,
                '--secondary-color': getShadeForHexColor(selectedSubscription?.color_code ?? '#1890ff', 1),
                '--ternary-color': getShadeForHexColor(selectedSubscription?.color_code ?? '#1890ff', 2),
              }}
            >
              <Row className={styles.highlightedMembershipCard} gutter={[8, 8]} justify="end" align="bottom">
                <Col xs={24}>
                  <Title level={5} className={styles.highlightedMembershipName}>
                    {selectedSubscription?.name}
                  </Title>
                </Col>
                <Col xs={24}>
                  <Row gutter={8} align="bottom">
                    <Col xs={14} className={styles.highlightedMembershipDetails}>
                      {generateBaseCreditsText(selectedSubscription, false)}
                    </Col>
                    <Col xs={10} className={styles.highlightedMembershipPrice}>
                      {selectedSubscription?.currency?.toUpperCase()} {selectedSubscription?.price} / month
                    </Col>
                  </Row>
                </Col>
              </Row>
            </Col>
          )}

          {/* Sessions List */}

          <Col xs={24}>
            {/* Videos List */}
            {selectedSubscription?.product_details?.VIDEO &&
              renderVideosComponent(selectedSubscription?.product_details?.VIDEO)}
          </Col>

          <Col xs={24}>
            {/* Other Memberships List */}
            {otherSubscriptions.length > 0 && otherSubscriptionsComponent}
          </Col>
        </Row>
      </Spin>
      {/* Sticky Bottom Buy UI */}
      {selectedSubscription && (
        <Affix offsetBottom={0}>
          <div className={styles.stickyBottomBar}>
            <Row gutter={8} align="middle">
              <Col xs={3}>
                <Button
                  ghost
                  block
                  size="large"
                  type="primary"
                  onClick={handleBackClicked}
                  icon={<ArrowLeftOutlined />}
                />
              </Col>
              <Col xs={11}>
                <div className={styles.bottomBarPrice}>
                  {selectedSubscription?.currency?.toUpperCase()} {selectedSubscription?.price} / month
                </div>
              </Col>
              <Col xs={10}>
                <Button block size="large" type="primary" onClick={openPurchaseModal}>
                  SUBSCRIBE
                </Button>
              </Col>
            </Row>
          </div>
        </Affix>
      )}
    </div>
  );
};

export default MembershipDetails;
