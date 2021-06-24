import React, { useState } from 'react';

import { Row, Col, Button, Typography } from 'antd';

import DetailsDrawer from 'components/DynamicProfileComponents/DetailsDrawer';
import SessionListCard from '../SessionListCard';

import { preventDefaults } from 'utils/helper';

import styles from './style.module.scss';

const { Title } = Typography;

// NOTE: The actual data that is shown here is inventories
const SessionListView = ({ limit = 2, sessions = [] }) => {
  const [detailsDrawerVisible, setDetailsDrawerVisible] = useState(false);

  if (!sessions || !sessions.length) {
    return null;
  }

  const showMoreSessionCards = (e) => {
    preventDefaults(e);
    setDetailsDrawerVisible(true);
  };

  const handleDrawerClose = (e) => {
    preventDefaults(e);
    setDetailsDrawerVisible(false);
  };

  const renderSessionCards = (session) => {
    return (
      <Col xs={24} sm={12} key={`${session.session_external_id}_${session.inventory_id}`}>
        <SessionListCard session={session} />
      </Col>
    );
  };

  return (
    <div>
      <Row gutter={[16, 16]}>
        {sessions?.slice(0, limit).map(renderSessionCards)}
        {sessions?.length > limit && (
          <Col xs={24}>
            <Row justify="center">
              <Col>
                <Button className={styles.moreButton} type="primary" size="large" onClick={showMoreSessionCards}>
                  MORE
                </Button>
              </Col>
            </Row>
          </Col>
        )}
      </Row>
      <DetailsDrawer
        visible={detailsDrawerVisible}
        onClose={handleDrawerClose}
        title={<Title level={4}> More Sessions </Title>}
      >
        <Row gutter={[16, 16]} className={styles.mb50}>
          {sessions.slice(0, limit * 5).map(renderSessionCards)}
        </Row>
      </DetailsDrawer>
    </div>
  );
};

export default SessionListView;
