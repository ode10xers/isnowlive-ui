import React, { useState, useCallback, useEffect } from 'react';

import { Route, Switch, useHistory, useRouteMatch } from 'react-router-dom';

import { Spin, Typography, Row, Col, Card, Menu } from 'antd';
import {
  VideoCameraTwoTone,
  PlayCircleTwoTone,
  BookTwoTone,
  PlayCircleOutlined,
  VideoCameraOutlined,
  BookOutlined,
} from '@ant-design/icons';

import apis from 'apis';
import Routes from 'routes';

import { isAPISuccess } from 'utils/helper';

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

const CardContainer = ({ isEditing, placeholderText, cardHeader, children }) => (
  <Card {...cardHeader} className={styles.profileComponentContainer} bodyStyle={{ padding: 12 }}>
    {isEditing ? (
      <Row justify="center" align="middle">
        <Col>{placeholderText || 'Placeholder text to represent the content'}</Col>
      </Row>
    ) : (
      children
    )}
  </Card>
);

const menuKeyRouteMap = {
  SESSIONS: Routes.sessions,
  VIDEOS: Routes.videos,
  COURSES: Routes.courses,
};

const ProductsProfileComponent = ({ identifier = null, isEditing, updateConfigHandler, ...customComponentProps }) => {
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

  const handleMenuClick = (e) => {
    history.push(menuKeyRouteMap[e.key]);
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'smooth',
    });
  };

  const getSelectedKeysForMenu = () => {
    switch (match.path) {
      case Routes.sessions:
        return ['SESSIONS'];
      case Routes.videos:
        return ['VIDEOS'];
      case Routes.courses:
        return ['COURSES'];
      case Routes.root:
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
      placeholderText="Upcoming sessions that are published will be shown here"
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
      placeholderText="Uploaded videos that are published will be shown here"
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
      placeholderText="Courses that you have published will be shown here"
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
      <Spin spinning={isLoading} tip="Fetching data...">
        <Switch>
          {sessions.length > 0 && (
            <Route exact path={Routes.sessions}>
              {sessionsComponent}
            </Route>
          )}
          {videos.length > 0 && (
            <Route exact path={Routes.videos}>
              {videosComponent}
            </Route>
          )}
          {courses.length > 0 && (
            <Route exact path={Routes.courses}>
              {coursesComponent}
            </Route>
          )}
          {/* Default Path */}
          <Route exact path={Routes.root}>
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
      {/* TODO: Handle highlighting */}
      {(sessions.length > 0 || videos.length > 0 || courses.length > 0) && (
        <Menu
          onClick={handleMenuClick}
          mode="horizontal"
          className={styles.bottomBarMenu}
          selectedKeys={getSelectedKeysForMenu()}
        >
          {sessions.length > 0 && (
            <Menu.Item key="SESSIONS" icon={<VideoCameraOutlined />}>
              Sessions
            </Menu.Item>
          )}
          {videos.length > 0 && (
            <Menu.Item key="VIDEOS" icon={<PlayCircleOutlined />}>
              Videos
            </Menu.Item>
          )}
          {courses.length > 0 && (
            <Menu.Item key="COURSES" icon={<BookOutlined />}>
              Courses
            </Menu.Item>
          )}
        </Menu>
      )}
    </div>
  );
};

export default ProductsProfileComponent;
