import React, { useState, useEffect } from 'react';

import { Row, Col, Button, Checkbox, Typography } from 'antd';

import apis from 'apis';

import { showSuccessModal, showErrorModal } from 'components/Modals/modals';

import { isAPISuccess } from 'utils/helper';

import styles from './styles.module.scss';

const { Title } = Typography;

const NotificationSettings = ({ checkedUserSettings, fetchUserSettings }) => {
  const [submitting, setSubmitting] = useState(false);
  const [checkedEmailOptions, setCheckedEmailOptions] = useState([]);

  const saveUserPreferences = async () => {
    setSubmitting(true);
    try {
      const payload = {
        receive_mails: checkedEmailOptions.includes('receive_mails'),
      };

      const { status } = await apis.user.setCreatorEmailPreferences(payload);

      if (isAPISuccess(status)) {
        showSuccessModal('User Preferences Updated Successfully');
        fetchUserSettings();
      }
    } catch (error) {
      showErrorModal('Failed updating user preferences', error.response?.data?.message || 'Something went wrong');
    }

    setSubmitting(false);
  };

  useEffect(() => {
    if (checkedUserSettings) {
      setCheckedEmailOptions(checkedUserSettings);
    }
  }, [checkedUserSettings]);

  const generateLabel = (item) => `Send email notifications for ${item}`;

  const emailOptions = [
    {
      label: generateLabel('booking confirmations'),
      value: 'receive_mails',
    },
  ];

  return (
    <div>
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
      <Row justify="center">
        <Col xs={24} md={8} lg={4}>
          <Button block type="primary" loading={submitting} onClick={saveUserPreferences} className={styles.saveBtn}>
            Save Changes
          </Button>
        </Col>
      </Row>
    </div>
  );
};

export default NotificationSettings;
