import React, { useState, useEffect, useCallback } from 'react';
import classNames from 'classnames';

import { Row, Col, Button, Typography, List, Modal, message } from 'antd';

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
  const [sessions, setSessions] = useState([]);
  const [videos, setVideos] = useState([]);
  const [courses, setCourses] = useState([]);

  const mapProductItems = (subscription) => {
    if (!subscription.external_id) {
      return subscription;
    }

    let mappedProductData = subscription.products;

    Object.entries(subscription.products).forEach(([key, val]) => {
      let items = [];

      if (val.product_ids?.length > 0) {
        switch (key) {
          case 'SESSION':
            items = sessions.filter((session) => val.product_ids?.includes(session.external_id));
            break;
          case 'VIDEO':
            items = videos.filter((video) => val.product_ids?.includes(video.external_id));
            break;
          case 'COURSE':
            items = courses.filter((course) => val.product_ids?.includes(course.id));
            break;
          default:
            break;
        }
      }

      mappedProductData[key] = {
        ...val,
        items: items,
      };
    });

    return {
      ...subscription,
      products: mappedProductData,
    };
  };

  const getCreatorSubscriptions = useCallback(async () => {
    setIsLoading(true);
    try {
      const { status, data } = await apis.subscriptions.getCreatorSubscriptions(1, 3);

      let mappedSubscriptionData = [];

      if (isAPISuccess(status) && data.Data) {
        mappedSubscriptionData = data.Data.map((subscription, idx) => ({ ...subscription, idx })).sort(
          (a, b) => a.price - b.price
        );
      }

      if (mappedSubscriptionData.length < 3) {
        const buttonData = mappedSubscriptionData.find((subscription) => subscription.external_id === null);

        if (!buttonData) {
          mappedSubscriptionData.push({
            idx: mappedSubscriptionData.length,
            external_id: null,
            isButton: true,
          });
        }
      }

      setSubscriptions(mappedSubscriptionData);
    } catch (error) {
      showErrorModal('Failed to fetch subscriptions', error?.response?.data?.message || 'Something wrong happened');
    }
    setIsLoading(false);
  }, []);

  const getCreatorProducts = useCallback(async () => {
    try {
      const { status, data } = await apis.session.getSession();

      if (isAPISuccess(status) && data) {
        setSessions(data);
      }
    } catch (error) {
      message.error(error?.response?.data?.message || 'Failed to load sessions');
    }

    try {
      const { status, data } = await apis.videos.getCreatorVideos();

      if (isAPISuccess(status) && data) {
        setVideos(data);
      }
    } catch (error) {
      message.error(error?.response?.data?.message || 'Failed to load videos');
    }

    try {
      const { status, data } = await apis.courses.getCreatorCourses();

      if (isAPISuccess(status) && data) {
        setCourses(data);
      }
    } catch (error) {
      message.error(error?.response?.data?.message || 'Failed to load courses');
    }
  }, []);

  useEffect(() => {
    // const fetchSubscriptionDetails = async () => {
    //   await getCreatorProducts();
    //   await getCreatorSubscriptions();
    // };
    // fetchSubscriptionDetails();
    //eslint-disable-next-line

    getCreatorProducts();
    getCreatorSubscriptions();
  }, [getCreatorProducts, getCreatorSubscriptions]);

  const deleteSubscription = async (subscription) => {
    setIsLoading(true);
    try {
      const { status } = await apis.subscriptions.deleteSubscription(subscription.external_id);

      if (isAPISuccess(status)) {
        showSuccessModal(`${subscription.name} removed successfully`);
        getCreatorSubscriptions();
      }
    } catch (error) {
      showErrorModal('Failed to remove subsription', error?.response?.data?.message || 'Something wrong happened');
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
      label: 'Subscription Tier Name',
      className: styles.subscriptionNameField,
    },
    {
      label: 'Monthly Subscription Price',
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
      label: 'Included Session Type',
      className: undefined,
    },
    {
      label: 'Included Sessions',
      className: undefined,
    },
    {
      label: 'Included Video Type',
      className: undefined,
    },
    {
      label: 'Included Videos',
      className: undefined,
    },
    {
      label: 'Course Included?',
      className: undefined,
    },
    {
      label: 'Course Credits/Month',
      className: undefined,
    },
    {
      label: 'Included Course Type',
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
        <Button block type="primary" onClick={() => setColumnState(subscription.idx, 'CREATE')} disabled={isEditing}>
          Add new Subscription Tier
        </Button>
      ) : !subscription.external_id || subscription.editing ? (
        <CreateSubscriptionCard
          sessions={sessions}
          videos={videos}
          courses={courses}
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
        />
      )}
    </List.Item>
  );

  return (
    <div className={styles.box}>
      <Row gutter={[8, 10]}>
        <Col xs={24}>
          <Title level={4}> Monthly Subscriptions </Title>
        </Col>
        <Col xs={24}>
          <Loader size="large" loading={isLoading} text="Fetching subscriptions...">
            <Row gutter={10} justify="start">
              <Col xs={7}>
                <List
                  itemLayout="vertical"
                  size="large"
                  dataSource={subscriptionFields}
                  renderItem={renderSubscriptionFields}
                />
              </Col>
              <Col xs={17}>
                <List
                  grid={{ gutter: 8, column: 3 }}
                  dataSource={subscriptions?.map(mapProductItems)}
                  renderItem={renderSubscriptionList}
                />
              </Col>
            </Row>
          </Loader>
        </Col>
      </Row>
    </div>
  );
};

export default Subscriptions;
