import React, { useState, useCallback, useEffect } from 'react';
import classNames from 'classnames';
import { Route, Switch, Redirect, useHistory, useRouteMatch } from 'react-router-dom';

import { Spin, Typography, Row, Col, Button, Space } from 'antd';
import {
  VideoCameraOutlined,
  PlayCircleOutlined,
  BookOutlined,
  VideoCameraFilled,
  PlayCircleFilled,
  BookFilled,
} from '@ant-design/icons';

import apis from 'apis';
import Routes from 'routes';
import dummy from 'data/dummy';

import SessionListView from '../SessionsProfileComponent/SessionListView';
import VideoListView from '../VideosProfileComponent/VideoListView';
import CoursesListView from '../CoursesProfileComponent/CoursesListView';
import ProductsEditView from './ProductsEditView';
import DragAndDropHandle from '../DragAndDropHandle';

import { convertHexToRGB, isAPISuccess, isBrightColorShade, isInCreatorDashboard } from 'utils/helper';

import styles from './style.module.scss';
import ContainerCard from 'components/ContainerCard';

const { Text } = Typography;

const ProductCardTemplate = ({
  title = '',
  icon = null,
  isEditing,
  productName,
  route = Routes.creatorDashboard.rootPath,
  children,
}) => (
  <ContainerCard title={title} icon={icon}>
    {isEditing ? (
      <Row justify="center" align="middle">
        <Col className={styles.textAlignCenter}>
          <Space align="center" className={styles.textAlignCenter}>
            <Text> The {productName} you have created will show up here </Text>
            <Button type="primary" onClick={() => window.open(route, '_blank')}>
              Manage my {productName}
            </Button>
          </Space>
        </Col>
      </Row>
    ) : (
      children
    )}
  </ContainerCard>
);

const menuKeyRouteMap = {
  SESSIONS: isInCreatorDashboard()
    ? Routes.creatorDashboard.rootPath + Routes.creatorDashboard.profileComponents.sessions
    : Routes.sessions,
  VIDEOS: isInCreatorDashboard()
    ? Routes.creatorDashboard.rootPath + Routes.creatorDashboard.profileComponents.videos
    : Routes.videos,
  COURSES: isInCreatorDashboard()
    ? Routes.creatorDashboard.rootPath + Routes.creatorDashboard.profileComponents.courses
    : Routes.courses,
};

// NOTE : Remove handler is not used since this component is mandatory
const ProductsProfileComponent = ({
  identifier = null,
  isEditing = false,
  isContained = false,
  isLiveData = true,
  dummyTemplateType = 'YOGA',
  dragHandleProps,
  updateConfigHandler,
  ...customComponentProps
}) => {
  const { values: innerComponents } = customComponentProps;

  const history = useHistory();
  const match = useRouteMatch();

  const [isLoading, setIsLoading] = useState(true);
  const [sessions, setSessions] = useState([]);
  const [videos, setVideos] = useState([]);
  const [courses, setCourses] = useState([]);

  const parseConfigValues = () => {
    let parsedConfig = {};

    innerComponents.forEach((component) => {
      parsedConfig[component.key] = {
        title: component.title,
      };
    });

    return parsedConfig;
  };

  const saveEditChanges = (values) => {
    updateConfigHandler(identifier, {
      title: '',
      values: Object.entries(values).map(([key, data]) => ({ key, value: null, title: data.title })),
    });
  };

  const fetchUpcomingSessions = useCallback(async () => {
    try {
      const { status, data } = await apis.user.getSessionsByUsername('upcoming');

      if (isAPISuccess(status) && data) {
        // setSessions(data);
        const upcomingInventories = data;
        const sessionIds = Array.from(new Set(upcomingInventories.map((inventory) => inventory.session_id)));
        const adjustedSessions = sessionIds
          .map((sessionId) => upcomingInventories.filter((item) => item.session_id === sessionId))
          .map((items) => ({
            beginning: items[0].beginning,
            color_code: items[0].color_code,
            creator_username: items[0].creator_username,
            currency: items[0].currency,
            description: items[0].description,
            document_urls: items[0].document_urls,
            expiry: items[0].expiry,
            group: items[0].group,
            inventory: items.map((item) => ({
              end_time: item.end_time,
              inventory_external_id: item.inventory_external_id,
              inventory_id: item.inventory_id,
              is_published: item.is_published,
              num_participants: item.num_participants,
              offline_event_address: item.offline_event_address,
              participants: item.participants,
              session_date: item.session_date,
              start_time: item.start_time,
              start_url: item.start_url,
            })),
            is_active: items[0].is_active,
            is_course: items[0].is_course,
            is_offline: items[0].is_offline,
            is_refundable: items[0].is_refundable,
            max_participants: items[0].max_participants,
            name: items[0].name,
            offline_event_address: items[0].offline_event_address,
            pay_what_you_want: items[0].pay_what_you_want,
            prerequisites: items[0].prerequisites,
            price: items[0].price,
            recurring: items[0].recurring,
            refund_before_hours: items[0].refund_before_hours,
            session_external_id: items[0].session_external_id,
            session_id: items[0].session_id,
            session_image_url: items[0].session_image_url,
            tags: items[0].tags,
            total_price: items[0].total_price,
            type: items[0].type,
            user_timezone: items[0].user_timezone,
            user_timezone_offset: items[0].user_timezone_offset,
          }));
        setSessions(adjustedSessions);
      }
    } catch (error) {
      console.error('Failed fetching sessions for creator');
      console.error(error);
    }
  }, []);

  const fetchCreatorVideos = useCallback(async () => {
    try {
      const { status, data } = await apis.videos.getVideosByUsername();

      if (isAPISuccess(status) && data) {
        setVideos(data.sort((a, b) => (b.thumbnail_url?.endsWith('.gif') ? 1 : -1)));
      }
    } catch (error) {
      console.error('Failed fetching videos for creator');
      console.error(error);
    }
  }, []);

  const fetchCreatorCourses = useCallback(async () => {
    try {
      const { status, data } = await apis.courses.getCoursesByUsername();

      if (isAPISuccess(status) && data) {
        setCourses(data);
      }
    } catch (error) {
      console.error('Failed to load courses details');
    }
  }, []);

  // TODO: Reimplement when we find a way to simplify the API Call
  // e.g. get count of products, which should be much lighter
  useEffect(() => {
    if (!isLiveData) {
      setSessions(dummy[dummyTemplateType].SESSIONS ?? []);
      setVideos(dummy[dummyTemplateType].VIDEOS ?? []);
      setCourses(dummy[dummyTemplateType].COURSES ?? []);
      setTimeout(() => setIsLoading(false), 800);
    } else {
      const fetchAllProductsData = async () => {
        setIsLoading(true);
        const sessionsPromise = fetchUpcomingSessions();
        const videosPromise = fetchCreatorVideos();
        const coursesPromise = fetchCreatorCourses();
        await Promise.all([sessionsPromise, videosPromise, coursesPromise]);
        setIsLoading(false);
      };
      fetchAllProductsData();
    }
  }, [fetchUpcomingSessions, fetchCreatorVideos, fetchCreatorCourses, isLiveData, dummyTemplateType]);

  if (!isContained) {
    return null;
  }

  const handleMenuClick = (key) => {
    history.push(menuKeyRouteMap[key]);
  };

  const getSelectedKeysForMenu = () => {
    switch (match.path) {
      case Routes.sessions:
      case Routes.creatorDashboard.rootPath + Routes.creatorDashboard.profileComponents.sessions:
        return ['SESSIONS'];
      case Routes.videos:
      case Routes.creatorDashboard.rootPath + Routes.creatorDashboard.profileComponents.videos:
        return ['VIDEOS'];
      case Routes.courses:
      case Routes.creatorDashboard.rootPath + Routes.creatorDashboard.profileComponents.courses:
        return ['COURSES'];
      case Routes.root:
      case Routes.creatorDashboard.rootPath + Routes.creatorDashboard.profile:
        if (sessions.length > 0) {
          return ['SESSIONS'];
        }
        if (videos.length > 0) {
          return ['VIDEOS'];
        }
        if (courses.length > 0) {
          return ['COURSES'];
        }
        return [];
      default:
        return [];
    }
  };

  const getComponentTitle = (key) => {
    const targetComponent = innerComponents.find((component) => component.key === key);
    return targetComponent?.title ?? '';
  };

  const sessionsComponent = (
    <ProductCardTemplate
      isEditing={isEditing}
      productName="sessions"
      route={Routes.creatorDashboard.rootPath + Routes.creatorDashboard.createSessions}
      title={getComponentTitle('SESSIONS')}
      icon={<VideoCameraOutlined className={styles.mr10} />}
    >
      <SessionListView limit={3} sessions={sessions} isContained={true} />
    </ProductCardTemplate>
  );

  const videosComponent = (
    <ProductCardTemplate
      isEditing={isEditing}
      productName="videos"
      route={Routes.creatorDashboard.rootPath + Routes.creatorDashboard.videos}
      title={getComponentTitle('VIDEOS')}
      icon={<PlayCircleOutlined className={styles.mr10} />}
    >
      <VideoListView limit={3} videos={videos} isContained={true} />
    </ProductCardTemplate>
  );

  const coursesComponent = (
    <ProductCardTemplate
      isEditing={isEditing}
      productName="courses"
      route={Routes.creatorDashboard.rootPath + Routes.creatorDashboard.courses}
      title={getComponentTitle('COURSES')}
      icon={<BookOutlined className={styles.mr10} />}
    >
      <CoursesListView limit={3} courses={courses} isContained={true} />
    </ProductCardTemplate>
  );

  return (
    <Row>
      <Col xs={24} className={styles.navigationBarContainer}>
        {(isEditing || sessions.length > 0 || videos.length > 0 || courses.length > 0) && (
          <Row gutter={[12, 12]} justify="center" align="center" className={styles.navigationBarMenu}>
            {(isEditing || sessions.length > 0) && (
              <Col xs={8} onClick={() => handleMenuClick('SESSIONS')}>
                <div
                  className={classNames(
                    styles.menuItem,
                    getSelectedKeysForMenu().includes('SESSIONS') ? styles.selectedMenu : undefined,
                    customComponentProps?.headerColor
                      ? isBrightColorShade(convertHexToRGB(customComponentProps?.headerColor))
                        ? styles.lightBg
                        : undefined
                      : undefined
                  )}
                >
                  <VideoCameraFilled className={styles.mr10} />
                  Sessions
                </div>
              </Col>
            )}
            {(isEditing || videos.length > 0) && (
              <Col xs={8} onClick={() => handleMenuClick('VIDEOS')}>
                <div
                  className={classNames(
                    styles.menuItem,
                    getSelectedKeysForMenu().includes('VIDEOS') ? styles.selectedMenu : undefined,
                    customComponentProps?.headerColor
                      ? isBrightColorShade(convertHexToRGB(customComponentProps?.headerColor))
                        ? styles.lightBg
                        : undefined
                      : undefined
                  )}
                >
                  <PlayCircleFilled className={styles.mr10} />
                  Videos
                </div>
              </Col>
            )}
            {(isEditing || courses.length > 0) && (
              <Col xs={8} onClick={() => handleMenuClick('COURSES')}>
                <div
                  className={classNames(
                    styles.menuItem,
                    getSelectedKeysForMenu().includes('COURSES') ? styles.selectedMenu : undefined,
                    customComponentProps?.headerColor
                      ? isBrightColorShade(convertHexToRGB(customComponentProps?.headerColor))
                        ? styles.lightBg
                        : undefined
                      : undefined
                  )}
                >
                  <BookFilled className={styles.mr10} />
                  Courses
                </div>
              </Col>
            )}
          </Row>
        )}
      </Col>
      <Col xs={24}>
        <Row className={styles.p10} align="middle" justify="center">
          {isEditing && (
            <Col xs={1}>
              <DragAndDropHandle {...dragHandleProps} />
            </Col>
          )}
          <Col xs={isEditing ? 22 : 24}>
            <Spin spinning={isLoading} tip="Fetching data...">
              <Switch>
                <Route
                  exact
                  path={[
                    Routes.sessions,
                    Routes.creatorDashboard.rootPath + Routes.creatorDashboard.profileComponents.sessions,
                  ]}
                >
                  {sessions.length > 0 ? sessionsComponent : isLoading ? null : <Redirect to={Routes.root} />}
                </Route>
                <Route
                  exact
                  path={[
                    Routes.videos,
                    Routes.creatorDashboard.rootPath + Routes.creatorDashboard.profileComponents.videos,
                  ]}
                >
                  {videos.length > 0 ? videosComponent : isLoading ? null : <Redirect to={Routes.root} />}
                </Route>
                <Route
                  exact
                  path={[
                    Routes.courses,
                    Routes.creatorDashboard.rootPath + Routes.creatorDashboard.profileComponents.courses,
                  ]}
                >
                  {courses.length > 0 ? coursesComponent : isLoading ? null : <Redirect to={Routes.root} />}
                </Route>
                {/* Default Path */}
                <Route exact path={[Routes.root, Routes.creatorDashboard.rootPath + Routes.creatorDashboard.profile]}>
                  {sessions.length > 0
                    ? sessionsComponent
                    : videos.length > 0
                    ? videosComponent
                    : courses.length > 0
                    ? coursesComponent
                    : isEditing
                    ? sessionsComponent
                    : null}
                </Route>
              </Switch>
            </Spin>
          </Col>
          {isEditing && (
            <Col xs={1}>
              {' '}
              <ProductsEditView updateHandler={saveEditChanges} configValues={parseConfigValues()} />{' '}
            </Col>
          )}
        </Row>
      </Col>
    </Row>
  );
};

export default ProductsProfileComponent;
