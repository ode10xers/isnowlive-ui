import React from 'react';

// import {  Typography } from 'antd';

// import apis from 'apis';

// import Loader from 'components/Loader';
// import ShowcaseCourseCard from 'components/ShowcaseCourseCard';

// import { isAPISuccess } from 'utils/helper';
// import { getLiveCoursesFromCourses, getVideoCoursesFromCourses } from 'utils/productsHelper';

import CourseDetailedListView from 'pages/DetailedListView/Courses';

import styles from './style.module.scss';

// const { Title } = Typography;

const Courses = () => {
  // const [liveCourses, setLiveCourses] = useState([]);
  // const [videoCourses, setVideoCourses] = useState([]);
  // const [isCoursesLoading, setIsCoursesLoading] = useState(true);

  // useEffect(() => {
  //   const getCoursesDetails = async () => {
  //     setIsCoursesLoading(true);
  //     try {
  //       const { status, data } = await apis.courses.getCoursesByUsername();

  //       if (isAPISuccess(status) && data) {
  //         setLiveCourses(getLiveCoursesFromCourses(data));
  //         setVideoCourses(getVideoCoursesFromCourses(data));
  //         setIsCoursesLoading(false);
  //       }
  //     } catch (error) {
  //       setIsCoursesLoading(false);
  //       console.error('Failed to load courses details');
  //     }
  //   };

  //   getCoursesDetails();
  // }, []);

  return (
    <div className={styles.coursePluginContainer}>
      {/* <Tabs defaultActiveKey={liveCourses.length > 0 ? 'liveCourses' : videoCourses.length > 0 ? 'videoCourses' : ''}>
        <Tabs.TabPane tab={<Title level={5}> Live Courses </Title>} key="liveCourses">
          <Loader loading={isCoursesLoading} size="large" text="Loading live courses">
            <div className={styles.p10}>
              <ShowcaseCourseCard courses={liveCourses} />
            </div>
          </Loader>
        </Tabs.TabPane>
        <Tabs.TabPane tab={<Title level={5}> Video Courses </Title>} key="videoCourses">
          <Loader loading={isCoursesLoading} size="large" text="Loading video courses">
            <div className={styles.p10}>
              <ShowcaseCourseCard courses={videoCourses} />
            </div>
          </Loader>
        </Tabs.TabPane>
      </Tabs> */}
      <div className={styles.courseListContainer}>
        <CourseDetailedListView />
      </div>
    </div>
  );
};

export default Courses;
