import React, { useState, useEffect, useCallback } from 'react';

import { Row, Col, Button, Typography, Collapse, Empty } from 'antd';

import Loader from 'components/Loader';
import Table from 'components/Table';

import { isMobileDevice } from 'utils/device';
import { isAPISuccess } from 'utils/helper';

import styles from './styles.module.scss';
import { showErrorModal } from 'components/Modals/modals';

const { Title } = Typography;
const { Panel } = Collapse;

const Subscriptions = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [subscriptions, setSubscriptions] = useState([]);

  const getCreatorSubscriptions = useCallback(() => {
    setIsLoading(true);
    try {
      //TODO: Implement API here later
      const { status, data } = {
        status: 200,
        data: [], //TODO: Mock data as required ehre
      };

      if (isAPISuccess(status) && data) {
        //TODO: Re map data as required here
        setSubscriptions(data);
      }
    } catch (error) {
      showErrorModal('Failed to fetch subscriptions', error?.response?.data?.message || 'Something wrong happened');
    }
  }, []);

  const showSubscriptionModal = () => {
    console.log('Subs Modal');
  };

  useEffect(() => {
    getCreatorSubscriptions();
  }, [getCreatorSubscriptions]);

  const subscriptionColumns = [];

  return (
    <div className={styles.box}>
      <Row gutter={[8, 24]}>
        <Col xs={24} md={14} xl={18}>
          <Title level={4}> Subscriptions </Title>
        </Col>
        <Col xs={24} md={10} xl={6}>
          <Button block type="primary" onClick={() => showSubscriptionModal()}>
            Create New Subscription
          </Button>
        </Col>
        <Col xs={24}>
          <Collapse>
            <Panel header={<Title level={5}> Published </Title>} key="Published">
              {isMobileDevice ? (
                subscriptions.length ? (
                  <Loader loading={isLoading} size="large" text="Loading subscriptions">
                    <Row gutter={[8, 16]}>Mobile Cards here</Row>
                  </Loader>
                ) : (
                  <Empty description="No Published Subscriptions" />
                )
              ) : (
                <Table
                  sticky={true}
                  size="small"
                  columns={subscriptionColumns}
                  data={subscriptions}
                  loading={isLoading}
                  rowKey={(record) => record.key || record.id}
                />
              )}
            </Panel>
          </Collapse>
        </Col>
      </Row>
    </div>
  );
};

export default Subscriptions;
