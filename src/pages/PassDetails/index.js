import React, { useEffect, useState, useCallback } from 'react';
import { Row, Col, Typography, Space, Divider, Card, Button, message } from 'antd';
import classNames from 'classnames';
import { loadStripe } from '@stripe/stripe-js';
import { useTranslation } from 'react-i18next';

import config from 'config';
import apis from 'apis';

import Loader from 'components/Loader';
import SessionCards from 'components/SessionCards';
import SimpleVideoCardsList from 'components/SimpleVideoCardsList';
import PurchaseModal from 'components/PurchaseModal';
import CreatorProfile from 'components/CreatorProfile';

import { showErrorModal, showAlreadyBookedModal, showBookingSuccessModal } from 'components/Modals/modals';

import { isMobileDevice } from 'utils/device';
import { isAPISuccess, reservedDomainName, orderType, productType } from 'utils/helper';

import styles from './style.module.scss';

const stripePromise = loadStripe(config.stripe.secretKey);

const { Title, Text } = Typography;

const PassDetails = ({ match, history }) => {
  const { t: translate } = useTranslation();
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState({});
  const [profileImage, setProfileImage] = useState(null);
  const [pass, setPass] = useState(null);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [username, setUsername] = useState(null);

  const getProfileDetails = useCallback(
    async (creatorUsername) => {
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
        message.error(translate('FAIL_TO_LOAD_PROFILE'));
        setIsLoading(false);
      }
    },
    [translate]
  );

  const openPurchaseModal = () => {
    setShowPurchaseModal(true);
  };

  const closePurchaseModal = () => {
    setShowPurchaseModal(false);
  };

  const getPassDetails = useCallback(
    async (passId) => {
      try {
        const { status, data } = await apis.passes.getPassById(passId);

        if (isAPISuccess(status) && data) {
          setPass({
            ...data,
            sessions:
              data.sessions?.map((session) => ({
                ...session,
                key: `${data.id}_${session.session_id}`,
                username: data.creator_username,
              })) || [],
            videos:
              data.videos?.map((video) => ({
                ...video,
                key: `${data.id}_${video.external_id}`,
                username: data.creator_username,
              })) || [],
          });

          const creatorUsername = data.creator_username || window.location.hostname.split('.')[0];
          setUsername(creatorUsername);
          await getProfileDetails(creatorUsername);
          setIsLoading(false);
        }
      } catch (error) {
        setIsLoading(false);
        message.error(translate('FAILED_TO_LOAD_PASS_DETAILS'));
      }
    },
    [getProfileDetails, translate]
  );

  useEffect(() => {
    if (match.params.pass_id) {
      const domainUsername = window.location.hostname.split('.')[0];
      if (domainUsername && !reservedDomainName.includes(domainUsername)) {
        getPassDetails(match.params.pass_id);
      }
    } else {
      setIsLoading(false);
      message.error(translate('SESSION_DETAILS_NOT_FOUND'));
    }

    //eslint-disable-next-line
  }, [match.params.pass_id]);

  const initiatePaymentForOrder = async (orderDetails) => {
    setIsLoading(true);
    try {
      const { data, status } = await apis.payment.createPaymentSessionForOrder({
        order_id: orderDetails.pass_order_id,
        order_type: orderType.PASS,
      });

      if (isAPISuccess(status) && data) {
        const stripe = await stripePromise;

        const result = await stripe.redirectToCheckout({
          sessionId: data.payment_gateway_session_id,
        });

        if (result.error) {
          message.error(translate('CANNOT_INITIATE_PAYMENT'));
          setIsLoading(false);
        }
      }
    } catch (error) {
      setIsLoading(false);
      message.error(error.response?.data?.message || translate('SOMETHING_WENT_WRONG'));
    }
  };

  const createOrder = async (userEmail) => {
    if (!pass) {
      showErrorModal(translate('SOMETHING_WENT_WRONG'), translate('INVALID_PASS_SELECTED'));
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
      if (error.response?.data?.message === 'user already has a confirmed order for this pass') {
        showAlreadyBookedModal(productType.PASS, username);
      } else {
        message.error(error.response?.data?.message || translate('SOMETHING_WENT_WRONG'));
      }
    }
  };

  return (
    <div className={styles.mt50}>
      <Loader loading={isLoading} size="large" text={translate('LOADING_PASS_DETAILS')}>
        <PurchaseModal visible={showPurchaseModal} closeModal={closePurchaseModal} createOrder={createOrder} />
        <Row gutter={[8, 24]}>
          <Col xs={24}>{profile && <CreatorProfile profile={profile} profileImage={profileImage} />}</Col>
          <Col xs={24}>
            {pass && (
              <Row className={classNames(styles.box, styles.p20)} gutter={[8, 24]}>
                <Col xs={24} className={styles.p20}>
                  <Card className={styles.passCard} bodyStyle={{ padding: isMobileDevice ? 15 : 24 }}>
                    <Row gutter={[8, 16]} align="center">
                      <Col xs={24} md={18}>
                        <Row gutter={8}>
                          <Col xs={24}>
                            <Title className={styles.blueText} level={3}>
                              {pass?.name}
                            </Title>
                          </Col>
                          <Col xs={24}>
                            <Space size={isMobileDevice ? 'small' : 'middle'}>
                              <Text className={classNames(styles.blueText, styles.textAlignCenter)} strong>
                                {pass && pass?.limited
                                  ? `${pass?.class_count} ${translate('CREDITS')}`
                                  : translate('UNLIMITED_CREDITS')}
                              </Text>
                              <Divider type="vertical" />
                              <Text className={classNames(styles.blueText, styles.textAlignCenter)} strong>
                                {`${pass?.validity} ${translate('DAYS')}`}
                              </Text>
                              <Divider type="vertical" />
                              <Text className={classNames(styles.blueText, styles.textAlignCenter)} strong>
                                {`${pass?.price} ${pass?.currency.toUpperCase()}`}
                              </Text>
                            </Space>
                          </Col>
                        </Row>
                      </Col>
                      <Col xs={24} md={6}>
                        <Button block type="primary" onClick={() => openPurchaseModal()}>
                          {translate('BUY_PASS')}
                        </Button>
                      </Col>
                    </Row>
                  </Card>
                </Col>

                {pass.sessions?.length > 0 && (
                  <Col xs={24}>
                    <Row gutter={[8, 8]}>
                      <Col xs={24}>
                        <Text className={styles.ml20}> {translate('APPLICABLE_TO_BELOW_CLASS')} </Text>
                      </Col>
                      <Col xs={24}>
                        <SessionCards sessions={pass.sessions} shouldFetchInventories={true} username={username} />
                      </Col>
                    </Row>
                  </Col>
                )}

                {pass.videos?.length > 0 && (
                  <Col xs={24}>
                    <Row gutter={[8, 8]}>
                      <Col xs={24}>
                        <Text className={styles.ml20}> {translate('VIDEO_PURCHASE_WITH_THIS_PASS')} </Text>
                      </Col>
                      <Col xs={24}>
                        <SimpleVideoCardsList username={username} passDetails={pass} videos={pass.videos} />
                      </Col>
                    </Row>
                  </Col>
                )}
              </Row>
            )}
          </Col>
        </Row>
      </Loader>
    </div>
  );
};

export default PassDetails;
