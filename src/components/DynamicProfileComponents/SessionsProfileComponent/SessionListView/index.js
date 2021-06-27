import React from 'react';
import { useHistory } from 'react-router-dom';

import { Row, Col, Button } from 'antd';

import SessionListCard from '../SessionListCard';

import styles from './style.module.scss';
import Routes from 'routes';

// NOTE: The actual data that is shown here is inventories
const SessionListView = ({ limit = 2, sessions = [] }) => {
  const history = useHistory();

  if (!sessions || !sessions.length) {
    return null;
  }

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
                <Button className={styles.moreButton} type="primary" onClick={() => history.push(Routes.list.sessions)}>
                  MORE
                </Button>
              </Col>
            </Row>
          </Col>
        )}
      </Row>
    </div>
  );
};

export default SessionListView;
