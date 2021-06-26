import React, { useEffect, useCallback, useState } from 'react';
import { Card, Typography, Spin, Row, Col, Button } from 'antd';
import { LikeTwoTone } from '@ant-design/icons';

import apis from 'apis';
import Routes from 'routes';

import { isAPISuccess } from 'utils/helper';

import styles from './style.module.scss';
import SubscriptionsListView from './SubscriptionListView';
import SubscriptionsEditView from './SubscriptionEditView';

const { Text, Paragraph } = Typography;

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
    <div className={styles.p10}>
      <Card
        title={<ContainerTitle title={customComponentProps?.title} />}
        headStyle={cardHeadingStyle}
        className={styles.profileComponentContainer}
        bodyStyle={{ padding: 12 }}
      >
        {isEditing ? (
          <Row gutter={[8, 8]} justify="center" align="center">
            <Col xs={24} className={styles.textAlignCenter}>
              <Paragraph>Memberships that you have created and published will show up here.</Paragraph>
              <Paragraph>You can manage your memberships in the dashboard by clicking the button below</Paragraph>
            </Col>
            <Col xs={24}>
              <Row justify="center">
                <Col>
                  <Button
                    type="primary"
                    onClick={() =>
                      window.open(Routes.creatorDashboard.rootPath + Routes.creatorDashboard.subscriptions, '_blank')
                    }
                  >
                    Manage my memberships
                  </Button>
                </Col>
              </Row>
            </Col>
          </Row>
        ) : (
          <Spin spinning={isLoading} tip="Fetching memberships">
            <SubscriptionsListView subscriptions={subscriptions} />
          </Spin>
        )}
      </Card>
      {isEditing && <SubscriptionsEditView configValues={customComponentProps} updateHandler={saveEditChanges} />}
    </div>
  ) : null;
};

export default SubscriptionProfileComponent;
