import React, { useState, useEffect, useCallback } from 'react';

import Loader from 'components/Loader';
import PublicVideoList from 'components/PublicVideoList';
import apis from 'apis';
import { isAPISuccess } from 'utils/helper';

const Videos = ({ profileUsername }) => {
  const [videos, setVideos] = useState([]);
  const [isVideosLoading, setIsVideosLoading] = useState(true);

  useEffect(() => {
    const getVideosDetails = async () => {
      setIsVideosLoading(true);
      try {
        const { status, data } = await apis.videos.getVideosByUsername(profileUsername);

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
  }, [profileUsername]);

  return (
    <Loader loading={isVideosLoading} size="large" text="Loading videos">
      <PublicVideoList videos={videos} username={profileUsername} />
    </Loader>
  );
};

export default Videos;
