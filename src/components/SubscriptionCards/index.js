import React from 'react';
import classNames from 'classnames';

import { Row, Col, Typography, Button, Card, List, Popover } from 'antd';

import { CloseCircleTwoTone, CheckCircleTwoTone, BookTwoTone, EditOutlined } from '@ant-design/icons';

import TagListPopup from 'components/TagListPopup';
import { includedProductsList } from 'components/CreateSubscriptionCard';

import { generateSubscriptionDuration, isUnlimitedMembership } from 'utils/subscriptions';
import { copyToClipboard, preventDefaults } from 'utils/helper';
import { generateUrlFromUsername } from 'utils/url';
import { getLocalUserDetails } from 'utils/storage';

import styles from './styles.module.scss';

const { Text } = Typography;
const defaultBorderColor = '#eeeeee';

const SubscriptionCards = ({
  subscription,
  editing,
  editSubscription,
  deleteSubscription,
  publishSubscription,
  unpublishSubscription,
}) => {
  const renderTickOrCross = (isTrue) =>
    isTrue ? <CheckCircleTwoTone twoToneColor="#52c41a" /> : <CloseCircleTwoTone twoToneColor="#bb2124" />;

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
              {item.bundle_only ? <BookTwoTone twoToneColor="#1890ff" /> : null} {item[productNameKey]}
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
      label: subscription.price > 0 ? `${subscription.currency?.toUpperCase()} ${subscription.price}` : 'Free',
      className: undefined,
    },
    {
      label: <TagListPopup tags={[subscription.tag].filter((tag) => tag.external_id)} />,
      className: undefined,
    },
    {
      label: generateSubscriptionDuration(subscription, true),
      className: undefined,
    },
    {
      label: (
        <Row gutter={6}>
          {includedProductsList.map((prod) => (
            <Col xs={8}>
              {renderTickOrCross(subscription.products[prod.value])} {prod.label}
            </Col>
          ))}
        </Row>
      ),
      className: undefined,
    },
    {
      label:
        subscription.products['VIDEO'] || subscription.products['SESSION']
          ? isUnlimitedMembership(subscription, false)
            ? 'Unlimited'
            : `${subscription.product_credits} credits/period`
          : 'None',
      className: subscription.products['VIDEO'] || subscription.products['SESSION'] ? undefined : styles.disabled,
    },
    {
      label: subscription.products['SESSION']
        ? renderProductListButton('Sessions', subscription.product_details['SESSION'], 'name')
        : 'None',
      className: subscription.products['SESSION'] ? styles.buttonContainer : styles.disabled,
    },
    {
      label: subscription.products['VIDEO']
        ? renderProductListButton('Videos', subscription.product_details['VIDEO'], 'title')
        : 'None',
      className: subscription.products['VIDEO'] ? styles.buttonContainer : styles.disabled,
    },
    {
      label: subscription.products['COURSE']
        ? isUnlimitedMembership(subscription, true)
          ? 'Unlimited'
          : `${subscription.course_credits} credits/period`
        : 'None',
      className: subscription.products['COURSE'] ? undefined : styles.disabled,
    },
    {
      label: subscription.products['COURSE']
        ? renderProductListButton('Courses', subscription.product_details['COURSE'], 'name')
        : 'None',
      className: subscription.products['COURSE'] ? styles.buttonContainer : styles.disabled,
    },
  ];

  const renderCardData = (item) => (
    <List.Item className={classNames(styles.cardListItem, item.className)}>{item.label}</List.Item>
  );

  const copySubscriptionLink = (e) => {
    preventDefaults(e);
    const username = getLocalUserDetails().username;
    const pageLink = `${generateUrlFromUsername(username)}/m/${subscription.external_id}`;

    copyToClipboard(pageLink);
  };

  return (
    <Card
      hoverable={true}
      style={{ border: `2px solid ${subscription.color_code || defaultBorderColor}` }}
      headStyle={{ textAlign: 'center', borderBottom: `2px solid ${subscription.color_code || defaultBorderColor}` }}
      title={
        <div className={styles.subscriptionNameWrapper}>
          <Text strong> {subscription.name} </Text>
        </div>
      }
      extra={
        <Button
          disabled={editing}
          type="primary"
          onClick={() => editSubscription(subscription.external_id)}
          icon={<EditOutlined />}
        />
      }
      bodyStyle={{ padding: '0px 10px' }}
      actions={[
        <div className={styles.p10}>
          {subscription.is_published ? (
            <Button
              block
              danger
              disabled={editing}
              type="primary"
              onClick={() => unpublishSubscription(subscription.external_id)}
            >
              Hide
            </Button>
          ) : (
            <Button
              block
              className={editing ? undefined : styles.greenBtn}
              disabled={editing}
              type="primary"
              onClick={() => publishSubscription(subscription.external_id)}
            >
              Show
            </Button>
          )}
        </div>,
        <div className={styles.p10}>
          <Button block ghost type="primary" onClick={copySubscriptionLink}>
            Copy Link
          </Button>
        </div>,
      ]}
    >
      <List size="large" itemLayout="vertical" dataSource={cardData} renderItem={renderCardData} rowKey="label" />
    </Card>
  );
};

export default SubscriptionCards;
