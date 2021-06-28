import React from 'react';
import { useHistory } from 'react-router-dom';

import { Row, Col, Button } from 'antd';

import Routes from 'routes';

import SessionListCard from '../SessionListCard';

import { getLocalUserDetails } from 'utils/storage';
import { generateUrlFromUsername, isInCreatorDashboard, preventDefaults } from 'utils/helper';

import styles from './style.module.scss';

// NOTE: The actual data that is shown here is inventories
const SessionListView = ({ limit = 2, sessions = [] }) => {
  const history = useHistory();

  const renderSessionCards = (session) => (
    <Col xs={24} sm={12} key={`${session.session_external_id}_${session.inventory_id}`}>
      <SessionListCard session={session} />
    </Col>
  );

  const handleMoreClicked = (e) => {
    preventDefaults(e);

    if (isInCreatorDashboard()) {
      const localUserDetails = getLocalUserDetails();

      window.open(generateUrlFromUsername(localUserDetails?.username ?? 'app') + Routes.list.sessions);
    } else {
      history.push(Routes.list.sessions);
    }
  };

  return (
    <div>
      <Row gutter={[16, 16]}>
        {sessions?.slice(0, limit).map(renderSessionCards)}
        {sessions?.length > limit && (
          <Col xs={24}>
            <Row justify="center">
              <Col>
                <Button className={styles.moreButton} type="primary" onClick={handleMoreClicked}>
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
