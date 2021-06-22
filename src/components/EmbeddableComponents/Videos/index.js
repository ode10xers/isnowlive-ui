import React, { useState, useEffect } from 'react';

import apis from 'apis';

import Loader from 'components/Loader';
import PublicVideoList from 'components/PublicVideoList';

import { isAPISuccess } from 'utils/helper';

import styles from './style.module.scss';

const Videos = () => {
  const [videos, setVideos] = useState([]);
  const [isVideosLoading, setIsVideosLoading] = useState(true);

  useEffect(() => {
    const getVideosDetails = async () => {
      setIsVideosLoading(true);
      try {
        const { status, data } = await apis.videos.getVideosByUsername();

        if (isAPISuccess(status) && data) {
          setVideos(data);
          setIsVideosLoading(false);
        }
      } catch (error) {
        setIsVideosLoading(false);
        console.error('Failed to load video details');
      }
    };
    getVideosDetails();
  }, []);

  return (
    <div className={styles.videoPluginContainer}>
      <Loader loading={isVideosLoading} size="large" text="Loading videos">
        <PublicVideoList videos={videos} />
      </Loader>
    </div>
  );
};

export default Videos;
