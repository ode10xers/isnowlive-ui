import React, { useState, useEffect, useCallback } from 'react';
import classNames from 'classnames';

import { Row, Col, Typography, Space, Spin, Button, Empty, Drawer, Divider, message } from 'antd';
import { BarsOutlined, CheckCircleFilled } from '@ant-design/icons';

import apis from 'apis';

import AuthModal from 'components/AuthModal';
import VideoListCard from 'components/DynamicProfileComponents/VideosProfileComponent/VideoListCard';
import SessionListCard from 'components/DynamicProfileComponents/SessionsProfileComponent/SessionListCard';
import { showErrorModal, showPurchaseSubscriptionSuccessModal } from 'components/Modals/modals';

import { generateColorPalletteForProfile } from 'utils/colors';
import { generateBaseCreditsText, generateSubscriptionDuration } from 'utils/subscriptions';

import dateUtil from 'utils/date';
import { isInIframeWidget, isWidgetUrl } from 'utils/widgets';
import { redirectToPluginVideoDetailsPage, redirectToVideosPage } from 'utils/redirect';
import {
  orderType,
  productType,
  isAPISuccess,
  preventDefaults,
  convertHexToRGB,
  getUsernameFromUrl,
  reservedDomainName,
  isBrightColorShade,
  isUnapprovedUserError,
} from 'utils/helper';

import { useGlobalContext } from 'services/globalContext';

import styles from './style.module.scss';

const { Title, Text } = Typography;
const {
  timezoneUtils: { getTimezoneLocation },
} = dateUtil;

const NewMembershipDetails = ({ match }) => {
  const subscriptionId = match.params.membership_id;

  const { showPaymentPopup } = useGlobalContext();

  const [isLoading, setIsLoading] = useState(true);

  const [otherSubscriptionsLoading, setOtherSubscriptionsLoading] = useState(true);
  const [creatorSubscriptions, setCreatorSubscriptions] = useState([]);

  const [selectedSubsDetails, setSelectedSubsDetails] = useState(null);
  const [initialSubsDetails, setInitialSubsDetails] = useState(null);
  const [authModalVisible, setAuthModalVisible] = useState(false);
  const [moreView, setMoreView] = useState('sessions');
  const [bottomSheetsVisible, setBottomSheetsVisible] = useState(false);

  const [creatorProfile, setCreatorProfile] = useState(null);

  //#region Start of useCallbacks

  const fetchInitialSubscriptionDetails = useCallback(async (subscriptionExternalId) => {
    setIsLoading(true);

    try {
      const { status, data } = await apis.subscriptions.getSubscriptionById(subscriptionExternalId);

      if (isAPISuccess(status) && data) {
        setInitialSubsDetails(data);
        setSelectedSubsDetails(data);
      }
    } catch (error) {
      console.error(error);
      showErrorModal('Failed to fetch membership details', error?.response?.data?.message ?? 'Something went wrong.');
    }

    setIsLoading(false);
  }, []);

  const fetchCreatorOtherSubscriptions = useCallback(async () => {
    setOtherSubscriptionsLoading(true);

    try {
      const { status, data } = await apis.subscriptions.getSubscriptionsByUsername();

      if (isAPISuccess(status) && data) {
        setCreatorSubscriptions(data.sort((a, b) => b.total_price - a.total_price));
      }
    } catch (error) {
      console.error(error);
      message.error(error?.response?.data?.message || 'Failed to load other memberships');
    }

    setOtherSubscriptionsLoading(false);
  }, []);

  const fetchCreatorProfileDetails = useCallback(async (creatorUsername) => {
    try {
      const { status, data } = creatorUsername
        ? await apis.user.getProfileByUsername(creatorUsername)
        : await apis.user.getProfile();

      if (isAPISuccess(status) && data) {
        setCreatorProfile(data);
      }
    } catch (error) {
      console.error(error);
      showErrorModal(
        'Failed to fetch creator profile details',
        error?.response?.data?.message || 'Something went wrong.'
      );
    }
  }, []);

  //#endregion End of useCallbacks

  //#region Start of Use Effects

  // Fetch creator details for coloring use

  useEffect(() => {
    if (subscriptionId) {
      fetchInitialSubscriptionDetails(subscriptionId);
    }
  }, [subscriptionId, fetchInitialSubscriptionDetails]);

  useEffect(() => {
    const domainUsername = getUsernameFromUrl();

    if (domainUsername && !reservedDomainName.includes(domainUsername)) {
      fetchCreatorProfileDetails(domainUsername);
    }

    fetchCreatorOtherSubscriptions();
  }, [fetchCreatorProfileDetails, fetchCreatorOtherSubscriptions]);

  // Coloring logic
  useEffect(() => {
    let profileStyleObject = {};

    // Prevent any coloring to happen inside widget
    if (!isInIframeWidget() && creatorProfile && creatorProfile?.profile?.color) {
      profileStyleObject = {
        ...profileStyleObject,
        ...generateColorPalletteForProfile(creatorProfile?.profile?.color, creatorProfile?.profile?.new_profile),
      };
    }

    Object.entries(profileStyleObject).forEach(([key, val]) => {
      document.documentElement.style.setProperty(key, val);
    });

    return () => {
      if (profileStyleObject) {
        Object.keys(profileStyleObject).forEach((key) => {
          document.documentElement.style.removeProperty(key);
        });
      }
    };
  }, [creatorProfile]);

  //#endregion End of Use Effects

  //#region Start of Purchase Business Logic

  const showConfirmPaymentPopup = () => {
    if (!selectedSubsDetails) {
      showErrorModal('Something went wrong', 'Invalid Subscription Selected');
      return;
    }

    let itemDescription = [];

    itemDescription.push(generateBaseCreditsText(selectedSubsDetails, false));

    if (selectedSubsDetails.products['COURSE']) {
      itemDescription.push(generateBaseCreditsText(selectedSubsDetails, true));
    }

    const paymentPopupData = {
      productId: selectedSubsDetails.external_id,
      productType: productType.SUBSCRIPTION,
      itemList: [
        {
          name: selectedSubsDetails.name,
          description: itemDescription.join(', '),
          currency: selectedSubsDetails.currency,
          price: selectedSubsDetails.total_price,
        },
      ],
    };

    showPaymentPopup(paymentPopupData, createOrder);
  };

  const createOrder = async (couponCode = '') => {
    setIsLoading(true);
    try {
      const payload = {
        subscription_id: selectedSubsDetails.external_id,
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

  const closeAuthModal = () => {
    setAuthModalVisible(false);
  };

  const handleBuySubscriptionClicked = (e) => {
    preventDefaults(e);

    if (!selectedSubsDetails) {
      showErrorModal('Invalid membership selected!');
      return;
    }

    setAuthModalVisible(true);
  };

  const handleSelectSubsItem = (targetSubs) => {
    setIsLoading(true);
    setSelectedSubsDetails(targetSubs);
    setTimeout(() => setIsLoading(false), 750);
  };

  const handleVideoItemClicked = (video) => {
    if (isInIframeWidget() || isWidgetUrl()) {
      redirectToPluginVideoDetailsPage(video);
    } else {
      redirectToVideosPage(video);
    }
  };

  // TODO: Clarify the approach here
  const handleSeeMoreSessions = () => {
    setMoreView('sessions');
    setBottomSheetsVisible(true);
  };
  const handleSeeMoreVideos = () => {
    setMoreView('videos');
    setBottomSheetsVisible(true);
  };

  const handleCloseBottomSheets = () => {
    setBottomSheetsVisible(false);
  };

  //#endregion End of UI Handlers

  //#region Start of UI Methods

  const renderSubsPrice = (subsData) =>
    subsData?.total_price > 0 ? `${subsData?.currency?.toUpperCase() ?? ''} ${subsData?.total_price ?? 0}` : 'Free';

  const renderBuyableMembershipItem = (subs) => (
    <Col xs={24} key={subs.external_id}>
      <div
        onClick={() => handleSelectSubsItem(subs)}
        className={classNames(
          styles.buyableSubsItem,
          subs?.external_id === selectedSubsDetails?.external_id ? styles.selected : undefined
        )}
      >
        <Row gutter={[8, 8]}>
          <Col xs={12} className={styles.subsCheckContainer}>
            <Space align="center">
              <CheckCircleFilled className={styles.checkIcon} />
              <Text className={classNames(styles.subsItemName, subs?.name.length > 20 ? styles.longText : undefined)}>
                {subs?.name}
              </Text>
            </Space>
          </Col>
          <Col xs={12} className={styles.textAlignRight}>
            <Text className={styles.subsItemDesc}>
              {generateBaseCreditsText(subs, false).replace(' credits/period', '')}
            </Text>
          </Col>
        </Row>
      </div>
    </Col>
  );

  //#endregion End of UI Methods

  //#region Start of UI Components

  const subsDetailInfo = selectedSubsDetails ? (
    <div className={styles.currentSubsDetailsContainer}>
      <Row gutter={[8, 8]}>
        <Col xs={24}>
          <Title level={3} className={styles.subsName}>
            {selectedSubsDetails?.name}
          </Title>
        </Col>
        <Col xs={24}>
          <Space align="center" split={<Text className={styles.dotSeparator}>●</Text>}>
            <Text className={styles.subsDetailItem}>{renderSubsPrice(selectedSubsDetails)}</Text>
            <Text className={styles.subsDetailItem}>
              {generateBaseCreditsText(selectedSubsDetails).replace(' credits/period', '')}
            </Text>
            <Text className={styles.subsDetailItem}>
              Renewed every {generateSubscriptionDuration(selectedSubsDetails, true)}
            </Text>
          </Space>
        </Col>
      </Row>
    </div>
  ) : null;

  const sessionItemLimit = 3;
  const subsSessionList = (
    <>
      <Title level={4} className={styles.sectionHeading}>
        Sessions bookable with this membership
      </Title>
      <Row gutter={[8, 8]} className={styles.subsContentContainer}>
        {selectedSubsDetails?.product_details['SESSION']?.slice(0, sessionItemLimit).map((session) => (
          <Col xs={18} sm={16} md={14} lg={12} key={session.session_external_id}>
            <SessionListCard session={session} />
          </Col>
        ))}
        {selectedSubsDetails?.product_details['SESSION']?.length > sessionItemLimit ? (
          <Col xs={18} sm={16} md={14} lg={12} className={styles.fadedItemContainer}>
            <div className={styles.fadedOverlay}>
              <div className={styles.seeMoreButton} onClick={handleSeeMoreSessions}>
                <BarsOutlined className={styles.seeMoreIcon} />
                SEE MORE
              </div>
            </div>
            <div className={styles.fadedItem}>
              <SessionListCard session={selectedSubsDetails?.product_details['SESSION'][sessionItemLimit]} />
            </div>
          </Col>
        ) : null}
      </Row>
    </>
  );

  const moreSessionsListView =
    selectedSubsDetails?.product_details['SESSION']?.length > 0 ? (
      <Row gutter={[16, 16]}>
        {selectedSubsDetails?.product_details['SESSION']?.map((session) => (
          <Col xs={24} md={12} lg={8} xl={6} key={`more_${session.session_external_id}`}>
            <SessionListCard session={session} />
          </Col>
        ))}
      </Row>
    ) : (
      <Empty description="No sessions to show" />
    );

  const videoItemLimit = 5;
  const subsVideoList = (
    <>
      <Title level={4} className={styles.sectionHeading}>
        Videos purchasable with this membership
      </Title>
      <Row gutter={[8, 8]} className={styles.subsContentContainer}>
        {selectedSubsDetails?.product_details['VIDEO']?.slice(0, videoItemLimit).map((video) => (
          <Col xs={16} sm={14} md={10} lg={12} key={video.external_id}>
            <VideoListCard video={video} handleClick={() => handleVideoItemClicked(video)} />
          </Col>
        ))}
        {selectedSubsDetails?.product_details['VIDEO']?.length > videoItemLimit ? (
          <Col xs={16} sm={14} md={10} lg={12} className={styles.fadedItemContainer}>
            <div className={styles.fadedOverlay}>
              <div className={styles.seeMoreButton} onClick={handleSeeMoreVideos}>
                <BarsOutlined className={styles.seeMoreIcon} />
                SEE MORE
              </div>
            </div>
            <div className={styles.fadedItem}>
              <VideoListCard video={selectedSubsDetails?.product_details['VIDEO'][videoItemLimit]} />
            </div>
          </Col>
        ) : null}
      </Row>
    </>
  );

  const moreVideosListView =
    selectedSubsDetails?.product_details['VIDEO']?.length > 0 ? (
      <Row gutter={[16, 16]}>
        {selectedSubsDetails?.product_details['VIDEO']?.map((video) => (
          <Col xs={24} md={12} lg={8} xl={6} key={`more_${video.external_id}`}>
            <VideoListCard video={video} />
          </Col>
        ))}
      </Row>
    ) : (
      <Empty description="No videos to show" />
    );

  const moreMembershipHeader = (
    <Col xs={24}>
      <Title level={5} className={styles.moreMembershipSectionHeader}>
        More membership options
      </Title>
    </Col>
  );

  const buySection = (
    <div className={styles.buySection}>
      <Row gutter={[12, 12]} align="middle">
        <Col xs={24}>
          <Title level={5} className={styles.buySectionHeader}>
            Buy Membership
          </Title>
        </Col>
        {isLoading && !initialSubsDetails ? (
          <Col xs={24}>
            <Spin spinning={true} size="large">
              <div className={styles.loadingPlaceholder} />
            </Spin>
          </Col>
        ) : initialSubsDetails ? (
          renderBuyableMembershipItem(initialSubsDetails)
        ) : null}
        {otherSubscriptionsLoading ? (
          <>
            {moreMembershipHeader}
            <Col xs={24}>
              <Spin spinning={true} size="large">
                <div className={styles.loadingPlaceholderLarge} />
              </Spin>
            </Col>
          </>
        ) : creatorSubscriptions.length > 0 ? (
          <>
            {moreMembershipHeader}
            {creatorSubscriptions
              .filter((subs) => subs.external_id !== initialSubsDetails?.external_id)
              .sort((a, b) => b.total_price - a.total_price)
              .slice(0, 2)
              .map(renderBuyableMembershipItem)}
          </>
        ) : null}
        <Col xs={24}>
          <Row justify="center">
            <Col>
              <Button
                size="large"
                type="primary"
                onClick={handleBuySubscriptionClicked}
                className={classNames(
                  styles.buyButton,
                  !isInIframeWidget() &&
                    isBrightColorShade(convertHexToRGB(creatorProfile?.profile?.color ?? '#1890ff'))
                    ? styles.darkText
                    : styles.lightText
                )}
              >
                BUY NOW | {renderSubsPrice(selectedSubsDetails)}
              </Button>
            </Col>
          </Row>
        </Col>
      </Row>
    </div>
  );

  //#endregion End of UI Components

  return (
    <div className={styles.membershipDetailsPageContainer}>
      <AuthModal visible={authModalVisible} closeModal={closeAuthModal} onLoggedInCallback={showConfirmPaymentPopup} />
      <Row gutter={[20, 20]} className={styles.membershipDetailsPage}>
        <Col xs={{ order: 2, span: 24 }} lg={{ order: 1, span: 14 }}>
          {/* Details Section */}
          <Spin spinning={isLoading} size="large">
            <Row gutter={[12, 12]}>
              {/* Subs Details */}
              <Col xs={24}>{subsDetailInfo}</Col>

              {/* Session Lists */}
              {selectedSubsDetails?.product_details['SESSION']?.length > 0 && (
                <>
                  <Col xs={24}>
                    <Divider />
                  </Col>
                  <Col xs={24}>{subsSessionList}</Col>
                </>
              )}

              {/* Video Lists Lists */}
              {selectedSubsDetails?.product_details['VIDEO']?.length > 0 && (
                <>
                  <Col xs={24}>
                    <Divider />
                  </Col>
                  <Col xs={24}>{subsVideoList}</Col>
                </>
              )}
            </Row>
          </Spin>
        </Col>
        <Col xs={{ order: 1, span: 24 }} lg={{ order: 1, span: 10 }}>
          {/* Buy Section */}
          {buySection}
        </Col>
      </Row>
      <Drawer
        visible={bottomSheetsVisible}
        placement="bottom"
        height={560}
        bodyStyle={{ padding: 10 }}
        title={
          <Text className={styles.bottomSheetsTitle}>
            {`${moreView[0].toUpperCase()}${moreView.slice(1)} included in membership`}
          </Text>
        }
        headerStyle={{
          color: `var(--membership-plugin-cta-background-color, var(--passion-profile-darker-color, #0050B3))`,
          background: `var(--membership-widget-background-color, var(--passion-profile-light-color, #F1FBFF))`,
          borderRadius: '12px 12px 0 0',
          boxShadow: 'inset 0px -1px 0px #E6F5FB',
        }}
        onClose={handleCloseBottomSheets}
        className={styles.moreContentDrawer}
      >
        {moreView === 'sessions' ? moreSessionsListView : moreVideosListView}
      </Drawer>
    </div>
  );
};

export default NewMembershipDetails;
