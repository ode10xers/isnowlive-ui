import React, { useCallback, useEffect, useState } from 'react';

import { Row, Col, Button, Spin, Typography, Radio } from 'antd';

import apis from 'apis';

import DetailsDrawer from 'components/DynamicProfileComponents/DetailsDrawer';
import CoursesListItem from '../CoursesListItem';

import { isAPISuccess, preventDefaults } from 'utils/helper';
import { getLiveCoursesFromCourses, getVideoCoursesFromCourses } from 'utils/productsHelper';

import styles from './style.module.scss';

const { Title } = Typography;

const CoursesListView = ({ limit = 4 }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [videoCourses, setVideoCourses] = useState([]);
  const [liveCourses, setLiveCourses] = useState([]);
  const [selectedView, setSelectedView] = useState('live');
  const [detailsDrawerVisible, setDetailsDrawerVisible] = useState(false);

  const fetchCreatorCourses = useCallback(async () => {
    setIsLoading(true);

    try {
      const { status, data } = await apis.courses.getCoursesByUsername();

      if (isAPISuccess(status) && data) {
        const liveCourseData = getLiveCoursesFromCourses(data);
        const videoCourseData = getVideoCoursesFromCourses(data);
        setLiveCourses(liveCourseData);
        setVideoCourses(videoCourseData);

        if (liveCourseData && liveCourseData?.length > 0) {
          setSelectedView('live');
        } else if (videoCourseData && videoCourseData?.length > 0) {
          setSelectedView('video');
        }
      }
    } catch (error) {
      console.error('Failed to load courses details');
    }

    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchCreatorCourses();
  }, [fetchCreatorCourses]);

  const showMoreCourses = (e) => {
    preventDefaults(e);
    setDetailsDrawerVisible(true);
  };

  const handleDrawerClose = (e) => {
    preventDefaults(e);
    setDetailsDrawerVisible(false);
  };

  const handleCourseViewChanged = (e) => {
    setSelectedView(e.target.value);
  };

  const renderCourseCards = (course) => {
    return (
      <Col xs={24} sm={12} key={course.id}>
        <CoursesListItem course={course} />
      </Col>
    );
  };

  const renderCourseList = (courses, renderShowMoreButton = false) => {
    return courses?.length > 0 ? (
      <Row gutter={[16, 16]}>
        {courses?.slice(0, limit).map(renderCourseCards)}
        {renderShowMoreButton && courses?.length > limit && (
          <Col xs={24}>
            <Row justify="center">
              <Col>
                <Button className={styles.moreButton} type="primary" size="large" onClick={showMoreCourses}>
                  MORE
                </Button>
              </Col>
            </Row>
          </Col>
        )}
      </Row>
    ) : null;
  };

  return (
    <div>
      <Spin spinning={isLoading} tip="Fetching courses">
        {(liveCourses?.length > 0 || videoCourses?.length > 0) && (
          <Row gutter={[8, 16]}>
            <Col xs={24}>
              <Row justify="center">
                <Col>
                  <Radio.Group value={selectedView} buttonStyle="solid" onChange={handleCourseViewChanged}>
                    <Radio.Button value="live" disabled={liveCourses.length === 0}>
                      {' '}
                      Live Courses{' '}
                    </Radio.Button>
                    <Radio.Button value="video" disabled={videoCourses.length === 0}>
                      {' '}
                      Video Courses{' '}
                    </Radio.Button>
                  </Radio.Group>
                </Col>
              </Row>
            </Col>
            <Col xs={24}>{renderCourseList(selectedView === 'live' ? liveCourses : videoCourses, true)}</Col>
          </Row>
        )}
      </Spin>
      <DetailsDrawer
        visible={detailsDrawerVisible}
        onClose={handleDrawerClose}
        title={<Title level={4}> More Courses </Title>}
      >
        {renderCourseList(selectedView === 'live' ? liveCourses : videoCourses, true)}
      </DetailsDrawer>
    </div>
  );
};

export default CoursesListView;
