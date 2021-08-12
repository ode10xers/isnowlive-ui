import React, { useEffect, useState, useCallback } from 'react';
import { Row, Col, Typography, Space, Divider, Card, Button, message } from 'antd';
import classNames from 'classnames';

import apis from 'apis';

import Loader from 'components/Loader';
import SessionCards from 'components/SessionCards';
import SimpleVideoCardsList from 'components/SimpleVideoCardsList';
import AuthModal from 'components/AuthModal';
import CreatorProfile from 'components/CreatorProfile';
import { showErrorModal, showAlreadyBookedModal, showPurchasePassSuccessModal } from 'components/Modals/modals';

import { isMobileDevice } from 'utils/device';
import {
  isAPISuccess,
  reservedDomainName,
  orderType,
  productType,
  isUnapprovedUserError,
  getUsernameFromUrl,
} from 'utils/helper';

import { useGlobalContext } from 'services/globalContext';

import styles from './style.module.scss';

const { Title, Text } = Typography;

/** @deprecated */
const PassDetails = ({ match, history }) => {
  const { showPaymentPopup } = useGlobalContext();

  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState({});
  const [profileImage, setProfileImage] = useState(null);
  const [pass, setPass] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);

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

  const openAuthModal = () => {
    setShowAuthModal(true);
  };

  const closeAuthModal = () => {
    setShowAuthModal(false);
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

          const creatorUsername = data.creator_username || getUsernameFromUrl();
          await getProfileDetails(creatorUsername);
          setIsLoading(false);
        }
      } catch (error) {
        setIsLoading(false);
        message.error('Failed to load pass details');
      }
    },
    [getProfileDetails]
  );

  useEffect(() => {
    if (match.params.pass_id) {
      const domainUsername = getUsernameFromUrl();
      if (domainUsername && !reservedDomainName.includes(domainUsername)) {
        getPassDetails(match.params.pass_id);
      }
    } else {
      setIsLoading(false);
      message.error('Session details not found.');
    }

    //eslint-disable-next-line
  }, [match.params.pass_id]);

  const showConfirmPaymentPopup = () => {
    if (!pass) {
      showErrorModal('Something went wrong', 'Invalid Pass Selected');
      return;
    }

    const desc = `${pass.class_count} Credits, Valid for ${pass.validity} days`;

    const paymentPopupData = {
      productId: pass.external_id,
      productType: productType.PASS,
      itemList: [
        {
          name: pass.name,
          description: desc,
          currency: pass.currency,
          price: pass.total_price,
        },
      ],
    };

    showPaymentPopup(paymentPopupData, createOrder);
  };

  const createOrder = async (couponCode = '') => {
    if (!pass) {
      showErrorModal('Something went wrong', 'Invalid Pass Selected');
      return null;
    }

    setIsLoading(true);
    try {
      const { status, data } = await apis.passes.createOrderForUser({
        pass_id: pass.external_id,
        price: pass.total_price,
        coupon_code: couponCode,
        currency: pass.currency.toLowerCase(),
      });

      if (isAPISuccess(status) && data) {
        setIsLoading(false);

        if (data.payment_required) {
          return {
            ...data,
            is_successful_order: true,
            payment_order_type: orderType.PASS,
            payment_order_id: data.pass_order_id,
          };
        } else {
          showPurchasePassSuccessModal(data.pass_order_id);

          return {
            ...data,
            is_successful_order: true,
          };
        }
      }
    } catch (error) {
      setIsLoading(false);
      if (error.response?.data?.message === 'user already has a confirmed order for this pass') {
        showAlreadyBookedModal(productType.PASS);
      } else if (!isUnapprovedUserError(error.response)) {
        message.error(error.response?.data?.message || 'Something went wrong');
      }
    }

    return {
      is_successful_order: false,
    };
  };

  return (
    <div className={styles.mt50}>
      <Loader loading={isLoading} size="large" text="Loading pass details">
        <AuthModal visible={showAuthModal} closeModal={closeAuthModal} onLoggedInCallback={showConfirmPaymentPopup} />
        <Row gutter={[8, 24]}>
          <Col xs={24}>{profile && <CreatorProfile profile={profile} profileImage={profileImage} />}</Col>
          <Col xs={24}>
            {pass && (
              <Row className={classNames(styles.box, styles.p20)} gutter={[8, 24]}>
                <Col xs={24} className={styles.p20}>
                  <Card className={styles.passCard} bodyStyle={{ padding: isMobileDevice ? 8 : 24 }}>
                    <Row gutter={[8, 16]} align="center">
                      <Col xs={24} md={18}>
                        <Row gutter={8}>
                          <Col xs={24}>
                            <Title className={styles.blueText} level={3}>
                              {pass?.name}
                            </Title>
                          </Col>
                          <Col xs={24}>
                            <Space size={isMobileDevice ? 8 : 'middle'}>
                              <Text className={classNames(styles.blueText, styles.textAlignCenter)} strong>
                                {pass && pass?.limited ? `${pass?.class_count} Credits` : 'Unlimited Credits'}
                              </Text>
                              <Divider type="vertical" />
                              <Text className={classNames(styles.blueText, styles.textAlignCenter)} strong>
                                {`${pass?.validity} days`}
                              </Text>
                              <Divider type="vertical" />
                              <Text className={classNames(styles.blueText, styles.textAlignCenter)} strong>
                                {pass?.total_price > 0
                                  ? `${pass?.total_price} ${pass?.currency.toUpperCase()}`
                                  : 'Free'}
                              </Text>
                            </Space>
                          </Col>
                        </Row>
                      </Col>
                      <Col xs={24} md={6}>
                        <Button block type="primary" onClick={() => openAuthModal()}>
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
                        <SessionCards sessions={pass.sessions} shouldFetchInventories={true} />
                      </Col>
                    </Row>
                  </Col>
                )}

                {pass.videos?.length > 0 && (
                  <Col xs={24}>
                    <Row gutter={[8, 8]}>
                      <Col xs={24}>
                        <Text className={styles.ml20}> Videos purchasable with this pass </Text>
                      </Col>
                      <Col xs={24}>
                        <SimpleVideoCardsList passDetails={pass} videos={pass.videos} />
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
