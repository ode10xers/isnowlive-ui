import React, { useState, useEffect, useCallback } from 'react';
import classNames from 'classnames';

import { Row, Col, Button, Typography, List } from 'antd';

import { isAPISuccess } from 'utils/helper';

import CreateSubscriptionCard from 'components/CreateSubscriptionCard';
import SubscriptionCards from 'components/SubscriptionCards';
import { showErrorModal } from 'components/Modals/modals';

import styles from './styles.module.scss';

const { Title, Text } = Typography;

const Subscriptions = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [subscriptions, setSubscriptions] = useState([]);

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
        mappedSubscriptionData.push({
          idx: mappedSubscriptionData.length,
          id: 0,
          isButton: false,
        });
      }

      setSubscriptions(mappedSubscriptionData);
    } catch (error) {
      showErrorModal('Failed to fetch subscriptions', error?.response?.data?.message || 'Something wrong happened');
    }
  }, []);

  useEffect(() => {
    getCreatorSubscriptions();
  }, [getCreatorSubscriptions]);

  useEffect(() => {
    console.log(subscriptions);
  }, [subscriptions]);

  const setColumnState = (targetIdx, state, data = null) => {
    // Clone the array
    const currSubscriptionData = subscriptions.map((subs) => subs);

    switch (state) {
      case 'EMPTY':
        currSubscriptionData[targetIdx]['isButton'] = true;
        currSubscriptionData[targetIdx]['editing'] = false;
        setSubscriptions(currSubscriptionData);
        break;
      case 'CREATE':
        currSubscriptionData[targetIdx]['isButton'] = false;
        currSubscriptionData[targetIdx]['editing'] = false;
        setSubscriptions(currSubscriptionData);
        break;
      case 'SAVED':
        currSubscriptionData[targetIdx] = data;
        currSubscriptionData[targetIdx]['isButton'] = false;
        currSubscriptionData[targetIdx]['editing'] = false;

        setSubscriptions(currSubscriptionData);
        break;
      case 'EDIT':
        currSubscriptionData[targetIdx]['isButton'] = false;
        currSubscriptionData[targetIdx]['editing'] = true;
        // setSubscriptions(currSubscriptionData);
        break;

      default:
        break;
    }
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
      ) : subs.id ? (
        subs.editing ? (
          <div> Edit (modified create) card here </div>
        ) : (
          <SubscriptionCards
            subscription={subs}
            editSubscription={() => setColumnState(subs.idx, 'EDIT')}
            deleteSubscription={() => console.log('Delete')}
          />
        )
      ) : (
        <CreateSubscriptionCard
          cancelChanges={() => setColumnState(subs.idx, 'EMPTY')}
          saveChanges={(data) => setColumnState(subs.idx, 'SAVED', data)}
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
        </Col>
      </Row>
    </div>
  );
};

export default Subscriptions;
