import React, { useState } from 'react';

import { Row, Col, Tabs, Typography, Button } from 'antd';

import CreateCourseModal from 'components/CreateCourseModal';
import { showErrorModal } from 'components/Modals/modals';

import { isAPISuccess } from 'utils/helper';

import styles from './styles.module.scss';
import apis from 'apis';

const { TabPane } = Tabs;
const { Title, Text } = Typography;

const Courses = () => {
  const [courses, setCourses] = useState([]);
  const [selectedListTab, setSelectedListTab] = useState('liveClassCourse');
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [targetCourse, setTargetCourse] = useState(null);

  const fetchAllCoursesForCreator = async () => {
    try {
      const { status, data } = await apis.courses.getCreatorCourses();

      if (isAPISuccess(status) && data) {
        setCourses(data);
      }
    } catch (error) {
      showErrorModal('Failed fetching courses', error?.response?.data?.message || 'Something went wrong');
    }
  };

  const handleChangeListTab = (key) => {
    setSelectedListTab(key);
  };

  const openCreateCourseModal = () => {
    setCreateModalVisible(true);
  };

  const hideCreateCourseModal = (shouldRefresh = false) => {
    console.log(courses);
    setCreateModalVisible(false);
    setTargetCourse(null);

    if (shouldRefresh) {
      fetchAllCoursesForCreator();
    }
  };

  return (
    <div className={styles.box}>
      <CreateCourseModal visible={createModalVisible} closeModal={hideCreateCourseModal} editedCourse={targetCourse} />
      <Row gutter={[8, 8]}>
        <Col xs={10} lg={16} xl={18}>
          <Title level={3}> Courses </Title>
        </Col>
        <Col xs={14} lg={8} xl={6}>
          <Button block size="large" type="primary" onClick={() => openCreateCourseModal()}>
            Create New Course
          </Button>
        </Col>
        <Col xs={24}>
          <Tabs
            size="large"
            defaultActiveKey={selectedListTab}
            activeKey={selectedListTab}
            onChange={handleChangeListTab}
          >
            <TabPane key="liveClassCourse" tab={<Text> Live Class Courses </Text>}></TabPane>
            {/* <TabPane key="videoCourse" tab={<Text> Video Courses </Text>}></TabPane> */}
          </Tabs>
        </Col>
      </Row>
    </div>
  );
};

export default Courses;
