import React, { useState, useEffect, useCallback } from 'react';

import { Row, Col, Tabs, Typography, Button } from 'antd';

import Loader from 'components/Loader';
import CreateCourseModal from 'components/CreateCourseModal';
import { showErrorModal, showSuccessModal } from 'components/Modals/modals';
import LiveCourses from 'pages/CreatorDashboard/Courses/LiveCourses';
import VideoCourses from 'pages/CreatorDashboard/Courses/VideoCourses';

import { courseType, isAPISuccess, productType } from 'utils/helper';

import { useGlobalContext } from 'services/globalContext';

import styles from './styles.module.scss';
import apis from 'apis';

const { TabPane } = Tabs;
const { Title, Text } = Typography;

const Courses = () => {
  const { showSendEmailPopup } = useGlobalContext();

  const [isLoading, setIsLoading] = useState([]);
  const [courses, setCourses] = useState([]);
  const [selectedListTab, setSelectedListTab] = useState('liveClassCourse');
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [targetCourse, setTargetCourse] = useState(null);
  const [isVideoModal, setIsVideoModal] = useState(false);
  const [creatorMemberTags, setCreatorMemberTags] = useState([]);

  const fetchCreatorMemberTags = useCallback(async () => {
    setIsLoading(true);
    try {
      const { status, data } = await apis.user.getCreatorUserPreferences();

      if (isAPISuccess(status) && data) {
        setCreatorMemberTags(data.tags);
      }
    } catch (error) {
      showErrorModal('Failed to fetch creator tags', error?.response?.data?.message || 'Something went wrong.');
    }
    setIsLoading(false);
  }, []);

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
        fetchAllCoursesForCreator();
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
        fetchAllCoursesForCreator();
      }
    } catch (error) {
      showErrorModal('Something wrong happened', error.response?.data?.message || 'Failed to unpublish course');
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchCreatorMemberTags();
    fetchAllCoursesForCreator();
  }, [fetchCreatorMemberTags, fetchAllCoursesForCreator]);

  const handleChangeListTab = (key) => {
    setIsLoading(true);
    setSelectedListTab(key);
    setTimeout(() => setIsLoading(false), 700);
  };

  const showSendEmailModal = (course) => {
    let userIdMap = new Map();

    // This mapping is used to make sure the recipients sent to modal is unique
    if (course.buyers && course?.buyers?.length > 0) {
      course.buyers.forEach((buyer) => {
        if (!userIdMap.has(buyer.external_id)) {
          userIdMap.set(buyer.external_id, buyer);
        }
      });
    }

    showSendEmailPopup({
      recipients: {
        active: Array.from(userIdMap, ([key, val]) => val),
        expired: [],
      },
      productId: course?.id || null,
      productType: productType.COURSE,
    });
  };

  const openCreateCourseModal = (type = 'mixed') => {
    setIsVideoModal(type === 'video');
    setCreateModalVisible(true);
  };

  const hideCreateCourseModal = (shouldRefresh = false) => {
    setCreateModalVisible(false);
    setTargetCourse(null);
    setIsVideoModal(false);

    if (shouldRefresh) {
      fetchAllCoursesForCreator();
    }
  };

  const openEditCourseModal = (course) => {
    setTargetCourse(course);
    openCreateCourseModal(course.type === courseType.MIXED ? 'mixed' : 'video');
  };

  return (
    <div className={styles.box}>
      <CreateCourseModal
        visible={createModalVisible}
        closeModal={hideCreateCourseModal}
        editedCourse={targetCourse}
        isVideoModal={isVideoModal}
        creatorMemberTags={creatorMemberTags}
      />
      <Row gutter={[8, 8]}>
        <Col xs={24}>
          <Title level={3}> Courses </Title>
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
                <Row gutter={[8, 8]}>
                  <Col xs={24} md={{ span: 10, offset: 14 }} lg={{ span: 8, offset: 16 }} xl={{ span: 6, offset: 18 }}>
                    <Button block size="large" type="primary" onClick={() => openCreateCourseModal('mixed')}>
                      Create Live Course
                    </Button>
                  </Col>
                  <Col xs={24}>
                    <LiveCourses
                      creatorMemberTags={creatorMemberTags}
                      liveCourses={courses.filter(
                        (course) => course.type === courseType.MIXED || course.type === 'live'
                      )}
                      showEditModal={openEditCourseModal}
                      publishCourse={publishCourse}
                      unpublishCourse={unpublishCourse}
                      showSendEmailModal={showSendEmailModal}
                    />
                  </Col>
                </Row>
              </Loader>
            </TabPane>
            <TabPane key="videoCourse" tab={<Text> Video Courses </Text>}>
              <Loader loading={isLoading} size="large" text="Fetching Video Courses">
                <Row gutter={[8, 8]}>
                  <Col xs={24} md={{ span: 10, offset: 14 }} lg={{ span: 8, offset: 16 }} xl={{ span: 6, offset: 18 }}>
                    <Button block size="large" type="primary" onClick={() => openCreateCourseModal('video')}>
                      Create Video Course
                    </Button>
                  </Col>
                  <Col xs={24}>
                    <VideoCourses
                      creatorMemberTags={creatorMemberTags}
                      videoCourses={courses.filter(
                        (course) => course.type === courseType.VIDEO_SEQ || course.type === courseType.VIDEO_NON_SEQ
                      )}
                      showEditModal={openEditCourseModal}
                      publishCourse={publishCourse}
                      unpublishCourse={unpublishCourse}
                      showSendEmailModal={showSendEmailModal}
                    />
                  </Col>
                </Row>
              </Loader>
            </TabPane>
          </Tabs>
        </Col>
      </Row>
    </div>
  );
};

export default Courses;
