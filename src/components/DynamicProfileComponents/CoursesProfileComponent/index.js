import React, { useState, useCallback, useEffect } from 'react';
import { Spin, Row, Col, Space, Button, Typography, message } from 'antd';
import { BookOutlined } from '@ant-design/icons';

import apis from 'apis';
import Routes from 'routes';

import CoursesListView from './CoursesListView';
import CoursesEditView from './CoursesEditView';
import DragAndDropHandle from '../DragAndDropHandle';
import DynamicProfileComponentContainer from 'components/DynamicProfileComponentContainer';

import { isAPISuccess } from 'utils/helper';

import styles from './style.module.scss';

const { Text } = Typography;

const CoursesProfileComponent = ({
  identifier = null,
  isEditing = false,
  dragHandleProps,
  updateConfigHandler,
  removeComponentHandler,
  title,
  ...customComponentProps
}) => {
  const [courses, setCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCreatorCourses = useCallback(async () => {
    setIsLoading(true);
    try {
      const { status, data } = await apis.courses.getCoursesByUsername();

      if (isAPISuccess(status) && data) {
        setCourses(data);
      }
    } catch (error) {
      console.error(error);
      message.error('Failed to fetch courses for creator');
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchCreatorCourses();
  }, [fetchCreatorCourses]);

  const saveEditChanges = (newConfig) => updateConfigHandler(identifier, newConfig);

  return courses.length > 0 || isEditing ? (
    <Row className={styles.p10} align="middle" justify="center" id="courses">
      {isEditing && (
        <Col xs={1}>
          {' '}
          <DragAndDropHandle {...dragHandleProps} />{' '}
        </Col>
      )}
      <Col xs={isEditing ? 22 : 24}>
        <DynamicProfileComponentContainer title={title ?? 'VIDEOS'} icon={<BookOutlined className={styles.mr10} />}>
          {isEditing ? (
            <Row gutter={[8, 8]} justify="center" align="center">
              <Col className={styles.textAlignCenter}>
                <Space align="center" className={styles.textAlignCenter}>
                  <Text> The Courses you have created will show up here </Text>
                  <Button
                    type="primary"
                    onClick={() =>
                      window.open(Routes.creatorDashboard.rootPath + Routes.creatorDashboard.courses, '_blank')
                    }
                  >
                    Manage my Courses
                  </Button>
                </Space>
              </Col>
            </Row>
          ) : (
            <Spin spinning={isLoading} tip="Fetching Courses">
              <CoursesListView courses={courses} />
            </Spin>
          )}
        </DynamicProfileComponentContainer>
      </Col>
      {isEditing && (
        <Col xs={1}>
          {' '}
          <CoursesEditView configValues={customComponentProps} updateHandler={saveEditChanges} />{' '}
        </Col>
      )}
    </Row>
  ) : null;
};

export default CoursesProfileComponent;
