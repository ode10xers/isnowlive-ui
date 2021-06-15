import React, { useState, useEffect, useCallback } from 'react';

import { Row, Col, Tabs, Typography, Switch, message } from 'antd';

import apis from 'apis';

import AudienceImport from './AudienceImport';
import AudienceList from './AudienceList';
import EmailList from '../EmailList';
import { showErrorModal, showSuccessModal } from 'components/Modals/modals';

import { isAPISuccess } from 'utils/helper';

import styles from './styles.module.scss';

const { TabPane } = Tabs;
const { Title, Paragraph } = Typography;

const Audiences = () => {
  const [selectedTab, setSelectedTab] = useState('list');
  const [creatorProfile, setCreatorProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchCreatorProfile = useCallback(async () => {
    setIsLoading(true);

    try {
      const { status, data } = await apis.user.getProfile();

      if (isAPISuccess(status) && data) {
        setCreatorProfile(data);
      }
    } catch (error) {
      message.error(error?.response?.data?.message || 'Failed to fetch creator profile details');
    }

    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchCreatorProfile();
  }, [fetchCreatorProfile]);

  const updateCollectEmailFlag = async (checked) => {
    setIsLoading(true);
    const creatorProfileData = creatorProfile;

    try {
      const payload = {
        ...creatorProfileData,
        profile: {
          ...creatorProfileData?.profile,
          collect_emails: checked,
        },
      };

      const { status } = await apis.user.updateProfile(payload);

      if (isAPISuccess(status)) {
        showSuccessModal('Successfully updated newsletter signup settings');
        setCreatorProfile(payload);
      }
    } catch (error) {
      showErrorModal(
        'Failed updating newsletter signup setting',
        error?.response?.data?.message || 'Something went wrong.'
      );
    }
    setIsLoading(false);
  };

  return (
    <Row gutter={[16, 16]}>
      <Col xs={24}>
        <Title level={4}> Audience & Members </Title>
      </Col>
      <Col xs={24}>
        <Paragraph>
          A Member is a person who has an account on this site and has purchased at least 1 of your products.
        </Paragraph>
        <Paragraph>
          An Audience is a person subscribed to your email list but does not have an account on this site and hence
          hasn't bought any of your products yet.
        </Paragraph>
      </Col>
      <Col xs={24}>
        <Row gutter={[8, 8]}>
          <Col>Add a newsletter signup box on my website</Col>
          <Col>
            <Switch
              loading={isLoading}
              checked={creatorProfile?.profile?.collect_emails}
              onChange={updateCollectEmailFlag}
            />
          </Col>
        </Row>
      </Col>
      <Col xs={24}>
        <Tabs size="large" activeKey={selectedTab} onChange={setSelectedTab}>
          <TabPane key="list" tab={<Title level={5}> Audience & Member List </Title>}>
            <AudienceList />
          </TabPane>
          <TabPane className={styles.p50} key="import" tab={<Title level={5}> Import List </Title>}>
            <AudienceImport />
          </TabPane>
          <TabPane key="emailList" tab={<Title level={5}> Email List </Title>}>
            <EmailList />
          </TabPane>
        </Tabs>
      </Col>
    </Row>
  );
};

export default Audiences;
