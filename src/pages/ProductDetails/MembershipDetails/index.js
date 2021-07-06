import React, { useState, useEffect, useCallback } from 'react';

import { Row, Col, Button, Spin, Typography, message, Affix, Drawer } from 'antd';
import { ArrowLeftOutlined, ScheduleTwoTone, PlayCircleTwoTone, VideoCameraTwoTone } from '@ant-design/icons';

import apis from 'apis';
import Routes from 'routes';

import AuthModal from 'components/AuthModal';
import ContainerCard, { generateCardHeadingStyle } from 'components/ContainerCard';
import VideoListCard from 'components/DynamicProfileComponents/VideosProfileComponent/VideoListCard';
import SessionListCard from 'components/DynamicProfileComponents/SessionsProfileComponent/SessionListCard';
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

const MembershipDetails = ({ match, history }) => {
  const membershipId = match.params.membership_id;

  const { showPaymentPopup } = useGlobalContext();

  const [isLoading, setIsLoading] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [otherSubscriptions, setOtherSubscriptions] = useState([]);
  const [selectedSubscription, setSelectedSubscription] = useState(null);

  const [moreView, setMoreView] = useState('sessions');
  const [bottomSheetsVisible, setBottomSheetsVisible] = useState(false);

  const fetchCreatorSubscriptions = useCallback(async (subscriptionId = null) => {
    setIsLoading(true);

    try {
      const { status, data } = await apis.subscriptions.getSubscriptionsByUsername();

      if (isAPISuccess(status) && data) {
        const sortedSubs = data.sort((a, b) => a.total_price - b.total_price);

        const targetSubsIndex = sortedSubs.findIndex((subs) => subs.external_id === subscriptionId);

        if (targetSubsIndex >= 0) {
          const targetSubscription = sortedSubs.splice(targetSubsIndex, 1)[0];

          setSelectedSubscription(targetSubscription);
        }

        setOtherSubscriptions(sortedSubs);
      }
    } catch (error) {
      console.error(error);
      message.error(error?.response?.data?.message || 'Failed to load subscription details');
    }

    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchCreatorSubscriptions(membershipId);
  }, [fetchCreatorSubscriptions, membershipId]);

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
          price: selectedSubscription.total_price,
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

  const closeAuthModal = () => {
    setShowAuthModal(false);
  };

  const handleMoreSessionsClicked = (e) => {
    preventDefaults(e);

    setMoreView('sessions');
    setBottomSheetsVisible(true);
  };

  const handleMoreVideoClicked = (e) => {
    preventDefaults(e);

    setMoreView('videos');
    setBottomSheetsVisible(true);
  };

  const handleCloseBottomSheets = () => {
    setBottomSheetsVisible(false);
  };

  //#endregion End of UI Handlers

  //#region Start of UI Components

  const renderSessionCards = (session) => (
    <Col xs={24} sm={12} key={session.session_external_id}>
      <SessionListCard session={session} />
    </Col>
  );

  const renderSessionsComponent = (sessions = []) =>
    sessions.length > 0 ? (
      <ContainerCard
        title="SESSIONS INCLUDED"
        icon={<VideoCameraTwoTone className={styles.mr10} twoToneColor="#0050B3" />}
      >
        <Row gutter={[16, 16]}>
          {sessions.slice(0, 2).map(renderSessionCards)}
          {sessions?.length > 2 && (
            <Col xs={24}>
              <Row justify="center">
                <Col>
                  <Button size="large" type="primary" onClick={handleMoreSessionsClicked}>
                    MORE
                  </Button>
                </Col>
              </Row>
            </Col>
          )}
        </Row>
      </ContainerCard>
    ) : null;

  const renderVideoCards = (video) => (
    <Col xs={24} sm={12} key={video.external_id}>
      <VideoListCard video={video} />
    </Col>
  );

  const renderVideosComponent = (videos = []) =>
    videos.length > 0 ? (
      <ContainerCard
        title="VIDEOS INCLUDED"
        icon={<PlayCircleTwoTone className={styles.mr10} twoToneColor="#0050B3" />}
      >
        <Row gutter={[16, 16]}>
          {videos.slice(0, 2).map(renderVideoCards)}
          {videos?.length > 2 && (
            <Col xs={24}>
              <Row justify="center">
                <Col>
                  <Button size="large" type="primary" onClick={handleMoreVideoClicked}>
                    MORE
                  </Button>
                </Col>
              </Row>
            </Col>
          )}
        </Row>
      </ContainerCard>
    ) : null;

  const otherSubscriptionsComponent = (
    <ContainerCard title="OTHER MEMBERSHIPS" icon={<ScheduleTwoTone className={styles.mr10} twoToneColor="#0050B3" />}>
      <SubscriptionsListView subscriptions={otherSubscriptions} />
    </ContainerCard>
  );

  const moreVideosListView = (
    <Row gutter={[16, 16]}>{selectedSubscription?.product_details?.VIDEO?.map(renderVideoCards)}</Row>
  );

  const moreSessionsListView = (
    <Row gutter={[16, 16]}>{selectedSubscription?.product_details?.SESSION?.map(renderSessionCards)}</Row>
  );

  //#endregion End of UI Components

  return (
    <div className={styles.membershipDetailsContainer}>
      <AuthModal visible={showAuthModal} closeModal={closeAuthModal} onLoggedInCallback={showConfirmPaymentPopup} />
      <Spin spinning={isLoading} tip="Fetching membership details..." size="large">
        <div className={styles.pageContent}>
          <Row gutter={[8, 16]} justify="center">
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
                        {selectedSubscription?.currency?.toUpperCase()} {selectedSubscription?.total_price} /{' '}
                        {selectedSubscription?.validity} days
                      </Col>
                    </Row>
                  </Col>
                </Row>
              </Col>
            )}

            {/* Sessions List */}
            {selectedSubscription?.product_details?.SESSION && (
              <Col xs={24}>{renderSessionsComponent(selectedSubscription?.product_details?.SESSION)}</Col>
            )}

            {/* Videos List */}
            {selectedSubscription?.product_details?.VIDEO && (
              <Col xs={24}>{renderVideosComponent(selectedSubscription?.product_details?.VIDEO)}</Col>
            )}

            {/* Other Memberships List */}
            {otherSubscriptions.length > 0 && <Col xs={24}>{otherSubscriptionsComponent}</Col>}
          </Row>
        </div>
      </Spin>
      {/* Bottom Sheets List */}
      <Drawer
        visible={bottomSheetsVisible}
        placement="bottom"
        height={560}
        bodyStyle={{ padding: 10 }}
        title={
          <Text style={{ color: '#0050B3' }}>
            {' '}
            {`${moreView[0].toUpperCase()}${moreView.slice(1)} included in this membership`}{' '}
          </Text>
        }
        headerStyle={generateCardHeadingStyle()}
        onClose={handleCloseBottomSheets}
        className={styles.detailsDrawer}
      >
        {moreView === 'videos' ? moreVideosListView : moreSessionsListView}
      </Drawer>

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
                  {selectedSubscription?.currency?.toUpperCase()} {selectedSubscription?.total_price} /{' '}
                  {selectedSubscription?.validity} days
                </div>
              </Col>
              <Col xs={10}>
                <Button block size="large" type="primary" className={styles.greenBtn} onClick={openPurchaseModal}>
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
