import React, { useState, useEffect, useCallback } from 'react';
import ReactHtmlParser from 'react-html-parser';
import classNames from 'classnames';
import { Row, Col, Button, Grid, Image, Typography, Space, Spin, Divider, message } from 'antd';
import {
  FilePdfOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  PlusCircleFilled,
  PlusOutlined,
  DownloadOutlined,
} from '@ant-design/icons';

import apis from 'apis';

import {
  showErrorModal,
  showAlreadyBookedModal,
  showGetVideoWithPassSuccessModal,
  showPurchaseSingleVideoSuccessModal,
  showPurchasePassAndGetVideoSuccessModal,
  showGetVideoWithSubscriptionSuccessModal,
  showPurchaseSubscriptionAndGetVideoSuccessModal,
} from 'components/Modals/modals';
import AuthModal from 'components/AuthModal';
import DocumentEmbed from 'components/DocumentEmbed';
import DefaultImage from 'components/Icons/DefaultImage';
import CourseListItem from 'components/DynamicProfileComponents/CoursesProfileComponent/CoursesListItem';
import SelectablePassItem from './SelectablePassItem';
import SelectableSubscriptionItem from './SelectableSubscriptionItem';
import VideoListCard from 'components/DynamicProfileComponents/VideosProfileComponent/VideoListCard';

import dateUtil from 'utils/date';
import { getUsernameFromUrl } from 'utils/url';
import { getLocalUserDetails, saveGiftOrderData } from 'utils/storage';
import { isInIframeWidget, isWidgetUrl } from 'utils/widgets';
import { generateBaseCreditsText } from 'utils/subscriptions';
import { redirectToPluginVideoDetailsPage, redirectToVideosPage } from 'utils/redirect';
import { isAPISuccess, preventDefaults, isUnapprovedUserError } from 'utils/helper';
import { generateColorPalletteForProfile, convertHexToRGB, isBrightColorShade } from 'utils/colors';
import { orderType, productType, paymentSource, videoSourceType, reservedDomainName } from 'utils/constants';

import { useGlobalContext } from 'services/globalContext';

import styles from './style.module.scss';

const {
  formatDate: { getVideoMinutesDuration, toShortDate },
  timezoneUtils: { getTimezoneLocation },
} = dateUtil;

const { Title, Text, Paragraph } = Typography;
const { useBreakpoint } = Grid;

const paymentInstruments = {
  ONE_OFF: 'one-off',
  PASS: 'pass',
  SUBSCRIPTION: 'subscription',
};

const NewVideoDetails = ({ match }) => {
  const videoId = match.params.video_id;

  const {
    showPaymentPopup,
    showGiftMessageModal,
    state: { userDetails },
  } = useGlobalContext();
  const { xs, sm, md, lg } = useBreakpoint();

  const [isLoading, setIsLoading] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [videoData, setVideoData] = useState(null);
  const [creatorProfile, setCreatorProfile] = useState(null);
  const [showDocumentPreview, setShowDocumentPreview] = useState(false);

  // Related Products State
  const [relatedSubscriptions, setRelatedSubscriptions] = useState([]);
  const [relatedPasses, setRelatedPasses] = useState([]);
  const [relatedCourses, setRelatedCourses] = useState([]);
  const [otherVideos, setOtherVideos] = useState([]);

  // User's usable Payment Instruments State
  const [usablePass, setUsablePass] = useState(null);
  const [usableSubscription, setUsableSubscription] = useState(null);
  const [shouldFollowUpGetVideo, setShouldFollowUpGetVideo] = useState(false);
  const [selectedPaymentInstrument, setSelectedPaymentInstrument] = useState(paymentInstruments.ONE_OFF);
  const [selectedPass, setSelectedPass] = useState(null);
  const [selectedSubscription, setSelectedSubscription] = useState(null);

  const [purchaseAsGift, setPurchaseAsGift] = useState(false);

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
                subscription.product_credits > subscription.product_credits_used &&
                subscription.products['VIDEO'] &&
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

  // TODO: Test this case later
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

  const fetchOtherVideos = useCallback(async () => {
    try {
      const { status, data } = await apis.videos.getVideosByUsername();

      if (isAPISuccess(status) && data) {
        setOtherVideos(data.sort((a, b) => (a.total_price ?? a.price) - (b.total_price ?? b.price)));
      }
    } catch (error) {
      console.error(error);
    }
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

  // Fetching data required for UI
  useEffect(() => {
    fetchVideoDetails(videoId);
    fetchRelatedPassesForVideo(videoId);
    fetchRelatedSubscriptionsForVideo(videoId);
    fetchOtherVideos();
  }, [videoId, fetchVideoDetails, fetchRelatedPassesForVideo, fetchRelatedSubscriptionsForVideo, fetchOtherVideos]);

  // Use Effect logic to handle when user lands in the page already logged in
  useEffect(() => {
    if (userDetails) {
      fetchUserPaymentInstruments(videoId);
    } else {
      setUsablePass(null);
      setUsableSubscription(null);
    }
  }, [videoId, userDetails, fetchUserPaymentInstruments]);

  useEffect(() => {
    if (shouldFollowUpGetVideo) {
      showConfirmPaymentPopup(purchaseAsGift);
    }
    //eslint-disable-next-line
  }, [shouldFollowUpGetVideo, purchaseAsGift]);

  //#endregion End of Use Effects

  //#region Start of Business Logics

  const purchaseVideo = async (payload) => await apis.videos.createOrderForUser(payload);

  const buySingleVideo = async (couponCode = '', priceAmount = 5, isGift = false) => {
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
          if (isGift) {
            saveGiftOrderData({
              ...data,
              order_type: orderType.VIDEO,
            });
            showGiftMessageModal();
          } else {
            showPurchaseSingleVideoSuccessModal(data.payment_order_id);
          }

          return {
            ...data,
            is_successful_order: false,
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
            is_successful_order: false,
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
          is_successful_order: false,
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
            is_successful_order: false,
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
          is_successful_order: false,
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

  const showConfirmPaymentPopup = async (purchaseAsGift = false) => {
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

    if (purchaseAsGift) {
      // Buy as gift
      let flexiblePaymentDetails = null;

      if (videoData?.pay_what_you_want) {
        flexiblePaymentDetails = {
          enabled: true,
          minimumPrice: videoData?.total_price,
        };
      }

      const paymentPopupData = {
        isGiftPurchase: true,
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

      showPaymentPopup(paymentPopupData, (couponCode, price) => buySingleVideo(couponCode, price, true));
    } else if (selectedPaymentInstrument === paymentInstruments.SUBSCRIPTION && videoData?.total_price > 0) {
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
          minimumPrice: videoData?.total_price,
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

    setPurchaseAsGift(false);
  };

  //#endregion End of Business Logics

  //#region Start of Event handlers

  const closeAuthModal = () => {
    setShowAuthModal(false);
  };

  const handleShowDocumentPreview = (e) => {
    preventDefaults(e);
    setShowDocumentPreview((prevState) => !prevState);
  };

  const handleHideDocumentPreview = (e) => {
    preventDefaults(e);
    setShowDocumentPreview(false);
  };

  const handleDeselectPass = () => {
    setSelectedPass(null);
  };

  const handleDeselectSubscription = () => {
    setSelectedSubscription(null);
  };

  const handleBuy = () => {
    if (userDetails) {
      showConfirmPaymentPopup();
    } else {
      setShowAuthModal(true);
    }
  };

  const handleVideoBuyClicked = (e) => {
    preventDefaults(e);
    setSelectedPaymentInstrument(paymentInstruments.ONE_OFF);
    setPurchaseAsGift(false);
    handleBuy();
  };

  const handleBuyAsGiftClicked = (e) => {
    preventDefaults(e);
    setPurchaseAsGift(true);
    if (userDetails) {
      showConfirmPaymentPopup(true);
    } else {
      setShowAuthModal(true);
    }
  };

  const handleBuyVideoUsingPassClicked = (e) => {
    setPurchaseAsGift(false);
    if (!usablePass) {
      message.error('You need a valid credit pass first!');
    } else {
      setSelectedPaymentInstrument(paymentInstruments.PASS);
      handleBuy();
    }
  };

  const handleBuyVideoUsingSubscriptionClicked = (e) => {
    setPurchaseAsGift(false);
    if (!usableSubscription) {
      message.error('You need a valid subscription first!');
    } else {
      setSelectedPaymentInstrument(paymentInstruments.SUBSCRIPTION);
      handleBuy();
    }
  };

  const handleBuyPassAndVideoClicked = (e) => {
    setPurchaseAsGift(false);
    if (!selectedPass) {
      message.error('Please select a pass!');
    } else {
      setSelectedPaymentInstrument(paymentInstruments.PASS);
      handleBuy();
    }
  };

  const handleBuySubscriptionAndVideoClicked = (e) => {
    setPurchaseAsGift(false);
    if (!selectedSubscription) {
      message.error('Please select a membership!');
    } else {
      setSelectedPaymentInstrument(paymentInstruments.SUBSCRIPTION);
      handleBuy();
    }
  };

  const handleOtherVideoClicked = useCallback((video) => {
    if (isInIframeWidget() || isWidgetUrl()) {
      redirectToPluginVideoDetailsPage(video);
    } else {
      redirectToVideosPage(video);
    }
  }, []);

  //#endregion End of Event handlers

  //#region Start of UI Components

  const documentPreview =
    showDocumentPreview && videoData && videoData?.is_public_document && videoData?.document?.url ? (
      <div className={styles.filePreviewContainer}>
        <Row gutter={[8, 8]}>
          {videoData?.document?.url?.includes('/image/') ? (
            <Col xs={24} className={styles.textAlignCenter}>
              <Image
                loading="lazy"
                width="100%"
                preview={false}
                className={styles.mt10}
                src={videoData?.document?.url}
              />
            </Col>
          ) : videoData?.document?.url?.includes('.pdf') ? (
            <Col xs={24}>
              <DocumentEmbed
                activeButtonClass={classNames(
                  styles.filePreviewButton,
                  isBrightColorShade(convertHexToRGB(creatorProfile?.profile?.color ?? '#1890ff'))
                    ? styles.darkText
                    : styles.lightText
                )}
                documentLink={videoData?.document?.url ?? null}
              />
            </Col>
          ) : null}
        </Row>
      </div>
    ) : null;

  const renderVideoDocumentUrl = () => {
    const documentData = videoData?.document ?? null;

    if (!documentData) {
      return null;
    }

    const isAccessibleByPublic = videoData?.is_public_document ?? false;
    const isDownloadable = videoData?.is_document_downloadable ?? false;
    const documentUrl = documentData.url;

    const filename =
      documentData.name || documentData.url.split('_').splice(1).join('_') || (isAccessibleByPublic ? 'View' : '');

    return (
      <Col xs={24}>
        <Paragraph className={styles.sectionHeading}>
          This video includes a file
          {isAccessibleByPublic ? '' : ` that's only available after purchase`}
        </Paragraph>
        {isAccessibleByPublic ? (
          <Space>
            <Button
              className={classNames(
                styles.filePreviewButton,
                isBrightColorShade(convertHexToRGB(creatorProfile?.profile?.color ?? '#1890ff'))
                  ? styles.darkText
                  : styles.lightText
              )}
              type="primary"
              icon={<FilePdfOutlined />}
              onClick={handleShowDocumentPreview}
            >
              {filename}
            </Button>
            {isDownloadable ? (
              <Button
                ghost
                className={styles.fileDownloadButton}
                type="primary"
                icon={<DownloadOutlined />}
                onClick={() => window.open(documentUrl)}
              />
            ) : null}
            {showDocumentPreview && (
              <Button
                className={classNames(
                  styles.filePreviewButton,
                  isBrightColorShade(convertHexToRGB(creatorProfile?.profile?.color ?? '#1890ff'))
                    ? styles.darkText
                    : styles.lightText
                )}
                type="primary"
                onClick={handleHideDocumentPreview}
              >
                Close Preview
              </Button>
            )}
          </Space>
        ) : (
          <div className={styles.fileContainer}>
            <Text className={styles.fileName}>
              <FilePdfOutlined /> {filename}
            </Text>
          </div>
        )}
        {documentPreview}
      </Col>
    );
  };

  const renderDynamicBuyButton = () => {
    let normalBuyBtn = (
      <Button
        className={classNames(
          styles.videoBuyBtn,
          !isInIframeWidget() && isBrightColorShade(convertHexToRGB(creatorProfile?.profile?.color ?? '#1890ff'))
            ? styles.darkText
            : styles.lightText
        )}
        size="large"
        type="primary"
        onClick={handleVideoBuyClicked}
      >
        <Space
          align="center"
          split={<Divider type="vertical" className={styles.buyBtnDivider} />}
          className={styles.buyBtnTextContainer}
        >
          <Text className={styles.buyBtnText}>BUY THIS VIDEO</Text>
          <Text className={styles.buyBtnText}>
            {videoData?.pay_what_you_want
              ? 'Flexible'
              : videoData?.total_price > 0
              ? `${videoData?.currency?.toUpperCase() ?? ''} ${videoData?.total_price ?? 0}`
              : 'Free'}
          </Text>
        </Space>
      </Button>
    );

    if (usableSubscription && videoData?.total_price > 0) {
      normalBuyBtn = (
        <div className={styles.buyUsingMembershipContainer}>
          <Space direction="vertical" className={styles.w100}>
            <Button
              block
              className={classNames(
                styles.videoBuyBtn,
                !isInIframeWidget() && isBrightColorShade(convertHexToRGB(creatorProfile?.profile?.color ?? '#1890ff'))
                  ? styles.darkText
                  : styles.lightText
              )}
              size="large"
              type="primary"
              onClick={handleBuyVideoUsingSubscriptionClicked}
            >
              <Space
                align="center"
                split={<Divider type="vertical" className={styles.buyBtnDivider} />}
                className={styles.buyBtnTextContainer}
              >
                <Text className={styles.buyBtnText}> BUY USING MEMBERSHIP </Text>
                <Text className={styles.buyBtnText}>
                  {videoData?.pay_what_you_want ? (
                    <>
                      <del>Flexible</del> 0
                    </>
                  ) : videoData?.total_price > 0 ? (
                    <>
                      {videoData?.currency?.toUpperCase() ?? ''} <del>{videoData?.total_price ?? 0}</del> 0
                    </>
                  ) : (
                    'Free'
                  )}
                </Text>
              </Space>
            </Button>
            <Row gutter={[8, 8]} wrap={false} justify="end">
              <Col flex="1 1 auto">
                <Space direction="vertical" size="small">
                  <Text strong className={styles.usablePaymentInstrumentText}>
                    {usableSubscription?.subscription_name ?? ''}
                  </Text>
                  <Text className={styles.usablePaymentInstrumentText}>
                    {usableSubscription.product_credits - usableSubscription.product_credits_used}/
                    {usableSubscription.product_credits} credits left.
                  </Text>
                </Space>
              </Col>
              <Col flex="0 0 120px" className={styles.textAlignRight}>
                <Space direction="vertical" size="small" className={styles.textAlignRight}>
                  <Text strong className={styles.usablePaymentInstrumentText}>
                    Auto renews on
                  </Text>
                  <Text className={styles.usablePaymentInstrumentText}>{toShortDate(usableSubscription?.expiry)}</Text>
                </Space>
              </Col>
            </Row>
          </Space>
        </div>
      );
    } else if (usablePass && videoData?.total_price > 0) {
      normalBuyBtn = (
        <div className={styles.buyUsingPassContainer}>
          <Space direction="vertical" className={styles.w100}>
            <Button
              block
              className={classNames(
                styles.videoBuyBtn,
                !isInIframeWidget() && isBrightColorShade(convertHexToRGB(creatorProfile?.profile?.color ?? '#1890ff'))
                  ? styles.darkText
                  : styles.lightText
              )}
              size="large"
              type="primary"
              onClick={handleBuyVideoUsingPassClicked}
            >
              <Space
                align="center"
                split={<Divider type="vertical" className={styles.buyBtnDivider} />}
                className={styles.buyBtnTextContainer}
              >
                <Text className={styles.buyBtnText}> BUY USING PASS </Text>
                <Text className={styles.buyBtnText}>
                  {videoData?.pay_what_you_want ? (
                    <>
                      <del>Flexible</del> 0
                    </>
                  ) : videoData?.total_price > 0 ? (
                    <>
                      {videoData?.currency?.toUpperCase() ?? ''} <del>{videoData?.total_price ?? 0}</del> 0
                    </>
                  ) : (
                    'Free'
                  )}
                </Text>
              </Space>
            </Button>
            <Row gutter={[8, 8]} wrap={false} justify="end">
              <Col flex="1 1 auto">
                <Text strong className={styles.usablePaymentInstrumentText}>
                  {usablePass?.pass_name ?? ''}
                </Text>
              </Col>
              <Col flex="0 0 140px" className={styles.textAlignRight}>
                <Text strong className={styles.usablePaymentInstrumentText}>
                  {usablePass?.classes_remaining}/{usablePass?.class_count} credits left.
                </Text>
              </Col>
            </Row>
          </Space>
        </div>
      );
    }

    const giftBuyBtn = (
      <Button className={styles.giftBtn} size="large" type="primary" onClick={handleBuyAsGiftClicked}>
        Buy as gift
      </Button>
    );

    return (
      <Row gutter={[8, 8]} wrap={true}>
        <Col>{normalBuyBtn}</Col>
        <Col>{giftBuyBtn}</Col>
      </Row>
    );
  };

  const renderRelatedPassItems = (pass) => (
    <Col xs={24} md={12} key={pass.external_id}>
      <SelectablePassItem
        pass={pass}
        showExtra={true}
        onSelect={setSelectedPass}
        onDeselect={handleDeselectPass}
        isSelected={selectedPass?.external_id === pass.external_id}
      />
    </Col>
  );

  const renderRelatedSubscriptionItems = (subs) => (
    <Col xs={24} md={12} key={subs.external_id}>
      <SelectableSubscriptionItem
        subscription={subs}
        showExtra={true}
        onSelect={setSelectedSubscription}
        onDeselect={handleDeselectSubscription}
        isSelected={selectedSubscription?.external_id === subs.external_id}
      />
    </Col>
  );

  const renderPaymentInstrumentsSection = () => {
    const relatedPassesAvailable = relatedPasses.length > 0;
    const relatedSubscriptionAvailable = relatedSubscriptions.length > 0;

    if (!relatedPassesAvailable && !relatedSubscriptionAvailable) {
      return null;
    }

    let paymentInstrumentTextArr = [];

    if (relatedPassesAvailable) {
      paymentInstrumentTextArr.push('Pass');
    }

    if (relatedSubscriptionAvailable) {
      paymentInstrumentTextArr.push('Membership');
    }

    return (
      <div className={styles.paymentInstrumentsContainer}>
        <Row gutter={[12, 16]} justify="space-around">
          <Col xs={24} className={styles.textAlignCenter}>
            <Title level={3} className={styles.paymentInstrumentHeadingText}>
              Get discounted price when you buy this with a {paymentInstrumentTextArr.join(' or ')}{' '}
            </Title>
          </Col>
          {relatedPassesAvailable && (
            <Col xs={24} lg={12}>
              <div className={styles.paymentInstrumentSelectContainer}>
                <Row gutter={[8, 16]}>
                  <Col xs={24}>
                    <Title level={4} className={styles.paymentInstrumentSelectHeading}>
                      Buy with a credit pass
                    </Title>
                  </Col>
                  <Col xs={24} className={styles.textAlignCenter}>
                    <Text className={styles.paymentInstrumentSelectDescription}>
                      Select from one of the passes below
                    </Text>
                  </Col>
                  <Col xs={24}>
                    <Row gutter={[12, 12]} className={styles.paymentInstrumentSelectList}>
                      {relatedPasses.map(renderRelatedPassItems)}
                    </Row>
                  </Col>
                  <Col xs={24}>
                    <Divider />
                  </Col>
                  <Col xs={24}>
                    <Row gutter={[12, 12]} align="middle">
                      <Col xs={24} md={11}>
                        <div className={styles.smallProductPreview}>
                          <div className={styles.smallProductPreviewOverlay}>This Video (1 pass credit)</div>
                          <Image
                            loading="lazy"
                            width="100%"
                            src={videoData?.thumbnail_url}
                            className={styles.smallProductPreviewImage}
                            fallback={DefaultImage()}
                            preview={false}
                          />
                        </div>
                      </Col>
                      <Col xs={24} md={2} className={styles.textAlignCenter}>
                        <PlusCircleFilled className={styles.bundleSummaryIcon} />
                      </Col>
                      <Col xs={24} md={11}>
                        {selectedPass ? (
                          <div className={styles.paymentInstrumentBundleContainer}>
                            <SelectablePassItem
                              pass={selectedPass}
                              showExtra={true}
                              onSelect={setSelectedPass}
                              onDeselect={handleDeselectPass}
                              isSelected={true}
                            />
                          </div>
                        ) : (
                          <div className={styles.paymentInstrumentOutlineContainer}>
                            <div className={styles.paymentInstrumentOutline}>Select a Credit Pass</div>
                            <Paragraph className={styles.paymentInstrumentOutlineHelpText}>
                              Select a pass above
                            </Paragraph>
                          </div>
                        )}
                      </Col>
                    </Row>
                  </Col>
                  <Col xs={24}>
                    <Row gutter={[8, 12]} align="middle" className={styles.bundleSummaryContainer}>
                      <Col xs={24} md={14} className={styles.textAlignCenter}>
                        <Space
                          align="center"
                          className={styles.bundleSummaryTextContainer}
                          split={<PlusOutlined className={styles.bundleSummaryDivider} />}
                        >
                          <Text className={styles.bundleSummaryText} strong>
                            {videoData?.title}
                          </Text>
                          {selectedPass ? (
                            <Text className={styles.bundleSummaryText} strong>
                              {selectedPass.name}
                            </Text>
                          ) : (
                            <Text className={styles.bundleSummaryText}>Selected Pass</Text>
                          )}
                        </Space>
                      </Col>
                      <Col xs={24} md={10}>
                        <Button
                          block
                          disabled={!selectedPass}
                          className={classNames(
                            styles.videoBuyBtn,
                            !selectedPass ? styles.disabled : undefined,
                            !isInIframeWidget() &&
                              isBrightColorShade(convertHexToRGB(creatorProfile?.profile?.color ?? '#1890ff'))
                              ? styles.darkText
                              : styles.lightText
                          )}
                          type="primary"
                          onClick={handleBuyPassAndVideoClicked}
                        >
                          <Space
                            align="center"
                            size="small"
                            split={<Divider type="vertical" className={styles.buyBtnDivider} />}
                            className={styles.buyBtnTextContainer}
                          >
                            <Text className={styles.buyBtnText}> BUY VIDEO & PASS </Text>
                          </Space>
                        </Button>
                      </Col>
                    </Row>
                  </Col>
                </Row>
              </div>
            </Col>
          )}
          {relatedSubscriptionAvailable && (
            <Col xs={24} lg={12}>
              <div className={styles.paymentInstrumentSelectContainer}>
                <Row gutter={[8, 16]}>
                  <Col xs={24}>
                    <Title level={4} className={styles.paymentInstrumentSelectHeading}>
                      Buy with a membership
                    </Title>
                  </Col>
                  <Col xs={24} className={styles.textAlignCenter}>
                    <Text className={styles.paymentInstrumentSelectDescription}>
                      Select from one of the memberships below
                    </Text>
                  </Col>
                  <Col xs={24}>
                    <Row gutter={[12, 12]} className={styles.paymentInstrumentSelectList}>
                      {relatedSubscriptions.map(renderRelatedSubscriptionItems)}
                    </Row>
                  </Col>
                  <Col xs={24}>
                    <Divider />
                  </Col>
                  <Col xs={24}>
                    <Row gutter={[12, 12]} align="middle">
                      <Col xs={24} md={11}>
                        <div className={styles.smallProductPreview}>
                          <div className={styles.smallProductPreviewOverlay}>This Video (1 membership credit)</div>
                          <Image
                            loading="lazy"
                            width="100%"
                            src={videoData?.thumbnail_url}
                            className={styles.smallProductPreviewImage}
                            fallback={DefaultImage()}
                            preview={false}
                          />
                        </div>
                      </Col>
                      <Col xs={24} md={2} className={styles.textAlignCenter}>
                        <PlusCircleFilled className={styles.bundleSummaryIcon} />
                      </Col>
                      <Col xs={24} md={11}>
                        {selectedSubscription ? (
                          <div className={styles.paymentInstrumentBundleContainer}>
                            <SelectableSubscriptionItem
                              subscription={selectedSubscription}
                              showExtra={true}
                              onSelect={setSelectedSubscription}
                              onDeselect={handleDeselectSubscription}
                              isSelected={true}
                            />
                          </div>
                        ) : (
                          <div className={styles.paymentInstrumentOutlineContainer}>
                            <div className={styles.paymentInstrumentOutline}>Select a Membership</div>
                            <Paragraph className={styles.paymentInstrumentOutlineHelpText}>
                              Select a membership above
                            </Paragraph>
                          </div>
                        )}
                      </Col>
                    </Row>
                  </Col>
                  <Col xs={24}>
                    <Row gutter={[8, 12]} align="middle" className={styles.bundleSummaryContainer}>
                      <Col xs={24} md={14} className={styles.textAlignCenter}>
                        <Space
                          align="center"
                          className={styles.bundleSummaryTextContainer}
                          split={<PlusOutlined className={styles.bundleSummaryDivider} />}
                        >
                          <Text className={styles.bundleSummaryText} strong>
                            {videoData?.title}
                          </Text>
                          {selectedSubscription ? (
                            <Text className={styles.bundleSummaryText} strong>
                              {selectedSubscription.name}
                            </Text>
                          ) : (
                            <Text className={styles.bundleSummaryText}>Selected Membership</Text>
                          )}
                        </Space>
                      </Col>
                      <Col xs={24} md={10}>
                        <Button
                          block
                          disabled={!selectedSubscription}
                          className={classNames(
                            styles.videoBuyBtn,
                            !selectedSubscription ? styles.disabled : undefined,
                            !isInIframeWidget() &&
                              isBrightColorShade(convertHexToRGB(creatorProfile?.profile?.color ?? '#1890ff'))
                              ? styles.darkText
                              : styles.lightText
                          )}
                          type="primary"
                          onClick={handleBuySubscriptionAndVideoClicked}
                        >
                          <Space
                            align="center"
                            size="small"
                            split={<Divider type="vertical" className={styles.buyBtnDivider} />}
                            className={styles.buyBtnTextContainer}
                          >
                            <Text className={styles.buyBtnText}> BUY VIDEO & MEMBERSHIP </Text>
                          </Space>
                        </Button>
                      </Col>
                    </Row>
                  </Col>
                </Row>
              </div>
            </Col>
          )}
        </Row>
      </div>
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

  const otherVideosLimit = 5;

  const getVideoItemFlexLayout = () => {
    if (xs) {
      return '85%';
    } else if (lg) {
      return '24%';
    } else if (md) {
      return '30%';
    } else if (sm) {
      return '45%';
    } else {
      return 'auto';
    }
  };

  const similarVideosSection = (
    <div>
      <Row gutter={[8, 8]}>
        <Col xs={24}>
          <Title level={4} className={styles.similarVideosHeading}>
            Similar Videos
          </Title>
        </Col>
        <Col xs={24}>
          <Row gutter={[8, 8]} className={styles.horizontalVideoList}>
            {otherVideos
              .filter((video) => video.external_id !== videoData?.external_id)
              .slice(0, otherVideosLimit)
              .map((video) => (
                <Col flex={getVideoItemFlexLayout()} key={video.external_id}>
                  <VideoListCard video={video} handleClick={() => handleOtherVideoClicked(video)} />
                </Col>
              ))}
          </Row>
        </Col>
      </Row>
    </div>
  );

  //#endregion End of UI Components

  return (
    <div className={styles.videoDetailsPage}>
      <AuthModal visible={showAuthModal} closeModal={closeAuthModal} onLoggedInCallback={showConfirmPaymentPopup} />
      <Spin spinning={isLoading} tip="Fetching data...">
        <Row gutter={[8, 12]}>
          {/* Details Section */}
          <Col xs={24}>
            <Row gutter={[10, 10]}>
              {/* Video Details */}
              <Col xs={{ span: 24, order: 2 }} lg={{ span: 12, order: 2 }} className={styles.videoDetailsSection}>
                <Space direction="vertical" className={styles.w100}>
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
                    <div className={styles.videoDesc}>
                      {ReactHtmlParser(videoData?.description.split('!~!~!~')[0] ?? '')}
                    </div>
                  </div>
                  {!videoData?.is_course && renderDynamicBuyButton()}
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
          {renderVideoDocumentUrl()}
          {/* Buy Sections */}
          <Col xs={24}>
            {videoData?.is_course
              ? relatedCourseSection
              : !usablePass && !usableSubscription
              ? renderPaymentInstrumentsSection()
              : null}
          </Col>
          {/* Similar Videos */}
          {otherVideos.length > 0 && <Col xs={24}>{similarVideosSection}</Col>}
        </Row>
      </Spin>
    </div>
  );
};

export default NewVideoDetails;
