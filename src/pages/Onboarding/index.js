import React, { useState, useCallback, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import classNames from 'classnames';

import {
  Row,
  Col,
  Typography,
  Space,
  Form,
  Input,
  Collapse,
  Modal,
  Spin,
  Button,
  Tooltip,
  Divider,
  message,
} from 'antd';

import {
  DownOutlined,
  PlusCircleOutlined,
  MinusCircleOutlined,
  DesktopOutlined,
  MobileOutlined,
  EditOutlined,
  BookOutlined,
  ClockCircleOutlined,
  GiftOutlined,
  LikeOutlined,
  LinkOutlined,
  PlayCircleOutlined,
  ProfileOutlined,
  ScheduleOutlined,
  VideoCameraOutlined,
  YoutubeOutlined,
  OrderedListOutlined,
  DeleteOutlined,
  ArrowLeftOutlined,
} from '@ant-design/icons';

import apis from 'apis';
import Routes from 'routes';

import TextEditor from 'components/TextEditor';
import ImageUpload from 'components/ImageUpload';
import DeviceUIPreview from 'components/DeviceUIPreview';
import DragAndDropHandle from 'components/DynamicProfileComponents/DragAndDropHandle';
import { resetBodyStyle, showErrorModal, showSuccessModal } from 'components/Modals/modals';

import { newProfileFormLayout } from 'layouts/FormLayouts';

import validationRules from 'utils/validation';
import { deepCloneObject, isAPISuccess, preventDefaults, generateUrlFromUsername, copyToClipboard } from 'utils/helper';

import { useGlobalContext } from 'services/globalContext';

import styles from './style.module.scss';

const { Title, Text, Paragraph, Link } = Typography;
const { Panel } = Collapse;

const colorPalletteChoices = ['#ff0a54', '#ff700a', '#ffc60a', '#0affb6', '#0ab6ff', '#b10aff', '#40A9FF'];

// TODO: Clean up this file
const SimpleEditForm = ({ formInstance, name, fieldKey, ...restFields }) => {
  return (
    <Form.Item
      {...restFields}
      label="Section Title"
      name={[name, 'title']}
      fieldKey={[fieldKey, 'title']}
      rules={validationRules.requiredValidation}
    >
      <Input placeholder="Input section title (max. 30 characters)" maxLength={30} />
    </Form.Item>
  );
};

const OtherLinksEditForm = ({ formInstance, name, fieldKey, ...restFields }) => {
  const [expandedAccordionKeys, setExpandedAccordionKeys] = useState([]);

  return (
    <>
      <Form.Item
        {...restFields}
        labelCol={{ xs: { span: 24 }, lg: { span: 4 } }}
        wrapperCol={{ xs: { span: 24 }, lg: { span: 20 } }}
        label="Title"
        name={[name, 'title']}
        fieldKey={[fieldKey, 'title']}
        rules={validationRules.requiredValidation}
      >
        <Input placeholder="Input section title (max. 30 characters)" maxLength={30} />
      </Form.Item>
      <Form.Item
        labelCol={{ xs: { span: 24 }, lg: { span: 4 } }}
        wrapperCol={{ xs: { span: 24 }, lg: { span: 20 } }}
        label="Your Links"
        required={true}
      >
        <Form.List
          {...restFields}
          name={[name, 'values']}
          fieldKey={[fieldKey, 'name']}
          rules={validationRules.otherLinksValidation}
        >
          {(fields, { add, remove }, { errors }) => (
            <Row className={styles.ml10} gutter={[8, 12]}>
              <Col xs={24}>
                <Collapse
                  defaultActiveKey={fields[0]?.name ?? 0}
                  activeKey={expandedAccordionKeys}
                  onChange={setExpandedAccordionKeys}
                >
                  {fields.map(({ name: otherLinksName, fieldKey: otherLinksFieldKey, ...otherLinksRestField }) => (
                    <Panel
                      key={otherLinksName}
                      header={
                        <Space align="baseline">
                          <Title level={5} className={styles.blueText}>
                            Link Item
                          </Title>
                          {fields.length > 1 ? (
                            <Tooltip title="Remove this link item">
                              <MinusCircleOutlined
                                className={styles.redText}
                                onClick={(e) => {
                                  preventDefaults(e);
                                  // NOTE : We use the name as Panel key
                                  setExpandedAccordionKeys((prevKeys) =>
                                    prevKeys.filter((val) => val !== otherLinksName)
                                  );
                                  remove(otherLinksName);
                                }}
                              />
                            </Tooltip>
                          ) : null}
                        </Space>
                      }
                    >
                      <Row gutter={[8, 4]}>
                        <Col xs={24} md={12}>
                          <Form.Item
                            className={styles.compactFormItem}
                            {...otherLinksRestField}
                            label="Link Title"
                            fieldKey={[otherLinksFieldKey, 'title']}
                            name={[otherLinksName, 'title']}
                            rules={validationRules.requiredValidation}
                          >
                            <Input placeholder="Text to show (max. 50)" maxLength={50} />
                          </Form.Item>
                        </Col>
                        <Col xs={24} md={12}>
                          <Form.Item
                            className={styles.compactFormItem}
                            {...otherLinksRestField}
                            label="Link URL"
                            fieldKey={[otherLinksFieldKey, 'url']}
                            name={[otherLinksName, 'url']}
                            rules={validationRules.urlValidation}
                          >
                            <Input placeholder="Paste your URL here" type="url" />
                          </Form.Item>
                        </Col>
                        <Col xs={24} md={12}>
                          <Form.Item
                            className={styles.compactFormItem}
                            {...otherLinksRestField}
                            label="Title Color"
                            fieldKey={[otherLinksFieldKey, 'textColor']}
                            name={[otherLinksName, 'textColor']}
                            rules={[...validationRules.requiredValidation, ...validationRules.hexColorValidation()]}
                          >
                            <Input placeholder="Hex color code of the title" />
                          </Form.Item>
                        </Col>
                        <Col xs={24} md={12}>
                          <Form.Item
                            className={styles.compactFormItem}
                            {...otherLinksRestField}
                            label="Background Color"
                            fieldKey={[otherLinksFieldKey, 'backgroundColor']}
                            name={[otherLinksName, 'backgroundColor']}
                            rules={[...validationRules.requiredValidation, ...validationRules.hexColorValidation()]}
                          >
                            <Input placeholder="Hex color code of the background" />
                          </Form.Item>
                        </Col>
                      </Row>
                    </Panel>
                  ))}
                </Collapse>
              </Col>
              <Col xs={24}>
                <Button
                  block
                  type="dashed"
                  onClick={(e) => {
                    preventDefaults(e);
                    // NOTE : Since the new one will be added at the last place
                    // We ad the length of current array to the expanded keys
                    setExpandedAccordionKeys((prevKeys) => [...new Set([...prevKeys, fields.length])]);
                    add();
                  }}
                  icon={<PlusCircleOutlined />}
                >
                  Add more links
                </Button>
              </Col>
              <Col xs={24}>
                <Form.ErrorList errors={errors} />
              </Col>
            </Row>
          )}
        </Form.List>
      </Form.Item>
    </>
  );
};

const DescriptionEditForm = ({ formInstance, name, fieldKey, ...restFields }) => (
  <>
    <Form.Item
      {...restFields}
      id="title"
      name={[name, 'title']}
      fieldKey={[fieldKey, 'title']}
      label="Section Title"
      rules={validationRules.requiredValidation}
    >
      <Input placeholder="Input section title (max. 30 characters)" maxLength={30} />
    </Form.Item>
    <Form.Item
      {...restFields}
      className={classNames(styles.bgWhite, styles.textEditorLayout)}
      id="values"
      name={[name, 'values']}
      fieldKey={[fieldKey, 'values']}
      label="Content"
      rules={validationRules.requiredValidation}
    >
      <div>
        <TextEditor
          form={formInstance}
          name={['profile', 'sections', name, 'values']}
          placeholder="Describe yourself here"
          triggerOnBlur={true}
        />
      </div>
    </Form.Item>
  </>
);

const YoutubeLinksEditForm = ({ formInstance, name, fieldKey, ...restFields }) => (
  <>
    <Form.Item
      id="title"
      {...restFields}
      name={[name, 'title']}
      fieldKey={[fieldKey, 'title']}
      label="Title"
      labelCol={{ xs: { span: 24 }, lg: { span: 4 } }}
      wrapperCol={{ xs: { span: 24 }, lg: { span: 20 } }}
      rules={validationRules.requiredValidation}
    >
      <Input placeholder="Input container title (max. 30 characters)" maxLength={30} />
    </Form.Item>
    <Form.Item
      labelCol={{ xs: { span: 24 }, lg: { span: 4 } }}
      wrapperCol={{ xs: { span: 24 }, lg: { span: 20 } }}
      label="Video Links"
      required={true}
    >
      <Form.List
        {...restFields}
        fieldKey={[fieldKey, 'values']}
        name={[name, 'values']}
        rules={validationRules.dynamicArrayItemValidation}
      >
        {(fields, { add, remove }, { errors }) => (
          <Row gutter={[8, 12]}>
            <Col xs={24}>
              <Paragraph>Accepts YouTube Links with this format:</Paragraph>
              <Paragraph>
                <Text strong>https://youtu.be/[video-id]</Text> or{' '}
                <Text strong>https://www.youtube.com/watch?v=[video-id]</Text>
              </Paragraph>
            </Col>
            <Col xs={24}>
              {fields.map(({ name: youtubeLinksName, fieldKey: youtubeLinksFieldKey, ...youtubeLinksRestFields }) => (
                <Row gutter={[8, 12]} align="middle" key={`youtube-fields-${youtubeLinksFieldKey}`}>
                  <Col flex="1 1 auto">
                    <Form.Item
                      {...youtubeLinksRestFields}
                      className={styles.compactFormItem}
                      fieldKey={youtubeLinksFieldKey}
                      name={youtubeLinksName}
                      rules={validationRules.youtubeLinkValidation}
                    >
                      <Input placeholder="Put YouTube video link here" maxLength={100} />
                    </Form.Item>
                  </Col>
                  <Col flex="0 0 40px">
                    <Tooltip title="Remove this item">
                      <MinusCircleOutlined
                        className={styles.redText}
                        onClick={(e) => {
                          preventDefaults(e);
                          remove(youtubeLinksName);
                        }}
                      />
                    </Tooltip>
                  </Col>
                </Row>
              ))}
            </Col>
            <Col xs={24}>
              <Button
                block
                type="dashed"
                onClick={(e) => {
                  preventDefaults(e);
                  add();
                }}
                icon={<PlusCircleOutlined />}
              >
                Add more links
              </Button>
            </Col>
            <Col xs={24}>
              <Form.ErrorList errors={errors} />
            </Col>
          </Row>
        )}
      </Form.List>
    </Form.Item>
  </>
);

const TextListEditForm = ({ formInstance, name, fieldKey, ...restFields }) => (
  <>
    <Form.Item
      id="title"
      {...restFields}
      fieldKey={[fieldKey, 'title']}
      name={[name, 'title']}
      labelCol={{ xs: { span: 24 }, lg: { span: 4 } }}
      wrapperCol={{ xs: { span: 24 }, lg: { span: 20 } }}
      label="Section Title"
      rules={validationRules.requiredValidation}
    >
      <Input placeholder="Input section title (max. 30 characters)" maxLength={30} />
    </Form.Item>
    <Form.Item
      labelCol={{ xs: { span: 24 }, lg: { span: 4 } }}
      wrapperCol={{ xs: { span: 24 }, lg: { span: 20 } }}
      label="List Items"
      required={true}
    >
      <Form.List
        {...restFields}
        fieldKey={[fieldKey, 'values']}
        name={[name, 'values']}
        rules={validationRules.dynamicArrayItemValidation}
      >
        {(fields, { add, remove }, { errors }) => (
          <Row gutter={[8, 12]}>
            <Col xs={24}>
              {fields.map(({ name: textListName, fieldKey: textListFieldKey, ...textListRestFields }) => (
                <Row gutter={[8, 12]} align="middle" key={`text-list-fields-${textListFieldKey}`}>
                  <Col flex="1 1 auto">
                    <Form.Item
                      {...textListRestFields}
                      fieldKey={textListFieldKey}
                      name={textListName}
                      rules={validationRules.requiredValidation}
                    >
                      <Input.TextArea
                        placeholder="Place any text here (max 200 chars)"
                        maxLength={200}
                        showCount={true}
                        autoSize={true}
                      />
                    </Form.Item>
                  </Col>
                  <Col flex="0 0 40px">
                    <Tooltip title="Remove this item">
                      <MinusCircleOutlined
                        className={styles.redText}
                        onClick={(e) => {
                          preventDefaults(e);
                          remove(textListName);
                        }}
                      />
                    </Tooltip>
                  </Col>
                </Row>
              ))}
            </Col>
            <Col xs={24}>
              <Button
                block
                type="dashed"
                onClick={(e) => {
                  preventDefaults(e);
                  add();
                }}
                icon={<PlusCircleOutlined />}
              >
                Add more items
              </Button>
            </Col>
            <Col xs={24}>
              <Form.ErrorList errors={errors} />
            </Col>
          </Row>
        )}
      </Form.List>
    </Form.Item>
  </>
);

// NOTE: we're ignoring PRODUCTS component for now
const componentUIType = {
  CONTAINED: 'CONTAINED', // Will only show when UI style is contained (is_contained = true)
  OPEN: 'OPEN', // Will only show when UI style is open (is_contained = false)
  FLEXIBLE: 'FLEXIBLE', // Can show in both
};

const componentsMap = {
  AVAILABILITY: {
    icon: <ClockCircleOutlined />,
    label: 'Availability',
    type: componentUIType.FLEXIBLE,
    optional: false,
    elementId: 'availability',
    defaultProps: {
      title: 'AVAILABILITY',
      values: null,
    },
  },
  // Currently here we're forcing user to new UI
  PRODUCTS: {
    icon: <GiftOutlined />,
    label: 'Products',
    type: componentUIType.CONTAINED,
    optional: false,
    elementId: 'products',
    defaultProps: {
      title: '',
      values: [
        {
          key: 'SESSIONS',
          title: 'My Sessions',
          values: null,
        },
        {
          key: 'COURSES',
          title: 'My Courses',
          values: null,
        },
        {
          key: 'VIDEOS',
          title: 'My Videos',
          values: null,
        },
      ],
    },
  },
  SESSIONS: {
    icon: <VideoCameraOutlined />,
    label: 'Sessions',
    type: componentUIType.OPEN,
    elementId: 'sessions',
    optional: false,
    defaultProps: {
      title: 'My Sessions',
      values: null,
    },
  },
  COURSES: {
    icon: <BookOutlined />,
    label: 'Courses',
    type: componentUIType.OPEN,
    elementId: 'courses',
    optional: false,
    defaultProps: {
      title: 'My Courses',
      values: null,
    },
  },
  VIDEOS: {
    icon: <PlayCircleOutlined />,
    label: 'Videos',
    type: componentUIType.OPEN,
    optional: false,
    elementId: 'videos',
    defaultProps: {
      title: 'My Videos',
      values: null,
    },
  },
  PASSES: {
    icon: <LikeOutlined />,
    label: 'Passes',
    optional: false,
    type: componentUIType.FLEXIBLE,
    elementId: 'passes',
    defaultProps: {
      title: 'CREDIT PASSES',
      values: null,
    },
  },
  SUBSCRIPTIONS: {
    icon: <ScheduleOutlined />,
    label: 'Memberships',
    type: componentUIType.FLEXIBLE,
    elementId: 'memberships',
    optional: false,
    defaultProps: {
      title: 'MEMBERSHIPS',
      values: null,
    },
  },
  OTHER_LINKS: {
    icon: <LinkOutlined />,
    label: 'Other Links',
    type: componentUIType.FLEXIBLE,
    elementId: 'other-links',
    optional: true,
    defaultProps: {
      title: 'OTHER LINKS',
      values: null,
    },
  },
  YOUTUBE_LINKS: {
    icon: <YoutubeOutlined />,
    label: 'Youtube Videos',
    type: componentUIType.FLEXIBLE,
    optional: true,
    elementId: 'youtube-videos',
    defaultProps: {
      title: 'Youtube Videos',
      values: null,
    },
  },
  DESCRIPTION: {
    icon: <ProfileOutlined />,
    label: 'Description',
    type: componentUIType.FLEXIBLE,
    optional: true,
    elementId: 'long-description',
    defaultProps: {
      title: 'About Me',
      values: null,
    },
  },
  TEXT_LIST: {
    icon: <OrderedListOutlined />,
    label: 'List Items',
    type: componentUIType.FLEXIBLE,
    optional: true,
    elementId: 'list-items',
    defaultProps: {
      title: 'List Items',
      values: null,
    },
  },
};

const editViewMap = {
  AVAILABILITY: {
    label: 'Availability',
    component: SimpleEditForm,
    optional: false,
  },
  PASSES: {
    label: 'Passes',
    component: SimpleEditForm,
    optional: false,
  },
  SUBSCRIPTIONS: {
    label: 'Memberships',
    component: SimpleEditForm,
    optional: false,
  },
  SESSIONS: {
    label: 'Sessions',
    component: SimpleEditForm,
    optional: false,
  },
  COURSES: {
    label: 'Courses',
    component: SimpleEditForm,
    optional: false,
  },
  VIDEOS: {
    label: 'Videos',
    component: SimpleEditForm,
    optional: false,
  },
  OTHER_LINKS: {
    label: 'Other Links',
    component: OtherLinksEditForm,
    optional: true,
  },
  DESCRIPTION: {
    label: 'Description',
    component: DescriptionEditForm,
    optional: true,
  },
  YOUTUBE_LINKS: {
    label: 'Youtube Links',
    component: YoutubeLinksEditForm,
    optional: true,
  },
  TEXT_LIST: {
    label: 'List Items',
    component: TextListEditForm,
    optional: true,
  },
};

const Onboarding = ({ match, history }) => {
  const [form] = Form.useForm();
  const [usernameForm] = Form.useForm();
  const { setUserDetails } = useGlobalContext();

  const isOnboarding = match.path.includes('/onboarding');

  const [isLoading, setIsLoading] = useState(false);
  const [creatorProfileData, setCreatorProfileData] = useState(null);

  const [creatorCoverImageUrl, setCreatorCoverImageUrl] = useState(null);
  const [creatorProfileImageUrl, setCreatorProfileImageUrl] = useState(null);

  const [creatorColorChoice, setCreatorColorChoice] = useState(null);

  const [expandedComponentsSection, setExpandedComponentsSection] = useState([]);

  const [isMobileView, setIsMobileView] = useState(true);

  const [addComponentModalVisible, setAddComponentModalVisible] = useState(false);
  const [editUsernameModalVisible, setEditUsernameModalVisible] = useState(false);

  const [isPublicUrlAvailable, setIsPublicUrlAvailable] = useState(false);
  const [isLoadingUsernameCheck, setIsLoadingUsernameCheck] = useState(false);

  const [updateTimeoutID, setUpdateTimeoutID] = useState(null);

  const fetchCreatorProfileData = useCallback(async () => {
    setIsLoading(true);

    try {
      const { status, data } = await apis.user.getProfile();

      if (isAPISuccess(status) && data) {
        setCreatorProfileData({
          ...data,
          profile: {
            ...data.profile,
            new_profile: true,
            color: isOnboarding ? '#ffc60a' : data.profile?.color ?? '',
          },
        });

        setCreatorCoverImageUrl(data.cover_image_url);
        setCreatorProfileImageUrl(data.profile_image_url);

        if (isOnboarding) {
          setCreatorColorChoice('#ffc60a');
        } else {
          setCreatorColorChoice(data?.profile?.color ?? null);
        }

        form.setFieldsValue(data);
      }
    } catch (error) {
      message.error(error?.response?.data?.message || 'Failed to load creator profile details');
      console.error(error);
    }

    setIsLoading(false);
  }, [form, isOnboarding]);

  useEffect(() => {
    fetchCreatorProfileData();
  }, [fetchCreatorProfileData]);

  useEffect(() => {}, []);

  const expandComponentSection = (componentKey) =>
    setExpandedComponentsSection((prevValues) => [...new Set([...prevValues, componentKey])]);

  const collapseComponentSection = (componentKey) =>
    setExpandedComponentsSection(expandedComponentsSection.filter((key) => key !== componentKey));

  const getExistingComponentInstance = (identifier) =>
    creatorProfileData?.profile?.sections?.find((component) => component.key === identifier);

  const updateSections = (newSections) => {
    const formData = form.getFieldsValue();
    const newCreatorProfileData = {
      ...creatorProfileData,
      ...formData,
      profile: {
        ...creatorProfileData.profile,
        ...formData.profile,
        sections: newSections,
      },
    };

    setCreatorProfileData(newCreatorProfileData);
    form.setFieldsValue(newCreatorProfileData);
  };

  const addComponent = (identifier = null, props) => {
    if (!identifier) {
      showErrorModal('Invalid section identifier!');
      return;
    }

    const existingComponentInstance = getExistingComponentInstance(identifier);

    if (existingComponentInstance) {
      showErrorModal('Duplicate of this section already exists!');
      return;
    }

    const currentComponentList = deepCloneObject(creatorProfileData?.profile?.sections) || [];
    currentComponentList.push({
      key: identifier,
      ...props,
    });

    showSuccessModal('Section added', `Make sure to save so you don't lose the changes`);
    setAddComponentModalVisible(false);

    updateSections(currentComponentList);
  };

  const removeComponent = (identifier = null) => {
    if (!identifier) {
      showErrorModal('Invalid identifier passed');
      return;
    }

    const currentComponentList = deepCloneObject(creatorProfileData?.profile?.sections) || [];
    const targetIndex = currentComponentList.findIndex((component) => component.key === identifier);

    if (targetIndex === -1) {
      showErrorModal(`Component with identifier ${identifier} not found!`);
      return;
    }

    currentComponentList.splice(targetIndex, 1);

    updateSections(currentComponentList);
    message.success('Section removed');
  };

  const handleDeleteComponentClicked = (e, identifier) => {
    preventDefaults(e);

    Modal.confirm({
      closable: true,
      centered: true,
      mask: true,
      maskClosable: false,
      title: 'Delete this section?',
      content: <Paragraph>Are you sure you want to remove this section?</Paragraph>,
      okText: 'Yes, remove it',
      okButtonProps: {
        danger: true,
        type: 'primary',
      },
      cancelText: 'Cancel',
      onOk: () => removeComponent(identifier),
      afterClose: resetBodyStyle,
    });
  };

  const renderSectionComponents = ({ key, name, fieldKey, ...restFields }) => {
    const componentKey = form.getFieldValue(['profile', 'sections', name, 'key']);

    if (!editViewMap[componentKey]) {
      return null;
    }

    const sectionLabel = editViewMap[componentKey].label;
    const EditComponent = editViewMap[componentKey].component;
    const isOptional = editViewMap[componentKey].optional;

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
                  <Space>
                    <Text strong> {sectionLabel} </Text>
                    {isOptional ? (
                      <Button
                        danger
                        type="link"
                        onClick={(e) => handleDeleteComponentClicked(e, componentKey)}
                        icon={<DeleteOutlined />}
                      />
                    ) : null}
                  </Space>
                </Col>
                <Col flex="0 0 40px">
                  <DownOutlined rotate={isExpanded ? 180 : 0} />
                </Col>
              </Row>
            </div>
            <div className={classNames(styles.customAccordionContent, isExpanded ? undefined : styles.hidden)}>
              <EditComponent formInstance={form} name={name} fieldKey={fieldKey} {...restFields} />
            </div>
          </div>
        )}
      </Draggable>
    );
  };

  const showCreatorProfilePreview = (creatorUrl) => {
    const newWindow = window.open(creatorUrl);
    newWindow.blur();
    window.focus();
  };

  const handleFormFinish = async (values) => {
    setIsLoading(true);

    try {
      // TODO: Currently hardcoding this to new UI
      const payload = {
        ...creatorProfileData,
        ...values,
        profile: {
          ...creatorProfileData.profile,
          ...values.profile,
          color: creatorColorChoice,
          new_profile: true,
        },
      };

      const { status, data } = await apis.user.updateProfile(payload);

      if (isAPISuccess(status) && data) {
        if (isOnboarding) {
          setUserDetails(data);
          const creatorUrl = generateUrlFromUsername(data.username);

          const modalRef = Modal.success({
            closable: false,
            maskClosable: false,
            width: 550,
            okButtonProps: { style: { display: 'none' } },
            title: 'Awesome! Your public website is ready',
            content: (
              <Row gutter={[8, 12]}>
                <Col xs={24}>
                  <Paragraph>You can now share your website</Paragraph>
                  <Paragraph>
                    <Space direction="vertical">
                      <Link href={creatorUrl} target="_blank">
                        {creatorUrl}
                      </Link>
                      <Space>
                        <Button ghost size="small" type="primary" onClick={() => copyToClipboard(creatorUrl)}>
                          Copy
                        </Button>
                        <Button size="small" type="primary" onClick={() => showCreatorProfilePreview(creatorUrl)}>
                          Show me!
                        </Button>
                      </Space>
                    </Space>
                  </Paragraph>
                  <Paragraph>on your social media or with your audience.</Paragraph>
                  <Paragraph>Now let's get your sessions or videos setup for them to start buying</Paragraph>
                </Col>
                <Col xs={24}>
                  <Row gutter={[8, 8]} justify="space-around">
                    <Col xs={24} md={12}>
                      <Button
                        block
                        type="primary"
                        onClick={() => {
                          history.push(Routes.creatorDashboard.rootPath + Routes.creatorDashboard.videos, {
                            onboarding: true,
                          });
                          modalRef.destroy();
                        }}
                      >
                        Upload a Video
                      </Button>
                    </Col>
                    <Col xs={24} md={12}>
                      <Button
                        block
                        type="primary"
                        className={styles.greenBtn}
                        onClick={() => {
                          history.push(Routes.creatorDashboard.rootPath + Routes.creatorDashboard.createSessions);
                          window.scrollTo(0, 0);
                          modalRef.destroy();
                        }}
                      >
                        Schedule a Session
                      </Button>
                    </Col>
                    <Col xs={24} md={12}>
                      <Button
                        block
                        type="link"
                        onClick={() => {
                          history.push(Routes.creatorDashboard.rootPath + Routes.creatorDashboard.defaultPath);
                          modalRef.destroy();
                        }}
                      >
                        I'll do these later
                      </Button>
                    </Col>
                  </Row>
                </Col>
              </Row>
            ),
          });
        }

        setCreatorProfileData(data);
        message.success('Profile Saved Successfully!');
      }
    } catch (error) {
      message.error(error?.response?.data?.message || 'Failed to update user profile');
      console.error(error);
    }

    setIsLoading(false);
  };

  const handleCoverImageUpload = (imageUrl) => {
    setCreatorCoverImageUrl(imageUrl);
    const formData = form.getFieldsValue();
    const newCreatorProfileData = {
      ...creatorProfileData,
      ...formData,
      profile: {
        ...creatorProfileData.profile,
        ...formData.profile,
      },
      cover_image_url: imageUrl,
    };

    setCreatorProfileData(newCreatorProfileData);
    form.setFieldsValue(newCreatorProfileData);
  };

  const handleProfileImageUpload = (imageUrl) => {
    setCreatorProfileImageUrl(imageUrl);
    const formData = form.getFieldsValue();
    const newCreatorProfileData = {
      ...creatorProfileData,
      ...formData,
      profile: {
        ...creatorProfileData.profile,
        ...formData.profile,
      },
      profile_image_url: imageUrl,
    };

    setCreatorProfileData(newCreatorProfileData);
    form.setFieldsValue(newCreatorProfileData);
  };

  const handleDragEnd = (result) => {
    const { destination, source, draggableId } = result;

    const formSectionValues = deepCloneObject(form.getFieldValue(['profile', 'sections']));

    const targetComponent = formSectionValues.find((component) => component.key === draggableId);

    if (targetComponent && destination && destination.index !== source.index) {
      formSectionValues.splice(source.index, 1);
      formSectionValues.splice(destination.index, 0, targetComponent);

      updateSections(formSectionValues);
    }
  };

  const handleAddProfileComponent = (e) => {
    preventDefaults(e);
    setAddComponentModalVisible(true);
  };

  const handleBackToDashboardClicked = (e) => {
    preventDefaults(e);
    history.push(Routes.creatorDashboard.rootPath);
  };

  const handleEditUsernameClicked = (e) => {
    preventDefaults(e);
    setEditUsernameModalVisible(true);
  };

  const handlePublicUrlChange = async (e) => {
    let regex = new RegExp('^[a-z]*$');
    if (regex.test(e.target.value)) {
      try {
        setIsLoadingUsernameCheck(true);
        const { data } = await apis.user.validUsernameCheck({
          username: e.target.value?.toLowerCase(),
        });
        if (data) {
          setIsPublicUrlAvailable(true);
        } else {
          setIsPublicUrlAvailable(false);
        }
        setIsLoadingUsernameCheck(false);
      } catch (error) {
        setIsLoadingUsernameCheck(false);
        message.error(error.response?.data?.message || 'Something went wrong.');
      }
    }
  };

  const reloadWithNewUsername = (newUsername) => {
    const { protocol, hostname, pathname } = window.location;

    const oldHostname = hostname.split('.');
    oldHostname.splice(0, 1, newUsername);
    let updatedHost = oldHostname.join('.');
    window.open(`${protocol}//${updatedHost}${pathname}`, '_self');
  };

  const handleFinishEditUsername = async () => {
    setIsLoading(true);

    if (isPublicUrlAvailable) {
      try {
        const values = usernameForm.getFieldsValue();
        const payload = {
          ...creatorProfileData,
          ...values,
        };

        const { status, data } = await apis.user.updateProfile(payload);

        if (isAPISuccess(status) && data) {
          setCreatorProfileData(data);
          message.success('Username updated!');
          setEditUsernameModalVisible(false);
          reloadWithNewUsername(values.username);
        }
      } catch (error) {
        message.error(error?.response?.data?.message || 'Failed to update username');
        console.error(error);
      }
    } else {
      message.error('Please enter valid username.');
    }
    setIsLoading(false);
  };

  // const handleFormFieldsChanged = (changedFields, allFields) => {
  //   const formValues = form.getFieldsValue();

  //   setCreatorProfileData((prevData) => ({
  //     ...prevData,
  //     ...formValues,
  //     profile: {
  //       ...prevData.profile,
  //       ...formValues.profile,
  //     },
  //   }));
  // };

  const handleFormValuesChange = (changedValues, allValues) => {
    if (updateTimeoutID) {
      clearTimeout(updateTimeoutID);
    }

    const newTimeout = setTimeout(() => {
      setCreatorProfileData((prevData) => ({
        ...prevData,
        ...allValues,
        profile: {
          ...prevData.profile,
          ...allValues.profile,
        },
      }));
    }, 800);

    setUpdateTimeoutID(newTimeout);
  };

  return (
    <div className={styles.editPageContainer}>
      <Modal
        visible={editUsernameModalVisible}
        title="Edit username"
        centered={true}
        footer={null}
        onCancel={() => setEditUsernameModalVisible(false)}
        afterClose={resetBodyStyle}
      >
        <Spin spinning={isLoading}>
          <Row gutter={[8, 8]} className={styles.editUsernameContainer}>
            <Col xs={24}>
              <Paragraph type="danger">
                Changing this username will refresh the page! Please make sure to save any changes before proceeding or
                you might lose any unsaved changes.
              </Paragraph>
            </Col>
            <Col xs={24}>
              <Form
                form={usernameForm}
                scrollToFirstError={true}
                initialValues={{ username: creatorProfileData?.username ?? '' }}
              >
                <Form.Item>
                  <Row align="middle" gutter={[10, 10]} className={styles.alignUrl} justify="center">
                    <Col flex="0 0 120px">
                      <Form.Item
                        name="username"
                        rules={validationRules.publicUrlValidation}
                        onBlur={handlePublicUrlChange}
                      >
                        <Input placeholder="username" maxLength={30} />
                      </Form.Item>
                    </Col>
                    <Col flex="0 0 70px">
                      <Text>.passion.do</Text>
                    </Col>

                    <Col flex="0 0 120px">
                      {isLoadingUsernameCheck ? (
                        <Spin />
                      ) : (
                        <Text type={isPublicUrlAvailable ? 'success' : 'danger'}>
                          <span
                            className={classNames(styles.dot, isPublicUrlAvailable ? styles.success : styles.danger)}
                          ></span>{' '}
                          {isPublicUrlAvailable ? 'Available' : 'Unavailable'}
                        </Text>
                      )}
                    </Col>
                  </Row>
                </Form.Item>
              </Form>
              <Form.Item>
                <Row gutter={8} justify="center">
                  <Col>
                    <Button disabled={!isPublicUrlAvailable} type="primary" onClick={handleFinishEditUsername}>
                      Update Username
                    </Button>
                  </Col>
                </Row>
              </Form.Item>
            </Col>
          </Row>
        </Spin>
      </Modal>
      <Modal
        visible={addComponentModalVisible}
        title="Select a component to add"
        centered={true}
        footer={null}
        width={420}
        onCancel={() => setAddComponentModalVisible(false)}
        afterClose={resetBodyStyle}
      >
        <Row gutter={[8, 8]}>
          {Object.entries(componentsMap).map(([componentKey, componentOptions]) =>
            componentOptions.optional ? (
              <Col xs={24} sm={12} key={componentKey}>
                <Button
                  block
                  type="text"
                  icon={componentOptions.icon}
                  disabled={getExistingComponentInstance(componentKey)}
                  onClick={() => addComponent(componentKey, componentOptions.defaultProps)}
                >
                  {componentOptions.label}
                </Button>
              </Col>
            ) : null
          )}
        </Row>
      </Modal>

      <Spin spinning={isLoading} size="large">
        <Row gutter={[10, 20]}>
          <Col xs={24} lg={12}>
            {!isOnboarding && (
              <Button
                className={styles.mb20}
                type="default"
                onClick={handleBackToDashboardClicked}
                icon={<ArrowLeftOutlined />}
              >
                Back to Dashboard
              </Button>
            )}
            <div className={styles.profileFormContainer}>
              <Form
                {...newProfileFormLayout}
                form={form}
                onValuesChange={handleFormValuesChange}
                // onFieldsChange={handleFormFieldsChanged}
                scrollToFirstError={true}
                onFinish={handleFormFinish}
              >
                <Row gutter={[12, 12]} align="middle" justify="center">
                  <Col xs={12}>
                    <Title level={4}>My Public Page</Title>
                  </Col>
                  <Col xs={12} className={styles.textAlignRight}>
                    <Button type="primary" className={styles.greenBtn} htmlType="submit" loading={isLoading}>
                      Save {!isOnboarding ? 'and Preview' : ''}
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
                                label="Cover Photo"
                                name="cover_image_url"
                                rules={validationRules.requiredValidation}
                              >
                                <div>
                                  <ImageUpload
                                    name="cover_image_url"
                                    label="Upload Cover Image (size of Facebook Cover Image)"
                                    onChange={handleCoverImageUpload}
                                    value={creatorCoverImageUrl}
                                    className={styles.creatorCoverImage}
                                    overlayHelpText="Click to change image (size of Facebook Cover Image)"
                                  />
                                </div>
                              </Form.Item>
                              <Form.Item
                                label="Your Photo"
                                name="profile_image_url"
                                rules={validationRules.requiredValidation}
                              >
                                <div>
                                  <ImageUpload
                                    aspect={1}
                                    shape="round"
                                    name="profile_image_url"
                                    label="Your profile image"
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
                                className={classNames(styles.bgWhite, styles.textEditorLayout)}
                              >
                                <div>
                                  <TextEditor
                                    form={form}
                                    name={['profile', 'bio']}
                                    placeholder="Your description here"
                                  />
                                </div>
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
                        <Col xs={24}>
                          <Paragraph>
                            Some of the sections below might not show up if you don't have the related products, but
                            will show up once you created them
                          </Paragraph>
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
                        <Col xs={24}>
                          <Button
                            ghost
                            type="primary"
                            block
                            onClick={handleAddProfileComponent}
                            icon={<PlusCircleOutlined />}
                          >
                            Add a section
                          </Button>
                        </Col>
                      </Row>
                    </Col>
                  )}
                </Row>
              </Form>
            </div>
          </Col>
          {creatorProfileData && (
            <>
              <Col xs={24} lg={12}>
                <Row gutter={[10, 10]}>
                  <Col xs={24} lg={12}>
                    <Space className={styles.usernameContainer} align="center">
                      <Text copyable={{ text: generateUrlFromUsername(creatorProfileData?.username) }}>
                        <Text strong>{creatorProfileData?.username}</Text>.passion.do
                      </Text>
                      <Button icon={<EditOutlined />} type="link" onClick={handleEditUsernameClicked} />
                    </Space>
                  </Col>
                  <Col xs={0} lg={12} className={styles.textAlignRight}>
                    {isMobileView ? (
                      <Button type="default" icon={<DesktopOutlined />} onClick={() => setIsMobileView(false)}>
                        Web View
                      </Button>
                    ) : (
                      <Button type="default" icon={<MobileOutlined />} onClick={() => setIsMobileView(true)}>
                        Mobile View
                      </Button>
                    )}
                  </Col>
                  <Col xs={0} lg={24} className={styles.deviceContainer}>
                    {isMobileView ? (
                      <DeviceUIPreview
                        key="desktop-mobile-preview"
                        creatorProfileData={creatorProfileData}
                        isMobilePreview={true}
                      />
                    ) : (
                      <DeviceUIPreview
                        key="desktop-web-preview"
                        creatorProfileData={creatorProfileData}
                        isMobilePreview={false}
                      />
                    )}
                  </Col>
                </Row>
              </Col>
              <Col xs={24} lg={0}>
                <div className={styles.mobileDeviceContainer}>
                  <DeviceUIPreview
                    key="mobile-preview"
                    creatorProfileData={creatorProfileData}
                    isMobilePreview={true}
                  />
                </div>
              </Col>
            </>
          )}
        </Row>
      </Spin>
    </div>
  );
};

export default Onboarding;
