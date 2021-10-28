import React, { useState } from 'react';

import { Row, Col } from 'antd';

import apis from 'apis';

import Loader from 'components/Loader';
import AuthModal from 'components/AuthModal';
// import VideoCard from 'components/VideoCard';
import VideoListCard from 'components/DynamicProfileComponents/VideosProfileComponent/VideoListCard';
import { showAlreadyBookedModal, showErrorModal, showPurchaseSingleVideoSuccessModal } from 'components/Modals/modals';

import dateUtil from 'utils/date';
import { isAPISuccess, isUnapprovedUserError } from 'utils/helper';
import { orderType, paymentSource, productType } from 'utils/constants';

import { useGlobalContext } from 'services/globalContext';

import styles from './styles.module.scss';

const {
  timezoneUtils: { getTimezoneLocation },
} = dateUtil;

const PublicVideoList = ({ videos }) => {
  const { showPaymentPopup } = useGlobalContext();

  const [isLoading, setIsLoading] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [showPurchaseVideoModal, setShowPurchaseVideoModal] = useState(false);

  // const handleSelectVideo = (video) => {
  //   if (video) {
  //     setSelectedVideo(video);
  //     openAuthModal();
  //   }
  // };

  const showConfirmPaymentPopup = () => {
    if (!selectedVideo) {
      showErrorModal('Something went wrong', 'Invalid Video Selected');
      return;
    }

    const desc = `Can be watched up to ${selectedVideo.watch_limit} times, valid for ${selectedVideo.validity} days`;

    let flexiblePaymentDetails = null;

    if (selectedVideo.pay_what_you_want) {
      flexiblePaymentDetails = {
        enabled: true,
        minimumPrice: selectedVideo.total_price,
      };
    }

    const paymentPopupData = {
      productId: selectedVideo.external_id,
      productType: productType.VIDEO,
      itemList: [
        {
          name: selectedVideo.title,
          description: desc,
          currency: selectedVideo.currency,
          price: selectedVideo.total_price,
          pay_what_you_want: selectedVideo.pay_what_you_want,
        },
      ],
      flexiblePaymentDetails,
    };

    showPaymentPopup(paymentPopupData, createOrder);
  };

  const createOrder = async (couponCode = '', priceAmount = 5) => {
    try {
      let payload = {
        video_id: selectedVideo?.external_id,
        payment_source: paymentSource.GATEWAY,
        user_timezone_location: getTimezoneLocation(),
        coupon_code: couponCode,
      };

      if (selectedVideo?.pay_what_you_want) {
        payload = { ...payload, amount: priceAmount };
      }

      const { status, data } = await apis.videos.createOrderForUser(payload);
      if (isAPISuccess(status) && data) {
        setIsLoading(false);
        setSelectedVideo(null);

        if (data.payment_required) {
          return {
            ...data,
            is_successful_order: true,
            payment_order_id: data.video_order_id,
            payment_order_type: orderType.VIDEO,
          };
        } else {
          showPurchaseSingleVideoSuccessModal(data.video_order_id);

          return {
            ...data,
            is_successful_order: false,
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

  // const openAuthModal = () => {
  //   setShowPurchaseVideoModal(true);
  // };

  const closeAuthModal = () => {
    setShowPurchaseVideoModal(false);
  };

  return (
    <div className={styles.publicVideoListContainer}>
      <AuthModal
        visible={showPurchaseVideoModal}
        closeModal={closeAuthModal}
        onLoggedInCallback={showConfirmPaymentPopup}
      />
      <Loader loading={isLoading} size="large" text="Processing...">
        <Row justify="start" gutter={[20, 20]}>
          {videos
            ?.sort((a, b) => (b.thumbnail_url?.endsWith('.gif') ? 1 : -1))
            .map((video) => (
              <Col xs={24} sm={12} key={video?.external_id}>
                {/* <VideoCard video={video} buyable={true} showAuthModal={() => handleSelectVideo(video)} /> */}
                <VideoListCard video={video} />
              </Col>
            ))}
        </Row>
      </Loader>
    </div>
  );
};

export default PublicVideoList;
