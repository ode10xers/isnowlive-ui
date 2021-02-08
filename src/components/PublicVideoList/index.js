import React, { useState } from 'react';
import classNames from 'classnames';

import { Row, Col, Typography, Image, Button, Card, message } from 'antd';
import { loadStripe } from '@stripe/stripe-js';

import config from 'config';
import apis from 'apis';

import DefaultImage from 'components/Icons/DefaultImage';
import PurchaseModal from 'components/PurchaseModal';
import Loader from 'components/Loader';
import { showAlreadyBookedModal, showVideoPurchaseSuccessModal } from 'components/Modals/modals';

import { isAPISuccess, orderType, generateUrlFromUsername } from 'utils/helper';

import { useGlobalContext } from 'services/globalContext';
import styles from './styles.module.scss';

const stripePromise = loadStripe(config.stripe.secretKey);

const { Title } = Typography;

const PublicVideoList = ({ username = null, videos }) => {
  const {
    state: { userDetails },
  } = useGlobalContext();

  const [isLoading, setIsLoading] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState(null);
  // const [showVideoDetailModal, setShowVideoDetailModal] = useState(false);
  const [showPurchaseVideoModal, setShowPurchaseVideoModal] = useState(false);

  const handleSelectVideo = (video) => {
    if (video) {
      setSelectedVideo(video);
      // setShowVideoDetailModal(true);
      openPurchaseModal();
    }
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
          hideVideoDetailModal();
        }
      }
    } catch (error) {
      message.error(error.response?.data?.message || 'Something went wrong');
    }
    setIsLoading(false);
  };

  const createOrder = async () => {
    try {
      const payload = {
        video_id: selectedVideo.external_id,
      };

      const { status, data } = await apis.videos.createOrderForUser(payload);
      if (isAPISuccess(status) && data) {
        if (data.payment_required) {
          initiatePaymentForOrder({
            order_id: data.video_order_id,
            order_type: orderType.VIDEO,
          });
        } else {
          setIsLoading(false);
          showVideoPurchaseSuccessModal(userDetails.email, selectedVideo, username);
          hideVideoDetailModal();
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

  const hideVideoDetailModal = () => {
    // setShowVideoDetailModal(false);
    setSelectedVideo(null);
    setShowPurchaseVideoModal(false);
  };

  const openPurchaseModal = () => {
    setShowPurchaseVideoModal(true);
  };

  const closePurchaseModal = () => {
    setShowPurchaseVideoModal(false);
  };

  const redirectToVideoDetails = (video) => {
    if (video.external_id) {
      const baseUrl = generateUrlFromUsername(username || video.username || 'app');
      window.open(`${baseUrl}/v/${video.external_id}`);
    }
  };

  return (
    <div className={styles.box}>
      <PurchaseModal visible={showPurchaseVideoModal} closeModal={closePurchaseModal} createOrder={createOrder} />
      {/* 
      Commenting this as per Rahul's request
      <Modal
        visible={selectedVideo && showVideoDetailModal}
        onCancel={hideVideoDetailModal}
        centered={true}
        footer={null}
        width={720}
      >
        {selectedVideo && (
          <div className={styles.mt20}>
            <VideoCard buyable={true} hoverable={false} video={selectedVideo} showPurchaseModal={openPurchaseModal} />
          </div>
        )}
      </Modal> 
      */}
      <Loader loading={isLoading} size="large" text="Processing...">
        <Row justify="start" gutter={[20, 20]}>
          {videos.map((video) => (
            <Col xs={24} md={12}>
              <Card
                key={video.external_id}
                className={styles.cleanCard}
                hoverable={true}
                bodyStyle={{ padding: '10px 20px' }}
                cover={
                  <Image
                    src={video.thumbnail_url || 'error'}
                    alt={video.title}
                    fallback={DefaultImage()}
                    preview={false}
                    height={200}
                  />
                }
              >
                <Row gutter={[8, 8]} justify="center">
                  {/* <Col span={24} className={styles.imageWrapper}>
                    <div className={styles.thumbnailImage}>
                      <Image
                        src={video.thumbnail_url || 'error'}
                        alt={video.title}
                        fallback={DefaultImage()}
                        preview={false}
                        height={200}
                      />
                    </div>
                  </Col> */}
                  <Col span={24} className={classNames(styles.mt10, styles.textWrapper)}>
                    <Row gutter={8} justify="start">
                      <Col span={24} className={styles.titleWrapper}>
                        <Title className={styles.textAlignLeft} level={5}>
                          {video.title}
                        </Title>
                      </Col>
                      <Col span={24} className={styles.buttonWrapper}>
                        <Row gutter={16} justify="space-around">
                          <Col xs={12}>
                            <Button
                              className={styles.detailBtn}
                              block
                              type="link"
                              onClick={() => redirectToVideoDetails(video)}
                            >
                              Details
                            </Button>
                          </Col>
                          <Col xs={12}>
                            <Button block type="primary" onClick={() => handleSelectVideo(video)}>
                              Buy
                            </Button>
                          </Col>
                        </Row>
                      </Col>
                    </Row>
                  </Col>
                </Row>
              </Card>
            </Col>
          ))}
        </Row>
      </Loader>
    </div>
  );
};

export default PublicVideoList;
