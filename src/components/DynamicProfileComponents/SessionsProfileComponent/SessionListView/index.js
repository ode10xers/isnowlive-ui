import React from 'react';
import { useHistory } from 'react-router-dom';
import { Row, Col } from 'antd';
import { BarsOutlined } from '@ant-design/icons';

import Routes from 'routes';

import SessionListCard from '../SessionListCard';

import { getLocalUserDetails } from 'utils/storage';
import { generateUrlFromUsername, isInCreatorDashboard, preventDefaults } from 'utils/helper';

import styles from './style.module.scss';

const SessionListView = ({ limit = 5, sessions = [] }) => {
  const history = useHistory();

  const handleMoreClicked = (e) => {
    preventDefaults(e);

    if (isInCreatorDashboard()) {
      const localUserDetails = getLocalUserDetails();

      window.open(generateUrlFromUsername(localUserDetails?.username ?? 'app') + Routes.list.sessions);
    } else {
      history.push(Routes.list.sessions);
    }
  };

  const renderSessionCards = (session) => (
    <Col xs={18} md={8} key={`${session.session_external_id}_${session?.inventory_id}`}>
      <SessionListCard session={session} />
    </Col>
  );

  return (
    <div>
      {sessions?.length > 0 && (
        <Row gutter={[8, 8]} className={styles.sessionListContainer}>
          {sessions.slice(0, limit).map(renderSessionCards)}
          {sessions?.length > limit && (
            <Col xs={18} md={8} className={styles.fadedItemContainer}>
              <div className={styles.fadedOverlay}>
                <div className={styles.seeMoreButton} onClick={handleMoreClicked}>
                  <BarsOutlined className={styles.seeMoreIcon} />
                  SEE MORE
                </div>
              </div>
              <div className={styles.fadedItem}>
                <SessionListCard session={sessions[limit]} />
              </div>
            </Col>
          )}
        </Row>
      )}
    </div>
  );
};

export default SessionListView;
