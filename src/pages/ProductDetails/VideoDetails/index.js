import React, { useState, useCallback, useEffect } from 'react';
import ReactHtmlParser from 'react-html-parser';

import { Row, Col, Button, Spin, Typography, Divider, Space, Drawer, Image, Statistic, message } from 'antd';
import { BookTwoTone, LikeTwoTone, ScheduleTwoTone, GiftOutlined, DollarOutlined } from '@ant-design/icons';

import apis from 'apis';

import {
  showErrorModal,
  showAlreadyBookedModal,
  showGetVideoWithPassSuccessModal,
  showGetVideoWithSubscriptionSuccessModal,
} from 'components/Modals/modals';
import AuthModal from 'components/AuthModal';
import ContainerCard, { generateCardHeadingStyle } from 'components/ContainerCard';
import PassesListItem from 'components/DynamicProfileComponents/PassesProfileComponent/PassesListItem';
import CourseListItem from 'components/DynamicProfileComponents/CoursesProfileComponent/CoursesListItem';
import SubscriptionsListView from 'components/DynamicProfileComponents/SubscriptionsProfileComponent/SubscriptionListView';

import dateUtil from 'utils/date';
import {
  isAPISuccess,
  preventDefaults,
  paymentSource,
  orderType,
  productType,
  isUnapprovedUserError,
} from 'utils/helper';

import { useGlobalContext } from 'services/globalContext';

import styles from './style.module.scss';
import { getLocalUserDetails } from 'utils/storage';

const { Title, Text, Paragraph } = Typography;

const {
  formatDate: { getVideoMinutesDuration },
  timezoneUtils: { getTimezoneLocation },
} = dateUtil;

const VideoDetails = ({ match, history }) => {
  const videoId = match.params.video_id;

  const {
    showPaymentPopup,
    state: { userDetails },
  } = useGlobalContext();

  const [isLoading, setIsLoading] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [videoData, setVideoData] = useState(null);

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
                subscription.products['VIDEO']?.credits > 0 &&
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

  //#endregion End of API Calls

  //#region Start of Use Effects

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
      console.log('Re-showing payment popup after fetch');
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

    if (userPurchasedSubscription && videoData?.price > 0) {
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
            price: videoData.price,
          },
        ],
        paymentInstrumentDetails: {
          type: paymentSource.SUBSCRIPTION,
          ...userPurchasedSubscription,
        },
      };

      showPaymentPopup(paymentPopupData, async () => await buyVideoUsingSubscription());
    } else if (userPurchasedPass && videoData?.price > 0) {
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
            price: videoData.price,
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
            price: videoData?.price,
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
    <Col xs={12} sm={8} key={pass.external_id}>
      <PassesListItem pass={pass} />
    </Col>
  );

  const renderCourseItems = (course) => (
    <Col xs={24} sm={12} key={course.id}>
      <CourseListItem course={course} />
    </Col>
  );

  //#endregion End of UI Handlers

  //#region Start of UI Components

  const relatedCoursesComponent = (
    <Col xs={24}>
      <ContainerCard
        title="Courses containing this video"
        icon={<BookTwoTone className={styles.mr10} twoToneColor="#0050B3" />}
      >
        <Row gutter={[10, 10]}>{relatedCourses.map(renderCourseItems)}</Row>
      </ContainerCard>
    </Col>
  );

  const relatedPassesComponent = (
    <Col xs={24}>
      <ContainerCard
        title="Buy a pass and this video"
        icon={<LikeTwoTone className={styles.mr10} twoToneColor="#0050B3" />}
      >
        <Row gutter={[10, 10]}>{relatedPasses.map(renderPassItems)}</Row>
      </ContainerCard>
    </Col>
  );

  const relatedSubscriptionsComponent = (
    <Col xs={24}>
      <ContainerCard title="Memberships" icon={<ScheduleTwoTone className={styles.mr10} twoToneColor="#0050B3" />}>
        <SubscriptionsListView subscriptions={relatedSubscriptions} />
      </ContainerCard>
    </Col>
  );

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
                    <Statistic
                      title="Duration"
                      value={getVideoMinutesDuration(videoData?.duration ?? 0)}
                      formatter={renderVideoDetailItem}
                    />
                  </Space>
                </Col>

                {/* Video Description */}
                <Col xs={24}>
                  <div className={styles.videoDescription}>{ReactHtmlParser(videoData?.description)}</div>
                </Col>
              </Row>
            </Col>
          )}

          {/* Related Products */}
          {videoData?.is_course ? (
            relatedCoursesComponent
          ) : (
            <>
              <Col xs={24}>
                <Row gutter={[8, 8]} justify="center" className={styles.buyContainer}>
                  {usableSubscription && videoData?.price > 0 ? (
                    <Col xs={24}>
                      <Row gutter={[12, 12]} justify="center" className={styles.buyVideoContainer}>
                        <Col xs={24}>
                          <Button
                            block
                            type="primary"
                            size="large"
                            className={styles.buyVideoBtn}
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
                                ) : videoData?.price > 0 ? (
                                  <>
                                    {' '}
                                    {videoData?.currency?.toUpperCase()} <del>{videoData?.price}</del> 0{' '}
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
                            purchased <b> {usableSubscription.subscription_name} </b> membership. You'll be left with{' '}
                            {usableSubscription.products['VIDEO'].credits -
                              usableSubscription.products['VIDEO'].credits_used -
                              1}{' '}
                            credits.
                          </Paragraph>
                        </Col>
                      </Row>
                    </Col>
                  ) : usablePass && videoData?.price > 0 ? (
                    <Col xs={24}>
                      <Row gutter={[12, 12]} justify="center" className={styles.buyVideoContainer}>
                        <Col xs={24}>
                          <Button
                            block
                            type="primary"
                            size="large"
                            className={styles.buyVideoBtn}
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
                                  'Flexible'
                                ) : videoData?.price > 0 ? (
                                  <>
                                    {videoData?.currency?.toUpperCase()} <del>{videoData?.price}</del> 0{' '}
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
                            purchased <b> {usablePass.pass_name} </b> Pass. You'll be left with{' '}
                            {usablePass.classes_remaining} credits.
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
                                Subscribe and never miss a video.
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
                              className={styles.buyVideoBtn}
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
                                    : videoData?.price > 0
                                    ? `${videoData?.currency?.toUpperCase()} ${videoData?.price}`
                                    : 'Free'}
                                </Text>
                              </Space>
                            </Button>
                          </Col>
                          <Col xs={24}>
                            <Paragraph className={styles.buyVideoDesc}>
                              Get the flexibility of choosing different <br />
                              videos as per your convenience.
                            </Paragraph>
                          </Col>
                        </Row>
                      </Col>
                    </>
                  )}
                </Row>
              </Col>
              {relatedPasses?.length > 0 && relatedPassesComponent}
              {relatedSubscriptions?.length > 0 && relatedSubscriptionsComponent}
            </>
          )}
        </Row>
      </Spin>
      <Drawer
        placement="bottom"
        height={560}
        bodyStyle={{ padding: 10 }}
        title={
          bottomSheetsView === 'membership' ? (
            <Text style={{ color: '#0050B3' }}>Select your plan</Text>
          ) : (
            <Text style={{ color: '#0050B3' }}>Select the pass to buy</Text>
          )
        }
        headerStyle={generateCardHeadingStyle()}
        visible={bottomSheetsVisible}
        onClose={handleBottomSheetsClosed}
        className={styles.videoBottomSheets}
      >
        {bottomSheetsView === 'membership' ? <SubscriptionsListView subscriptions={relatedSubscriptions} /> : null}
      </Drawer>
    </div>
  );
};

export default VideoDetails;
