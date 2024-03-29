import React, { useState, useEffect, useCallback } from 'react';
import classNames from 'classnames';

import { Row, Col, Button, Typography, List, Modal, Divider, Space, Result } from 'antd';
import { ToolOutlined } from '@ant-design/icons';

import apis from 'apis';
import Routes from 'routes';

import Loader from 'components/Loader';
import SubscriptionCards from 'components/SubscriptionCards';
import CreateSubscriptionCard from 'components/CreateSubscriptionCard';
import { showErrorModal, showSuccessModal } from 'components/Modals/modals';

import { isAPISuccess } from 'utils/helper';
import { StripeAccountStatus, defaultPlatformFeePercentage, paymentProvider } from 'utils/constants';

import { useGlobalContext } from 'services/globalContext';
import { openFreshChatWidget } from 'services/integrations/fresh-chat';

import styles from './styles.module.scss';

const { Title, Text, Paragraph } = Typography;

const Subscriptions = ({ history }) => {
  const {
    state: { userDetails },
  } = useGlobalContext();

  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [subscriptions, setSubscriptions] = useState([]);
  const [targetSubscription, setTargetSubscription] = useState(null);
  const [creatorMemberTags, setCreatorMemberTags] = useState([]);
  const [creatorAbsorbsFees, setCreatorAbsorbsFees] = useState(true);
  const [creatorFeePercentage, setCreatorFeePercentage] = useState(defaultPlatformFeePercentage);

  const fetchCreatorSettings = useCallback(async () => {
    setIsLoading(true);
    try {
      const { status, data } = await apis.user.getCreatorSettings();

      if (isAPISuccess(status) && data) {
        setCreatorMemberTags(data.tags ?? []);
        setCreatorAbsorbsFees(data.creator_owns_fee ?? true);
        setCreatorFeePercentage(data.platform_fee_percentage ?? defaultPlatformFeePercentage);
      }
    } catch (error) {
      showErrorModal('Failed to fetch creator tags', error?.response?.data?.message || 'Something went wrong.');
    }
    setIsLoading(false);
  }, []);

  const getCreatorSubscriptions = useCallback(async () => {
    setIsLoading(true);
    try {
      const { status, data } = await apis.subscriptions.getCreatorSubscriptions();

      let mappedSubscriptionData = [];
      if (isAPISuccess(status) && data.Data) {
        mappedSubscriptionData = data.Data.sort((a, b) => a.price - b.price).map((subscription, idx) => ({
          ...subscription,
          idx,
        }));
      }

      const buttonData = mappedSubscriptionData.find((subscription) => subscription.external_id === null);

      if (!buttonData) {
        mappedSubscriptionData.push({
          idx: mappedSubscriptionData.length,
          external_id: null,
          isButton: true,
        });
      }

      setSubscriptions(mappedSubscriptionData);
    } catch (error) {
      showErrorModal('Failed to fetch memberships', error?.response?.data?.message || 'Something wrong happened');
    }
    setIsLoading(false);
  }, []);

  // TODO: Remove this later
  const hideAllSubscriptions = useCallback(async (subscriptionList) => {
    setIsLoading(true);
    await Promise.all(
      subscriptionList
        .filter((subs) => subs.external_id)
        .map(async (subs) => {
          try {
            const { status } = await apis.subscriptions.unpublishSubscription(subs.external_id);

            if (isAPISuccess(status)) {
              console.log(`Unpublished membership "${subs.name}"`);
            }
          } catch (error) {
            console.error(error);
          }
        })
    );
    setIsLoading(false);
  }, []);

  useEffect(() => {
    // TODO: Currently we only support membership for stripe. Remove some of these checks when PayPal membership is supported
    if (
      userDetails?.profile?.currency &&
      userDetails?.profile?.payment_provider === paymentProvider.STRIPE &&
      userDetails?.profile?.payment_account_status === StripeAccountStatus.CONNECTED
    ) {
      getCreatorSubscriptions();
      fetchCreatorSettings();
    }
  }, [userDetails, getCreatorSubscriptions, fetchCreatorSettings]);

  useEffect(() => {
    if (
      !userDetails?.profile?.currency ||
      (userDetails?.profile?.payment_provider === paymentProvider.STRIPE &&
        userDetails?.profile?.payment_account_status !== StripeAccountStatus.CONNECTED)
    ) {
      Modal.confirm({
        centered: true,
        closable: false,
        maskClosable: false,
        title: 'Setup payments to offer memberships',
        content: (
          <Paragraph>
            You need to setup your payments to create flexible memberships of any duration (days/months) and add
            selected content for your buyers to enjoy with memberships credits.
          </Paragraph>
        ),
        okText: 'Setup Payments',
        cancelText: 'Go Back',
        onOk: () => history.push(Routes.creatorDashboard.rootPath + Routes.creatorDashboard.paymentAccount),
        onCancel: () => history.push(Routes.creatorDashboard.rootPath),
      });
    } else if (userDetails?.profile?.payment_provider === paymentProvider.PAYPAL) {
      if (subscriptions.length > 0) {
        hideAllSubscriptions(subscriptions);
      }

      Modal.info({
        centered: true,
        closable: true,
        maskClosable: false,
        title: 'Unable to create membership',
        content: (
          <>
            <Paragraph>
              Membership subscriptions for users using PayPal are unavailable at the moment. We are working on it.
            </Paragraph>
            <Paragraph>Please drop us a message and express your interest to make it faster for you.</Paragraph>
          </>
        ),
        okText: 'I want to sell memberships',
        onOk: openFreshChatWidget,
      });
    }
  }, [subscriptions, userDetails, history, hideAllSubscriptions]);

  const publishSubscription = async (subscriptionId) => {
    setIsLoading(true);
    try {
      const { status } = await apis.subscriptions.publishSubscription(subscriptionId);

      if (isAPISuccess(status)) {
        showSuccessModal('Membership Published');
        getCreatorSubscriptions();
      }
    } catch (error) {
      showErrorModal('Failed publishing membership', error?.response?.data?.message || 'Something went wrong');
    }
    setIsLoading(true);
  };

  const unpublishSubscription = async (subscriptionId) => {
    setIsLoading(true);
    try {
      const { status } = await apis.subscriptions.unpublishSubscription(subscriptionId);

      if (isAPISuccess(status)) {
        showSuccessModal('Membership Unpublished');
        getCreatorSubscriptions();
      }
    } catch (error) {
      showErrorModal(
        'Failed unpublishing membership',
        error?.response?.data?.message || 'https://www.getpostman.com/collections/5b70cace98cec39eeb6d'
      );
    }
    setIsLoading(true);
  };

  const deleteSubscription = async (subscription) => {
    setIsLoading(true);
    try {
      const { status } = await apis.subscriptions.deleteSubscription(subscription.external_id);

      if (isAPISuccess(status)) {
        showSuccessModal(`${subscription.name} removed successfully`);
        getCreatorSubscriptions();
      }
    } catch (error) {
      showErrorModal('Failed to remove membership', error?.response?.data?.message || 'Something wrong happened');
    }
    setIsLoading(true);
  };

  const handleDelete = (data) => {
    Modal.confirm({
      title: 'Confirm Delete',
      content: (
        <Paragraph>
          Are you sure you want to delete <Text strong> {data.name} </Text> subscription tier?
        </Paragraph>
      ),
      centered: true,
      closable: true,
      maskClosable: true,
      okText: 'Yes, Delete',
      okButtonProps: {
        danger: true,
      },
      onOk: () => {
        deleteSubscription(data);
      },
    });
  };

  const setColumnState = async (targetIdx, state, data = null) => {
    // Clone the array
    const currSubscriptionData = subscriptions.map((subscription) => subscription);

    switch (state) {
      case 'EMPTY':
        currSubscriptionData[targetIdx]['isButton'] = true;
        currSubscriptionData[targetIdx]['editing'] = false;
        setIsEditing(false);
        break;
      case 'CREATE':
        currSubscriptionData[targetIdx]['isButton'] = false;
        currSubscriptionData[targetIdx]['editing'] = false;
        setIsEditing(true);
        setTargetSubscription(null);
        break;
      case 'SAVED':
        await getCreatorSubscriptions();
        setIsEditing(false);
        return;
      case 'EDIT':
        currSubscriptionData[targetIdx]['isButton'] = false;
        currSubscriptionData[targetIdx]['editing'] = true;

        if (data) {
          setIsEditing(true);
          setTargetSubscription(data);
        }
        break;

      default:
        return;
    }

    setSubscriptions(currSubscriptionData);
  };

  const subscriptionFields = [
    {
      label: 'Membership Tier Name',
      className: undefined,
    },
    {
      label: 'Membership Price',
      className: undefined,
    },
    {
      label: 'Purchasable by',
      className: undefined,
    },
    {
      label: 'Membership Period',
      className: undefined,
    },
    {
      label: 'Applicable to',
      className: undefined,
    },
    {
      label: 'Session/Video Credit',
      className: undefined,
    },
    {
      label: 'Included Sessions',
      className: undefined,
    },
    {
      label: 'Included Videos',
      className: undefined,
    },
    {
      label: 'Course Credits/period',
      className: undefined,
    },
    {
      label: 'Included Courses',
      className: undefined,
    },
  ];

  const renderSubscriptionFields = (item) => (
    <List.Item className={classNames(item.className, styles.fieldsListItem)}>
      <Text strong> {item.label} </Text>
    </List.Item>
  );

  const renderSubscriptionList = (subscription) => (
    <List.Item>
      {subscription.isButton ? (
        <Button
          block
          type="primary"
          onClick={() => setColumnState(subscription.idx, 'CREATE')}
          disabled={isEditing || !userDetails?.profile?.currency}
        >
          Add new Membership Tier
        </Button>
      ) : !subscription.external_id || subscription.editing ? (
        <CreateSubscriptionCard
          creatorMemberTags={creatorMemberTags || []}
          creatorAbsorbsFees={creatorAbsorbsFees}
          creatorFeePercentage={creatorFeePercentage}
          cancelChanges={() => setColumnState(subscription.idx, 'EMPTY')}
          saveChanges={() => setColumnState(subscription.idx, 'SAVED')}
          editedSubscription={targetSubscription}
        />
      ) : (
        <SubscriptionCards
          subscription={subscription}
          editing={isEditing}
          editSubscription={() => setColumnState(subscription.idx, 'EDIT', subscription)}
          deleteSubscription={() => handleDelete(subscription)}
          publishSubscription={publishSubscription}
          unpublishSubscription={unpublishSubscription}
        />
      )}
    </List.Item>
  );

  const renderSubscriptionRows = () => {
    let tempSubscriptions = JSON.parse(JSON.stringify(subscriptions));
    let segmentedSubscriptions = [];

    while (tempSubscriptions.length > 0) {
      segmentedSubscriptions.push(tempSubscriptions.splice(0, 3));
    }

    return segmentedSubscriptions.map((segmentedSubs) => (
      <Row gutter={10} justify="start" key={segmentedSubs[0].external_id || 'button'}>
        <Col xs={5}>
          <List
            rowKey="external_id"
            itemLayout="vertical"
            size="large"
            dataSource={subscriptionFields}
            renderItem={renderSubscriptionFields}
          />
        </Col>
        <Col xs={19}>
          <List grid={{ gutter: 8, column: 3 }} dataSource={segmentedSubs} renderItem={renderSubscriptionList} />
        </Col>
      </Row>
    ));
  };

  return (
    <div className={styles.box}>
      <Row gutter={[8, 10]}>
        <Col xs={24}>
          <Title level={4}> Memberships </Title>
        </Col>
        {userDetails?.profile?.payment_provider === paymentProvider.PAYPAL ? (
          <Col xs={24}>
            <Row justify="center">
              <Col xs={12}>
                <Result
                  icon={<ToolOutlined />}
                  title="Support for memberships for PayPal creator is coming!"
                  subTitle="Membership and recurring payments for PayPal Creator is not yet supported, but we are working hard on realizing it! Thank you for your patience and support for us, we will let you know once you can use this."
                />
              </Col>
            </Row>
          </Col>
        ) : (
          <Col xs={24}>
            <Loader size="large" loading={isLoading} text="Fetching memberships...">
              <Space
                split={<Divider type="horizontal" />}
                direction="vertical"
                className={styles.creatorMembershipList}
              >
                {renderSubscriptionRows()}
              </Space>
            </Loader>
          </Col>
        )}
      </Row>
    </div>
  );
};

export default Subscriptions;
