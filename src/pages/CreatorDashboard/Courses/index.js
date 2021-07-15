import React, { useState, useEffect, useCallback } from 'react';
import Routes from 'routes';
import { Row, Col, Typography, Button } from 'antd';

import Loader from 'components/Loader';
import { showErrorModal, showSuccessModal } from 'components/Modals/modals';
import LiveCourses from 'pages/CreatorDashboard/Courses/LiveCourses';

import { courseType, isAPISuccess, productType } from 'utils/helper';

import { useGlobalContext } from 'services/globalContext';

import styles from './styles.module.scss';
import apis from 'apis';

const { Title } = Typography;

const Courses = ({ history }) => {
  const { showSendEmailPopup } = useGlobalContext();

  const [isLoading, setIsLoading] = useState([]);
  const [courses, setCourses] = useState([]);
  // const [targetCourse, setTargetCourse] = useState(null);
  // const [isVideoModal, setIsVideoModal] = useState(false);
  const [creatorMemberTags, setCreatorMemberTags] = useState([]);

  const fetchCreatorMemberTags = useCallback(async () => {
    setIsLoading(true);
    try {
      const { status, data } = await apis.user.getCreatorSettings();

      if (isAPISuccess(status) && data) {
        setCreatorMemberTags(data.tags);
      }
    } catch (error) {
      showErrorModal('Failed to fetch creator tags', error?.response?.data?.message || 'Something went wrong.');
    }
    setIsLoading(false);
  }, []);

  const fetchAllCoursesForCreator = useCallback(async () => {
    console.log('came here ');
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
    //setIsVideoModal(type === 'video');
    history.push(Routes.creatorDashboard.rootPath + Routes.creatorDashboard.createCourse);
  };

  const openEditCourseModal = (course) => {
    //setTargetCourse(course);
    history.push(Routes.creatorDashboard.rootPath + Routes.creatorDashboard.updateCourse);
  };

  return (
    <div className={styles.box}>
      <Row gutter={[8, 8]}>
        <Col xs={24}>
          <Title level={3}> Courses </Title>
        </Col>
        <Col xs={24}>
          <Loader loading={isLoading} size="large" text="Fetching Courses">
            <Row gutter={[8, 8]}>
              <Col xs={24} md={{ span: 10, offset: 14 }} lg={{ span: 8, offset: 16 }} xl={{ span: 6, offset: 18 }}>
                <Button block size="large" type="primary" onClick={() => openCreateCourseModal('mixed')}>
                  Create Live Course
                </Button>
              </Col>
              <Col xs={24}>
                <LiveCourses
                  creatorMemberTags={creatorMemberTags}
                  liveCourses={courses.filter((course) => course.type === courseType.MIXED || course.type === 'live')}
                  showEditModal={openEditCourseModal}
                  publishCourse={publishCourse}
                  unpublishCourse={unpublishCourse}
                  showSendEmailModal={showSendEmailModal}
                />
              </Col>
            </Row>
          </Loader>
        </Col>
      </Row>
    </div>
  );
};

export default Courses;
