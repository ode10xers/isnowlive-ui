import React, { useState } from 'react';

import { Row, Col, Typography, Image, Modal, Card, message } from 'antd';
import { PlayCircleOutlined } from '@ant-design/icons';
import { loadStripe } from '@stripe/stripe-js';

import config from 'config';
import apis from 'apis';

import VideoCard from 'components/VideoCard';
import DefaultImage from 'components/Icons/DefaultImage';
import PurchaseModal from 'components/PurchaseModal';
import Loader from 'components/Loader';
import { showAlreadyBookedModal, showVideoPurchaseSuccessModal } from 'components/Modals/modals';

import { isAPISuccess, orderType } from 'utils/helper';

import styles from './styles.module.scss';

const stripePromise = loadStripe(config.stripe.secretKey);

const { Title, Text } = Typography;

const PublicVideoList = ({ username = null, videos }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [showVideoDetailModal, setShowVideoDetailModal] = useState(false);
  const [showPurchaseVideoModal, setShowPurchaseVideoModal] = useState(false);

  const handleSelectVideo = (video) => {
    if (video) {
      setSelectedVideo(video);
      setShowVideoDetailModal(true);
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
          showVideoPurchaseSuccessModal(selectedVideo);
          setShowVideoDetailModal(false);
          setSelectedVideo(null);
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
    setShowVideoDetailModal(false);
    setSelectedVideo(null);
  };

  const openPurchaseModal = () => {
    setShowPurchaseVideoModal(true);
  };

  const closePurchaseModal = () => {
    setShowPurchaseVideoModal(false);
  };

  return (
    <div className={styles.box}>
      <PurchaseModal visible={showPurchaseVideoModal} closeModal={closePurchaseModal} createOrder={createOrder} />
      <Modal
        visible={selectedVideo && showVideoDetailModal}
        onCancel={hideVideoDetailModal}
        centered={true}
        footer={null}
        width={720}
      >
        {selectedVideo && (
          <Loader loading={isLoading} size="large" text="Processing...">
            <div className={styles.mt20}>
              <VideoCard buyable={true} hoverable={false} video={selectedVideo} showPurchaseModal={openPurchaseModal} />
            </div>
          </Loader>
        )}
      </Modal>
      <Row justify="start" gutter={[20, 20]}>
        {videos.map((video) => (
          <Col xs={24} md={12} xl={8}>
            <Card
              hoverable={true}
              bordered={false}
              key={video.video_id || video.external_id}
              className={styles.cleanCard}
              onClick={() => handleSelectVideo(video)}
              actions={null}
              bodyStyle={{ padding: '10px 20px' }}
              cover={
                <div className={styles.imageWrapper}>
                  <div className={styles.thumbnailImage}>
                    <Image
                      src={video.thumbnail_url || 'error'}
                      alt={video.title}
                      fallback={DefaultImage()}
                      preview={false}
                    />
                  </div>
                  <div className={styles.playIconWrapper}>
                    <PlayCircleOutlined className={styles.playIcon} />
                  </div>
                </div>
              }
            >
              <Row gutter={[8, 8]} justify="center">
                <Col span={24} className={styles.textWrapper}>
                  <Row gutter={8} justify="start">
                    <Col flex="1 0 auto">
                      <Title className={styles.textAlignLeft} level={5}>
                        {video.title}
                      </Title>
                      <Text className={styles.blueText} strong>
                        Validity: {video.validity || 0} hours
                      </Text>
                    </Col>
                    <Col flex="0 0 auto">
                      <Text>
                        {video.price} {video.currency.toUpperCase()}
                      </Text>
                    </Col>
                  </Row>
                </Col>
              </Row>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
};

export default PublicVideoList;
