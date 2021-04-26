import React, { useState, useEffect, useCallback } from 'react';

import { Row, Col, Button, Checkbox, Typography } from 'antd';

import apis from 'apis';

import Loader from 'components/Loader';
import { showSuccessModal, showErrorModal } from 'components/Modals/modals';

import { isAPISuccess } from 'utils/helper';

import styles from './styles.module.scss';

const { Title } = Typography;

const NotificationSettings = () => {
  const [submitting, setSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [checkedEmailOptions, setCheckedEmailOptions] = useState([]);
  const [checkedMemberOptions, setCheckedMemberOptions] = useState([]);

  const getCreatorNotificationPreferences = useCallback(async () => {
    setIsLoading(true);
    try {
      const { status, data } = await apis.user.getCreatorUserPreferences();

      if (isAPISuccess(status) && data) {
        setCheckedEmailOptions(data.receive_mails ? ['receive_mails'] : []);
        setCheckedMemberOptions(data.member_requires_invite ? ['member_requires_invite'] : []);
      }
    } catch (error) {
      showErrorModal('Failed to fetch user preferences', error.response?.data?.message || 'Something went wrong');
    }

    setIsLoading(false);
  }, []);

  const saveUserPreferences = async () => {
    setSubmitting(true);
    try {
      const payload = {
        receive_mails: checkedEmailOptions.includes('receive_mails'),
        member_requires_invite: checkedMemberOptions.includes('member_requires_invite'),
      };

      const { status } = await apis.user.setCreatorUserPreferences(payload);

      if (isAPISuccess(status)) {
        showSuccessModal('User Preferences Updated Successfully');
      }
    } catch (error) {
      showErrorModal('Failed updating user preferences', error.response?.data?.message || 'Something went wrong');
    }

    setSubmitting(false);
  };

  useEffect(() => {
    getCreatorNotificationPreferences();
  }, [getCreatorNotificationPreferences]);

  const generateLabel = (item) => `Send email notifications for ${item}`;

  const emailOptions = [
    {
      label: generateLabel('booking confirmations'),
      value: 'receive_mails',
    },
  ];

  const memberOptions = [
    {
      label: 'New members need approval to join',
      value: 'member_requires_invite',
    },
  ];

  return (
    <div>
      <Loader size="large" text="Fetching user preferences" loading={isLoading}>
        <Row gutter={[8, 24]} className={styles.notificationSettingsWrapper}>
          <Col span={24} className={styles.textAlignLeft}>
            <Title level={3}> Notification Settings </Title>
          </Col>
          <Col span={24}>
            <div className={styles.sectionWrapper}>
              <Row gutter={[8, 10]}>
                <Col span={24} className={styles.textAlignLeft}>
                  <Title level={4}> Email Notification </Title>
                </Col>
                <Col span={24}>
                  <div className={styles.optionWrapper}>
                    <Checkbox.Group
                      name="email_options"
                      value={checkedEmailOptions}
                      onChange={(values) => setCheckedEmailOptions(values)}
                    >
                      <Row gutter={[8, 8]}>
                        {emailOptions.map((emailOption) => (
                          <Col span={24}>
                            <Checkbox value={emailOption.value}>{emailOption.label}</Checkbox>
                          </Col>
                        ))}
                      </Row>
                    </Checkbox.Group>
                  </div>
                </Col>
              </Row>
            </div>
          </Col>
        </Row>
        <Row gutter={[8, 24]} className={styles.memberSettingsWrapper}>
          <Col span={24} className={styles.textAlignLeft}>
            <Title level={3}> Member Settings </Title>
          </Col>
          <Col span={24}>
            <div className={styles.optionWrapper}>
              <Checkbox.Group
                name="member_options"
                value={checkedMemberOptions}
                onChange={(values) => setCheckedMemberOptions(values)}
              >
                <Row gutter={[8, 8]}>
                  {memberOptions.map((memberOption) => (
                    <Col span={24}>
                      <Checkbox value={memberOption.value}>{memberOption.label}</Checkbox>
                    </Col>
                  ))}
                </Row>
              </Checkbox.Group>
            </div>
          </Col>
        </Row>
        <Row justify="center">
          <Col xs={24} md={8} lg={4}>
            <Button block type="primary" loading={submitting} onClick={saveUserPreferences} className={styles.saveBtn}>
              Save Changes
            </Button>
          </Col>
        </Row>
      </Loader>
    </div>
  );
};

export default NotificationSettings;
