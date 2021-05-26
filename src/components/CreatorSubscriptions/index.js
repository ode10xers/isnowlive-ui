import React, { useState } from 'react';

import { Row, Col, List, message } from 'antd';

import apis from 'apis';

import Loader from 'components/Loader';
import AuthModal from 'components/AuthModal';
import { showErrorModal, showPurchaseSubscriptionSuccessModal } from 'components/Modals/modals';
import ShowcaseSubscriptionCards from 'components/ShowcaseSubscriptionCards';

import dateUtil from 'utils/date';
import { generateBaseCreditsText } from 'utils/subscriptions';
import { isAPISuccess, orderType, isUnapprovedUserError } from 'utils/helper';
// import { isMobileDevice } from 'utils/device';

import { useGlobalContext } from 'services/globalContext';

import styles from './styles.module.scss';

const {
  timezoneUtils: { getTimezoneLocation },
} = dateUtil;

const CreatorSubscriptions = ({ subscriptions }) => {
  const { showPaymentPopup } = useGlobalContext();

  const [isLoading, setIsLoading] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState(null);

  const openPurchaseModal = (subscription) => {
    setSelectedSubscription(subscription);
    setShowAuthModal(true);
  };

  const closePurchaseModal = () => {
    setSelectedSubscription(null);
    setShowAuthModal(false);
  };

  const showConfirmPaymentPopup = () => {
    if (!selectedSubscription) {
      showErrorModal('Something went wrong', 'Invalid Subscription Selected');
      return;
    }

    let itemDescription = [];

    itemDescription.push(generateBaseCreditsText(selectedSubscription, false));

    if (selectedSubscription.products['COURSE']) {
      itemDescription.push(generateBaseCreditsText(selectedSubscription, true));
    }

    const paymentPopupData = {
      productId: selectedSubscription.external_id,
      productType: 'SUBSCRIPTION',
      itemList: [
        {
          name: selectedSubscription.name,
          description: itemDescription.join(', '),
          currency: selectedSubscription.currency,
          price: selectedSubscription.price,
        },
      ],
    };

    showPaymentPopup(paymentPopupData, createOrder);
  };

  const createOrder = async (couponCode = '') => {
    setIsLoading(true);
    try {
      const payload = {
        subscription_id: selectedSubscription.external_id,
        coupon_code: couponCode,
        user_timezone_location: getTimezoneLocation(),
      };

      const { status, data } = await apis.subscriptions.createOrderForUser(payload);

      if (isAPISuccess(status) && data) {
        setIsLoading(false);
        setSelectedSubscription(null);

        if (data.payment_required) {
          return {
            ...data,
            is_successful_order: true,
            payment_order_type: orderType.SUBSCRIPTION,
            payment_order_id: data.subscription_order_id,
          };
        } else {
          showPurchaseSubscriptionSuccessModal();
          return {
            ...data,
            is_successful_order: true,
          };
        }
      }
    } catch (error) {
      setIsLoading(false);
      if (error?.response?.status === 500 && error?.response?.data?.message === 'unable to apply discount to order') {
        showErrorModal(
          'Discount Code Not Applicable',
          'The discount code you entered is not applicable this product. Please try again with a different discount code'
        );
      } else if (!isUnapprovedUserError(error.response)) {
        message.error(error.response?.data?.message || 'Something went wrong');
      }
    }

    return {
      is_successful_order: false,
    };
  };

  const renderShowcaseSubscriptionCards = (subscription) => (
    <List.Item key={subscription?.external_id}>
      <ShowcaseSubscriptionCards subscription={subscription} openPurchaseModal={openPurchaseModal} />
    </List.Item>
  );

  return (
    <div className={styles.p10}>
      <AuthModal visible={showAuthModal} closeModal={closePurchaseModal} onLoggedInCallback={showConfirmPaymentPopup} />
      <Loader loading={isLoading} text="Processing payment" size="large">
        <Row gutter={[8, 10]}>
          <Col xs={24}>
            <List
              // pagination={{ pageSize: isMobileDevice ? 1 : 3, position: 'top' }}
              rowKey={(record) => record.external_id}
              grid={{ gutter: 10, xs: 1, sm: 1, md: 2, lg: 3, xl: 3, xxl: 3 }}
              dataSource={subscriptions}
              renderItem={renderShowcaseSubscriptionCards}
            />
          </Col>
        </Row>
      </Loader>
    </div>
  );
};

export default CreatorSubscriptions;
