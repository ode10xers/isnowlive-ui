import React, { useEffect, useState, useCallback } from 'react';
import { Row, Col, Typography, Space, Divider, Card, Button, Tag, Image, message } from 'antd';
import { UpOutlined, DownOutlined } from '@ant-design/icons';
import classNames from 'classnames';

import apis from 'apis';

import CreatorProfile from 'components/CreatorProfile';
import Loader from 'components/Loader';
import VideoCard from 'components/VideoCard';
import SessionCards from 'components/SessionCards';
import ShowcaseCourseCard from 'components/ShowcaseCourseCard';
import SimpleVideoCardsList from 'components/SimpleVideoCardsList';
import AuthModal from 'components/AuthModal';
import {
  showAlreadyBookedModal,
  showSuccessModal,
  showErrorModal,
  showPurchasePassAndGetVideoSuccessModal,
  showGetVideoWithPassSuccessModal,
  showPurchaseSingleVideoSuccessModal,
  showGetVideoWithSubscriptionSuccessModal,
} from 'components/Modals/modals';

import dateUtil from 'utils/date';
import { isMobileDevice } from 'utils/device';
import { getLocalUserDetails } from 'utils/storage';
import { getUsernameFromUrl } from 'utils/url';
import { redirectToSessionsPage, redirectToVideosPage } from 'utils/redirect';
import {
  isAPISuccess,
  orderType,
  paymentSource,
  productType,
  reservedDomainName,
  isUnapprovedUserError,
} from 'utils/helper';

import { useGlobalContext } from 'services/globalContext';

import styles from './style.module.scss';

const { Title, Text, Paragraph } = Typography;
const {
  formatDate: { toLongDateWithDay },
  timezoneUtils: { getTimezoneLocation },
} = dateUtil;

// NOTE : Will be deprecated soon, to be replaced with NewVideoDetails
/** @deprecated */
const VideoDetails = ({ match }) => {
  const {
    showPaymentPopup,
    state: { userDetails },
  } = useGlobalContext();

  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState({});
  const [profileImage, setProfileImage] = useState(null);
  const [video, setVideo] = useState(null);
  const [courses, setCourses] = useState([]);
  const [showPurchaseVideoModal, setShowPurchaseVideoModal] = useState(false);
  const [availablePassesForVideo, setAvailablePassesForVideo] = useState([]);
  const [selectedPass, setSelectedPass] = useState(null);
  const [userPasses, setUserPasses] = useState([]);
  const [expandedPassKeys, setExpandedPassKeys] = useState([]);
  const [shouldFollowUpGetVideo, setShouldFollowUpGetVideo] = useState(false);
  const [usableUserSubscription, setUsableUserSubscription] = useState(null);

  const getProfileDetails = useCallback(async (creatorUsername) => {
    try {
      const { status, data } = creatorUsername
        ? await apis.user.getProfileByUsername(creatorUsername)
        : await apis.user.getProfile();
      if (isAPISuccess(status) && data) {
        setProfile(data);
        setProfileImage(data.profile_image_url);
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Failed to load profile details');
      setIsLoading(false);
    }
  }, []);

  const getCourseDetailsForVideo = useCallback(async (videoExternalid) => {
    try {
      const { status, data } = await apis.courses.getVideoCoursesByVideoId(videoExternalid);

      if (isAPISuccess(status) && data) {
        setCourses(data);
      }
    } catch (error) {
      console.error(
        'Failed to fetch courses data for video',
        error?.response?.data?.message || 'Something went wrong.'
      );
    }
  }, []);

  const getVideoDetails = useCallback(
    async (videoId) => {
      try {
        const { status, data } = await apis.videos.getVideoById(videoId);

        if (isAPISuccess(status) && data) {
          setVideo(data);

          const creatorUsername = data.creator_username || getUsernameFromUrl();
          await getProfileDetails(creatorUsername);

          if (data.is_course) {
            getCourseDetailsForVideo(videoId);
          }

          setIsLoading(false);
        } else {
          console.error('Failed to fetch video details', status);
        }
      } catch (error) {
        setIsLoading(false);
        message.error('Failed to load class video details');
      }
    },
    [getProfileDetails, getCourseDetailsForVideo]
  );

  const getAvailablePassesForVideo = useCallback(async (videoId) => {
    try {
      const { status, data } = await apis.passes.getPassesByVideoId(videoId);

      if (isAPISuccess(status) && data) {
        setAvailablePassesForVideo(data);
      }
    } catch (error) {
      console.error(error.response?.data?.message || 'Failed fetching available pass for video');
      setIsLoading(false);
    }
    //eslint-disable-next-line
  }, []);

  // TODO: Consider refactoring like subscription below
  const getUsablePassesForUser = useCallback(async (videoId) => {
    setIsLoading(true);
    try {
      const loggedInUserData = getLocalUserDetails();
      if (loggedInUserData) {
        const { status, data } = await apis.passes.getAttendeePassesForVideo(videoId);

        if (isAPISuccess(status) && data) {
          setUserPasses(
            data.active.map((userPass) => ({
              ...userPass,
              id: userPass.pass_id,
              name: userPass.pass_name,
            }))
          );
        }
      }
    } catch (error) {
      setIsLoading(false);

      if (!isUnapprovedUserError(error.response)) {
        message.error(error.response?.data?.message || 'Failed fetching usable pass for user');
      }
    }
    setIsLoading(false);
  }, []);

  const getUsableSubscriptionForUser = useCallback(async (videoId) => {
    setIsLoading(true);
    try {
      const loggedInUserData = getLocalUserDetails();

      if (loggedInUserData) {
        // TODO: Can put this as a generic helper
        const { status, data } = await apis.subscriptions.getUserSubscriptionForVideo(videoId);

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
                  subscription.products['VIDEO']?.product_ids?.includes(videoId)
              ) || null;

            console.log(usableSubscription);

            setUsableUserSubscription(usableSubscription);
          } else {
            setUsableUserSubscription(null);
          }
        }
      }
    } catch (error) {
      message.error(error?.response?.data?.message || 'Failed fetching usable membership for user');
    }
    setIsLoading(false);
  }, []);

  const openPurchaseVideoModal = () => {
    setSelectedPass(null);
    setShowPurchaseVideoModal(true);
  };

  const openPurchasePassModal = (pass) => {
    setSelectedPass(pass);
    setShowPurchaseVideoModal(true);
  };

  const closeAuthModal = () => {
    setShowPurchaseVideoModal(false);
  };

  const showPassDetails = (passId) => {
    const currExpandedPassKeys = expandedPassKeys;
    currExpandedPassKeys.push(passId);
    setExpandedPassKeys([...new Set(currExpandedPassKeys)]);
  };

  const hidePassDetails = (passId) => {
    const currExpandedPassKeys = expandedPassKeys;
    setExpandedPassKeys(currExpandedPassKeys.filter((passKeys) => passKeys !== passId));
  };

  useEffect(() => {
    if (match.params.video_id) {
      const domainUsername = getUsernameFromUrl();
      if (domainUsername && !reservedDomainName.includes(domainUsername)) {
        getVideoDetails(match.params.video_id);
        getAvailablePassesForVideo(match.params.video_id);
      }

      if (getLocalUserDetails()) {
        getUsablePassesForUser(match.params.video_id);
        getUsableSubscriptionForUser(match.params.video_id);
      }
    } else {
      setIsLoading(false);
      message.error('Video details not found.');
    }
    //eslint-disable-next-line
  }, [match.params.video_id]);

  // This logic is for resetting the UI
  // If the user logs out (e.g. from the header button)
  useEffect(() => {
    if (!userDetails) {
      setUserPasses([]);
      setUsableUserSubscription(null);
    }
  }, [userDetails]);

  useEffect(() => {
    if (shouldFollowUpGetVideo) {
      showConfirmPaymentPopup();
    }
    //eslint-disable-next-line
  }, [shouldFollowUpGetVideo]);

  const purchaseVideo = async (payload) => await apis.videos.createOrderForUser(payload);

  const getUserPurchasedPass = (getDefault = false) => {
    if (userPasses.length > 0) {
      if (selectedPass && !getDefault) {
        return userPasses.filter((userPass) => userPass.id === selectedPass.id)[0];
      }

      return userPasses[0];
    }

    return null;
  };

  const buySingleVideo = async (couponCode = '', priceAmount = 5) => {
    setIsLoading(true);

    try {
      let payload = {
        video_id: video.external_id,
        payment_source: paymentSource.GATEWAY,
        user_timezone_location: getTimezoneLocation(),
        coupon_code: couponCode,
      };

      if (video.pay_what_you_want) {
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
          // This popup will only show up in very edge cases
          if (selectedPass) {
            const modalContent = (
              <>
                <Paragraph> You tried to use a pass to book a free video </Paragraph>
                <Paragraph>
                  {' '}
                  To prevent unnecessary payment/credit usage, we got the video for you without using the pass.{' '}
                </Paragraph>
                <Paragraph> You can see all your purchases in one place in your dashboard </Paragraph>
              </>
            );

            showSuccessModal('Video Purchase Successful', modalContent);
            setSelectedPass(null);
          } else {
            showPurchaseSingleVideoSuccessModal(data.video_order_id);
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

  // TODO : When Pass has PWYW, modify to be similar like buySingleVideo
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
              productId: video.external_id,
            },
          };
        } else {
          // It's a free pass, so we immediately book the video after this
          const followUpGetVideo = await purchaseVideo({
            video_id: video.external_id,
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
      const usableUserPass = getUserPurchasedPass(true);

      const payload = {
        video_id: video.external_id,
        payment_source: paymentSource.PASS,
        source_id: usableUserPass.pass_order_id,
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
        video_id: video.external_id,
        payment_source: paymentSource.SUBSCRIPTION,
        source_id: usableUserSubscription.subscription_order_id,
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
    if (!shouldFollowUpGetVideo) {
      // If user logged in from AuthModal
      // We fetch the usable subscriptions/pass info
      if (getLocalUserDetails() && (userPasses.length <= 0 || !usableUserSubscription)) {
        if (userPasses.length <= 0) {
          await getUsablePassesForUser(match.params.video_id);
        }

        if (!usableUserSubscription) {
          await getUsableSubscriptionForUser(match.params.video_id);
        }

        setShouldFollowUpGetVideo(true);
        return;
      }
    } else {
      setShouldFollowUpGetVideo(false);
    }

    const videoDesc = `Can be watched up to ${video.watch_limit} times, valid for ${video.validity} days`;

    const usableUserPass = getUserPurchasedPass(true);
    if (usableUserSubscription && video?.total_price > 0) {
      // Get Video using Subscription
      // If user have a subscription usable for purchasing this product
      // We prioritize using that subscription

      const paymentPopupData = {
        productId: video.external_id,
        productType: productType.VIDEO,
        itemList: [
          {
            name: video.title,
            description: videoDesc,
            currency: video.currency,
            price: video.total_price,
          },
        ],
        paymentInstrumentDetails: {
          type: paymentSource.SUBSCRIPTION,
          ...usableUserSubscription,
        },
      };

      showPaymentPopup(paymentPopupData, async () => await buyVideoUsingSubscription());
    } else if (usableUserPass && video?.total_price > 0) {
      // Get Video using Pass
      // If user have usable pass for this video
      // We use the pass to get the video
      // If video is a free one, we redirect them to
      // Single video booking flow to prevent accidental credit usage
      const paymentPopupData = {
        productId: video.external_id,
        productType: productType.VIDEO,
        itemList: [
          {
            name: video.title,
            description: videoDesc,
            currency: video.currency,
            price: video.total_price,
          },
        ],
        paymentInstrumentDetails: {
          type: paymentSource.PASS,
          ...usableUserPass,
        },
      };

      showPaymentPopup(paymentPopupData, async () => await buyVideoUsingPass());
    } else if (selectedPass && video?.total_price > 0) {
      // Buy Pass and Get Video
      // If user decide to buy pass along with video
      // We first buy the pass, then followup book the video
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
            name: video.title,
            description: videoDesc,
            currency: video.currency,
            price: 0,
          },
        ],
      };

      showPaymentPopup(paymentPopupData, buyPassAndGetVideo);
    } else {
      // Single Video Booking
      // Will also trigger for free video

      let flexiblePaymentDetails = null;

      if (video.pay_what_you_want) {
        flexiblePaymentDetails = {
          enabled: true,
          minimumPrice: video.total_price,
        };
      }

      const paymentPopupData = {
        productId: video.external_id,
        productType: productType.VIDEO,
        itemList: [
          {
            name: video.title,
            description: videoDesc,
            currency: video.currency,
            price: video.total_price,
            pay_what_you_want: video.pay_what_you_want,
          },
        ],
        flexiblePaymentDetails,
      };

      showPaymentPopup(paymentPopupData, buySingleVideo);
    }
  };

  const renderPassCards = (pass, purchased = false) => (
    <Card className={styles.videoCard} bodyStyle={{ padding: isMobileDevice ? 15 : 24 }} key={pass?.id}>
      <Row gutter={[16, 16]} align="center">
        <Col xs={24} md={16} xl={18}>
          <Row gutter={[8, 16]}>
            <Col xs={24} className={styles.headerWrapper}>
              <Row gutter={16}>
                <Col xs={24} md={17} xl={19} className={styles.textAlignLeft}>
                  <Title level={5}> {pass?.name} </Title>
                </Col>
                <Col xs={24} md={7} xl={5} className={styles.passPriceText}>
                  <Title level={5}>
                    {purchased ? (
                      <>
                        {pass?.currency.toUpperCase()} 0 <del>{video?.total_price}</del>
                      </>
                    ) : (
                      `${pass?.currency.toUpperCase()} ${pass?.total_price}`
                    )}
                  </Title>
                </Col>
              </Row>
            </Col>
            <Col xs={24}>
              {purchased ? (
                <Space size={isMobileDevice ? 'small' : 'middle'}>
                  <Text className={classNames(styles.blueText, styles.textAlignCenter)} strong>
                    {pass?.classes_remaining}/{pass?.class_count} credits left
                  </Text>
                  <Divider type="vertical" />
                  <Text className={classNames(styles.blueText, styles.textAlignCenter)} strong>
                    Pass is valid till : {toLongDateWithDay(pass?.expiry)}
                  </Text>
                </Space>
              ) : (
                <Space size={isMobileDevice ? 'small' : 'middle'}>
                  <Text className={classNames(styles.blueText, styles.textAlignCenter)} strong>
                    {pass?.limited ? `${pass?.class_count} Credits` : 'Unlimited Credits'}
                  </Text>
                  <Divider type="vertical" />
                  <Text className={classNames(styles.blueText, styles.textAlignCenter)} strong>
                    {`${pass?.validity} Days Validity`}
                  </Text>
                </Space>
              )}
            </Col>
          </Row>
        </Col>
        <Col xs={24} md={8} xl={6}>
          <Row gutter={[8, 16]} justify="center">
            <Col xs={12} md={24}>
              <Button block type="primary" onClick={() => openPurchasePassModal(pass)}>
                {purchased ? 'Buy Video' : 'Buy Pass'}
              </Button>
            </Col>
            <Col xs={12} md={24}>
              {expandedPassKeys.includes(pass?.id) ? (
                <Button block type="default" onClick={() => hidePassDetails(pass?.id)} icon={<UpOutlined size={16} />}>
                  Detail
                </Button>
              ) : (
                <Button
                  block
                  type="default"
                  onClick={() => showPassDetails(pass?.id)}
                  icon={<DownOutlined size={16} />}
                >
                  Detail
                </Button>
              )}
            </Col>
          </Row>
        </Col>
        {expandedPassKeys.includes(pass?.id) && (
          <>
            {pass?.sessions?.length > 0 && (
              <>
                <Col xs={24}>
                  <Text strong> Sessions bookable with this pass </Text>
                </Col>
                {isMobileDevice ? (
                  <Col xs={24}>
                    {pass?.sessions?.map((session) => (
                      <Tag
                        key={`${purchased ? pass?.pass_order_id : pass?.id}_${session?.session_id}`}
                        color="blue"
                        onClick={() => redirectToSessionsPage(session)}
                      >
                        {session.name}
                      </Tag>
                    ))}
                  </Col>
                ) : (
                  <Col xs={24} className={styles.passClassListContainer}>
                    <SessionCards sessions={pass?.sessions} shouldFetchInventories={true} />
                  </Col>
                )}
              </>
            )}
            {pass?.videos?.length > 0 && (
              <>
                <Col xs={24}>
                  <Text strong> Videos purchasable with this pass </Text>
                </Col>
                {isMobileDevice ? (
                  <Col xs={24}>
                    {pass?.videos?.map((video) => (
                      <Tag
                        key={`${purchased ? pass?.pass_order_id : pass?.id}_${video?.external_id}`}
                        color="volcano"
                        onClick={() => redirectToVideosPage(video)}
                      >
                        {video?.title}
                      </Tag>
                    ))}
                  </Col>
                ) : (
                  <Col xs={24} className={styles.passVideoListContainer}>
                    <SimpleVideoCardsList passDetails={pass} videos={pass.videos} />
                  </Col>
                )}
              </>
            )}
          </>
        )}
      </Row>
    </Card>
  );

  return (
    <div className={styles.mt50}>
      <Row gutter={[8, 24]}>
        <Col xs={24}>{profile && <CreatorProfile profile={profile} profileImage={profileImage} />}</Col>
        <Col xs={24}>
          {video && (
            <>
              <AuthModal
                visible={showPurchaseVideoModal}
                closeModal={closeAuthModal}
                onLoggedInCallback={showConfirmPaymentPopup}
              />

              <Row className={classNames(styles.box, styles.p20)} gutter={[8, 24]}>
                <Loader loading={isLoading} size="large" text="Loading video details">
                  <Col xs={24} className={styles.showcaseCardContainer}>
                    <VideoCard
                      video={video}
                      buyable={false}
                      hoverable={false}
                      showDetailsBtn={false}
                      showDesc={true}
                      onCardClick={() => {}}
                      cover={
                        video?.thumbnail_url ? (
                          <Image
                            loading="lazy"
                            className={styles.videoDetailsCardCover}
                            preview={false}
                            src={video?.thumbnail_url}
                            alt={video?.title}
                          />
                        ) : null
                      }
                    />
                  </Col>
                </Loader>

                {video.is_course ? (
                  courses?.length > 0 && (
                    <div className={classNames(styles.mb50, styles.mt20)}>
                      <Row gutter={[8, 16]}>
                        <Col xs={24}>
                          <Title level={5}> This video can only be purchased via this course </Title>
                        </Col>
                        <Col xs={24}>
                          <ShowcaseCourseCard courses={courses} />
                        </Col>
                      </Row>
                    </div>
                  )
                ) : (
                  <>
                    {/* 
                      If user has usable subscription
                      We show the video card with price 0
                      and with the subscription details
                    */}
                    {usableUserSubscription && (
                      <>
                        <Col xs={24} className={styles.mt10}>
                          <Title level={3} className={styles.ml20}>
                            Buy using your subscription
                          </Title>
                        </Col>
                        <Col xs={24} className={styles.p20}>
                          <Card className={styles.videoCard} bodyStyle={{ padding: isMobileDevice ? 15 : 24 }}>
                            <Row gutter={[8, 16]} align="center">
                              <Col xs={24} md={16} xl={18}>
                                <Row gutter={[8, 16]}>
                                  <Col xs={24} className={styles.headerWrapper}>
                                    <Row gutter={16}>
                                      <Col xs={24} md={17} xl={19} className={styles.textAlignLeft}>
                                        <Title level={5}> {usableUserSubscription?.subscription_name} </Title>
                                      </Col>
                                      <Col xs={24} md={7} xl={5} className={styles.passPriceText}>
                                        <Title level={5}>
                                          {usableUserSubscription?.currency.toUpperCase()} 0{' '}
                                          <del>{video?.total_price}</del>
                                        </Title>
                                      </Col>
                                    </Row>
                                  </Col>
                                  <Col xs={24}>
                                    <Text className={styles.blueText} strong>
                                      Credits :{' '}
                                      {`${
                                        usableUserSubscription?.product_credits -
                                        usableUserSubscription?.product_credits_used
                                      }/${usableUserSubscription?.product_credits}`}
                                    </Text>
                                  </Col>
                                </Row>
                              </Col>
                              <Col xs={24} md={8} xl={6}>
                                <Button block type="primary" onClick={() => openPurchaseVideoModal()}>
                                  Buy This Video
                                </Button>
                              </Col>
                            </Row>
                          </Card>
                        </Col>
                      </>
                    )}

                    {/* 
                      If user have purchased a pass
                      that can be used to get this video
                      we show them here
                    */}
                    {userPasses?.length > 0 && !usableUserSubscription && (
                      <>
                        <Col xs={24} className={styles.mt10}>
                          <Title level={3} className={styles.ml20}>
                            Buy using your pass
                          </Title>
                        </Col>
                        <Col xs={24} className={styles.passListContainer}>
                          {userPasses?.map((pass) => renderPassCards(pass, true))}
                        </Col>
                      </>
                    )}

                    {/* 
                      If user don't have usable pass/subscription
                      (will also trigger in logged out state)
                    */}
                    {userPasses?.length <= 0 && !usableUserSubscription && (
                      <>
                        {/* Show normal buy card */}
                        <Col xs={24} className={styles.p20}>
                          <Card className={styles.videoCard} bodyStyle={{ padding: isMobileDevice ? 15 : 24 }}>
                            <Row gutter={[8, 16]} align="center">
                              <Col xs={24} md={16} xl={18}>
                                <Row gutter={8}>
                                  <Col xs={24}>
                                    <Title className={styles.blueText} level={3}>
                                      {video?.title}
                                    </Title>
                                  </Col>
                                  <Col xs={24}>
                                    <Space size={isMobileDevice ? 'small' : 'middle'}>
                                      <Text className={classNames(styles.blueText, styles.textAlignCenter)} strong>
                                        {`Validity ${video?.validity} Days`}
                                      </Text>
                                      <Divider type="vertical" />
                                      <Text className={classNames(styles.blueText, styles.textAlignCenter)} strong>
                                        {video.pay_what_you_want
                                          ? 'Pay what you value this video'
                                          : video.total_price > 0
                                          ? `${video.currency?.toUpperCase()} ${video.total_price}`
                                          : 'Free'}
                                      </Text>
                                    </Space>
                                  </Col>
                                </Row>
                              </Col>
                              <Col xs={24} md={8} xl={6}>
                                <Button block type="primary" onClick={() => openPurchaseVideoModal()}>
                                  {video?.total_price === 0 ? 'Get' : 'Buy'} This Video
                                </Button>
                              </Col>
                            </Row>
                          </Card>
                        </Col>
                        {/* Show passes that can be used to buy this */}
                        {availablePassesForVideo?.length > 0 && (
                          <>
                            <Col xs={24} className={styles.mt10}>
                              <Title level={3} className={styles.ml20}>
                                Buy a pass and this video
                              </Title>
                            </Col>

                            <Col xs={24} className={styles.passListContainer}>
                              {availablePassesForVideo?.map((pass) => renderPassCards(pass, false))}
                            </Col>
                          </>
                        )}
                      </>
                    )}

                    {/* Upsellin section for sessions related to video */}
                    {video.sessions?.length > 0 && (
                      <Col xs={24}>
                        <Row gutter={[8, 8]}>
                          <Col xs={24}>
                            <Text className={styles.ml20}> Related to these class(es) </Text>
                          </Col>
                          <Col xs={24}>
                            <SessionCards sessions={video.sessions} shouldFetchInventories={true} />
                          </Col>
                        </Row>
                      </Col>
                    )}
                  </>
                )}
              </Row>
            </>
          )}
        </Col>
      </Row>
    </div>
  );
};

export default VideoDetails;
