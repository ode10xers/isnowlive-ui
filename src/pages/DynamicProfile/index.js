import React, { useState, useCallback, useEffect, lazy, Suspense } from 'react';
// import classNames from 'classnames';
import { useHistory, useRouteMatch } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { message, Spin, Row, Col, Button, Space, Modal, Typography } from 'antd';
import {
  ArrowLeftOutlined,
  BookOutlined,
  // CheckOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  EditOutlined,
  GiftOutlined,
  GlobalOutlined,
  LikeOutlined,
  LinkOutlined,
  PlayCircleOutlined,
  PlusCircleOutlined,
  ProfileOutlined,
  RetweetOutlined,
  SaveOutlined,
  ScheduleOutlined,
  VideoCameraOutlined,
  YoutubeOutlined,
  OrderedListOutlined,
} from '@ant-design/icons';

import apis from 'apis';
import Routes from 'routes';

import { resetBodyStyle, showErrorModal, showSuccessModal } from 'components/Modals/modals';
import CreatorProfileComponent from 'components/DynamicProfileComponents/CreatorProfileComponent';

import {
  deepCloneObject,
  isAPISuccess,
  preventDefaults,
  isInCreatorDashboard,
  generateUrlFromUsername,
} from 'utils/helper';
import { getLocalUserDetails } from 'utils/storage';
import { convertHSLToHex, generateColorPalletteForProfile, getNewProfileUIMaxWidth } from 'utils/colors';

import styles from './style.module.scss';

const AvailabilityProfileComponent = lazy(() =>
  import('components/DynamicProfileComponents/AvailabilityProfileComponent')
);
const PassesProfileComponent = lazy(() => import('components/DynamicProfileComponents/PassesProfileComponent'));
const SessionsProfileComponent = lazy(() => import('components/DynamicProfileComponents/SessionsProfileComponent'));
const VideosProfileComponent = lazy(() => import('components/DynamicProfileComponents/VideosProfileComponent'));
const CoursesProfileComponent = lazy(() => import('components/DynamicProfileComponents/CoursesProfileComponent'));

const SubscriptionProfileComponent = lazy(() =>
  import('components/DynamicProfileComponents/SubscriptionsProfileComponent')
);
const OtherLinksProfileComponent = lazy(() => import('components/DynamicProfileComponents/OtherLinksProfileComponent'));
// const CreatorProfileComponent = lazy(() => import('components/DynamicProfileComponents/CreatorProfileComponent'));
const ProductsProfileComponent = lazy(() => import('components/DynamicProfileComponents/ProductsProfileComponent'));
const YoutubeEmbedProfileComponent = lazy(() =>
  import('components/DynamicProfileComponents/YoutubeEmbedProfileComponent')
);
const DescriptionProfileComponent = lazy(() =>
  import('components/DynamicProfileComponents/DescriptionProfileComponent')
);
const TextListProfileComponent = lazy(() => import('components/DynamicProfileComponents/TextListProfileComponent'));

const PassionLogo = require('assets/images/passion-orange-logo.png');

const { Paragraph } = Typography;

/*
  Sample Data for future reference of components

  OTHER LINKS
  {
    "title": "Reference Links",
    "links": [
        {
            "title": "What a link!",
            "url": "https://bitbucket.org",
            "textColor": "#ffffff",
            "backgroundColor": "#1890ff"
        }
    ]
  }

  DONATIONS
  {
  "key": "DONATIONS",
  "title": "Buy me a coffee!",
  "values": [
    5,
    10,
    15,
    20
  ]
},
*/

const componentUIType = {
  CONTAINED: 'CONTAINED', // Will only show when UI style is contained (is_contained = true)
  OPEN: 'OPEN', // Will only show when UI style is open (is_contained = false)
  FLEXIBLE: 'FLEXIBLE', // Can show in both
};

const componentsMap = {
  AVAILABILITY: {
    icon: <ClockCircleOutlined />,
    component: AvailabilityProfileComponent,
    label: 'Availability',
    type: componentUIType.FLEXIBLE,
    optional: false,
    elementId: 'availability',
    defaultProps: {
      title: 'AVAILABILITY',
      values: null,
    },
  },
  PRODUCTS: {
    icon: <GiftOutlined />,
    component: ProductsProfileComponent,
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
    component: SessionsProfileComponent,
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
    component: CoursesProfileComponent,
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
    component: VideosProfileComponent,
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
    component: PassesProfileComponent,
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
    component: SubscriptionProfileComponent,
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
    component: OtherLinksProfileComponent,
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
    component: YoutubeEmbedProfileComponent,
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
    component: DescriptionProfileComponent,
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
    component: TextListProfileComponent,
    defaultProps: {
      title: 'List Items',
      values: null,
    },
  },
};

// const colorPalletteChoices = ['#ff0a54', '#ff700a', '#ffc60a', '#0affb6', '#0ab6ff', '#b10aff', '#40A9FF'];

// TODO: Most of the edit functionality in this page will be moved to the new onboarding page
// Remove code as necessary
const DynamicProfile = ({ creatorUsername = null, overrideUserObject = null }) => {
  const history = useHistory();
  const match = useRouteMatch();

  const [isLoading, setIsLoading] = useState(overrideUserObject ? false : true);
  const [creatorProfileData, setCreatorProfileData] = useState(null);
  const [editingMode, setEditingMode] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [addComponentModalVisible, setAddComponentModalVisible] = useState(false);
  const [creatorUIConfig, setCreatorUIConfig] = useState([]);
  const [tempCreatorUIConfig, setTempCreatorUIConfig] = useState([]);
  const [uiConfigChanged, setUiConfigChanged] = useState(false);

  const [creatorColorChoice, setCreatorColorChoice] = useState(null);
  const [containedUI, setContainedUI] = useState(true);

  const fetchCreatorProfileData = useCallback(async (username) => {
    if (!username) {
      return;
    }

    setIsLoading(true);
    try {
      const { status, data } = username ? await apis.user.getProfileByUsername(username) : await apis.user.getProfile();

      if (isAPISuccess(status) && data) {
        setCreatorProfileData(data);
        setContainedUI(!data.profile?.new_profile);

        if (data.profile?.color) {
          setCreatorColorChoice(data.profile?.color);
        } else {
          setCreatorColorChoice(null);
        }
      }
    } catch (error) {
      message.error('Failed to load creator profile details');
      console.error(error);
    }
    setIsLoading(false);
  }, []);

  const scrollToComponent = useCallback(
    (urlPath) => {
      const scrollToElement = (elementId) => {
        const targetElement = document.getElementById(elementId);
        console.log(targetElement);
        if (targetElement) {
          targetElement.scrollIntoView({ block: 'center', inline: 'nearest' });
          // window.scrollBy(0, -70);
        }
      };

      // NOTE : These IDs need to be the same as the id that is set in each DynamicProfileComponent
      switch (urlPath) {
        case Routes.subscriptions:
          scrollToElement('memberships');
          break;
        case Routes.passes:
          scrollToElement('passes');
          break;
        case Routes.sessions:
          scrollToElement(containedUI ? 'products' : 'sessions');
          break;
        case Routes.courses:
          scrollToElement(containedUI ? 'products' : 'courses');
          break;
        case Routes.videos:
          scrollToElement(containedUI ? 'products' : 'videos');
          break;
        default:
          window.scrollTo(0, 0);
          break;
      }
    },
    [containedUI]
  );

  //#region Start of Use Effects

  useEffect(() => {
    if (overrideUserObject) {
      setCreatorProfileData(overrideUserObject);
      // setContainedUI(!overrideUserObject?.profile?.new_profile);
      setContainedUI(false);
      setCreatorColorChoice(overrideUserObject?.profile?.color);
    } else {
      if (!creatorUsername) {
        fetchCreatorProfileData(getLocalUserDetails()?.username ?? '');
      } else {
        fetchCreatorProfileData(creatorUsername);
      }
    }
  }, [fetchCreatorProfileData, creatorUsername, overrideUserObject]);

  useEffect(() => {
    setCreatorUIConfig(creatorProfileData?.profile?.sections ?? []);
  }, [creatorProfileData]);

  // Use Effect to handle page coloring
  useEffect(() => {
    let profileStyleObject = {};
    if (!containedUI) {
      profileStyleObject = { ...profileStyleObject, ...getNewProfileUIMaxWidth() };
    }

    if (creatorColorChoice) {
      profileStyleObject = {
        ...profileStyleObject,
        ...generateColorPalletteForProfile(creatorColorChoice, !containedUI),
      };
    }

    Object.entries(profileStyleObject).forEach(([key, val]) => {
      if (overrideUserObject) {
        for (let idx = 0; idx <= window.frames.length; idx++) {
          try {
            window.frames[idx].document.documentElement.style.setProperty(key, val);
          } catch (error) {
            console.log('Silently passing error');
          }
        }
      } else {
        window.document.documentElement.style.setProperty(key, val);
      }
    });

    return () => {
      if (profileStyleObject) {
        Object.keys(profileStyleObject).forEach((key) => {
          if (overrideUserObject) {
            for (let idx = 0; idx <= window.frames.length; idx++) {
              try {
                window.frames[idx].document.documentElement.style.removeProperty(key);
              } catch (error) {
                console.log('Silently passing error');
              }
            }
          } else {
            window.document.documentElement.style.removeProperty(key);
          }
        });
      }
    };
  }, [creatorColorChoice, containedUI, overrideUserObject]);

  useEffect(() => {
    scrollToComponent(match.path);
  }, [match.path, scrollToComponent]);

  //#endregion End of Use Effects

  //#region Start Of Page Edit Button Handlers

  // const saveCreatorColorPalletteChoice = async (e) => {
  //   preventDefaults(e);

  //   setIsLoading(true);

  //   try {
  //     const payload = {
  //       cover_image_url: creatorProfileData?.cover_image_url,
  //       profile_image_url: creatorProfileData?.profile_image_url,
  //       first_name: creatorProfileData?.first_name,
  //       last_name: creatorProfileData?.last_name,
  //       username: creatorProfileData?.username,
  //       profile: {
  //         color: creatorColorChoice,
  //         new_profile: !containedUI,
  //       },
  //     };

  //     const { status, data } = await apis.user.updateProfile(payload);

  //     if (isAPISuccess(status) && data) {
  //       setContainedUI(!data?.profile?.new_profile);
  //       message.success('Creator profile color successfully updated');
  //     }
  //   } catch (error) {
  //     showErrorModal(
  //       'Failed updating Creator Profile UI Colors',
  //       error?.response?.data?.message || 'Something went wrong.'
  //     );
  //   }

  //   setIsLoading(false);
  // };

  const getExistingComponentInstance = (identifier) =>
    tempCreatorUIConfig.find((component) => component.key === identifier);

  const addComponent = (identifier = null, props) => {
    if (!identifier) {
      showErrorModal('Invalid component identifier!');
      return;
    }

    const existingComponentInstance = getExistingComponentInstance(identifier);

    if (existingComponentInstance) {
      showErrorModal('Duplicate of this component already exists!');
      return;
    }

    const currentComponentsList = deepCloneObject(tempCreatorUIConfig) || [];
    currentComponentsList.push({
      key: identifier,
      ...props,
    });

    setTempCreatorUIConfig(currentComponentsList);
    setUiConfigChanged(false);
    setAddComponentModalVisible(false);
    showSuccessModal('Component added', `Make sure to save so you don't lose the changes`);
  };

  const disableEditingMode = () => {
    setTempCreatorUIConfig([]);
    setEditingMode(false);
    setPreviewMode(false);
  };

  const handleEditDynamicProfileButtonClicked = (e) => {
    preventDefaults(e);

    window.open(`${generateUrlFromUsername(creatorProfileData?.username)}${Routes.profileEdit}`, '_self');

    // setTempCreatorUIConfig(deepCloneObject(creatorUIConfig));
    // setEditingMode(true);
    // setPreviewMode(false);
    // setUiConfigChanged(false);
  };

  const handleSaveDynamicProfileButtonClicked = async (e) => {
    preventDefaults(e);

    const newCreatorUIConfig = deepCloneObject(tempCreatorUIConfig);

    try {
      // NOTE: the API requires some fields, so we'll just pre-fill
      // with existing data
      const payload = {
        cover_image_url: creatorProfileData?.cover_image_url,
        profile_image_url: creatorProfileData?.profile_image_url,
        first_name: creatorProfileData?.first_name,
        last_name: creatorProfileData?.last_name,
        username: creatorProfileData?.username,
        profile: {
          sections: newCreatorUIConfig,
          new_profile: !containedUI,
        },
      };

      const { status, data } = await apis.user.updateProfile(payload);

      if (isAPISuccess(status) && data) {
        setCreatorUIConfig(newCreatorUIConfig);
        setCreatorProfileData(data);
        setContainedUI(!data?.profile?.new_profile);
        setUiConfigChanged(false);
        message.success('Profile changes saved!');
        disableEditingMode();
      }
    } catch (error) {
      showErrorModal('Failed updating Creator Profile UI', error?.response?.data?.message || 'Something went wrong.');
    }
  };

  const handleCancelDynamicProfileButtonClicked = (e) => {
    preventDefaults(e);

    if (uiConfigChanged) {
      Modal.confirm({
        mask: true,
        maskClosable: false,
        centered: true,
        width: 420,
        title: 'Unsaved changes detected',
        content: (
          <Paragraph>
            Are you sure you want to close editing mode? You have made changes that will not be saved if you close now.
          </Paragraph>
        ),
        onOk: () => {
          setContainedUI(!creatorProfileData?.profile?.new_profile);
          disableEditingMode();
        },
        okText: 'Close without saving',
        okButtonProps: {
          type: 'primary',
          danger: true,
        },
        cancelText: 'Cancel',
        cancelButtonProps: {
          type: 'default',
        },
        afterClose: resetBodyStyle,
      });
    } else {
      setContainedUI(!creatorProfileData?.profile?.new_profile);
      disableEditingMode();
    }
  };

  const handleAddComponentDynamicProfileButtonClicked = (e) => {
    preventDefaults(e);
    setAddComponentModalVisible(true);
  };

  //#endregion End of Page Edit Button Handlers

  //#region Start of Dashboard Button Handlers

  const handleNavigateToDashboard = (e) => {
    preventDefaults(e);

    const navigateToDashboard = () => {
      disableEditingMode();
      history.push(Routes.creatorDashboard.rootPath);
    };

    if (uiConfigChanged) {
      Modal.confirm({
        mask: true,
        maskClosable: false,
        centered: true,
        width: 420,
        title: 'Unsaved changes detected',
        content: (
          <Paragraph>
            Are you sure you want to leave? You have made changes that will not be saved if you close now.
          </Paragraph>
        ),
        onOk: navigateToDashboard,
        okText: 'Close without saving',
        okButtonProps: {
          type: 'primary',
          danger: true,
        },
        cancelText: 'Cancel',
        cancelButtonProps: {
          type: 'default',
        },
        afterClose: resetBodyStyle,
      });
    } else {
      navigateToDashboard();
    }
  };

  const handleNavigateToPublicPage = (e) => {
    preventDefaults(e);

    const openPublicPage = () => {
      disableEditingMode();
      window.open(generateUrlFromUsername(creatorProfileData?.username ?? 'app'));
    };

    if (uiConfigChanged) {
      Modal.confirm({
        mask: true,
        maskClosable: false,
        centered: true,
        width: 420,
        title: 'Unsaved changes detected',
        content: (
          <Paragraph>
            Are you sure you want to leave? You have made changes that will not be saved if you close now.
          </Paragraph>
        ),
        onOk: openPublicPage,
        okText: 'Close without saving',
        okButtonProps: {
          type: 'primary',
          danger: true,
        },
        cancelText: 'Cancel',
        cancelButtonProps: {
          type: 'default',
        },
        afterClose: resetBodyStyle,
      });
    } else {
      openPublicPage();
    }
  };

  const handleChangeUIStyleClicked = (e) => {
    preventDefaults(e);
    setContainedUI(!containedUI);
    message.success('UI style changed! Click on Save Changes to keep this change');
  };

  const handlePassionBrandingClicked = (e) => {
    preventDefaults(e);
    const targetUrl =
      window.location.hostname.includes('stage') || window.location.hostname.includes('localhost')
        ? 'https://passion-do.webflow.io'
        : 'https://passion.do';

    window.open(`${targetUrl}?creator-ref=${creatorProfileData.username}`, '_blank');
  };

  //#endregion End of Dashboard Button Handlers

  //#region Start Of Component Edit View Handlers

  const updateComponentConfig = (identifier = null, newConfig = null) => {
    if (!identifier) {
      showErrorModal('Invalid identifier passed');
      return;
    }

    if (!newConfig) {
      showErrorModal('Invalid configuration passed');
      return;
    }

    // Updates the temp config first, will be removed if user cancels
    const tempConfigComponents = deepCloneObject(tempCreatorUIConfig);
    const targetIndex = tempConfigComponents.findIndex((component) => component.key === identifier);
    const targetComponent = tempConfigComponents.find((component) => component.key === identifier);

    if (!targetComponent || targetIndex === -1) {
      showErrorModal(`Component with identifier ${identifier} not found!`);
      return;
    }

    targetComponent.title = newConfig.title;
    targetComponent.values = newConfig.values ?? null;
    tempConfigComponents.splice(targetIndex, 1, targetComponent);
    setTempCreatorUIConfig(tempConfigComponents);
    setUiConfigChanged(true);
  };

  const removeComponent = (identifier = null) => {
    if (!identifier) {
      showErrorModal('Invalid identifier passed');
      return;
    }

    if (!componentsMap[identifier].optional) {
      showErrorModal('Component is not optional, cannot be removed!');
      return;
    }

    const tempConfigComponents = deepCloneObject(tempCreatorUIConfig);
    const targetIndex = tempConfigComponents.findIndex((component) => component.key === identifier);

    if (targetIndex === -1) {
      showErrorModal(`Component with identifier ${identifier} not found!`);
      return;
    }

    tempConfigComponents.splice(targetIndex, 1);
    setTempCreatorUIConfig(tempConfigComponents);
  };

  //#endregion End Of Component Edit View Handlers

  //#region Start Of Drag and Drop Handlers

  const handleDragEnd = (result) => {
    const { destination, source, draggableId } = result;

    const componentsList = deepCloneObject(tempCreatorUIConfig);
    const targetComponent = componentsList.find((component) => component.key === draggableId);

    if (targetComponent && destination && destination.index !== source.index) {
      componentsList.splice(source.index, 1);
      componentsList.splice(destination.index, 0, targetComponent);

      setUiConfigChanged(true);
      setTempCreatorUIConfig(componentsList);
    }
  };

  const renderDraggableCustomComponents = (component, idx) => {
    // if (component.key === 'DONATIONS') {
    //   return null;
    // }

    const targetComponent = componentsMap[component.key];

    if (!targetComponent) {
      return null;
    }

    const RenderedComponent = targetComponent?.component ?? null;

    if (!RenderedComponent) {
      return null;
    }

    if (
      (containedUI && targetComponent.type === componentUIType.OPEN) ||
      (!containedUI && targetComponent.type === componentUIType.CONTAINED)
    ) {
      return null;
    }

    // NOTE : We are passing the color here to programatically add styling
    // to more buttons and nav bars, so we know if we need a light text (for dark BG)
    // or dark text (for light BG)
    return (
      <Draggable
        isDragDisabled={!editingMode || previewMode}
        draggableId={component.key}
        index={idx}
        key={component.key}
      >
        {(provided) => (
          <Col
            xs={24}
            {...provided.draggableProps}
            ref={provided.innerRef}
            id={targetComponent.elementId ?? component.key}
            style={{ padding: 0 }}
          >
            <Suspense fallback={<Spin spinning={true} tip="Loading..." />}>
              <RenderedComponent
                identifier={component.key}
                isEditing={editingMode && !previewMode}
                updateConfigHandler={updateComponentConfig}
                removeComponentHandler={removeComponent}
                dragHandleProps={provided.dragHandleProps}
                isContained={containedUI}
                title={component.title}
                values={component.values}
                isLiveData={creatorProfileData?.profile?.live_mode ?? true}
                dummyTemplateType={creatorProfileData?.profile?.category || 'YOGA'}
                headerColor={
                  creatorColorChoice
                    ? convertHSLToHex(
                        generateColorPalletteForProfile(creatorColorChoice)['--passion-profile-primary-color']
                      )
                    : null
                }
              />
            </Suspense>
          </Col>
        )}
      </Draggable>
    );
  };

  //#endregion End Of Drag and Drop Handlers

  return (
    <>
      {isInCreatorDashboard() && (
        <Row className={styles.mb30} align="center">
          <Col xs={24}>
            <Space size="large" className={styles.p10}>
              <Button icon={<ArrowLeftOutlined />} onClick={handleNavigateToDashboard}>
                Dashboard
              </Button>
              {editingMode ? (
                <>
                  <Button
                    type="primary"
                    className={styles.blueBtn}
                    icon={<PlusCircleOutlined />}
                    onClick={handleAddComponentDynamicProfileButtonClicked}
                  >
                    Add Component
                  </Button>
                  <Button
                    className={styles.orangeBtn}
                    type="primary"
                    icon={<RetweetOutlined />}
                    onClick={handleChangeUIStyleClicked}
                  >
                    Change UI Style
                  </Button>
                  <Button
                    type="primary"
                    className={styles.greenBtn}
                    icon={<SaveOutlined />}
                    onClick={handleSaveDynamicProfileButtonClicked}
                  >
                    Save Changes
                  </Button>
                  <Button
                    type="primary"
                    danger
                    icon={<CloseCircleOutlined />}
                    onClick={handleCancelDynamicProfileButtonClicked}
                  >
                    Cancel
                  </Button>
                </>
              ) : (
                <>
                  <Button type="primary" icon={<EditOutlined />} onClick={handleEditDynamicProfileButtonClicked}>
                    Edit
                  </Button>
                  <Button ghost type="primary" icon={<GlobalOutlined />} onClick={handleNavigateToPublicPage}>
                    My Website
                  </Button>
                </>
              )}
            </Space>
          </Col>
          {/* <Col xs={24}>
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
              <Button
                type="primary"
                icon={<CheckOutlined />}
                onClick={saveCreatorColorPalletteChoice}
                loading={isLoading}
              >
                Apply Color
              </Button>
            </Space>
          </Col> */}
        </Row>
      )}
      <div className={styles.creatorProfilePage}>
        <Spin spinning={isLoading} size="large" tip="Fetching creator details...">
          <Row gutter={8} justify="center">
            <Col xs={24}>
              <CreatorProfileComponent
                creatorProfile={creatorProfileData}
                isEditing={editingMode && !previewMode}
                isContained={containedUI}
                refetchCreatorProfileData={() =>
                  fetchCreatorProfileData(creatorUsername ?? getLocalUserDetails()?.username ?? '')
                }
              />
            </Col>
            <Col xs={24} className={styles.mb10}>
              <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable
                  isDropDisabled={!editingMode || previewMode}
                  droppableId={creatorProfileData?.external_id || 'creator-profile-column'}
                >
                  {(provided) => (
                    <Row gutter={[8, 4]} justify="center" {...provided.droppableProps} ref={provided.innerRef}>
                      {editingMode
                        ? tempCreatorUIConfig?.map(renderDraggableCustomComponents)
                        : creatorUIConfig.map(renderDraggableCustomComponents)}
                      {provided.placeholder}
                    </Row>
                  )}
                </Droppable>
              </DragDropContext>
            </Col>
            <Col xs={24} className={styles.textAlignCenter}>
              <div className={styles.passionBranding} onClick={handlePassionBrandingClicked}>
                Build your site with
                <span className={styles.passionLogoContainer}>
                  <img src={PassionLogo} alt="Passion.do" className={styles.passionLogo} />
                </span>
              </div>
            </Col>
          </Row>
        </Spin>
      </div>
      {editingMode && (
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
      )}
    </>
  );
};

export default DynamicProfile;
