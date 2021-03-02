import React from 'react';
import classNames from 'classnames';

import { Row, Col, Typography, Button, Card, List } from 'antd';

import { CloseCircleTwoTone, CheckCircleTwoTone } from '@ant-design/icons';

import styles from './styles.module.scss';

const { Text } = Typography;

const SubscriptionCards = ({ subscription, editing, editSubscription, deleteSubscription }) => {
  const renderTickOrCross = (isTrue) =>
    isTrue ? <CheckCircleTwoTone twoToneColor="#52c41a" /> : <CloseCircleTwoTone twoToneColor="#bb2124" />;

  const renderIncludedProductType = (type) => (
    <Row gutter={8}>
      <Col xs={12}>{renderTickOrCross(type === 'MIXED' || type === 'PUBLIC')} Public</Col>
      <Col xs={12}>{renderTickOrCross(type === 'MIXED' || type === 'MEMBERSHIP')} Member</Col>
    </Row>
  );

  const cardData = [
    {
      label: `${subscription.currency?.toUpperCase()} ${subscription.price}`,
      className: undefined,
    },
    {
      label: `${subscription.base_credits} Credits/Month`,
      className: undefined,
    },
    {
      label: (
        <Row gutter={8}>
          <Col xs={12}>{renderTickOrCross(subscription.product_applicable?.includes('session'))} Session</Col>
          <Col xs={12}>{renderTickOrCross(subscription.product_applicable?.includes('video'))} Videos</Col>
        </Row>
      ),
      className: undefined,
    },
    {
      label: subscription.product_applicable?.includes('session')
        ? renderIncludedProductType(subscription.included_session_type)
        : 'None',
      className: subscription.product_applicable?.includes('session') ? undefined : styles.disabled,
    },
    {
      label: subscription.product_applicable?.includes('video')
        ? renderIncludedProductType(subscription.included_video_type)
        : 'None',
      className: subscription.product_applicable?.includes('video') ? undefined : styles.disabled,
    },
    {
      label: (
        <Row gutter={8} justify="center">
          <Col xs={4}>{renderTickOrCross(subscription.include_course)}</Col>
        </Row>
      ),
      className: subscription.include_course ? undefined : styles.disabled,
    },
    {
      label: subscription.include_course ? renderIncludedProductType(subscription.included_course_type) : 'None',
      className: subscription.include_course ? undefined : styles.disabled,
    },
    {
      label: subscription.include_course ? `${subscription.base_course_credits} Credits/Month` : 'None',
      className: subscription.include_course ? undefined : styles.disabled,
    },
  ];

  const renderCardData = (item) => (
    <List.Item className={classNames(styles.cardListItem, item.className)}>{item.label}</List.Item>
  );

  return (
    <Card
      hoverable={true}
      headStyle={{ textAlign: 'center' }}
      title={
        <div className={styles.subscriptionNameWrapper}>
          <Text strong> {subscription.name} </Text>
        </div>
      }
      bodyStyle={{ padding: '0px 10px' }}
      actions={[
        <Button disabled={editing} type="primary" danger onClick={() => deleteSubscription(subscription.id)}>
          Delete
        </Button>,
        <Button disabled={editing} type="primary" onClick={() => editSubscription(subscription.id)}>
          Edit
        </Button>,
      ]}
    >
      <List size="large" itemLayout="vertical" dataSource={cardData} renderItem={renderCardData} rowKey="label" />
    </Card>
  );
};

export default SubscriptionCards;
