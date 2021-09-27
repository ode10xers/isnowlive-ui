import React, { useState, useCallback, useEffect } from 'react';
import ReactHtmlParser from 'react-html-parser';
import classNames from 'classnames';

import { Row, Col, Button, Spin, Typography, Divider, Space, Drawer, Image, Statistic, message } from 'antd';
import {
  LikeOutlined,
  ScheduleOutlined,
  GiftOutlined,
  DollarOutlined,
  BookOutlined,
  FilePdfOutlined,
  DownloadOutlined,
} from '@ant-design/icons';

import apis from 'apis';

import {
  showErrorModal,
  showAlreadyBookedModal,
  showGetVideoWithPassSuccessModal,
  showPurchaseSingleVideoSuccessModal,
  showGetVideoWithSubscriptionSuccessModal,
} from 'components/Modals/modals';
import AuthModal from 'components/AuthModal';
import DocumentEmbed from 'components/DocumentEmbed';
import ContainerCard, { generateCardHeadingStyle } from 'components/ContainerCard';
import DynamicProfileComponentContainer from 'components/DynamicProfileComponentContainer';
import PassesListItem from 'components/DynamicProfileComponents/PassesProfileComponent/PassesListItem';
import CourseListItem from 'components/DynamicProfileComponents/CoursesProfileComponent/CoursesListItem';
import SubscriptionsListView from 'components/DynamicProfileComponents/SubscriptionsProfileComponent/SubscriptionListView';

import dateUtil from 'utils/date';
import { getLocalUserDetails } from 'utils/storage';
import { generateColorPalletteForProfile, getNewProfileUIMaxWidth } from 'utils/colors';
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

import { useGlobalContext } from 'services/globalContext';

import styles from './style.module.scss';

const { Title, Text, Paragraph } = Typography;

const {
  formatDate: { getVideoMinutesDuration },
  timezoneUtils: { getTimezoneLocation },
} = dateUtil;

/** @deprecated */
const VideoDetails = ({ match, history }) => {
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
  const [usableSubscription, setUsableSubscription] = useState(null);
  const [usablePass, setUsablePass] = useState(null);
  const [shouldFollowUpGetVideo, setShouldFollowUpGetVideo] = useState(false);

  // Bottom Sheet States
  const [bottomSheetsView, setBottomSheetsView] = useState(null);
  const [bottomSheetsVisible, setBottomSheetsVisible] = useState(false);

  const [showDocumentPreview, setShowDocumentPreview] = useState(false);

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
      setUsableSubscription(await getUsableSubscriptionForVideo(videoExternalId));
      setUsablePass(await getUsablePassForVideo(videoExternalId));
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

  useEffect(() => {
    let profileStyleObject = {};

    if (creatorProfile && creatorProfile?.profile?.new_profile) {
      profileStyleObject = { ...profileStyleObject, ...getNewProfileUIMaxWidth() };
    }

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

    if (userPurchasedSubscription && videoData?.total_price > 0) {
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
    } else if (userPurchasedPass && videoData?.total_price > 0) {
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

  //#region Start of UI Logics

  const handleShowDocumentPreview = (e) => {
    preventDefaults(e);
    setShowDocumentPreview((prevState) => !prevState);
  };

  const handleHideDocumentPreview = (e) => {
    preventDefaults(e);
    setShowDocumentPreview(false);
  };

  const handleMembershipBuyClicked = (e) => {
    preventDefaults(e);
    setBottomSheetsView('membership');
    setBottomSheetsVisible(true);
  };

  const handleVideoBuyClicked = (e) => {
    preventDefaults(e);
    setShowAuthModal(true);
  };

  const handleBottomSheetsClosed = (e) => {
    preventDefaults(e);
    setBottomSheetsVisible(false);
  };

  const closeAuthModal = () => {
    setShowAuthModal(false);
  };

  //#endregion End of UI Logics

  //#region Start of UI Handlers

  const renderVideoDetailItem = (value) => <Text className={styles.videoDetailItem}>{value}</Text>;

  const renderPassItems = (pass) => (
    <Col xs={12} md={8} lg={!creatorProfile?.profile?.new_profile ? 8 : 6} key={pass.external_id}>
      <PassesListItem pass={pass} />
    </Col>
  );

  const renderCourseItems = (course) => (
    <Col
      xs={!creatorProfile?.profile?.new_profile ? 24 : 18}
      md={12}
      lg={!creatorProfile?.profile?.new_profile ? 12 : 8}
      key={course.id}
    >
      <CourseListItem course={course} />
    </Col>
  );

  const renderContainerComponent = (props, children) => {
    const ContainingComponent = creatorProfile?.profile?.new_profile ? DynamicProfileComponentContainer : ContainerCard;

    return (
      <Col xs={24}>
        <ContainingComponent {...props}>{children}</ContainingComponent>
      </Col>
    );
  };

  //#endregion End of UI Handlers

  //#region Start of UI Components

  const renderRelatedCoursesComponent = () => {
    if (!relatedCourses.length) {
      return null;
    }

    const componentChild = <Row gutter={[10, 10]}>{relatedCourses.map(renderCourseItems)}</Row>;

    const commonContainerProps = {
      title: 'Courses containing this video',
      icon: <BookOutlined className={styles.icon} />,
    };

    return renderContainerComponent(commonContainerProps, componentChild);
  };

  const renderRelatedPassesComponent = () => {
    if (!relatedPasses.length) {
      return null;
    }

    const componentChild = <Row gutter={[10, 10]}>{relatedPasses.map(renderPassItems)}</Row>;

    const commonContainerProps = {
      title: 'Buy a pass and this video',
      icon: <LikeOutlined className={styles.icon} />,
    };

    return renderContainerComponent(commonContainerProps, componentChild);
  };

  const renderRelatedSubscriptionsComponent = () => {
    if (!relatedSubscriptions.length) {
      return null;
    }

    const componentChild = (
      <SubscriptionsListView subscriptions={relatedSubscriptions} isContained={!creatorProfile?.profile?.new_profile} />
    );

    const commonContainerProps = {
      title: 'Memberships',
      icon: <ScheduleOutlined className={styles.icon} />,
    };

    return renderContainerComponent(commonContainerProps, componentChild);
  };

  const documentPreview =
    showDocumentPreview && videoData && videoData?.is_public_document && videoData?.document?.url ? (
      <div className={styles.filePreviewContainer}>
        <Row gutter={[8, 8]}>
          <Col xs={24} className={styles.textAlignCenter}>
            <Button danger ghost type="primary" onClick={handleHideDocumentPreview}>
              Close Preview
            </Button>
          </Col>
          <Col xs={24}>
            <DocumentEmbed documentLink={videoData?.document?.url ?? null} />
          </Col>
        </Row>
      </div>
    ) : null;

  const renderVideoDocument = () => {
    const documentData = videoData?.document ?? null;
    const isAccessibleByPublic = videoData?.is_public_document ?? false;
    const isDownloadable = videoData?.is_document_downloadable ?? false;

    if (!documentData) {
      return null;
    }

    const documentUrl = documentData.url;
    const filename =
      documentData.name || documentData.url.split('_').splice(1).join('_') || (isAccessibleByPublic ? 'View' : '');

    return (
      <Col xs={24}>
        <Paragraph className={styles.sectionHeading}>
          This video includes a PDF file
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

  //#endregion End of UI Components

  return (
    <div className={styles.videoDetailsPage}>
      <AuthModal visible={showAuthModal} closeModal={closeAuthModal} onLoggedInCallback={showConfirmPaymentPopup} />
      <Spin spinning={isLoading} tip="Fetching video details...">
        <Row gutter={[8, 8]}>
          {videoData && (
            <Col xs={24}>
              <Row gutter={[8, 8]} className={styles.videoDataContainer}>
                {/* Video Thumbnail */}
                <Col xs={24}>
                  <div className={styles.videoImageContainer}>
                    <Image preview={false} src={videoData.thumbnail_url} className={styles.videoImage} />
                  </div>
                </Col>

                {/* Video Title */}
                <Col xs={24}>
                  <Title level={3} className={styles.videoTitle}>
                    {videoData.title}
                  </Title>
                </Col>

                {/* Video Details */}
                <Col xs={24}>
                  <Space
                    size="large"
                    className={styles.videoDetailsContainer}
                    align="center"
                    split={<Divider type="vertical" className={styles.videoDetailsDivider} />}
                  >
                    <Statistic
                      title="Validity"
                      value={`${videoData?.validity} day${videoData?.validity > 1 ? 's' : ''}`}
                      formatter={renderVideoDetailItem}
                    />
                    {videoData.source === videoSourceType.CLOUDFLARE ? (
                      <Statistic
                        title="Duration"
                        value={getVideoMinutesDuration(videoData?.duration ?? 0)}
                        formatter={renderVideoDetailItem}
                      />
                    ) : null}
                  </Space>
                </Col>

                {/* Video Document */}
                {renderVideoDocument()}

                {/* Video Description */}
                <Col xs={24}>
                  <Paragraph className={styles.sectionHeading}> Description </Paragraph>
                  <div className={styles.videoDescription}>
                    {ReactHtmlParser(videoData?.description.split('!~!~!~')[0] ?? '')}
                  </div>
                </Col>
              </Row>
            </Col>
          )}

          {/* Related Products */}
          {videoData?.is_course ? (
            renderRelatedCoursesComponent()
          ) : (
            <>
              <Col xs={24}>
                <Row gutter={[8, 8]} justify="center" className={styles.buyContainer}>
                  {usableSubscription && videoData?.total_price > 0 ? (
                    <Col xs={24}>
                      <Row gutter={[12, 12]} justify="center" className={styles.buyVideoContainer}>
                        <Col xs={24}>
                          <Button
                            block
                            type="primary"
                            size="large"
                            className={classNames(
                              styles.buyVideoBtn,
                              isBrightColorShade(convertHexToRGB(creatorProfile?.profile?.color ?? '#1890ff'))
                                ? styles.darkText
                                : styles.lightText
                            )}
                            icon={<DollarOutlined />}
                            onClick={handleVideoBuyClicked}
                          >
                            <Space
                              split={<Divider className={styles.buyBtnDivider} />}
                              className={styles.buyVideoBtnContent}
                            >
                              <Text className={styles.buyVideoBtnText}> BUY WITH MEMBERSHIP </Text>
                              <Text className={styles.buyVideoBtnText}>
                                {videoData?.pay_what_you_want ? (
                                  'Flexible'
                                ) : videoData?.total_price > 0 ? (
                                  <>
                                    {videoData?.currency?.toUpperCase()} <del>{videoData?.total_price}</del> 0
                                  </>
                                ) : (
                                  'Free'
                                )}
                              </Text>
                            </Space>
                          </Button>
                        </Col>
                        <Col xs={24}>
                          <Paragraph className={styles.buyVideoDesc}>
                            Get this video for 1 credit with your <br />
                            purchased <b> {usableSubscription.subscription_name} </b> membership. You currently have{' '}
                            {usableSubscription.product_credits - usableSubscription.product_credits_used} credits left.
                          </Paragraph>
                        </Col>
                      </Row>
                    </Col>
                  ) : usablePass && videoData?.total_price > 0 ? (
                    <Col xs={24}>
                      <Row gutter={[12, 12]} justify="center" className={styles.buyVideoContainer}>
                        <Col xs={24}>
                          <Button
                            block
                            type="primary"
                            size="large"
                            className={classNames(
                              styles.buyVideoBtn,
                              isBrightColorShade(convertHexToRGB(creatorProfile?.profile?.color ?? '#1890ff'))
                                ? styles.darkText
                                : styles.lightText
                            )}
                            icon={<DollarOutlined />}
                            onClick={handleVideoBuyClicked}
                          >
                            <Space
                              split={<Divider className={styles.buyBtnDivider} />}
                              className={styles.buyVideoBtnContent}
                            >
                              <Text className={styles.buyVideoBtnText}> BUY WITH PASS </Text>
                              <Text className={styles.buyVideoBtnText}>
                                {videoData?.pay_what_you_want ? (
                                  <>
                                    {videoData?.currency?.toUpperCase()} <del>Flexible</del> 0
                                  </>
                                ) : videoData?.total_price > 0 ? (
                                  <>
                                    {videoData?.currency?.toUpperCase()} <del>{videoData?.total_price}</del> 0
                                  </>
                                ) : (
                                  'Free'
                                )}
                              </Text>
                            </Space>
                          </Button>
                        </Col>
                        <Col xs={24}>
                          <Paragraph className={styles.buyVideoDesc}>
                            Get this video for 1 credit with your <br />
                            purchased <b> {usablePass.pass_name} </b> Pass. You currently have
                            {usablePass.classes_remaining} credits left.
                          </Paragraph>
                        </Col>
                      </Row>
                    </Col>
                  ) : (
                    <>
                      {relatedSubscriptions?.length > 0 && (
                        <Col xs={24} sm={12}>
                          <Row gutter={[12, 12]} justify="center" className={styles.buyMembershipContainer}>
                            <Col xs={24}>
                              <Button
                                block
                                type="primary"
                                size="large"
                                className={styles.buyMembershipBtn}
                                icon={<GiftOutlined />}
                                onClick={handleMembershipBuyClicked}
                              >
                                SUBSCRIBE AND BOOK
                              </Button>
                            </Col>
                            <Col xs={24}>
                              <Paragraph className={styles.buyMembershipDesc}>
                                Subscribe to a membership for discounted price.
                              </Paragraph>
                            </Col>
                          </Row>
                        </Col>
                      )}
                      <Col xs={24} sm={12}>
                        <Row gutter={[12, 12]} justify="center" className={styles.buyVideoContainer}>
                          <Col xs={24}>
                            <Button
                              block
                              type="primary"
                              size="large"
                              className={classNames(
                                styles.buyVideoBtn,
                                isBrightColorShade(convertHexToRGB(creatorProfile?.profile?.color ?? '#1890ff'))
                                  ? styles.darkText
                                  : styles.lightText
                              )}
                              icon={<DollarOutlined />}
                              onClick={handleVideoBuyClicked}
                            >
                              <Space
                                split={<Divider className={styles.buyBtnDivider} />}
                                className={styles.buyVideoBtnContent}
                              >
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
                    </>
                  )}
                </Row>
              </Col>
              {relatedPasses?.length > 0 && renderRelatedPassesComponent()}
              {relatedSubscriptions?.length > 0 && renderRelatedSubscriptionsComponent()}
            </>
          )}
        </Row>
      </Spin>
      <Drawer
        placement="bottom"
        height={560}
        bodyStyle={{ padding: 10 }}
        title={
          <Text style={{ color: 'var(--passion-profile-darker-color, #0050B3)' }}>
            {bottomSheetsView === 'membership' ? 'Select your plan' : 'Select the pass to buy'}
          </Text>
        }
        headerStyle={generateCardHeadingStyle()}
        visible={bottomSheetsVisible}
        onClose={handleBottomSheetsClosed}
        className={styles.videoBottomSheets}
      >
        {bottomSheetsView === 'membership' ? (
          <SubscriptionsListView
            subscriptions={relatedSubscriptions}
            isContained={!creatorProfile?.profile?.new_profile}
          />
        ) : null}
      </Drawer>
    </div>
  );
};

export default VideoDetails;
