import React, { useState, useCallback, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import classNames from 'classnames';

import { Row, Col, Typography, Space, Form, Input, Collapse, Spin, Button, Divider, message } from 'antd';
import { DownOutlined } from '@ant-design/icons';

import apis from 'apis';

import { deepCloneObject, isAPISuccess } from 'utils/helper';
import validationRules from 'utils/validation';

import ImageUpload from 'components/ImageUpload';
import DeviceUIPreview from 'components/DeviceUIPreview';
import DragAndDropHandle from 'components/DynamicProfileComponents/DragAndDropHandle';

import { newProfileFormLayout } from 'layouts/FormLayouts';

import styles from './style.module.scss';

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

  const [creatorCoverImageUrl, setCreatorCoverImageUrl] = useState(null);
  const [creatorProfileImageUrl, setCreatorProfileImageUrl] = useState(null);

  const [creatorColorChoice, setCreatorColorChoice] = useState(null);
  const [isContainedUI, setIsContainedUI] = useState(false);

  const [expandedComponentsSection, setExpandedComponentsSection] = useState([]);

  const fetchCreatorProfileData = useCallback(async () => {
    setIsLoading(true);

    try {
      const { status, data } = await apis.user.getProfile();

      if (isAPISuccess(status) && data) {
        const creatorData = {
          ...data,
          profile: {
            ...data.profile,
            bio: data?.profile?.bio?.replace(/(<([^>]+)>)/gi, '').replaceAll('&nbsp;', ''),
          },
        };

        setCreatorProfileData(creatorData);

        setCreatorCoverImageUrl(data.cover_image_url);
        setCreatorProfileImageUrl(data.profile_image_url);

        setCreatorColorChoice(data?.profile?.color ?? null);
        setIsContainedUI(!data?.profile?.new_profile);

        form.setFieldsValue(creatorData);
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

  const expandComponentSection = (componentKey) =>
    setExpandedComponentsSection((prevValues) => [...new Set([...prevValues, componentKey])]);

  const collapseComponentSection = (componentKey) =>
    setExpandedComponentsSection(expandedComponentsSection.filter((key) => key !== componentKey));

  const renderSectionComponents = ({ key, name, fieldKey, ...restFields }) => {
    const componentKey = form.getFieldValue(['profile', 'sections', name, 'key']);

    if (!editViewMap[componentKey]) {
      return null;
    }

    const sectionLabel = editViewMap[componentKey].label;
    const EditComponent = editViewMap[componentKey].component;

    const isExpanded = expandedComponentsSection.includes(componentKey);

    return (
      <Draggable draggableId={componentKey} index={name} key={componentKey}>
        {(provided) => (
          <div className={styles.customAccordionItem} {...provided.draggableProps} ref={provided.innerRef}>
            <div
              className={styles.customAccordionHeader}
              onClick={() =>
                isExpanded ? collapseComponentSection(componentKey) : expandComponentSection(componentKey)
              }
            >
              <Row gutter={[8, 8]} align="middle">
                <Col flex="0 0 40px">
                  <DragAndDropHandle {...provided.dragHandleProps} />
                </Col>
                <Col flex="1 1 auto">
                  <Text strong> {sectionLabel} </Text>
                </Col>
                <Col flex="0 0 40px">
                  <DownOutlined rotate={isExpanded ? 180 : 0} />
                </Col>
              </Row>
            </div>
            <div className={classNames(styles.customAccordionContent, isExpanded ? undefined : styles.hidden)}>
              <EditComponent name={name} fieldKey={fieldKey} {...restFields} />
            </div>
          </div>
        )}
      </Draggable>
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

  const handleCoverImageUpload = (imageUrl) => {
    setCreatorCoverImageUrl(imageUrl);
    form.setFieldsValue({
      ...form.getFieldsValue(),
      cover_image_url: imageUrl,
    });
  };

  const handleProfileImageUpload = (imageUrl) => {
    setCreatorProfileImageUrl(imageUrl);
    form.setFieldsValue({
      ...form.getFieldsValue(),
      profile_image_url: imageUrl,
    });
  };

  const handleDragEnd = (result) => {
    const { destination, source, draggableId } = result;

    const formSectionValues = deepCloneObject(form.getFieldValue(['profile', 'sections']));

    const targetComponent = formSectionValues.find((component) => component.key === draggableId);

    if (targetComponent && destination && destination.index !== source.index) {
      formSectionValues.splice(source.index, 1);
      formSectionValues.splice(destination.index, 0, targetComponent);

      const oldFormValues = form.getFieldsValue();

      form.setFieldsValue({
        ...oldFormValues,
        profile: {
          ...oldFormValues?.profile,
          sections: formSectionValues,
        },
      });
    }
  };

  return (
    <div className={styles.editPageContainer}>
      <Spin spinning={isLoading} size="large">
        <Row gutter={[10, 20]}>
          <Col xs={24} lg={12}>
            <div className={styles.profileFormContainer}>
              <Form {...newProfileFormLayout} form={form} scrollToFirstError={true} onFinish={handleFormFinish}>
                <Row gutter={[12, 12]} align="middle" justify="center">
                  <Col xs={12}>
                    <Title level={4}>My Public Page</Title>
                  </Col>
                  <Col xs={12} className={styles.textAlignRight}>
                    <Button type="primary" className={styles.greenBtn} htmlType="submit" loading={isLoading}>
                      Save And Preview
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
                      <Row gutter={10}>
                        {/* Profile Section */}
                        <Col xs={24}>
                          <Collapse
                            ghost
                            expandIconPosition="right"
                            className={styles.componentsSectionContainer}
                            defaultActiveKey={['profile']}
                            expandIcon={({ isActive }) => <DownOutlined rotate={isActive ? 180 : 0} />}
                          >
                            <Panel key="profile" header={<Text strong>Profile</Text>}>
                              <Form.Item
                                name="cover_image_url"
                                label="Cover Photo"
                                rules={validationRules.requiredValidation}
                              >
                                <div>
                                  <ImageUpload
                                    name="cover_image_url"
                                    listType="picture"
                                    onChange={handleCoverImageUpload}
                                    value={creatorCoverImageUrl}
                                    className={styles.creatorCoverImage}
                                    overlayHelpText="Click to change image (size of Facebook Cover Image)"
                                  />
                                </div>
                              </Form.Item>
                              <Form.Item
                                name="profile_image_url"
                                label="Your Photo"
                                rules={validationRules.requiredValidation}
                              >
                                <div>
                                  <ImageUpload
                                    aspect={1}
                                    shape="round"
                                    name="profile_image_url"
                                    onChange={handleProfileImageUpload}
                                    value={creatorProfileImageUrl}
                                    className={styles.creatorProfileImage}
                                  />
                                </div>
                              </Form.Item>
                              <Form.Item label="Name" required={true}>
                                <Form.Item
                                  className={styles.nameInputWrapper}
                                  name="first_name"
                                  rules={validationRules.nameValidation}
                                >
                                  <Input placeholder="First Name" />
                                </Form.Item>
                                <Form.Item
                                  className={styles.nameInputWrapper}
                                  name="last_name"
                                  rules={validationRules.nameValidation}
                                >
                                  <Input placeholder="Last Name" />
                                </Form.Item>
                              </Form.Item>
                              <Form.Item
                                name={['profile', 'bio']}
                                label="Short Bio"
                                rules={validationRules.requiredValidation}
                              >
                                <Input.TextArea
                                  autoSize={true}
                                  showCount={true}
                                  maxLength={2000}
                                  className={styles.textAreaInput}
                                />
                              </Form.Item>
                            </Panel>
                            <Panel key="social_links" header={<Text strong> Social Media Links (optional) </Text>}>
                              <Form.Item label="Website" name={['profile', 'social_media_links', 'website']}>
                                <Input placeholder="Your website link" />
                              </Form.Item>

                              <Form.Item label="Facebook" name={['profile', 'social_media_links', 'facebook_link']}>
                                <Input placeholder="Facebook profile link" />
                              </Form.Item>

                              <Form.Item label="Twitter" name={['profile', 'social_media_links', 'twitter_link']}>
                                <Input placeholder="Twitter profile link" />
                              </Form.Item>

                              <Form.Item label="Instagram" name={['profile', 'social_media_links', 'instagram_link']}>
                                <Input placeholder="Instagram profile link" />
                              </Form.Item>

                              <Form.Item label="LinkedIn" name={['profile', 'social_media_links', 'linkedin_link']}>
                                <Input placeholder="LinkedIn profile link" />
                              </Form.Item>
                            </Panel>
                          </Collapse>
                        </Col>
                        <Col xs={24}>
                          <Divider />
                        </Col>
                        {/* Components Section */}
                        <Col xs={24}>
                          <DragDropContext onDragEnd={handleDragEnd}>
                            <Form.List name={['profile', 'sections']}>
                              {(sectionFields) => (
                                <Droppable droppableId="profile-components">
                                  {(provided) => (
                                    <div
                                      className={styles.customAccordionContainers}
                                      {...provided.droppableProps}
                                      ref={provided.innerRef}
                                    >
                                      {sectionFields.map(renderSectionComponents)}
                                      {provided.placeholder}
                                    </div>
                                  )}
                                </Droppable>
                              )}
                            </Form.List>
                          </DragDropContext>
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
            <Col xs={24} lg={12} className={styles.textAlignCenter}>
              <DeviceUIPreview creatorProfileData={creatorProfileData} />
            </Col>
          )}
        </Row>
      </Spin>
    </div>
  );
};

export default Onboarding;
