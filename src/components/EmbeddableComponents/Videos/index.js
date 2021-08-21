import React from 'react';

import VideoDetailedListView from 'pages/DetailedListView/Videos';

import styles from './style.module.scss';

const Videos = () => {
  return (
    <div className={styles.videoPluginContainer}>
      <div className={styles.videoListContainer}>
        <VideoDetailedListView />
      </div>
    </div>
  );
};

export default Videos;
