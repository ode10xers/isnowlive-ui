import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Row, Col, Button, Checkbox, Typography } from 'antd';

import apis from 'apis';

import Loader from 'components/Loader';
import { showSuccessModal, showErrorModal } from 'components/Modals/modals';

import { isAPISuccess } from 'utils/helper';

import styles from './styles.module.scss';

const { Title } = Typography;

const NotificationSettings = () => {
  const { t: translate } = useTranslation();
  const [submitting, setSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [checkedEmailOptions, setCheckedEmailOptions] = useState([]);

  const getCreatorNotificationPreferences = useCallback(async () => {
    setIsLoading(true);
    try {
      const { status, data } = await apis.user.getCreatorUserPreferences();

      if (isAPISuccess(status) && data) {
        let checkedKeys = [];

        Object.entries(data).forEach(([key, value]) => {
          if (value) {
            checkedKeys.push(key.toString());
          }
        });

        setCheckedEmailOptions(checkedKeys);
      }
    } catch (error) {
      showErrorModal(
        translate('FAILED_TO_FETCH_USER_PREFERENCES'),
        error.response?.data?.message || translate('SOMETHING_WENT_WRONG')
      );
    }

    setIsLoading(false);
  }, []);

  const saveUserPreferences = async () => {
    setSubmitting(true);
    try {
      const payload = {
        receive_mails: checkedEmailOptions.includes('receive_mails'),
      };

      const { status } = await apis.user.setCreatorUserPreferences(payload);

      if (isAPISuccess(status)) {
        showSuccessModal(translate('UPDATED_USER_PREFERENCES_SUCCESS'));
      }
    } catch (error) {
      showErrorModal(
        translate('UPDATED_USER_PREFERENCES_FAILED'),
        error.response?.data?.message || translate('SOMETHING_WENT_WRONG')
      );
    }

    setSubmitting(false);
  };

  useEffect(() => {
    getCreatorNotificationPreferences();
  }, [getCreatorNotificationPreferences]);

  const generateLabel = (item) => `${translate('SEND_EMAIL_NOTIFICATION_FOR')} ${item}`;

  const emailOptions = [
    {
      label: generateLabel(translate('BOOKING_CONFIRMATIONS')),
      value: 'receive_mails',
    },
  ];

  return (
    <div>
      <Loader size="large" text={translate('FETCHING_USER_PREFERENCES')} loading={isLoading}>
        <Row gutter={[8, 24]} className={styles.notificationSettingsWrapper}>
          <Col span={24} className={styles.textAlignLeft}>
            <Title level={3}> {translate('NOTIFICATION_SETTINGS')} </Title>
          </Col>
          <Col span={24}>
            <div className={styles.sectionWrapper}>
              <Row gutter={[8, 10]}>
                <Col span={24} className={styles.textAlignLeft}>
                  <Title level={4}> {translate('EMAIL_NOTIFICATIONS')} </Title>
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
              {translate('SAVE_CHANGES')}
            </Button>
          </Col>
        </Row>
      </Loader>
    </div>
  );
};

export default NotificationSettings;
