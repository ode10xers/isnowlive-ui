import React, { useState, useEffect } from 'react';

import { Tabs, Typography } from 'antd';

import Loader from 'components/Loader';
import ShowcaseCourseCard from 'components/ShowcaseCourseCard';
import apis from 'apis';
import { isAPISuccess, generateUrlFromUsername } from 'utils/helper';
import { getLiveCoursesFromCourses, getVideoCoursesFromCourses } from 'utils/productsHelper';

import styles from './style.module.scss';

const { Title } = Typography;

const Courses = ({ profileUsername }) => {
  const [liveCourses, setLiveCourses] = useState([]);
  const [videoCourses, setVideoCourses] = useState([]);
  const [isCoursesLoading, setIsCoursesLoading] = useState(true);

  const redirectToCourseDetails = (course) => {
    if (course?.id) {
      const baseUrl = generateUrlFromUsername(profileUsername || course?.username || 'app');
      window.open(`${baseUrl}/c/${course?.id}`);
    }
  };

  useEffect(() => {
    const getCoursesDetails = async () => {
      setIsCoursesLoading(true);
      try {
        const { status, data } = await apis.courses.getCoursesByUsername(profileUsername);

        if (isAPISuccess(status) && data) {
          setLiveCourses(getLiveCoursesFromCourses(data));
          setVideoCourses(getVideoCoursesFromCourses(data));
          setIsCoursesLoading(false);
        }
      } catch (error) {
        setIsCoursesLoading(false);
        console.error('Failed to load courses details');
      }
    };

    getCoursesDetails();
  }, [profileUsername]);

  return (
    <Tabs defaultActiveKey={liveCourses.length > 0 ? 'liveCourses' : videoCourses.length > 0 ? 'videoCourses' : ''}>
      <Tabs.TabPane tab={<Title level={5}> Live Courses </Title>} key="liveCourses">
        <Loader loading={isCoursesLoading} size="large" text="Loading live courses">
          <div className={styles.p10}>
            <ShowcaseCourseCard
              username={profileUsername}
              courses={liveCourses}
              onCardClick={(targetCourse) => redirectToCourseDetails(targetCourse)}
            />
          </div>
        </Loader>
      </Tabs.TabPane>
      <Tabs.TabPane tab={<Title level={5}> Video Courses </Title>} key="videoCourses">
        <Loader loading={isCoursesLoading} size="large" text="Loading video courses">
          <div className={styles.p10}>
            <ShowcaseCourseCard
              username={profileUsername}
              courses={videoCourses}
              onCardClick={(targetCourse) => redirectToCourseDetails(targetCourse)}
            />
          </div>
        </Loader>
      </Tabs.TabPane>
    </Tabs>
  );
};

export default Courses;
