import React, { useState } from 'react';

import { Row, Col } from 'antd';

import apis from 'apis';

import VideoCard from 'components/VideoCard';
import AuthModal from 'components/AuthModal';
import Loader from 'components/Loader';
import { showAlreadyBookedModal, showErrorModal, showPurchaseSingleVideoSuccessModal } from 'components/Modals/modals';

import { isAPISuccess, orderType, generateUrlFromUsername, paymentSource, productType } from 'utils/helper';

import { useGlobalContext } from 'services/globalContext';

import styles from './styles.module.scss';

const PublicVideoList = ({ username = null, videos }) => {
  const { showPaymentPopup } = useGlobalContext();

  const [isLoading, setIsLoading] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [showPurchaseVideoModal, setShowPurchaseVideoModal] = useState(false);

  const handleSelectVideo = (video) => {
    if (video) {
      setSelectedVideo(video);
      openAuthModal();
    }
  };

  const showConfirmPaymentPopup = () => {
    if (!selectedVideo) {
      showErrorModal('Something went wrong', 'Invalid Video Selected');
      return;
    }

    const desc = `Can be watched up to ${selectedVideo.watch_limit} times, valid for ${selectedVideo.validity} days`;

    const paymentPopupData = {
      productId: selectedVideo.external_id,
      productType: 'VIDEO',
      itemList: [
        {
          name: selectedVideo.title,
          description: desc,
          currency: selectedVideo.currency,
          price: selectedVideo.price,
        },
      ],
    };

    showPaymentPopup(paymentPopupData, createOrder);
  };

  const createOrder = async (couponCode = '') => {
    try {
      const payload = {
        video_id: selectedVideo?.external_id,
        payment_source: paymentSource.GATEWAY,
      };

      const { status, data } = await apis.videos.createOrderForUser(payload);
      if (isAPISuccess(status) && data) {
        setIsLoading(false);
        setSelectedVideo(null);

        if (data.payment_required) {
          return {
            ...data,
            payment_order_id: data.video_order_id,
            payment_order_type: orderType.VIDEO,
          };
        } else {
          showPurchaseSingleVideoSuccessModal(data.video_order_id);

          return null;
        }
      }
    } catch (error) {
      setIsLoading(false);

      if (error.response?.data?.message === 'user already has a confirmed order for this video') {
        showAlreadyBookedModal(productType.VIDEO);
      } else {
        showErrorModal('Something went wrong', error.response?.data?.message);
      }
    }

    return null;
  };

  const openAuthModal = () => {
    setShowPurchaseVideoModal(true);
  };

  const closeAuthModal = () => {
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
      <AuthModal
        visible={showPurchaseVideoModal}
        closeModal={closeAuthModal}
        onLoggedInCallback={showConfirmPaymentPopup}
      />
      <Loader loading={isLoading} size="large" text="Processing...">
        <Row justify="start" gutter={[20, 20]}>
          {videos?.map((video) => (
            <Col xs={24} lg={12} key={video?.external_id}>
              <VideoCard
                video={video}
                buyable={true}
                onCardClick={() => redirectToVideoDetails(video)}
                showAuthModal={() => handleSelectVideo(video)}
              />
            </Col>
          ))}
        </Row>
      </Loader>
    </div>
  );
};

export default PublicVideoList;
