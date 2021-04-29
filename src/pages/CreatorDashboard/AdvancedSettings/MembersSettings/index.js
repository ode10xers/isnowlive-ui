import React, { useState, useEffect, useCallback } from 'react';
import classNames from 'classnames';
import { Tabs, Row, Col, Checkbox, Button, Typography } from 'antd';
import { TeamOutlined } from '@ant-design/icons';

import apis from 'apis';

import Loader from 'components/Loader';
import { showErrorModal, showSuccessModal } from 'components/Modals/modals';

import { isAPISuccess } from 'utils/helper';

import styles from './styles.module.scss';

const { TabPane } = Tabs;
const { Title } = Typography;

// TODO: Right now, this is very similar to AccountSettings
// Might want to refactor
const MembersSettings = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [accountSettings, setAccountSettings] = useState(null);
  const [checkedMemberOptions, setCheckedMemberOptions] = useState([]);

  const getCreatorUserSettings = useCallback(async () => {
    setIsLoading(true);
    try {
      const { status, data } = await apis.user.getCreatorUserPreferences();

      if (isAPISuccess(status) && data) {
        setAccountSettings(data);
        setCheckedMemberOptions(data.member_requires_invite ? ['member_requires_invite'] : []);
      }
    } catch (error) {
      showErrorModal('Failed to fetch user account settings', error.response?.data?.message || 'Something went wrong');
    }

    setIsLoading(false);
  }, []);

  useEffect(() => {
    getCreatorUserSettings();
    //eslint-disable-next-line
  }, []);

  const saveCreatorNotificationSettings = async () => {
    setIsLoading(true);
    try {
      // This uses the same API as the one in Account Settings
      // But since it only modifies some flag, we will keep everything else as is
      const payload = {
        receive_mails: accountSettings.receive_mails,
        member_requires_invite: checkedMemberOptions.includes('member_requires_invite'),
      };

      const { status } = await apis.user.setCreatorUserPreferences(payload);

      if (isAPISuccess(status)) {
        showSuccessModal('User member settings updated successfully');
        getCreatorUserSettings();
      }
    } catch (error) {
      showErrorModal('Failed updating user member settings', error.response?.data?.message || 'Something went wrong');
    }

    setIsLoading(false);
  };

  return (
    <div className={classNames(styles.box, styles.settingsWrapper)}>
      <Loader size="large" text="Fetching user member settings" loading={isLoading}>
        {accountSettings && (
          <Tabs size="large" defaultActiveKey="members">
            <TabPane
              key="members"
              tab={
                <div className={styles.largeTabHeader}>
                  <TeamOutlined />
                  Members
                </div>
              }
            >
              <Row gutter={[8, 24]}>
                <Col xs={24}>
                  <Title level={3}> Members Settings </Title>
                </Col>
                <Col xs={24}>
                  <div className={styles.sectionWrapper}>
                    <Row gutter={[8, 16]}>
                      <Col xs={24}>
                        <div className={styles.optionWrapper}>
                          <Checkbox.Group
                            name="member_options"
                            value={checkedMemberOptions}
                            onChange={(values) => setCheckedMemberOptions(values)}
                          >
                            <Row gutter={[8, 8]}>
                              <Col span={24}>
                                <Checkbox value="member_requires_invite"> New members need approval to join </Checkbox>
                              </Col>
                            </Row>
                          </Checkbox.Group>
                        </div>
                      </Col>
                    </Row>
                  </div>
                </Col>
              </Row>
              <Row justify="center">
                <Col xs={24} md={8} lg={4}>
                  <Button
                    block
                    type="primary"
                    loading={isLoading}
                    onClick={saveCreatorNotificationSettings}
                    className={styles.saveBtn}
                  >
                    Save Changes
                  </Button>
                </Col>
              </Row>
            </TabPane>
          </Tabs>
        )}
      </Loader>
    </div>
  );
};

export default MembersSettings;
