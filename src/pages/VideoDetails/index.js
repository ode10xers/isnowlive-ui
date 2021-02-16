import React, { useEffect, useState, useCallback } from 'react';
import { Row, Col, Image, Typography, Space, Divider, Card, Button, message } from 'antd';
import {
  GlobalOutlined,
  FacebookOutlined,
  InstagramOutlined,
  TwitterOutlined,
  LinkedinOutlined,
  UpOutlined,
  DownOutlined,
} from '@ant-design/icons';
import classNames from 'classnames';
import ReactHtmlParser from 'react-html-parser';
import { loadStripe } from '@stripe/stripe-js';

import config from 'config';
import apis from 'apis';

import Share from 'components/Share';
import Loader from 'components/Loader';
import VideoCard from 'components/VideoCard';
import SessionCards from 'components/SessionCards';
import PurchaseModal from 'components/PurchaseModal';
import { showAlreadyBookedModal, showVideoPurchaseSuccessModal } from 'components/Modals/modals';

import DefaultImage from 'components/Icons/DefaultImage';

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

const stripePromise = loadStripe(config.stripe.secretKey);

const { Title, Text } = Typography;
const {
  formatDate: { toLongDateWithDay },
} = dateUtil;

const VideoDetails = ({ match, history }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState({});
  const [profileImage, setProfileImage] = useState(null);
  const [video, setVideo] = useState(null);
  const [showPurchaseVideoModal, setShowPurchaseVideoModal] = useState(false);
  const [availablePassesForVideo, setAvailablePassesForVideo] = useState([]);
  const [selectedPass, setSelectedPass] = useState(null);
  const [userPasses, setUserPasses] = useState([]);
  const [expandedPassKeys, setExpandedPassKeys] = useState([]);

  const username = window.location.hostname.split('.')[0];

  const getProfileDetails = useCallback(async () => {
    try {
      const { data } = username ? await apis.user.getProfileByUsername(username) : await apis.user.getProfile();
      if (data) {
        setProfile(data);
        setProfileImage(data.profile_image_url);
        setIsLoading(false);
      }
    } catch (error) {
      message.error('Failed to load profile details');
      setIsLoading(false);
    }
  }, [username]);

  const getVideoDetails = useCallback(async (videoId) => {
    try {
      const { data } = await apis.videos.getVideoById(videoId);

      if (data) {
        setVideo(data);
        setIsLoading(false);
      }
    } catch (error) {
      setIsLoading(false);
      message.error('Failed to load class video details');
    }
  }, []);

  const getAvailablePassesForVideo = useCallback(async (videoId) => {
    console.log('GetAvailablePass');
    try {
      // TODO:Adjust for this
      // const { status, data } = await apis.passes.getPassesByVideoId(videoId);
      const { status, data } = await apis.passes.getPassesByUsername(username);

      if (isAPISuccess(status) && data) {
        //TODO: Also adjust this according to the response
        setAvailablePassesForVideo(
          data.map((tempPass) => ({
            ...tempPass,
            videos: [
              {
                title: 'My New Video Testing',
                description: '\u003cp\u003eDesc\u003c/p\u003e\n',
                validity: 6,
                price: 10,
                currency: 'sgd',
                thumbnail_url: 'https://dkfqbuenrrvge.cloudfront.net/image/tIwOqOnsV249Hq8H_sample_image.jpg',
                sessions: [],
                external_id: '80c75636-a4d6-4d94-b42d-31262d19a525',
                is_published: true,
                video_url: '',
                video_uid: 'baa0646cc7b77fe217071b3093d25ac3',
                duration: 489,
                status: 'UPLOAD_SUCCESS',
                watch_limit: 6,
              },
              {
                title: 'My New Video Testing',
                description: '\u003cp\u003eDesc\u003c/p\u003e\n',
                validity: 6,
                price: 10,
                currency: 'sgd',
                thumbnail_url: 'https://dkfqbuenrrvge.cloudfront.net/image/tIwOqOnsV249Hq8H_sample_image.jpg',
                sessions: [],
                external_id: '80c75636-a4d6-4d94-b42d-31262d19a526',
                is_published: true,
                video_url: '',
                video_uid: 'baa0646cc7b77fe217071b3093d25ac3',
                duration: 489,
                status: 'UPLOAD_SUCCESS',
                watch_limit: 6,
              },
              {
                title: 'My New Video Testing',
                description: '\u003cp\u003eDesc\u003c/p\u003e\n',
                validity: 6,
                price: 10,
                currency: 'sgd',
                thumbnail_url: 'https://dkfqbuenrrvge.cloudfront.net/image/tIwOqOnsV249Hq8H_sample_image.jpg',
                sessions: [],
                external_id: '80c75636-a4d6-4d94-b42d-31262d19a527',
                is_published: true,
                video_url: '',
                video_uid: 'baa0646cc7b77fe217071b3093d25ac3',
                duration: 489,
                status: 'UPLOAD_SUCCESS',
                watch_limit: 6,
              },
            ],
          }))
        );
      }
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed fetching available pass for video');
      setIsLoading(false);
    }
    //eslint-disable-next-line
  }, []);

  const getUsablePassesForUser = async (videoId) => {
    console.log('GetUsablePass');
    try {
      const loggedInUserData = getLocalUserDetails();

      if (loggedInUserData && video) {
        // TODO: Adjust for this
        // const { status, data } = await apis.passes.getAttendeePassesForVideo(video.external_id);
        const { status, data } = await apis.passes.getPassesByUsername(username);

        if (isAPISuccess(status) && data) {
          //TODO: Also adjust this according to the response
          setUserPasses(data);
        }
      }
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed fetching usable pass for user');
      setIsLoading(false);
    }
  };

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
      if (username && !reservedDomainName.includes(username)) {
        getProfileDetails();
        getVideoDetails(match.params.video_id);

        if (getLocalUserDetails()) {
          getUsablePassesForUser();
        } else {
          getAvailablePassesForVideo(match.params.video_id);
        }
      }
    } else {
      setIsLoading(false);
      message.error('Video details not found.');
    }
    //eslint-disable-next-line
  }, [match.params.video_id]);

  const purchaseVideo = async (payload) => await apis.videos.createOrderForUser(payload);

  const getUserPurchasedPass = (getDefault = false) => {
    if (userPasses.length) {
      if (selectedPass && !getDefault) {
        return userPasses.filter((userPass) => userPass.id === selectedPass.id);
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
          showVideoPurchaseSuccessModal(userEmail, video, username);
        }
      }
    } catch (error) {
      setIsLoading(false);
      message.error(error.response?.data?.message || 'Something went wrong');
      //TODO: Need to check the message sent for already booked videos
      if (error.response?.data?.message === 'user already has a confirmed order for this pass') {
        showAlreadyBookedModal(productType.VIDEO, username);
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
            video_id: video.external_id, //TODO: Make sure Backend supports this
          });
        } else {
          const followUpGetVideo = await purchaseVideo({
            video_id: video.external_id,
            payment_source: paymentSource.PASS,
            source_id: data.pass_order_id,
          });

          if (isAPISuccess(followUpGetVideo.status)) {
            showVideoPurchaseSuccessModal(userEmail, video, username);
            setIsLoading(false);
          }
        }
      }
    } catch (error) {
      setIsLoading(false);
      message.error(error.response?.data?.message || 'Something went wrong');
      //TODO: Need to check the message sent for already booked videos
      if (error.response?.data?.message === 'user already has a confirmed order for this pass') {
        showAlreadyBookedModal(productType.VIDEO, username);
      }
    }
  };

  const buyVideoUsingPass = async (userEmail, payload) => {
    try {
      const { status, data } = await purchaseVideo(payload);

      if (isAPISuccess(status) && data) {
        showVideoPurchaseSuccessModal(userEmail, video, username);
        setIsLoading(false);
      }
    } catch (error) {
      setIsLoading(false);
      message.error(error.response?.data?.message || 'Something went wrong');
      //TODO: Need to check the message sent for already booked videos
      if (error.response?.data?.message === 'user already has a confirmed order for this pass') {
        showAlreadyBookedModal(productType.VIDEO, username);
      }
    }
  };

  const handleOrder = async (userEmail) => {
    setIsLoading(true);

    console.log('Handling Order');
    // After user has logged in from the modal, we try to fetch usable passes first
    if (getLocalUserDetails()) {
      await getUsablePassesForUser();
    }

    if (selectedPass) {
      const usableUserPass = getUserPurchasedPass(false);

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

  //TODO: Adjust the new credits key for passes here
  const renderPassCards = (pass, purchased = false) => (
    <Card className={styles.videoCard} bodyStyle={{ padding: isMobileDevice ? 15 : 24 }} key={pass?.id}>
      <Row gutter={[16, 16]} align="center">
        <Col xs={24} md={18} lg={20}>
          <Row gutter={8}>
            <Col xs={24}>
              <Row gutter={16}>
                <Col xs={24} md={18} xl={19} className={styles.textAlignLeft}>
                  <Title level={5}> {pass?.name} </Title>
                </Col>
                <Col xs={24} md={6} xl={5} className={styles.passPriceText}>
                  <Title level={5}>
                    {' '}
                    {pass?.currency.toUpperCase()} {pass?.price}{' '}
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
                    Expires on : {toLongDateWithDay(pass?.expiry)}
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
        <Col xs={24} md={6} lg={4}>
          <Row gutter={[8, 16]} justify="center">
            <Col xs={12} md={24}>
              <Button block type="primary" onClick={() => openPurchasePassModal(pass)}>
                {purchased ? 'Buy Video' : 'Buy Pass'}
              </Button>
            </Col>
            <Col xs={12} md={24}>
              {expandedPassKeys.includes(pass?.id) ? (
                <Button block type="default" onClick={() => hidePassDetails(pass?.id)} icon={<UpOutlined />}>
                  Detail
                </Button>
              ) : (
                <Button block type="default" onClick={() => showPassDetails(pass?.id)} icon={<DownOutlined />}>
                  Detail
                </Button>
              )}
            </Col>
          </Row>
        </Col>
        {expandedPassKeys.includes(pass?.id) && (
          <>
            <Col xs={24}>
              <Text strong> Pass applicable to below videos </Text>
            </Col>
            <Col xs={24} className={styles.passVideoListContainer}>
              <Row gutter={[16, 16]} justify="start">
                {pass.videos.map((passVideo) => (
                  <Col xs={12} md={12} lg={8} key={`${pass.id}_${passVideo.external_id}`}>
                    <div className={styles.passVideoItemContainer}></div>
                  </Col>
                ))}
              </Row>
            </Col>
          </>
        )}
      </Row>
    </Card>
  );

  return (
    <Loader loading={isLoading} size="large" text="Loading video details">
      <Row gutter={[8, 24]}>
        <Col xs={24}>
          <Row className={styles.imageWrapper} gutter={[8, 8]}>
            <Col xs={24} className={styles.profileImageWrapper}>
              <div className={styles.profileImage}>
                <Image
                  preview={false}
                  width={'100%'}
                  src={profileImage ? profileImage : 'error'}
                  fallback={DefaultImage()}
                />
                <div className={styles.userName}>
                  <Title level={isMobileDevice ? 4 : 2}>
                    {profile?.first_name} {profile?.last_name}
                  </Title>
                </div>
                <div className={styles.shareButton}>
                  <Share
                    label="Share"
                    shareUrl={generateUrlFromUsername(profile.username)}
                    title={`${profile.first_name} ${profile.last_name}`}
                  />
                </div>
              </div>
            </Col>
            <Col xs={24} md={{ span: 22, offset: 1 }}>
              <div className={styles.bio}>{ReactHtmlParser(profile?.profile?.bio)}</div>
            </Col>
            <Col xs={24} md={{ span: 22, offset: 1 }}>
              {profile?.profile?.social_media_links && (
                <Space size={'middle'}>
                  {profile.profile.social_media_links.website && (
                    <a href={profile.profile.social_media_links.website} target="_blank" rel="noopener noreferrer">
                      <GlobalOutlined className={styles.socialIcon} />
                    </a>
                  )}
                  {profile.profile.social_media_links.facebook_link && (
                    <a
                      href={profile.profile.social_media_links.facebook_link}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <FacebookOutlined className={styles.socialIcon} />
                    </a>
                  )}
                  {profile.profile.social_media_links.twitter_link && (
                    <a href={profile.profile.social_media_links.twitter_link} target="_blank" rel="noopener noreferrer">
                      <TwitterOutlined className={styles.socialIcon} />
                    </a>
                  )}
                  {profile.profile.social_media_links.instagram_link && (
                    <a
                      href={profile.profile.social_media_links.instagram_link}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <InstagramOutlined className={styles.socialIcon} />
                    </a>
                  )}
                  {profile.profile.social_media_links.linkedin_link && (
                    <a
                      href={profile.profile.social_media_links.linkedin_link}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <LinkedinOutlined className={styles.socialIcon} />
                    </a>
                  )}
                </Space>
              )}
            </Col>
          </Row>
        </Col>
        <Col xs={24}>
          {video && (
            <>
              <PurchaseModal
                visible={showPurchaseVideoModal}
                closeModal={closePurchaseModal}
                createOrder={handleOrder}
              />
              <Row className={classNames(styles.box, styles.p20)} gutter={[8, 24]}>
                <Col xs={24} className={styles.p20}>
                  <Card className={styles.videoCard} bodyStyle={{ padding: isMobileDevice ? 15 : 24 }}>
                    <Row gutter={[8, 16]} align="center">
                      <Col xs={24} md={20}>
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
                              {userPasses.length <= 0 && (
                                <>
                                  <Divider type="vertical" />
                                  <Text className={classNames(styles.blueText, styles.textAlignCenter)} strong>
                                    {video?.price === 0
                                      ? 'Free video'
                                      : ` ${video?.currency.toUpperCase()} ${video?.price}`}
                                  </Text>
                                </>
                              )}
                            </Space>
                          </Col>
                        </Row>
                      </Col>
                      {userPasses.length <= 0 && (
                        <Col xs={24} md={4}>
                          <Button block type="primary" onClick={() => openPurchaseVideoModal()}>
                            {video?.price === 0 ? 'Get' : 'Buy'} Video
                          </Button>
                        </Col>
                      )}
                    </Row>
                  </Card>
                </Col>

                <Col xs={24} className={styles.showcaseCardContainer}>
                  <VideoCard video={video} buyable={false} hoverable={false} />
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
                        <SessionCards sessions={video.sessions} shouldFetchInventories={true} username={username} />
                      </Col>
                    </Row>
                  </Col>
                )}
              </Row>
            </>
          )}
        </Col>
      </Row>
    </Loader>
  );
};

export default VideoDetails;
