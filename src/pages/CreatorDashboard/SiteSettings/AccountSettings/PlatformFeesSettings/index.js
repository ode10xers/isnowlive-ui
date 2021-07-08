import React, { useState } from 'react';

import { Row, Col, Button, Switch, Typography, Spin, Space } from 'antd';

import apis from 'apis';

import { showSuccessModal, showErrorModal } from 'components/Modals/modals';

import { isAPISuccess } from 'utils/helper';

import styles from './styles.module.scss';

const { Title, Text } = Typography;

const PlatformFeesSettings = ({ accountSettings, fetchUserSettings }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [shouldCreatorOwnFee, setShouldCreatorOwnFee] = useState(accountSettings?.creator_owns_fee ?? false);

  const handleCreatorFeeSettingsChanged = async () => {
    setIsLoading(true);
    try {
      const { status } = await apis.user.updateCreatorFeeSettings({
        creator_owns_fee: shouldCreatorOwnFee,
      });

      if (isAPISuccess(status)) {
        showSuccessModal('Successfully updated creator fee settings');
        await fetchUserSettings();
      }
    } catch (error) {
      console.error(error);
      showErrorModal('Failed to load creator fee settings', error?.response?.data?.message || 'Something went wrong.');
    }

    setIsLoading(false);
  };

  const handleSwitchChanged = (checked) => {
    setShouldCreatorOwnFee(checked);
  };

  return (
    <div>
      <Row gutter={[8, 24]} className={styles.notificationSettingsWrapper}>
        <Col span={24} className={styles.textAlignLeft}>
          <Title level={3}> Platform Fee Settings </Title>
        </Col>
        <Col span={24}>
          <div className={styles.sectionWrapper}>
            <Row gutter={[8, 10]}>
              <Col span={24} className={styles.textAlignLeft}>
                <Title level={4}> Fees will be handled by </Title>
              </Col>
              <Col span={24}>
                <div className={styles.optionWrapper}>
                  <Spin spinning={isLoading}>
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
      <Row justify="center">
        <Col xs={24} md={8} lg={4}>
          <Button
            block
            type="primary"
            loading={isLoading}
            onClick={handleCreatorFeeSettingsChanged}
            className={styles.saveBtn}
          >
            Save Changes
          </Button>
        </Col>
      </Row>
    </div>
  );
};

export default PlatformFeesSettings;
