import React, { useState, useCallback } from 'react';

import { Row, Col, Button, Checkbox, Switch, Spin, Space, Typography } from 'antd';

import apis from 'apis';

import { showErrorModal, showSuccessModal } from 'components/Modals/modals';

import { isAPISuccess } from 'utils/helper';

import styles from './styles.module.scss';

const { Title, Text } = Typography;

const PlatformSettings = ({ fetchAccountSettings, accountSettings = null }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [shouldCreatorOwnFee, setShouldCreatorOwnFee] = useState(accountSettings?.creator_owns_fee ?? false);
  const [checkedEmailOptions, setCheckedEmailOptions] = useState(
    accountSettings?.receive_mails ? ['receive_mails'] : []
  );

  // This uses the same API as the one in Members Settings
  // But since it only modifies some flag, we will keep everything else as is
  const saveCreatorNotificationSettings = () =>
    apis.user.setCreatorUserPreferences({
      receive_mails: checkedEmailOptions.includes('receive_mails'),
      member_requires_invite: accountSettings.member_requires_invite,
    });

  const saveCreatorFeeSettings = () =>
    apis.user.updateCreatorFeeSettings({
      creator_owns_fee: shouldCreatorOwnFee,
    });

  const handleSavePlatformSettings = async () => {
    setIsSubmitting(true);

    try {
      const saveNotificationPromise = saveCreatorNotificationSettings();
      const saveFeePromise = saveCreatorFeeSettings();

      const [{ status: notificationResStatus }, { status: feeResStatus }] = await Promise.all([
        saveNotificationPromise,
        saveFeePromise,
      ]);

      if (isAPISuccess(notificationResStatus) && isAPISuccess(feeResStatus)) {
        showSuccessModal('Platform settings saved successfully!');
        await fetchAccountSettings();
      }
    } catch (error) {
      console.error(error);
      showErrorModal('Failed to save platform settings', error?.response?.data?.message || 'Something went wrong');
    }

    setIsSubmitting(false);
  };

  const handleSwitchChanged = useCallback((checked) => {
    setShouldCreatorOwnFee(checked);
  }, []);

  const generateLabel = (item) => `Send email notifications for ${item}`;

  const emailOptions = [
    {
      label: generateLabel('booking confirmations'),
      value: 'receive_mails',
    },
  ];

  return (
    <Row gutter={[8, 24]}>
      <Col xs={24}>
        <Row gutter={[8, 8]}>
          <Col span={24} className={styles.textAlignLeft}>
            <Title level={4}> Platform Fee Settings </Title>
          </Col>
          <Col span={24}>
            <div className={styles.sectionWrapper}>
              <Row gutter={[8, 10]}>
                <Col span={24} className={styles.textAlignLeft}>
                  <Title level={5}> Fees will be handled by </Title>
                </Col>
                <Col span={24}>
                  <div className={styles.optionWrapper}>
                    <Spin spinning={isSubmitting}>
                      <Space>
                        <Text> Buyers </Text>
                        <Switch
                          disabled={!accountSettings}
                          checked={shouldCreatorOwnFee}
                          onChange={handleSwitchChanged}
                        />
                        <Text> Me </Text>
                      </Space>
                    </Spin>
                  </div>
                </Col>
              </Row>
            </div>
          </Col>
        </Row>
      </Col>
      <Col xs={24}>
        <Row gutter={[8, 8]} className={styles.notificationSettingsWrapper}>
          <Col span={24} className={styles.textAlignLeft}>
            <Title level={4}> Notification Settings </Title>
          </Col>
          <Col span={24}>
            <div className={styles.sectionWrapper}>
              <Row gutter={[8, 10]}>
                <Col span={24} className={styles.textAlignLeft}>
                  <Title level={5}> Email Notification </Title>
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
                          <Col span={24} key={emailOption.value}>
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
      </Col>
      <Col xs={24}>
        <Row justify="center">
          <Col xs={24} md={8} lg={4}>
            <Button
              block
              type="primary"
              loading={isSubmitting}
              onClick={handleSavePlatformSettings}
              className={styles.saveBtn}
            >
              Save Changes
            </Button>
          </Col>
        </Row>
      </Col>
    </Row>
  );
};

export default PlatformSettings;
