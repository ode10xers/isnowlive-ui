import React, { useState, useEffect, useCallback } from 'react';
import ReactHtmlParser from 'react-html-parser';
import classNames from 'classnames';
import { Row, Col, Button, Image, Typography, Space, Spin, Divider, message } from 'antd';
import {
  ClockCircleOutlined,
  CalendarOutlined,
  FilePdfOutlined,
  CreditCardOutlined,
  TagsOutlined,
  ScheduleOutlined,
  CheckCircleTwoTone,
} from '@ant-design/icons';

import apis from 'apis';

import {
  showErrorModal,
  showAlreadyBookedModal,
  showGetVideoWithPassSuccessModal,
  showPurchaseSingleVideoSuccessModal,
  showGetVideoWithSubscriptionSuccessModal,
  showPurchasePassAndGetVideoSuccessModal,
  showPurchaseSubscriptionAndGetVideoSuccessModal,
} from 'components/Modals/modals';
import AuthModal from 'components/AuthModal';
import DefaultImage from 'components/Icons/DefaultImage';
import CourseListItem from 'components/DynamicProfileComponents/CoursesProfileComponent/CoursesListItem';
import SubscriptionListItem from 'components/DynamicProfileComponents/SubscriptionsProfileComponent/SubscriptionListItem';

import {
  isAPISuccess,
  preventDefaults,
  paymentSource,
  orderType,
  productType,
  videoSourceType,
  isUnapprovedUserError,
  getUsernameFromUrl,
  reservedDomainName,
  isBrightColorShade,
  convertHexToRGB,
} from 'utils/helper';
import dateUtil from 'utils/date';
import { getLocalUserDetails } from 'utils/storage';
import { generateColorPalletteForProfile } from 'utils/colors';

import { useGlobalContext } from 'services/globalContext';

import styles from './style.module.scss';
import { generateBaseCreditsText } from 'utils/subscriptions';

const {
  formatDate: { getVideoMinutesDuration },
  timezoneUtils: { getTimezoneLocation },
} = dateUtil;

const { Title, Text, Paragraph } = Typography;

const paymentInstruments = {
  ONE_OFF: 'one-off',
  PASS: 'pass',
  SUBSCRIPTION: 'subscription',
};

const NewVideoDetails = ({ match }) => {
  const videoId = match.params.video_id;

  const {
    showPaymentPopup,
    state: { userDetails },
  } = useGlobalContext();

  const [isLoading, setIsLoading] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [videoData, setVideoData] = useState(null);
  const [creatorProfile, setCreatorProfile] = useState(null);

  // Related Products State
  const [relatedSubscriptions, setRelatedSubscriptions] = useState([]);
  const [relatedPasses, setRelatedPasses] = useState([]);
  const [relatedCourses, setRelatedCourses] = useState([]);

  // User's usable Payment Instruments State
  const [usablePass, setUsablePass] = useState(null);
  const [usableSubscription, setUsableSubscription] = useState(null);
  const [shouldFollowUpGetVideo, setShouldFollowUpGetVideo] = useState(false);
  const [selectedPaymentInstrument, setSelectedPaymentInstrument] = useState(paymentInstruments.ONE_OFF);
  const [selectedPass, setSelectedPass] = useState(null);
  const [passSelectionError, setPassSelectionError] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState(null);
  const [subscriptionSelectionError, setSubscriptionSelectionError] = useState(false);

  //#region Start of API Calls

  const getUsablePassForVideo = useCallback(async (videoExternalId) => {
    setIsLoading(true);

    try {
      const { status, data } = await apis.passes.getAttendeePassesForVideo(videoExternalId);

      if (isAPISuccess(status) && data) {
        // Use the pass that's closest to expiry first
        if (data.active.length > 0) {
          setIsLoading(false);
          return data.active[0];
        }
      }
    } catch (error) {
      console.error(error);
      message.error(error?.response?.data?.message || 'Failed to fetch user passes for video');
    }
    setIsLoading(false);
    return null;
  }, []);

  const getUsableSubscriptionForVideo = useCallback(async (videoExternalId) => {
    setIsLoading(true);

    try {
      const { status, data } = await apis.subscriptions.getUserSubscriptionForVideo(videoExternalId);

      if (isAPISuccess(status) && data) {
        if (data.active.length > 0) {
          // Choose a purchased subscription based on these conditions
          // 1. Should be usable for Videos
          // 2. Still have credits to purchase videos
          // 3. This video can be purchased by this subscription
          const usableSubscription =
            data.active.find(
              (subscription) =>
                subscription.products['VIDEO'] &&
                subscription.products['VIDEO']?.credits - subscription.products['VIDEO']?.credits_used > 0 &&
                subscription.products['VIDEO']?.product_ids?.includes(videoExternalId)
            ) || null;

          setIsLoading(false);
          return usableSubscription;
        }
      }
    } catch (error) {
      console.error(error);
      message.error(error?.response?.data?.message || 'Failed to fetch user memberships for video');
    }

    setIsLoading(false);
    return null;
  }, []);

  const fetchUserPaymentInstruments = useCallback(
    async (videoExternalId) => {
      const userSub = await getUsableSubscriptionForVideo(videoExternalId);
      const userPass = await getUsablePassForVideo(videoExternalId);

      setUsableSubscription(userSub);
      setUsablePass(userPass);

      if (userSub) {
        setSelectedPaymentInstrument(paymentInstruments.SUBSCRIPTION);
      } else if (userPass) {
        setSelectedPaymentInstrument(paymentInstruments.PASS);
      } else {
        setSelectedPaymentInstrument(paymentInstruments.ONE_OFF);
      }
    },
    [getUsableSubscriptionForVideo, getUsablePassForVideo]
  );

  const fetchRelatedSubscriptionsForVideo = useCallback(async (videoExternalId) => {
    try {
      const { status, data } = await apis.subscriptions.getSubscriptionsForVideo(videoExternalId);

      if (isAPISuccess(status) && data) {
        setRelatedSubscriptions(data);
      }
    } catch (error) {
      console.error(error);
      message.error(error?.response?.data?.message || 'Failed to load memberships for video');
    }
  }, []);

  const fetchRelatedPassesForVideo = useCallback(async (videoExternalId) => {
    try {
      const { status, data } = await apis.passes.getPassesByVideoId(videoExternalId);

      if (isAPISuccess(status) && data) {
        setRelatedPasses(data);
      }
    } catch (error) {
      console.error(error);
      message.error(error?.response?.data?.message || 'Failed to load passes for video');
    }
  }, []);

  const getCourseDetailsForVideo = useCallback(async (videoExternalId) => {
    try {
      const { status, data } = await apis.courses.getVideoCoursesByVideoId(videoExternalId);

      if (isAPISuccess(status) && data) {
        setRelatedCourses(data);
      }
    } catch (error) {
      console.error(error);
      message.error(error?.response?.data?.message || 'Failed to load courses for video');
    }
  }, []);

  const fetchVideoDetails = useCallback(
    async (videoExternalId) => {
      setIsLoading(true);

      try {
        const { status, data } = await apis.videos.getVideoById(videoExternalId);

        if (isAPISuccess(status) && data) {
          setVideoData(data);

          if (data.is_course) {
            getCourseDetailsForVideo(videoExternalId);
          }
        }
      } catch (error) {
        console.error(error);
        message.error(error?.response?.data?.message || 'Failed to load video details');
      }

      setIsLoading(false);
    },
    [getCourseDetailsForVideo]
  );

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

  //#endregion End of API Calls

  //#region Start of Use Effects

  useEffect(() => {
    const domainUsername = getUsernameFromUrl();

    if (domainUsername && !reservedDomainName.includes(domainUsername)) {
      fetchCreatorProfileDetails(domainUsername);
    }
  }, [fetchCreatorProfileDetails]);

  // Coloring logic
  useEffect(() => {
    let profileStyleObject = {};

    if (creatorProfile && creatorProfile?.profile?.color) {
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

  // Fetching data required for UI
  useEffect(() => {
    fetchVideoDetails(videoId);
    fetchRelatedPassesForVideo(videoId);
    fetchRelatedSubscriptionsForVideo(videoId);
  }, [videoId, fetchVideoDetails, fetchRelatedPassesForVideo, fetchRelatedSubscriptionsForVideo]);

  // Use Effect logic to handle when user lands in the page already logged in
  useEffect(() => {
    if (userDetails) {
      fetchUserPaymentInstruments(videoId);
    } else {
      setUsablePass(null);
      setUsableSubscription(null);
      setSelectedPass(null);
      setSelectedSubscription(null);
      setPassSelectionError(false);
      setSubscriptionSelectionError(false);
      setSelectedPaymentInstrument(paymentInstruments.ONE_OFF);
    }
  }, [videoId, userDetails, fetchUserPaymentInstruments]);

  useEffect(() => {
    if (shouldFollowUpGetVideo) {
      showConfirmPaymentPopup();
    }
    //eslint-disable-next-line
  }, [shouldFollowUpGetVideo]);

  //#endregion End of Use Effects

  //#region Start of Business Logics

  const purchaseVideo = async (payload) => await apis.videos.createOrderForUser(payload);

  const buySingleVideo = async (couponCode = '', priceAmount = 5) => {
    setIsLoading(true);

    try {
      let payload = {
        video_id: videoData.external_id,
        payment_source: paymentSource.GATEWAY,
        user_timezone_location: getTimezoneLocation(),
        coupon_code: couponCode,
      };

      if (videoData.pay_what_you_want) {
        payload = { ...payload, amount: priceAmount };
      }

      const { status, data } = await purchaseVideo(payload);

      if (isAPISuccess(status) && data) {
        setIsLoading(false);

        if (data.payment_required) {
          return {
            ...data,
            is_successful_order: true,
            payment_order_id: data.video_order_id,
            payment_order_type: orderType.VIDEO,
          };
        } else {
          showPurchaseSingleVideoSuccessModal(data.payment_order_id);

          return {
            ...data,
            is_successful_order: true,
          };
        }
      }
    } catch (error) {
      setIsLoading(false);
      if (error.response?.data?.message === 'user already has a confirmed order for this video') {
        showAlreadyBookedModal(productType.VIDEO);
      } else if (!isUnapprovedUserError(error.response)) {
        showErrorModal('Something went wrong', error.response?.data?.message);
      }
    }

    return {
      is_successful_order: false,
    };
  };

  const buyPassAndGetVideo = async (couponCode = '') => {
    setIsLoading(true);

    try {
      const payload = {
        pass_id: selectedPass.external_id,
        price: selectedPass.total_price,
        currency: selectedPass.currency.toLowerCase(),
        coupon_code: couponCode,
      };

      const { status, data } = await apis.passes.createOrderForUser(payload);

      if (isAPISuccess(status) && data) {
        setIsLoading(false);

        if (data.payment_required) {
          return {
            ...data,
            is_successful_order: true,
            payment_order_id: data.pass_order_id,
            payment_order_type: orderType.PASS,
            follow_up_booking_info: {
              productType: productType.VIDEO,
              productId: videoData.external_id,
            },
          };
        } else {
          // It's a free pass, so we immediately book the video after this
          const followUpGetVideo = await purchaseVideo({
            video_id: videoData.external_id,
            payment_source: paymentSource.PASS,
            source_id: data.pass_order_id,
            user_timezone_location: getTimezoneLocation(),
          });

          if (isAPISuccess(followUpGetVideo.status)) {
            showPurchasePassAndGetVideoSuccessModal(data.pass_order_id);
            setIsLoading(false);
          }

          return {
            ...data,
            is_successful_order: true,
          };
        }
      }
    } catch (error) {
      setIsLoading(false);
      if (error.response?.data?.message === 'user already has a confirmed order for this video') {
        showAlreadyBookedModal(productType.VIDEO);
      } else if (!isUnapprovedUserError(error.response)) {
        showErrorModal('Something went wrong', error.response?.data?.message);
      }
    }

    return {
      is_successful_order: false,
    };
  };

  const buyVideoUsingPass = async () => {
    setIsLoading(true);

    try {
      const payload = {
        video_id: videoData.external_id,
        payment_source: paymentSource.PASS,
        source_id: usablePass.pass_order_id,
        user_timezone_location: getTimezoneLocation(),
      };

      const { status, data } = await purchaseVideo(payload);

      if (isAPISuccess(status) && data) {
        showGetVideoWithPassSuccessModal(payload.source_id);
        setIsLoading(false);
        return {
          ...data,
          is_successful_order: true,
        };
      }
    } catch (error) {
      setIsLoading(false);

      if (error.response?.data?.message === 'user already has a confirmed order for this video') {
        showAlreadyBookedModal(productType.VIDEO);
      } else if (!isUnapprovedUserError(error.response)) {
        showErrorModal('Something went wrong', error.response?.data?.message);
      }
    }

    return {
      is_successful_order: false,
    };
  };

  const buySubscriptionAndGetVideo = async (couponCode = '') => {
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
            follow_up_booking_info: {
              productType: productType.VIDEO,
              productId: videoData.external_id,
            },
          };
        } else {
          // It's a free pass, so we immediately book the video after this
          const followUpGetVideo = await purchaseVideo({
            video_id: videoData.external_id,
            payment_source: paymentSource.SUBSCRIPTION,
            source_id: data.subscription_order_id,
            user_timezone_location: getTimezoneLocation(),
          });

          if (isAPISuccess(followUpGetVideo.status)) {
            showPurchaseSubscriptionAndGetVideoSuccessModal();
            setIsLoading(false);
          }

          return {
            ...data,
            is_successful_order: true,
          };
        }
      }
    } catch (error) {
      setIsLoading(false);
      if (error.response?.data?.message === 'user already has a confirmed order for this video') {
        showAlreadyBookedModal(productType.VIDEO);
      } else if (!isUnapprovedUserError(error.response)) {
        showErrorModal('Something went wrong', error.response?.data?.message);
      }
    }

    return {
      is_successful_order: false,
    };
  };

  const buyVideoUsingSubscription = async () => {
    try {
      const payload = {
        video_id: videoData.external_id,
        payment_source: paymentSource.SUBSCRIPTION,
        source_id: usableSubscription.subscription_order_id,
      };

      const { status, data } = await purchaseVideo(payload);

      if (isAPISuccess(status) && data) {
        showGetVideoWithSubscriptionSuccessModal();
        setIsLoading(false);
        return {
          ...data,
          is_successful_order: true,
        };
      }
    } catch (error) {
      setIsLoading(false);

      if (error.response?.data?.message === 'user already has a confirmed order for this video') {
        showAlreadyBookedModal(productType.VIDEO);
      } else if (!isUnapprovedUserError(error.response)) {
        showErrorModal('Something went wrong', error.response?.data?.message);
      }
    }
    return {
      is_successful_order: false,
    };
  };

  const showConfirmPaymentPopup = async () => {
    let userPurchasedPass = usablePass;
    let userPurchasedSubscription = usableSubscription;

    if (!shouldFollowUpGetVideo) {
      // If user logged in from AuthModal
      // We fetch the usable subscriptions/pass info
      if (getLocalUserDetails() && (!usablePass || !usableSubscription)) {
        await fetchUserPaymentInstruments(videoId);

        setShouldFollowUpGetVideo(true);
        return;
      }
    } else {
      setShouldFollowUpGetVideo(false);
    }

    const videoDesc = `Can be watched up to ${videoData?.watch_limit} times, valid for ${videoData?.validity} days`;

    if (selectedPaymentInstrument === paymentInstruments.SUBSCRIPTION && videoData?.total_price > 0) {
      if (userPurchasedSubscription) {
        // Buy Video using Membership Flow
        // If user have a subscription usable for purchasing this product
        // We prioritize using that subscription

        const paymentPopupData = {
          productId: videoData.external_id,
          productType: productType.VIDEO,
          itemList: [
            {
              name: videoData.title,
              description: videoDesc,
              currency: videoData.currency,
              price: videoData.total_price,
            },
          ],
          paymentInstrumentDetails: {
            type: paymentSource.SUBSCRIPTION,
            ...userPurchasedSubscription,
          },
        };

        showPaymentPopup(paymentPopupData, async () => await buyVideoUsingSubscription());
      } else {
        // Buy Membership + Video flow
        const paymentPopupData = {
          productId: selectedSubscription.external_id,
          productType: productType.SUBSCRIPTION,
          itemList: [
            {
              name: selectedSubscription.name,
              description: generateBaseCreditsText(selectedSubscription, false),
              currency: selectedSubscription.currency,
              price: selectedSubscription.total_price,
            },
            {
              name: videoData.title,
              description: videoDesc,
              currency: videoData.currency,
              price: 0,
            },
          ],
        };

        showPaymentPopup(paymentPopupData, buySubscriptionAndGetVideo);
      }
    } else if (selectedPaymentInstrument === paymentInstruments.PASS && videoData?.total_price > 0) {
      if (userPurchasedPass) {
        // Buy Video with Pass Flow
        // If user have usable pass for this video
        // We use the pass to get the video
        // If video is a free one, we redirect them to
        // Single video booking flow to prevent accidental credit usage
        const paymentPopupData = {
          productId: videoData.external_id,
          productType: productType.VIDEO,
          itemList: [
            {
              name: videoData.title,
              description: videoDesc,
              currency: videoData.currency,
              price: videoData.total_price,
            },
          ],
          paymentInstrumentDetails: {
            type: paymentSource.PASS,
            ...userPurchasedPass,
          },
        };

        showPaymentPopup(paymentPopupData, async () => await buyVideoUsingPass());
      } else {
        // Buy Pass with Video flow

        const paymentPopupData = {
          productId: selectedPass.external_id,
          productType: productType.PASS,
          itemList: [
            {
              name: selectedPass.name,
              description: `${selectedPass.class_count} Credits, Valid for ${selectedPass.validity} days`,
              currency: selectedPass.currency,
              price: selectedPass.total_price,
            },
            {
              name: videoData.title,
              description: videoDesc,
              currency: videoData.currency,
              price: 0,
            },
          ],
        };

        showPaymentPopup(paymentPopupData, buyPassAndGetVideo);
      }
    } else {
      // Buy Single Video Flow
      let flexiblePaymentDetails = null;

      if (videoData?.pay_what_you_want) {
        flexiblePaymentDetails = {
          enabled: true,
          minimumPrice: videoData?.price,
        };
      }

      const paymentPopupData = {
        productId: videoData?.external_id,
        productType: productType.VIDEO,
        itemList: [
          {
            name: videoData?.title,
            description: videoDesc,
            currency: videoData?.currency,
            price: videoData?.total_price,
            pay_what_you_want: videoData?.pay_what_you_want,
          },
        ],
        flexiblePaymentDetails,
      };

      showPaymentPopup(paymentPopupData, buySingleVideo);
    }
  };

  //#endregion End of Business Logics

  //#region Start of Event handlers

  const closeAuthModal = () => {
    setSelectedPaymentInstrument(paymentInstruments.ONE_OFF);
    setShowAuthModal(false);
  };

  const handleVideoBuyClicked = (e) => {
    preventDefaults(e);
    setSelectedPaymentInstrument(paymentInstruments.ONE_OFF);
    setShowAuthModal(true);
  };

  const handleMembershipBuyClicked = (e) => {
    preventDefaults(e);

    if (!selectedSubscription) {
      setSubscriptionSelectionError(true);
    } else {
      setSelectedPaymentInstrument(paymentInstruments.SUBSCRIPTION);
      setShowAuthModal(true);
    }
  };

  const handleSelectBuyableSubscription = (subs) => {
    setSubscriptionSelectionError(false);
    setSelectedSubscription(subs);
  };

  //#endregion End of Event handlers

  //#region Start of UI Components

  const renderVideoDocumentUrl = () => {
    const documentUrl = videoData?.description.split('!~!~!~')[1] ?? '';
    const isPublicDownloadable = videoData?.description.split('!~!~!~')[2] ?? false;

    if (!documentUrl) {
      return null;
    }

    const filename = documentUrl.split('_').slice(-1)[0] || 'Download';

    return (
      <div className={styles.videoDocumentUrl}>
        <Space direction="vertical">
          <Text> This video includes a downloadable PDF file: </Text>
          {isPublicDownloadable ? (
            <Button
              className={styles.filenameDownload}
              type="primary"
              icon={<FilePdfOutlined />}
              onClick={() => window.open(documentUrl)}
            >
              {filename}
            </Button>
          ) : (
            <Text className={styles.filenameText}>{filename}</Text>
          )}
        </Space>
      </div>
    );
  };

  const renderBuyableSubscriptionItem = (subs) => (
    <Col xs={24} key={subs.external_id}>
      <Row gutter={6} align="middle">
        <Col flex="0 0 16px">
          <div
            onClick={() => handleSelectBuyableSubscription(subs)}
            className={selectedSubscription?.external_id === subs.external_id ? undefined : styles.roundBtn}
          >
            {selectedSubscription?.external_id === subs.external_id && <CheckCircleTwoTone twoToneColor="#52c41a" />}
          </div>
        </Col>
        <Col flex="1 1 auto">
          <SubscriptionListItem subscription={subs} />
        </Col>
      </Row>
    </Col>
  );

  // TODO: Also handle showing purchased payment instrument
  const renderBuySection = () => {
    const colCount = 1 + (relatedPasses?.length > 0 ? 1 : 0) + (relatedSubscriptions?.length > 0 ? 1 : 0);

    const buyOneOffUI = (
      <Col
        className={styles.paymentInstrumentOption}
        xs={{ span: 24, order: 3 }}
        md={{ span: 24 / colCount, order: 1 }}
      >
        <Title level={5} className={styles.textAlignCenter}>
          <CreditCardOutlined /> Make a one-time purchase
        </Title>
        <Row gutter={[12, 12]} justify="center" className={styles.buyVideoContainer}>
          <Col xs={24}>
            <Button
              block
              type="primary"
              size="large"
              onClick={handleVideoBuyClicked}
              className={classNames(
                styles.buyVideoBtn,
                isBrightColorShade(convertHexToRGB(creatorProfile?.profile?.color ?? '#1890ff'))
                  ? styles.darkText
                  : styles.lightText
              )}
            >
              <Space split={<Divider className={styles.buyBtnDivider} />} className={styles.buyVideoBtnContent}>
                <Text className={styles.buyVideoBtnText}> ONE TIME PURCHASE </Text>
                <Text className={styles.buyVideoBtnText}>
                  {videoData?.pay_what_you_want
                    ? 'Flexible'
                    : videoData?.total_price > 0
                    ? `${videoData?.currency?.toUpperCase()} ${videoData?.total_price}`
                    : 'Free'}
                </Text>
              </Space>
            </Button>
          </Col>
          <Col xs={24}>
            <Paragraph className={styles.buyVideoDesc}>Just buy this video</Paragraph>
          </Col>
        </Row>
      </Col>
    );

    const buyWithPassUI = (
      <Col
        className={styles.paymentInstrumentOption}
        xs={{ span: 24, order: 2 }}
        md={{ span: 24 / colCount, order: 2 }}
      >
        <Title level={5} className={styles.textAlignCenter}>
          <TagsOutlined /> Buy with Pass
        </Title>
        <Row gutter={[12, 12]} justify="center" className={styles.buyPassContainer}>
          <Col xs={24}></Col>
        </Row>
      </Col>
    );

    const buyWithMembershipUI = (
      <Col
        className={styles.paymentInstrumentOption}
        xs={{ span: 24, order: 1 }}
        md={{ span: 24 / colCount, order: 3 }}
      >
        <Title level={5} className={styles.textAlignCenter}>
          <ScheduleOutlined /> Buy with Membership
        </Title>
        <Row gutter={[12, 12]} justify="center" className={styles.buyMembershipContainer}>
          <Col xs={24}>
            <Button
              block
              type="primary"
              size="large"
              className={styles.buyMembershipBtn}
              onClick={handleMembershipBuyClicked}
            >
              SUBSCRIBE AND BOOK
            </Button>
          </Col>
          <Col xs={24}>
            <Paragraph className={styles.buyMembershipDesc}>Subscribe to a membership for discounted price.</Paragraph>
          </Col>
        </Row>
        {subscriptionSelectionError && <Paragraph type="danger">Please select a subscription below first</Paragraph>}
        <Row
          gutter={[12, 12]}
          justify="center"
          className={classNames(
            styles.buyableMembershipListContainer,
            subscriptionSelectionError ? styles.error : undefined
          )}
        >
          {relatedSubscriptions?.map(renderBuyableSubscriptionItem)}
        </Row>
      </Col>
    );

    return (
      <>
        <Col xs={24}>
          <Title level={3} className={styles.paymentInstrumentHeader}>
            Ways to buy
          </Title>
        </Col>
        <Col xs={24}>
          <Row>
            {buyOneOffUI}
            {relatedPasses?.length > 0 && buyWithPassUI}
            {relatedSubscriptions?.length > 0 && buyWithMembershipUI}
          </Row>
        </Col>
      </>
    );
  };

  const relatedCourseSection =
    relatedCourses.length > 0 ? (
      <Row gutter={[8, 8]}>
        <Col xs={24}>
          <Title level={5}>This video can only be accessed by purchasing the course(s) below</Title>
        </Col>
        {relatedCourses.map((course) => (
          <Col xs={24} md={12} lg={8} key={course.external_id}>
            <CourseListItem course={course} />
          </Col>
        ))}
      </Row>
    ) : null;

  //#endregion End of UI Components

  return (
    <div className={styles.videoDetailsPage}>
      <AuthModal visible={showAuthModal} closeModal={closeAuthModal} onLoggedInCallback={showConfirmPaymentPopup} />
      <Spin spinning={isLoading} tip="Fetching data...">
        <Row gutter={[8, 8]}>
          {/* Details Section */}
          <Col xs={24}>
            <Row gutter={[10, 10]}>
              {/* Video Details */}
              <Col xs={{ span: 24, order: 2 }} lg={{ span: 12, order: 2 }}>
                <Space direction="vertical">
                  <Title level={3} className={styles.videoTitle}>
                    {videoData?.title}
                  </Title>
                  <Space className={styles.videoDetailsContainer}>
                    {videoData?.source === videoSourceType.CLOUDFLARE ? (
                      <Text className={styles.videoDetailItem}>
                        <ClockCircleOutlined className={styles.detailIcons} />{' '}
                        {videoData?.duration > 0 ? getVideoMinutesDuration(videoData.duration) : '0 Mins'}
                      </Text>
                    ) : null}
                    <Text className={styles.videoDetailItem}>
                      <CalendarOutlined className={styles.detailIcons} /> {videoData?.validity ?? 0} days
                    </Text>
                  </Space>
                  <div className={styles.videoDescContainer}>
                    {renderVideoDocumentUrl()}
                    <Divider />
                    <div className={styles.videoDesc}>
                      {ReactHtmlParser(videoData?.description.split('!~!~!~')[0] ?? '')}
                    </div>
                  </div>
                </Space>
              </Col>
              {/* Video Image */}
              <Col xs={{ span: 24, order: 1 }} lg={{ span: 12, order: 2 }}>
                <div className={styles.videoImageContainer}>
                  <Image
                    loading="lazy"
                    width="100%"
                    src={videoData?.thumbnail_url}
                    className={styles.videoImage}
                    preview={false}
                    fallback={DefaultImage()}
                  />
                </div>
              </Col>
            </Row>
          </Col>
          {/* Buy Sections */}
          <Col xs={24}>{videoData?.is_course ? relatedCourseSection : renderBuySection()}</Col>
          {/* Similar Videos */}
          <Col xs={24}></Col>
        </Row>
      </Spin>
    </div>
  );
};

export default NewVideoDetails;
