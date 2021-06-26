import React, { useState, useCallback, useEffect } from 'react';
import classNames from 'classnames';
import { Route, Switch, Redirect, useHistory, useRouteMatch } from 'react-router-dom';

import { Spin, Typography, Row, Col, Card, Button, Space } from 'antd';
import {
  VideoCameraTwoTone,
  PlayCircleTwoTone,
  BookTwoTone,
  VideoCameraFilled,
  PlayCircleFilled,
  BookFilled,
} from '@ant-design/icons';

import apis from 'apis';
import Routes from 'routes';

import { isAPISuccess, isInCreatorDashboard } from 'utils/helper';

import SessionListView from '../SessionsProfileComponent/SessionListView';
import VideoListView from '../VideosProfileComponent/VideoListView';
import CoursesListView from '../CoursesProfileComponent/CoursesListView';

import styles from './style.module.scss';
import ProductsEditView from './ProductsEditView';

const { Text } = Typography;

const ContainerTitle = ({ title = '', icon = null }) => (
  <Text style={{ color: '#0050B3' }}>
    {icon}
    {title}
  </Text>
);

const cardHeadingStyle = {
  background: '#F1FBFF',
  boxShadow: 'inset 0px -1px 0px #E6F5FB',
  color: '#0050B3',
  borderRadius: '12px 12px 0 0',
};

const CardContainer = ({ isEditing, productName, route = Routes.creatorDashboard.rootPath, cardHeader, children }) => (
  <Card {...cardHeader} className={styles.profileComponentContainer} bodyStyle={{ padding: 12 }}>
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
  </Card>
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
  isEditing,
  updateConfigHandler,
  removeComponentHandler,
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
        setSessions(data);
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
    const fetchAllProductsData = async () => {
      setIsLoading(true);
      const sessionsPromise = fetchUpcomingSessions();
      const videosPromise = fetchCreatorVideos();
      const coursesPromise = fetchCreatorCourses();
      await Promise.all([sessionsPromise, videosPromise, coursesPromise]);
      setIsLoading(false);
    };
    fetchAllProductsData();
  }, [fetchUpcomingSessions, fetchCreatorVideos, fetchCreatorCourses]);

  const handleMenuClick = (key) => {
    history.push(menuKeyRouteMap[key]);
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'smooth',
    });
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

  const generateCardHeader = (title, icon) => ({
    title: <ContainerTitle title={title} icon={icon} />,
    headStyle: cardHeadingStyle,
  });

  const getComponentTitle = (key) => {
    const targetComponent = innerComponents.find((component) => component.key === key);
    return targetComponent?.title ?? '';
  };

  const sessionsComponent = (
    <CardContainer
      isEditing={isEditing}
      productName="sessions"
      route={Routes.creatorDashboard.rootPath + Routes.creatorDashboard.createSessions}
      cardHeader={generateCardHeader(
        getComponentTitle('SESSIONS'),
        <VideoCameraTwoTone className={styles.mr10} twoToneColor="#0050B3" />
      )}
    >
      <SessionListView sessions={sessions} />
    </CardContainer>
  );

  const videosComponent = (
    <CardContainer
      isEditing={isEditing}
      productName="videos"
      route={Routes.creatorDashboard.rootPath + Routes.creatorDashboard.videos}
      cardHeader={generateCardHeader(
        getComponentTitle('VIDEOS'),
        <PlayCircleTwoTone className={styles.mr10} twoToneColor="#0050B3" />
      )}
    >
      <VideoListView videos={videos} />
    </CardContainer>
  );

  const coursesComponent = (
    <CardContainer
      isEditing={isEditing}
      productName="courses"
      route={Routes.creatorDashboard.rootPath + Routes.creatorDashboard.courses}
      cardHeader={generateCardHeader(
        getComponentTitle('COURSES'),
        <BookTwoTone className={styles.mr10} twoToneColor="#0050B3" />
      )}
    >
      <CoursesListView courses={courses} />
    </CardContainer>
  );

  return (
    <div className={styles.p10}>
      {(sessions.length > 0 || videos.length > 0 || courses.length > 0) && (
        <Row gutter={[12, 12]} justify="center" align="center" className={styles.bottomBarMenu}>
          {sessions.length > 0 && (
            <Col xs={8} onClick={() => handleMenuClick('SESSIONS')}>
              <div
                className={classNames(
                  styles.menuItem,
                  getSelectedKeysForMenu().includes('SESSIONS') ? styles.selectedMenu : undefined
                )}
              >
                <VideoCameraFilled className={styles.mr10} />
                Sessions
              </div>
            </Col>
          )}
          {videos.length > 0 && (
            <Col xs={8} onClick={() => handleMenuClick('VIDEOS')}>
              <div
                className={classNames(
                  styles.menuItem,
                  getSelectedKeysForMenu().includes('VIDEOS') ? styles.selectedMenu : undefined
                )}
              >
                <PlayCircleFilled className={styles.mr10} />
                Videos
              </div>
            </Col>
          )}
          {courses.length > 0 && (
            <Col xs={8} onClick={() => handleMenuClick('COURSES')}>
              <div
                className={classNames(
                  styles.menuItem,
                  getSelectedKeysForMenu().includes('COURSES') ? styles.selectedMenu : undefined
                )}
              >
                <BookFilled className={styles.mr10} />
                Courses
              </div>
            </Col>
          )}
        </Row>
      )}
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
            path={[Routes.videos, Routes.creatorDashboard.rootPath + Routes.creatorDashboard.profileComponents.videos]}
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
              : null}
          </Route>
        </Switch>
      </Spin>
      {isEditing && <ProductsEditView updateHandler={saveEditChanges} configValues={parseConfigValues()} />}
    </div>
  );
};

export default ProductsProfileComponent;
