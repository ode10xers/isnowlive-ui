import React, { useState, useCallback, useEffect } from 'react';

import { Row, Col, Spin, Button, Typography } from 'antd';

import apis from 'apis';

import DetailsDrawer from 'components/DynamicProfileComponents/DetailsDrawer';
import SessionListCard from '../SessionListCard';

import { isAPISuccess, preventDefaults } from 'utils/helper';

import styles from './style.module.scss';

const { Title } = Typography;

// NOTE: The actual data that is shown here is inventories
// TODO: Make this not show on viewing mode if sessions are empty
// But still show up on editing mode
const SessionListView = ({ limit = 4 }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [sessions, setSessions] = useState([]);
  const [detailsDrawerVisible, setDetailsDrawerVisible] = useState(false);

  const fetchUpcomingSessions = useCallback(async () => {
    setIsLoading(true);

    try {
      const { status, data } = await apis.user.getSessionsByUsername('upcoming');

      if (isAPISuccess(status) && data) {
        setSessions(data);
      }
    } catch (error) {
      console.error(error);
    }

    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchUpcomingSessions();
  }, [fetchUpcomingSessions]);

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
      <Col xs={24} sm={12} key={session.session_external_id}>
        <SessionListCard session={session} />
      </Col>
    );
  };

  return (
    <div>
      <Spin spinning={isLoading} tip="Fetching sessions">
        {sessions?.length > 0 && (
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
        )}
      </Spin>
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
