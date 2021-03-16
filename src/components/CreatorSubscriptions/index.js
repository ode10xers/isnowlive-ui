import React, { useState } from 'react';

import { Row, Col, List, message } from 'antd';

import Loader from 'components/Loader';
import PurchaseModal from 'components/PurchaseModal';
import { showErrorModal, showSuccessModal } from 'components/Modals/modals';
import ShowcaseSubscriptionCards from 'components/ShowcaseSubscriptionCards';

import dateUtil from 'utils/date';
import { generateBaseCreditsText } from 'utils/subscriptions';

import { useGlobalContext } from 'services/globalContext';

import apis from 'apis';
import { isAPISuccess } from 'utils/helper';

const {
  timezoneUtils: { getTimezoneLocation },
} = dateUtil;

const CreatorSubscriptions = ({ subscriptions }) => {
  const { showPaymentPopup } = useGlobalContext();

  const [isLoading, setIsLoading] = useState(false);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState(null);

  const openPurchaseModal = (subscription) => {
    setSelectedSubscription(subscription);
    setShowPurchaseModal(true);
  };

  const closePurchaseModal = () => {
    setSelectedSubscription(null);
    setShowPurchaseModal(false);
  };

  const showConfirmPaymentPopup = () => {
    if (!selectedSubscription) {
      showErrorModal('Something went wrong', 'Invalid Course Selected');
      return;
    }

    let itemDescription = [];

    itemDescription.push(generateBaseCreditsText(selectedSubscription, false));

    if (selectedSubscription.products['COURSE']) {
      itemDescription.push(generateBaseCreditsText(selectedSubscription, true));
    }

    const paymentPopupData = {
      productId: selectedSubscription.external_id,
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

  //TODO: Integrate this once implemented
  const initiatePaymentForOrder = async (orderDetails) => {
    console.log(orderDetails);
    message.success('Order created!');
  };

  const createOrder = async (userEmail, couponCode = '') => {
    setIsLoading(true);

    console.log(couponCode);

    try {
      const payload = {
        subscription_id: selectedSubscription.external_id,
        user_timezone_location: getTimezoneLocation(),
      };

      const { status, data } = await apis.subscriptions.createSubscriptionOrder(payload);

      if (isAPISuccess(status) && data) {
        if (data.payment_required) {
          initiatePaymentForOrder(data);
        } else {
          //TODO: Confirm with Rahul about the content of confirmation popup
          showSuccessModal('Subscription Purchased');
        }
      }
    } catch (error) {
      if (error?.response?.status === 500 && error?.response?.data?.message === 'unable to apply discount to order') {
        showErrorModal(
          'Discount Code Not Applicable',
          'The discount code you entered is not applicable this product. Please try again with a different discount code'
        );
      } else {
        message.error(error.response?.data?.message || 'Something went wrong');
      }
    }

    setIsLoading(false);
  };

  const renderShowcaseSubscriptionCards = (subscription) => (
    <List.Item key={subscription?.external_id}>
      <ShowcaseSubscriptionCards subscription={subscription} openPurchaseModal={openPurchaseModal} />
    </List.Item>
  );

  return (
    <div>
      <PurchaseModal
        visible={showPurchaseModal}
        closeModal={closePurchaseModal}
        createOrder={showConfirmPaymentPopup}
      />
      <Loader loading={isLoading} text="Processing payment" size="large">
        <Row gutter={[8, 10]}>
          <Col xs={24}>
            <List
              grid={{ gutter: 10, column: 3 }}
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
