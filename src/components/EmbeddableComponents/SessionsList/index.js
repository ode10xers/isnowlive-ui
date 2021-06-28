import SessionDetailedListView from 'pages/DetailedListView/Sessions';
import React from 'react';

import styles from './style.module.scss';

const SessionsList = () => {
  return (
    <div className={styles.sessionListPluginContainer}>
      <div className={styles.sessionListContainer}>
        <SessionDetailedListView />
      </div>
    </div>
  );
};

export default SessionsList;
