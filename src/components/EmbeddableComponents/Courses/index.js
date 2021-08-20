import React from 'react';

import CourseDetailedListView from 'pages/DetailedListView/Courses';

import styles from './style.module.scss';

const Courses = () => {
  return (
    <div className={styles.coursePluginContainer}>
      <div className={styles.courseListContainer}>
        <CourseDetailedListView />
      </div>
    </div>
  );
};

export default Courses;
