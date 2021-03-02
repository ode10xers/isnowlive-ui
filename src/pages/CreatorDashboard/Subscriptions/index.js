import React, { useState, useEffect, useCallback } from 'react';
import classNames from 'classnames';

import { Row, Col, Button, Typography, List, Modal } from 'antd';

import { isAPISuccess } from 'utils/helper';

import Loader from 'components/Loader';
import CreateSubscriptionCard from 'components/CreateSubscriptionCard';
import SubscriptionCards from 'components/SubscriptionCards';
import { showErrorModal } from 'components/Modals/modals';

import styles from './styles.module.scss';

const { Title, Text, Paragraph } = Typography;

const Subscriptions = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [subscriptions, setSubscriptions] = useState([]);
  const [targetSubscription, setTargetSubscription] = useState(null);

  const getCreatorSubscriptions = useCallback(() => {
    setIsLoading(true);
    try {
      //TODO: Implement API here later
      const { status, data } = {
        status: 200, //TODO: Mock data as required here
        data: [
          {
            id: 1337,
            name: 'Mock Tier Just very long name here to tes',
            price: 90,
            currency: 'SGD',
            base_credits: 75,
            product_applicable: ['session', 'video'],
            included_session_type: 'PUBLIC',
            included_video_type: 'MEMBERSHIP',
            include_course: true,
            included_course_type: 'MIXED',
            base_course_credits: 3,
          },
          {
            id: 1338,
            name: 'Second Short Tier',
            price: 15,
            currency: 'SGD',
            base_credits: 75,
            product_applicable: ['session'],
            included_session_type: 'PUBLIC',
            included_video_type: 'MEMBERSHIP',
            include_course: false,
          },
        ],
      };

      let mappedSubscriptionData = [];

      if (isAPISuccess(status) && data) {
        //TODO: Re map data as required here
        mappedSubscriptionData = data.map((subs, idx) => ({ ...subs, idx }));
      }

      if (mappedSubscriptionData.length < 3) {
        const buttonData = mappedSubscriptionData.find((subs) => subs.id === 0);

        if (!buttonData) {
          mappedSubscriptionData.push({
            idx: mappedSubscriptionData.length,
            id: 0,
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

  useEffect(() => {
    getCreatorSubscriptions();
  }, [getCreatorSubscriptions]);

  const deleteSubscription = (data) => {
    const currSubscriptionData = subscriptions.map((subs) => subs).filter((subs) => subs.idx !== data.idx);

    if (currSubscriptionData.length < 3) {
      const buttonIndex = currSubscriptionData.findIndex((subs) => subs.id === 0);

      if (buttonIndex < 0) {
        currSubscriptionData.push({
          idx: currSubscriptionData.length,
          id: 0,
          isButton: true,
        });
      } else {
        currSubscriptionData[buttonIndex].idx = currSubscriptionData.length;
      }
    }

    setSubscriptions(currSubscriptionData);
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

  const setColumnState = (targetIdx, state, data = null) => {
    // Clone the array
    const currSubscriptionData = subscriptions.map((subs) => subs);

    switch (state) {
      case 'EMPTY':
        currSubscriptionData[targetIdx]['isButton'] = true;
        currSubscriptionData[targetIdx]['editing'] = false;
        break;
      case 'CREATE':
        currSubscriptionData[targetIdx]['isButton'] = false;
        currSubscriptionData[targetIdx]['editing'] = false;
        setTargetSubscription(null);
        break;
      case 'SAVED':
        currSubscriptionData[targetIdx] = data;
        currSubscriptionData[targetIdx]['isButton'] = false;
        currSubscriptionData[targetIdx]['editing'] = false;
        break;
      case 'EDIT':
        currSubscriptionData[targetIdx]['isButton'] = false;
        currSubscriptionData[targetIdx]['editing'] = true;

        if (data) {
          console.log('Editing');
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
      label: 'Included Video Type',
      className: undefined,
    },
    {
      label: 'Include Courses',
      className: undefined,
    },
    {
      label: 'Included Course Type',
      className: undefined,
    },
    {
      label: 'Course Credits/Month',
      className: undefined,
    },
  ];

  const renderSubscriptionFields = (item) => (
    <List.Item className={classNames(item.className, styles.fieldsListItem)}>
      <Text strong> {item.label} </Text>
    </List.Item>
  );

  const renderSubscriptionList = (subs) => (
    <List.Item>
      {subs.isButton ? (
        <Button block type="primary" onClick={() => setColumnState(subs.idx, 'CREATE')}>
          Add new Subscription Tier
        </Button>
      ) : !subs.id || subs.editing ? (
        <CreateSubscriptionCard
          cancelChanges={() => setColumnState(subs.idx, 'EMPTY')}
          saveChanges={(data) => setColumnState(subs.idx, 'SAVED', data)}
          editedSubscription={targetSubscription}
        />
      ) : (
        <SubscriptionCards
          subscription={subs}
          editSubscription={() => setColumnState(subs.idx, 'EDIT', subs)}
          deleteSubscription={() => handleDelete(subs)}
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
                <List grid={{ gutter: 8, column: 3 }} dataSource={subscriptions} renderItem={renderSubscriptionList} />
              </Col>
            </Row>
          </Loader>
        </Col>
      </Row>
    </div>
  );
};

export default Subscriptions;
