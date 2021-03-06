import React from 'react';
import classNames from 'classnames';

import { Row, Col, Typography, Button, Card, List, Popover } from 'antd';

import { CloseCircleTwoTone, CheckCircleTwoTone, BookTwoTone } from '@ant-design/icons';

import styles from './styles.module.scss';

const { Text } = Typography;

const SubscriptionCards = ({ subscription, editing, editSubscription, deleteSubscription }) => {
  const renderTickOrCross = (isTrue) =>
    isTrue ? <CheckCircleTwoTone twoToneColor="#52c41a" /> : <CloseCircleTwoTone twoToneColor="#bb2124" />;

  const renderIncludedProductType = (accessTypes) => (
    <Row gutter={8}>
      <Col xs={12}>{renderTickOrCross(accessTypes.includes('PUBLIC'))} Public </Col>
      <Col xs={12}>{renderTickOrCross(accessTypes.includes('MEMBERSHIP'))} Members </Col>
    </Row>
  );

  const renderProductListButton = (productName, productList, productNameKey = 'name') => (
    <Popover
      trigger="click"
      title={`${productName} List`}
      content={
        <List
          size="small"
          dataSource={productList}
          renderItem={(item) => (
            <List.Item>
              {' '}
              {item.is_course ? <BookTwoTone twoToneColor="#1890ff" /> : null} {item[productNameKey]}{' '}
            </List.Item>
          )}
        />
      }
    >
      <Button block ghost type="primary">
        {productList.length || 0} {productName}
      </Button>
    </Popover>
  );

  const cardData = [
    {
      label: `${subscription.currency?.toUpperCase()} ${subscription.price}`,
      className: undefined,
    },
    {
      label: `${
        subscription.products['SESSION']
          ? subscription.products['SESSION'].credits
          : subscription.products['VIDEO'].credits
      } Credits/Month`,
      className: undefined,
    },
    {
      label: (
        <Row gutter={8}>
          <Col xs={12}>{renderTickOrCross(subscription.products['SESSION'])} Session</Col>
          <Col xs={12}>{renderTickOrCross(subscription.products['VIDEO'])} Videos</Col>
        </Row>
      ),
      className: undefined,
    },
    {
      label: subscription.products['SESSION']
        ? renderIncludedProductType(subscription.products['SESSION'].access_types)
        : 'None',
      className: subscription.products['SESSION'] ? undefined : styles.disabled,
    },
    {
      label: subscription.products['SESSION']
        ? renderProductListButton('Sessions', subscription.products['SESSION'].items, 'name')
        : 'None',
      className: subscription.products['SESSION'] ? styles.buttonContainer : styles.disabled,
    },
    {
      label: subscription.products['VIDEO']
        ? renderIncludedProductType(subscription.products['VIDEO'].access_types)
        : 'None',
      className: subscription.products['VIDEO'] ? undefined : styles.disabled,
    },
    {
      label: subscription.products['VIDEO']
        ? renderProductListButton('Videos', subscription.products['VIDEO'].items, 'title')
        : 'None',
      className: subscription.products['VIDEO'] ? styles.buttonContainer : styles.disabled,
    },
    {
      label: (
        <Row gutter={8} justify="center">
          <Col xs={4}>{renderTickOrCross(subscription.products['COURSE'])}</Col>
        </Row>
      ),
      className: subscription.products['COURSE'] ? undefined : styles.disabled,
    },
    {
      label: subscription.products['COURSE'] ? `${subscription.products['COURSE'].credits} Credits/Month` : 'None',
      className: subscription.products['COURSE'] ? undefined : styles.disabled,
    },
    {
      label: subscription.products['COURSE']
        ? renderIncludedProductType(subscription.products['COURSE'].access_types)
        : 'None',
      className: subscription.products['COURSE'] ? undefined : styles.disabled,
    },
    {
      label: subscription.products['COURSE']
        ? renderProductListButton('Courses', subscription.products['COURSE'].items, 'name')
        : 'None',
      className: subscription.products['COURSE'] ? styles.buttonContainer : styles.disabled,
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
        <Button disabled={editing} type="primary" danger onClick={() => deleteSubscription(subscription.external_id)}>
          Delete
        </Button>,
        <Button disabled={editing} type="primary" onClick={() => editSubscription(subscription.external_id)}>
          Edit
        </Button>,
      ]}
    >
      <List size="large" itemLayout="vertical" dataSource={cardData} renderItem={renderCardData} rowKey="label" />
    </Card>
  );
};

export default SubscriptionCards;
