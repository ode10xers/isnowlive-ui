import React, { useState, useCallback, useEffect } from 'react';
import classNames from 'classnames';

import { Row, Col, Typography, Space, Form, Input, Collapse, Spin, Button, message } from 'antd';
import { DownOutlined } from '@ant-design/icons';

import apis from 'apis';

import { isAPISuccess } from 'utils/helper';
import validationRules from 'utils/validation';

import styles from './style.module.scss';
import DeviceUIPreview from 'components/DeviceUIPreview';

const { Title, Text } = Typography;
const { Panel } = Collapse;

const colorPalletteChoices = ['#ff0a54', '#ff700a', '#ffc60a', '#0affb6', '#0ab6ff', '#b10aff', '#40A9FF'];

const SimpleEditForm = ({ name, fieldKey, ...restFields }) => {
  return (
    <Form.Item
      {...restFields}
      name={[name, 'title']}
      fieldKey={[fieldKey, 'title']}
      label="Container Title"
      rules={validationRules.requiredValidation}
    >
      <Input placeholder="Input container title (max. 30 characters)" maxLength={30} />
    </Form.Item>
  );
};

const editViewMap = {
  AVAILABILITY: {
    label: 'Availability',
    component: SimpleEditForm,
  },
  PASSES: {
    label: 'Passes',
    component: SimpleEditForm,
  },
  SUBSCRIPTIONS: {
    label: 'Memberships',
    component: SimpleEditForm,
  },
  SESSIONS: {
    label: 'Sessions',
    component: SimpleEditForm,
  },
  COURSES: {
    label: 'Courses',
    component: SimpleEditForm,
  },
  VIDEOS: {
    label: 'Videos',
    component: SimpleEditForm,
  },
};

// TODO: We need this page to open in with username in hostname
const Onboarding = ({ history }) => {
  const [form] = Form.useForm();

  const [isLoading, setIsLoading] = useState(false);
  const [creatorProfileData, setCreatorProfileData] = useState(null);

  const [creatorColorChoice, setCreatorColorChoice] = useState(null);
  const [isContainedUI, setIsContainedUI] = useState(false);

  const fetchCreatorProfileData = useCallback(async () => {
    setIsLoading(true);

    try {
      const { status, data } = await apis.user.getProfile();

      if (isAPISuccess(status) && data) {
        setCreatorProfileData(data);
        setCreatorColorChoice(data?.profile?.color ?? null);
        setIsContainedUI(!data?.profile?.new_profile);

        form.setFieldsValue(data);
      }
    } catch (error) {
      message.error(error?.response?.data?.message || 'Failed to load creator profile details');
      console.error(error);
    }

    setIsLoading(false);
  }, [form]);

  useEffect(() => {
    fetchCreatorProfileData();
  }, [fetchCreatorProfileData]);

  const renderSectionComponents = ({ key, name, fieldKey, ...restFields }) => {
    const componentKey = form.getFieldValue(['profile', 'sections', name, 'key']);

    if (!editViewMap[componentKey]) {
      return null;
    }

    const sectionLabel = editViewMap[componentKey].label;
    const EditComponent = editViewMap[componentKey].component;

    return (
      <Panel key={name} header={<Text strong>{sectionLabel}</Text>}>
        <EditComponent name={name} fieldKey={fieldKey} {...restFields} />
      </Panel>
    );
  };

  const handleFormFinish = async (values) => {
    setIsLoading(true);

    try {
      const payload = {
        ...creatorProfileData,
        ...values,
        profile: {
          ...creatorProfileData.profile,
          ...values.profile,
          color: creatorColorChoice,
          new_profile: !isContainedUI,
        },
      };

      console.log(payload);
      setCreatorProfileData(payload);
      setIsLoading(false);
      return;

      const { status, data } = await apis.user.updateProfile(payload);

      if (isAPISuccess(status) && data) {
        setCreatorProfileData(data);
      }
    } catch (error) {
      message.error(error?.response?.data?.message || 'Failed to update user profile');
      console.error(error);
    }

    setIsLoading(false);
  };

  return (
    <div className={styles.editPageContainer}>
      <Spin spinning={isLoading} size="large">
        <Row gutter={[10, 20]}>
          <Col xs={24} lg={12}>
            <div className={styles.profileFormContainer}>
              <Form form={form} scrollToFirstError={true} onFinish={handleFormFinish}>
                <Row gutter={[12, 12]} align="middle" justify="center">
                  <Col xs={12}>
                    <Title level={4}> My Public Page </Title>
                  </Col>
                  <Col xs={12} className={styles.textAlignRight}>
                    <Button type="primary" className={styles.greenBtn} htmlType="submit" loading={isLoading}>
                      {' '}
                      Save And Preview{' '}
                    </Button>
                  </Col>
                  <Col xs={24}>
                    {/* Color Selectipn */}
                    <Space className={styles.colorChoicesContainer}>
                      {colorPalletteChoices.map((color) => (
                        <div
                          key={color}
                          className={classNames(
                            styles.colorContainer,
                            creatorColorChoice === color ? styles.selected : undefined
                          )}
                          onClick={() => setCreatorColorChoice(color)}
                        >
                          <div className={styles.colorChoice} style={{ backgroundColor: color }}></div>
                        </div>
                      ))}
                    </Space>
                  </Col>
                  {creatorProfileData && (
                    <Col xs={24}>
                      <Row gutter={[10, 10]}>
                        {/* Profile Section */}
                        <Col xs={24}></Col>
                        {/* Components Section */}
                        <Col xs={24}>
                          <Form.List name={['profile', 'sections']}>
                            {(sectionFields, { addSection, removeSection }) => (
                              <Collapse
                                expandIconPosition="right"
                                ghost
                                className={styles.componentsSectionContainer}
                                expandIcon={({ isActive }) => <DownOutlined rotate={isActive ? 180 : 0} />}
                              >
                                {sectionFields.map(renderSectionComponents)}
                              </Collapse>
                            )}
                          </Form.List>
                        </Col>
                        <Col xs={24}></Col>
                      </Row>
                    </Col>
                  )}
                </Row>
              </Form>
            </div>
          </Col>
          {creatorProfileData && (
            <Col xs={24} lg={12}>
              <DeviceUIPreview creatorProfileData={creatorProfileData} />
            </Col>
          )}
        </Row>
      </Spin>
    </div>
  );
};

export default Onboarding;
