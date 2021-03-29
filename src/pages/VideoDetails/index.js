import React, { useEffect, useState, useCallback } from 'react';
import { Row, Col, Typography, Space, Divider, Card, Button, Tag, message } from 'antd';
import { UpOutlined, DownOutlined } from '@ant-design/icons';
import classNames from 'classnames';

// import config from 'config';
import apis from 'apis';

import CreatorProfile from 'components/CreatorProfile';
import Loader from 'components/Loader';
import VideoCard from 'components/VideoCard';
import SessionCards from 'components/SessionCards';
import ShowcaseCourseCard from 'components/ShowcaseCourseCard';
import SimpleVideoCardsList from 'components/SimpleVideoCardsList';
import PurchaseModal from 'components/PurchaseModal';
import {
  showAlreadyBookedModal,
  showSuccessModal,
  showErrorModal,
  showVideoPurchaseSuccessModal,
} from 'components/Modals/modals';

import dateUtil from 'utils/date';
import { isMobileDevice } from 'utils/device';
import { getLocalUserDetails } from 'utils/storage';
import {
  generateUrlFromUsername,
  isAPISuccess,
  orderType,
  paymentSource,
  productType,
  reservedDomainName,
} from 'utils/helper';

import styles from './style.module.scss';

const stripePromise = null;

const { Title, Text, Paragraph } = Typography;
const {
  formatDate: { toLongDateWithDay },
} = dateUtil;

const VideoDetails = ({ match }) => {
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
  const [username, setUsername] = useState(null);

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
      message.error('Failed to load profile details');
      setIsLoading(false);
    }
  }, []);

  const getVideoDetails = useCallback(
    async (videoId) => {
      try {
        const videoDetailsResponse = await apis.videos.getVideoById(videoId);

        if (isAPISuccess(videoDetailsResponse.status) && videoDetailsResponse.data) {
          setVideo(videoDetailsResponse.data);

          const creatorUsername = videoDetailsResponse.data.creator_username || window.location.hostname.split('.')[0];
          setUsername(creatorUsername);
          await getProfileDetails(creatorUsername);

          if (videoDetailsResponse.data.is_course) {
            const courseDetailsResponse = await apis.courses.getVideoCoursesByVideoId(
              videoDetailsResponse.data.external_id
            );

            if (isAPISuccess(courseDetailsResponse.status) && courseDetailsResponse.data) {
              setCourses(courseDetailsResponse.data);
            } else {
              console.error('Failed to fetch courses data for session', courseDetailsResponse);
            }
          }

          setIsLoading(false);
        } else {
          console.error('Failed to fetch video details', videoDetailsResponse);
        }
      } catch (error) {
        setIsLoading(false);
        message.error('Failed to load class video details');
      }
    },
    [getProfileDetails]
  );

  const getAvailablePassesForVideo = useCallback(async (videoId) => {
    try {
      const { status, data } = await apis.passes.getPassesByVideoId(videoId);

      if (isAPISuccess(status) && data) {
        setAvailablePassesForVideo(data);
      }
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed fetching available pass for video');
      setIsLoading(false);
    }
    //eslint-disable-next-line
  }, []);

  const getUsablePassesForUser = useCallback(async (videoId) => {
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
      message.error(error.response?.data?.message || 'Failed fetching usable pass for user');
      setIsLoading(false);
    }
  }, []);

  const openPurchaseVideoModal = () => {
    setSelectedPass(null);
    setShowPurchaseVideoModal(true);
  };

  const openPurchasePassModal = (pass) => {
    setSelectedPass(pass);
    setShowPurchaseVideoModal(true);
  };

  const closePurchaseModal = () => {
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
      const domainUsername = window.location.hostname.split('.')[0];
      if (domainUsername && !reservedDomainName.includes(domainUsername)) {
        getVideoDetails(match.params.video_id);
        getAvailablePassesForVideo(match.params.video_id);

        if (getLocalUserDetails()) {
          getUsablePassesForUser(match.params.video_id);
        }
      }
    } else {
      setIsLoading(false);
      message.error('Video details not found.');
    }
    //eslint-disable-next-line
  }, [match.params.video_id]);

  useEffect(() => {
    if (shouldFollowUpGetVideo) {
      const userDetails = getLocalUserDetails();
      handleOrder(userDetails.email);
    }
    //eslint-disable-next-line
  }, [userPasses]);

  const purchaseVideo = async (payload) => await apis.videos.createOrderForUser(payload);

  const getUserPurchasedPass = async (getDefault = false) => {
    if (userPasses.length) {
      if (selectedPass && !getDefault) {
        return userPasses.filter((userPass) => userPass.id === selectedPass.id)[0];
      }

      return userPasses[0];
    }

    return null;
  };

  const initiatePaymentForOrder = async (payload) => {
    setIsLoading(true);
    try {
      const { data, status } = await apis.payment.createPaymentSessionForOrder(payload);

      if (isAPISuccess(status) && data) {
        const stripe = await stripePromise;

        const result = await stripe.redirectToCheckout({
          sessionId: data.payment_gateway_session_id,
        });

        if (result.error) {
          message.error('Cannot initiate payment at this time, please try again...');
          setIsLoading(false);
        }
      }
    } catch (error) {
      setIsLoading(false);
      message.error(error.response?.data?.message || 'Something went wrong');
    }
  };

  const buySingleVideo = async (userEmail, payload) => {
    try {
      const { status, data } = await purchaseVideo(payload);

      if (isAPISuccess(status) && data) {
        if (data.payment_required) {
          initiatePaymentForOrder({
            order_id: data.video_order_id,
            order_type: orderType.VIDEO,
          });
        } else {
          setIsLoading(false);

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
            showVideoPurchaseSuccessModal(userEmail, video, null, false, false, username);
          }
        }
      }
    } catch (error) {
      setIsLoading(false);
      message.error(error.response?.data?.message || 'Something went wrong');
      if (error.response?.data?.message === 'user already has a confirmed order for this video') {
        showAlreadyBookedModal(productType.VIDEO, username);
      } else {
        showErrorModal('Something went wrong', error.response?.data?.message);
      }
    }
  };

  const buyPassAndGetVideo = async (userEmail, payload) => {
    try {
      const { status, data } = await apis.passes.createOrderForUser(payload);

      if (isAPISuccess(status) && data) {
        if (data.payment_required) {
          initiatePaymentForOrder({
            order_id: data.pass_order_id,
            order_type: orderType.PASS,
            video_id: video.external_id,
          });
        } else {
          const followUpGetVideo = await purchaseVideo({
            video_id: video.external_id,
            payment_source: paymentSource.PASS,
            source_id: data.pass_order_id,
          });

          if (isAPISuccess(followUpGetVideo.status)) {
            showVideoPurchaseSuccessModal(userEmail, video, selectedPass, true, false, username);
            setIsLoading(false);
          }
        }
      }
    } catch (error) {
      setIsLoading(false);
      if (error.response?.data?.message === 'user already has a confirmed order for this video') {
        showAlreadyBookedModal(productType.VIDEO, username);
      } else {
        showErrorModal('Something went wrong', error.response?.data?.message);
      }
    }
  };

  const buyVideoUsingPass = async (userEmail, payload) => {
    try {
      const { status, data } = await purchaseVideo(payload);

      if (isAPISuccess(status) && data) {
        showVideoPurchaseSuccessModal(userEmail, video, selectedPass, true, false, username);
        setIsLoading(false);
      }
    } catch (error) {
      setIsLoading(false);
      message.error(error.response?.data?.message || 'Something went wrong');

      if (error.response?.data?.message === 'user already has a confirmed order for this video') {
        showAlreadyBookedModal(productType.VIDEO, username);
      } else {
        showErrorModal('Something went wrong', error.response?.data?.message);
      }
    }
  };

  const handleOrder = async (userEmail) => {
    setIsLoading(true);

    if (!shouldFollowUpGetVideo) {
      if (getLocalUserDetails() && userPasses.length <= 0) {
        setShouldFollowUpGetVideo(true);
        getUsablePassesForUser(match.params.video_id);
        return;
      }
    } else {
      setShouldFollowUpGetVideo(false);
    }

    //Handling edge case, buy free video using pass
    //We redirect them to the buySingleVideo flow
    if (selectedPass && video?.price > 0) {
      const usableUserPass = await getUserPurchasedPass(false);

      if (usableUserPass) {
        const payload = {
          video_id: video.external_id,
          payment_source: paymentSource.PASS,
          source_id: usableUserPass.pass_order_id,
        };

        buyVideoUsingPass(userEmail, payload);
      } else {
        const payload = {
          pass_id: selectedPass.id,
          price: selectedPass.price,
          currency: selectedPass.currency.toLowerCase(),
        };

        buyPassAndGetVideo(userEmail, payload);
      }
    } else {
      const payload = {
        video_id: video.external_id,
        payment_source: paymentSource.GATEWAY,
      };

      buySingleVideo(userEmail, payload);
    }
  };

  const redirectToSessionsPage = (session) => {
    const baseUrl = generateUrlFromUsername(username || 'app');
    window.open(`${baseUrl}/s/${session.session_id}`);
  };

  const redirectToVideosPage = (video) => {
    const baseUrl = generateUrlFromUsername(username || video?.creator_username || 'app');
    window.open(`${baseUrl}/v/${video.external_id}`);
  };

  const redirectToCourseDetails = (course) => {
    const baseUrl = generateUrlFromUsername(username || course?.username || 'app');
    window.open(`${baseUrl}/c/${course?.id}`);
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
                        {pass?.currency.toUpperCase()} 0 <del>{video?.price}</del>
                      </>
                    ) : (
                      `${pass?.currency.toUpperCase()} ${pass?.price}`
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
                    <SessionCards username={username} sessions={pass?.sessions} shouldFetchInventories={true} />
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
                    <SimpleVideoCardsList username={username} passDetails={pass} videos={pass.videos} />
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
      <Loader loading={isLoading} size="large" text="Loading video details">
        <Row gutter={[8, 24]}>
          <Col xs={24}>{profile && <CreatorProfile profile={profile} profileImage={profileImage} />}</Col>
          <Col xs={24}>
            {video && (
              <>
                <PurchaseModal
                  visible={showPurchaseVideoModal}
                  closeModal={closePurchaseModal}
                  createOrder={handleOrder}
                />
                <Row className={classNames(styles.box, styles.p20)} gutter={[8, 24]}>
                  <Col xs={24} className={styles.showcaseCardContainer}>
                    <VideoCard video={video} buyable={false} hoverable={false} showDetailsBtn={false} showDesc={true} />
                  </Col>

                  {video.is_course ? (
                    courses?.length > 0 && (
                      <div className={classNames(styles.mb50, styles.mt20)}>
                        <Row gutter={[8, 16]}>
                          <Col xs={24}>
                            <Title level={5}> This video can only be purchased via this course </Title>
                          </Col>
                          <Col xs={24}>
                            <ShowcaseCourseCard
                              courses={courses}
                              onCardClick={(course) => redirectToCourseDetails(course)}
                              username={username}
                            />
                          </Col>
                        </Row>
                      </div>
                    )
                  ) : (
                    <>
                      {(!getLocalUserDetails() || userPasses.length <= 0) && (
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
                                        {video?.price === 0
                                          ? 'Free video'
                                          : ` ${video?.currency.toUpperCase()} ${video?.price}`}
                                      </Text>
                                    </Space>
                                  </Col>
                                </Row>
                              </Col>
                              <Col xs={24} md={8} xl={6}>
                                <Button block type="primary" onClick={() => openPurchaseVideoModal()}>
                                  {video?.price === 0 ? 'Get' : 'Buy'} This Video
                                </Button>
                              </Col>
                            </Row>
                          </Card>
                        </Col>
                      )}

                      <Col xs={24} className={styles.mt10}>
                        <Title level={3} className={styles.ml20}>
                          {getLocalUserDetails() && userPasses.length > 0
                            ? 'Buy using your pass'
                            : 'Buy a pass and this video'}
                        </Title>
                      </Col>

                      <Col xs={24} className={styles.passListContainer}>
                        {getLocalUserDetails() && userPasses.length > 0
                          ? userPasses.map((pass) => renderPassCards(pass, true))
                          : availablePassesForVideo.map((pass) => renderPassCards(pass, false))}
                      </Col>

                      {video.sessions?.length > 0 && (
                        <Col xs={24}>
                          <Row gutter={[8, 8]}>
                            <Col xs={24}>
                              <Text className={styles.ml20}> Related to these class(es) </Text>
                            </Col>
                            <Col xs={24}>
                              <SessionCards
                                username={username}
                                sessions={video.sessions}
                                shouldFetchInventories={true}
                              />
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
      </Loader>
    </div>
  );
};

export default VideoDetails;
