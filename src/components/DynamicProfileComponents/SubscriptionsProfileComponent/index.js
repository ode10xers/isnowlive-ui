import React, { useEffect, useCallback, useState } from 'react';
import { Card, Typography, Spin, Row, Col, Button, Space } from 'antd';
import { LikeTwoTone } from '@ant-design/icons';

import apis from 'apis';
import Routes from 'routes';

import SubscriptionsListView from './SubscriptionListView';
import SubscriptionsEditView from './SubscriptionEditView';
import DragAndDropHandle from '../DragAndDropHandle';

import { isAPISuccess } from 'utils/helper';

import styles from './style.module.scss';

const { Text } = Typography;

const ContainerTitle = ({ title = 'MEMBERSHIPS' }) => (
  <Text style={{ color: '#0050B3' }}>
    <LikeTwoTone className={styles.mr10} twoToneColor="#0050B3" />
    {title}
  </Text>
);

// TODO : Later we might want these colors to be customized
const cardHeadingStyle = {
  background: '#F1FBFF',
  boxShadow: 'inset 0px -1px 0px #E6F5FB',
  color: '#0050B3',
  borderRadius: '12px 12px 0 0',
};

const SubscriptionProfileComponent = ({
  identifier = null,
  isEditing = false,
  dragHandleProps,
  updateConfigHandler,
  removeComponentHandler,
  ...customComponentProps
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [subscriptions, setSubscriptions] = useState([]);

  const fetchCreatorSubscriptions = useCallback(async () => {
    setIsLoading(true);

    try {
      const { status, data } = await apis.subscriptions.getSubscriptionsByUsername();

      if (isAPISuccess(status) && data) {
        setSubscriptions(data.sort((a, b) => a.price - b.price));
      }
    } catch (error) {
      console.error('Failed to load subscription details');
    }

    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchCreatorSubscriptions();
  }, [fetchCreatorSubscriptions]);

  const saveEditChanges = (newConfig) => updateConfigHandler(identifier, newConfig);

  return subscriptions.length > 0 || isEditing ? (
    <Row className={styles.p10} align="middle" justify="center">
      {isEditing && (
        <Col xs={1}>
          <DragAndDropHandle {...dragHandleProps} />{' '}
        </Col>
      )}
      <Col xs={isEditing ? 22 : 24}>
        <Card
          title={<ContainerTitle title={customComponentProps?.title} />}
          headStyle={cardHeadingStyle}
          className={styles.profileComponentContainer}
          bodyStyle={{ padding: 12 }}
        >
          {isEditing ? (
            <Row gutter={[8, 8]} justify="center" align="center">
              <Col className={styles.textAlignCenter}>
                <Space align="center" className={styles.textAlignCenter}>
                  <Text> The memberships you have created will show up here </Text>
                  <Button
                    type="primary"
                    onClick={() =>
                      window.open(Routes.creatorDashboard.rootPath + Routes.creatorDashboard.subscriptions, '_blank')
                    }
                  >
                    Manage my memberships
                  </Button>
                </Space>
              </Col>
            </Row>
          ) : (
            <Spin spinning={isLoading} tip="Fetching memberships">
              <SubscriptionsListView subscriptions={subscriptions} />
            </Spin>
          )}
        </Card>
      </Col>
      {isEditing && (
        <Col xs={1}>
          <SubscriptionsEditView configValues={customComponentProps} updateHandler={saveEditChanges} />{' '}
        </Col>
      )}
    </Row>
  ) : null;
};

export default SubscriptionProfileComponent;
