import React, { useState } from 'react';

import { Row, Col, message } from 'antd';


// import config from 'config';
import apis from 'apis';

import VideoCard from 'components/VideoCard';
import PurchaseModal from 'components/PurchaseModal';
import Loader from 'components/Loader';
import { showAlreadyBookedModal, showErrorModal, showVideoPurchaseSuccessModal } from 'components/Modals/modals';

import { isAPISuccess, orderType, generateUrlFromUsername, paymentSource, productType } from 'utils/helper';

import styles from './styles.module.scss';

const stripePromise = null;

const PublicVideoList = ({ username = null, videos }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [showPurchaseVideoModal, setShowPurchaseVideoModal] = useState(false);

  const handleSelectVideo = (video) => {
    if (video) {
      setSelectedVideo(video);
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

  const createOrder = async (userEmail) => {
    try {
      const payload = {
        video_id: selectedVideo?.external_id,
        payment_source: paymentSource.GATEWAY,
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
          showVideoPurchaseSuccessModal(userEmail, selectedVideo, null, false, false, username);
          hideVideoDetailModal();
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

  const hideVideoDetailModal = () => {
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
    if (video?.external_id) {
      const baseUrl = generateUrlFromUsername(username || video?.username || 'app');
      window.open(`${baseUrl}/v/${video?.external_id}`);
    }
  };

  return (
    <div className={styles.box}>
      <PurchaseModal visible={showPurchaseVideoModal} closeModal={closePurchaseModal} createOrder={createOrder} />
      <Loader loading={isLoading} size="large" text="Processing...">
        <Row justify="start" gutter={[20, 20]}>
          {videos?.map((video) => (
            <Col xs={24} lg={12} key={video?.external_id}>
              <VideoCard
                video={video}
                buyable={true}
                onCardClick={() => redirectToVideoDetails(video)}
                showPurchaseModal={() => handleSelectVideo(video)}
              />
            </Col>
          ))}
        </Row>
      </Loader>
    </div>
  );
};

export default PublicVideoList;
