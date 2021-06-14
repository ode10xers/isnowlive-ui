import React, { useState, useCallback, useEffect } from 'react';

import { message, Spin, Row, Col } from 'antd';

import apis from 'apis';

import CreatorProfile from 'components/CreatorProfile';

import { isAPISuccess } from 'utils/helper';
import SessionsProfileComponent from 'components/DynamicProfileComponents/SessionsProfileComponent';
import PassesProfileComponent from 'components/DynamicProfileComponents/PassesProfileComponent';

// TODO: Define the Profile UI Configurations Sample Data here

const DynamicProfile = ({ creatorUsername = null }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [creatorProfileData, setCreatorProfileData] = useState({});

  const fetchCreatorProfileData = useCallback(async (username) => {
    setIsLoading(true);
    try {
      const { status, data } = username ? await apis.user.getProfileByUsername(username) : await apis.user.getProfile();

      if (isAPISuccess(status) && data) {
        setCreatorProfileData(data);
      }
    } catch (error) {
      message.error('Failed to load creator profile details');
      console.error(error);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchCreatorProfileData(creatorUsername);
  }, [fetchCreatorProfileData, creatorUsername]);
  // TODO: Currently using old CreatorProfile, decide if we want to make a new one
  return (
    <Spin spinning={isLoading} size="large" tip="Fetching creator details...">
      <Row gutter={[8, 16]} justify="center">
        <Col xs={24}>
          <CreatorProfile
            profile={creatorProfileData}
            profileImage={creatorProfileData?.profile_image_url}
            showCoverImage={true}
            coverImage={creatorProfileData?.cover_image_url}
          />
        </Col>
        <Col xs={24}>
          <PassesProfileComponent />
        </Col>
        <Col xs={24}>
          <SessionsProfileComponent />
        </Col>
      </Row>
    </Spin>
  );
};

export default DynamicProfile;
