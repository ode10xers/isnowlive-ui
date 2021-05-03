import React, { useState, useEffect, useCallback } from 'react';
import classNames from 'classnames';

import { Row, Col, Button, Typography, List, Modal, Divider, Space } from 'antd';

import apis from 'apis';

import { isAPISuccess } from 'utils/helper';

import Loader from 'components/Loader';
import CreateSubscriptionCard from 'components/CreateSubscriptionCard';
import SubscriptionCards from 'components/SubscriptionCards';
import { showErrorModal, showSuccessModal } from 'components/Modals/modals';

import styles from './styles.module.scss';

const { Title, Text, Paragraph } = Typography;

const Subscriptions = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [subscriptions, setSubscriptions] = useState([]);
  const [targetSubscription, setTargetSubscription] = useState(null);
  const [creatorMemberTags, setCreatorMemberTags] = useState([]);

  const fetchCreatorMemberTags = useCallback(async () => {
    setIsLoading(true);
    try {
      const { status, data } = await apis.user.getCreatorUserPreferences();

      if (isAPISuccess(status) && data) {
        setCreatorMemberTags(data.tags);
      }
    } catch (error) {
      showErrorModal('Failed to fetch creator tags', error?.response?.data?.message || 'Something went wrong.');
    }
    setIsLoading(false);
  }, []);

  const getCreatorSubscriptions = useCallback(async () => {
    setIsLoading(true);
    try {
      //TODO: Since the API is paginated right now the temporary solution is to set per_page as 25
      const { status, data } = await apis.subscriptions.getCreatorSubscriptions(1, 25);

      if (isAPISuccess(status) && data.Data) {
        let mappedSubscriptionData = [];
        mappedSubscriptionData = data.Data.sort((a, b) => a.price - b.price).map((subscription, idx) => ({
          ...subscription,
          idx,
        }));

        const buttonData = mappedSubscriptionData.find((subscription) => subscription.external_id === null);

        if (!buttonData) {
          mappedSubscriptionData.push({
            idx: mappedSubscriptionData.length,
            external_id: null,
            isButton: true,
          });
        }

        setSubscriptions(mappedSubscriptionData);
      }
    } catch (error) {
      showErrorModal('Failed to fetch memberships', error?.response?.data?.message || 'Something wrong happened');
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    getCreatorSubscriptions();
    fetchCreatorMemberTags();
  }, [getCreatorSubscriptions, fetchCreatorMemberTags]);

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
      className: styles.subscriptionNameField,
    },
    {
      label: 'Monthly Membership Price',
      className: undefined,
    },
    {
      label: 'Purchasable by',
      className: undefined,
    },
    {
      label: 'Session or Video Credits/Month',
      className: undefined,
    },
    {
      label: 'Applicable to',
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
    // {
    //   label: 'Course Included?',
    //   className: undefined,
    // },
    // {
    //   label: 'Course Credits/Month',
    //   className: undefined,
    // },
    // {
    //   label: 'Included Courses',
    //   className: undefined,
    // },
  ];

  const renderSubscriptionFields = (item) => (
    <List.Item className={classNames(item.className, styles.fieldsListItem)}>
      <Text strong> {item.label} </Text>
    </List.Item>
  );

  const renderSubscriptionList = (subscription) => (
    <List.Item>
      {subscription.isButton ? (
        <Button block type="primary" onClick={() => setColumnState(subscription.idx, 'CREATE')} disabled={isEditing}>
          Add new Membership Tier
        </Button>
      ) : !subscription.external_id || subscription.editing ? (
        <CreateSubscriptionCard
          creatorMemberTags={creatorMemberTags || []}
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
    let tempSubscriptions = Array.from(subscriptions);
    let segmentedSubscriptions = [];

    while (tempSubscriptions.length > 0) {
      segmentedSubscriptions.push(tempSubscriptions.slice(0, 3));
      tempSubscriptions.splice(0, 3);
    }

    return segmentedSubscriptions.map((segmentedSubs) => (
      <Row gutter={10} justify="start" key={segmentedSubs[0].external_id || 'button'}>
        <Col xs={5}>
          <List
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
          <Title level={4}> Monthly Memberships </Title>
        </Col>
        <Col xs={24}>
          <Loader size="large" loading={isLoading} text="Fetching memberships...">
            <Space split={<Divider type="horizontal" />} direction="vertical" className={styles.creatorMembershipList}>
              {renderSubscriptionRows()}
            </Space>
          </Loader>
        </Col>
      </Row>
    </div>
  );
};

export default Subscriptions;
