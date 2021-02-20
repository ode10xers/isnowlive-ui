import React, { useState, useEffect, useCallback } from 'react';

import { Row, Col, Tabs, Typography, Button } from 'antd';

import Loader from 'components/Loader';
import CreateCourseModal from 'components/CreateCourseModal';
import { showErrorModal, showSuccessModal } from 'components/Modals/modals';
import LiveCourses from 'pages/CreatorDashboard/Courses/LiveCourses';

import { isAPISuccess } from 'utils/helper';

import styles from './styles.module.scss';
import apis from 'apis';

const { TabPane } = Tabs;
const { Title, Text } = Typography;

const Courses = () => {
  const [isLoading, setIsLoading] = useState([]);
  const [courses, setCourses] = useState([]);
  const [selectedListTab, setSelectedListTab] = useState('liveClassCourse');
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [targetCourse, setTargetCourse] = useState(null);

  const fetchAllCoursesForCreator = useCallback(async () => {
    setIsLoading(true);
    try {
      const { status, data } = await apis.courses.getCreatorCourses();

      if (isAPISuccess(status) && data) {
        setCourses(data);
      }
    } catch (error) {
      showErrorModal('Failed fetching courses', error?.response?.data?.message || 'Something went wrong');
    }
    setIsLoading(false);
  }, []);

  const publishCourse = async (course) => {
    setIsLoading(true);
    try {
      const { status } = await apis.courses.publishCourse(course.id);

      if (isAPISuccess(status)) {
        showSuccessModal('Course Published');
        fetchCourseForCreator();
      }
    } catch (error) {
      showErrorModal('Something wrong happened', error.response?.data?.message || 'Failed to publish course');
    }
    setIsLoading(false);
  };

  const unpublishCourse = async (course) => {
    setIsLoading(true);
    try {
      const { status } = await apis.courses.unpublishCourse(course.id);

      if (isAPISuccess(status)) {
        showSuccessModal('Course Unpublished');
        fetchCourseForCreator();
      }
    } catch (error) {
      showErrorModal('Something wrong happened', error.response?.data?.message || 'Failed to unpublish course');
    }
    setIsLoading(false);
  };

  const fetchCourseForCreator = () => {
    if (selectedListTab === 'liveClassCourse') {
      fetchAllCoursesForCreator();
    }
  };

  useEffect(() => {
    fetchCourseForCreator();
    //eslint-disable-next-line
  }, [selectedListTab]);

  const handleChangeListTab = (key) => {
    setSelectedListTab(key);
  };

  const openCreateCourseModal = () => {
    setCreateModalVisible(true);
  };

  const hideCreateCourseModal = (shouldRefresh = false) => {
    setCreateModalVisible(false);
    setTargetCourse(null);

    if (shouldRefresh) {
      fetchAllCoursesForCreator();
    }
  };

  const openEditCourseModal = (course) => {
    setTargetCourse(course);
    openCreateCourseModal();
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
            <TabPane key="liveClassCourse" tab={<Text> Live Class Courses </Text>}>
              <Loader loading={isLoading} size="large" text="Fetching Live Courses">
                <LiveCourses
                  liveCourses={courses}
                  showEditModal={openEditCourseModal}
                  publishCourse={publishCourse}
                  unpublishCourse={unpublishCourse}
                />
              </Loader>
            </TabPane>
            {/* <TabPane key="videoCourse" tab={<Text> Video Courses </Text>}></TabPane> */}
          </Tabs>
        </Col>
      </Row>
    </div>
  );
};

export default Courses;
