import React, { useEffect, useState, useCallback } from 'react';
import { Row, Col, Image, Typography, Space, Divider, Card, Button, message } from 'antd';
import {
  GlobalOutlined,
  FacebookOutlined,
  InstagramOutlined,
  TwitterOutlined,
  LinkedinOutlined,
} from '@ant-design/icons';
import classNames from 'classnames';
import ReactHtmlParser from 'react-html-parser';
import { loadStripe } from '@stripe/stripe-js';

import config from 'config';
import apis from 'apis';

import Share from 'components/Share';
import Loader from 'components/Loader';
import SessionCards from 'components/SessionCards';
import PurchaseModal from 'components/PurchaseModal';

import { showErrorModal, showAlreadyBookedModal, showBookingSuccessModal } from 'components/Modals/modals';

import DefaultImage from 'components/Icons/DefaultImage';

import { isMobileDevice } from 'utils/device';
import { generateUrlFromUsername, isAPISuccess, reservedDomainName } from 'utils/helper';

import styles from './style.module.scss';

const stripePromise = loadStripe(config.stripe.secretKey);

const { Title, Text } = Typography;

const PassDetails = ({ match, history }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState({});
  const [profileImage, setProfileImage] = useState(null);
  const [pass, setPass] = useState(null);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);

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

  const openPurchaseModal = () => {
    setShowPurchaseModal(true);
  };

  const closePurchaseModal = () => {
    setShowPurchaseModal(false);
  };

  const getPassDetails = useCallback(
    async (passId) => {
      try {
        const { data } = await apis.passes.getPassById(passId);

        if (data) {
          setPass({
            ...data,
            sessions:
              data.sessions.map((session) => ({
                ...session,
                key: `${data.id}_${session.session_id}`,
                username: username,
              })) || [],
          });
          setIsLoading(false);
        }
      } catch (error) {
        setIsLoading(false);
        message.error('Failed to load class pass details');
      }
    },
    [username]
  );

  useEffect(() => {
    if (match.params.pass_id) {
      if (username && !reservedDomainName.includes(username)) {
        getProfileDetails();
        getPassDetails(match.params.pass_id);
      }
    } else {
      setIsLoading(false);
      message.error('Session details not found.');
    }

    //eslint-disable-next-line
  }, [match.params.pass_id]);

  const initiatePaymentForOrder = async (orderDetails) => {
    setIsLoading(true);
    try {
      const { data, status } = await apis.payment.createPaymentSessionForOrder({
        order_id: orderDetails.pass_order_id,
        order_type: 'PASS_ORDER',
      });

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

  const createOrder = async (userEmail) => {
    if (!pass) {
      showErrorModal('Something went wrong', 'Invalid Class Pass Selected');
      return;
    }

    setIsLoading(true);
    try {
      const { status, data } = await apis.passes.createOrderForUser({
        pass_id: pass.id,
        price: pass.price,
        currency: pass.currency.toLowerCase(),
      });

      if (isAPISuccess(status) && data) {
        if (data.payment_required) {
          initiatePaymentForOrder(data);
        } else {
          setIsLoading(false);
          showBookingSuccessModal(userEmail, pass, false, false, username);
        }
      }
    } catch (error) {
      setIsLoading(false);
      message.error(error.response?.data?.message || 'Something went wrong');
      if (error.response?.data?.message === 'user already has a confirmed order for this pass') {
        showAlreadyBookedModal(true, username);
      }
    }
  };

  //TODO: Adjust new credit keys here
  return (
    <Loader loading={isLoading} size="large" text="Loading pass details">
      <PurchaseModal visible={showPurchaseModal} closeModal={closePurchaseModal} createOrder={createOrder} />
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
          {pass && (
            <Row className={classNames(styles.box, styles.p20)} gutter={[8, 24]}>
              <Col xs={24} className={styles.p20}>
                <Card className={styles.passCard} bodyStyle={{ padding: isMobileDevice ? 15 : 24 }}>
                  <Row gutter={[8, 16]} align="center">
                    <Col xs={24} md={20}>
                      <Row gutter={8}>
                        <Col xs={24}>
                          <Title className={styles.blueText} level={3}>
                            {pass?.name}
                          </Title>
                        </Col>
                        <Col xs={24}>
                          <Space size={isMobileDevice ? 'small' : 'middle'}>
                            <Text className={classNames(styles.blueText, styles.textAlignCenter)} strong>
                              {pass && pass?.limited ? `${pass?.class_count} Credits` : 'Unlimited Credits'}
                            </Text>
                            <Divider type="vertical" />
                            <Text className={classNames(styles.blueText, styles.textAlignCenter)} strong>
                              {`${pass?.validity} days`}
                            </Text>
                            <Divider type="vertical" />
                            <Text className={classNames(styles.blueText, styles.textAlignCenter)} strong>
                              {`${pass?.price} ${pass?.currency.toUpperCase()}`}
                            </Text>
                          </Space>
                        </Col>
                      </Row>
                    </Col>
                    <Col xs={24} md={4}>
                      <Button block type="primary" onClick={() => openPurchaseModal()}>
                        Buy Pass
                      </Button>
                    </Col>
                  </Row>
                </Card>
              </Col>

              {pass.sessions?.length > 0 && (
                <Col xs={24}>
                  <Row gutter={[8, 8]}>
                    <Col xs={24}>
                      <Text className={styles.ml20}> Applicable to below class(es) </Text>
                    </Col>
                    <Col xs={24}>
                      <SessionCards sessions={pass.sessions} shouldFetchInventories={true} username={username} />
                    </Col>
                  </Row>
                </Col>
              )}
            </Row>
          )}
        </Col>
      </Row>
    </Loader>
  );
};

export default PassDetails;
