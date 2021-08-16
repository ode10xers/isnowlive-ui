import React, { useState, useCallback, useEffect } from 'react';
import { Spin, Row, Col, Space, Button, Typography } from 'antd';

import apis from 'apis';
import Routes from 'routes';

import CoursesListView from './CoursesListView';
import CoursesEditView from './CoursesEditView';
import DragAndDropHandle from '../DragAndDropHandle';

import { isAPISuccess } from 'utils/helper';

import styles from './style.module.scss';

const { Text } = Typography;

const CoursesProfileComponent = ({
  identifier = null,
  isEditing = false,
  dragHandleProps,
  updateConfigHandler,
  removeComponentHandler,
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
      console.error('Failed to load courses details');
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchCreatorCourses();
  }, [fetchCreatorCourses]);

  const saveEditChanges = (newConfig) => updateConfigHandler(identifier, newConfig);

  return courses.length > 0 || isEditing ? (
    <Row className={styles.p10} align="middle" justify="center" id="sessions">
      {isEditing && (
        <Col xs={1}>
          {' '}
          <DragAndDropHandle {...dragHandleProps} />{' '}
        </Col>
      )}
      <Col xs={isEditing ? 22 : 24}>
        {isEditing ? (
          <Row gutter={[8, 8]} justify="center" align="center">
            <Col className={styles.textAlignCenter}>
              <Space align="center" className={styles.textAlignCenter}>
                <Text> The COurses you have created will show up here </Text>
                <Button
                  type="primary"
                  onClick={() =>
                    window.open(Routes.creatorDashboard.rootPath + Routes.creatorDashboard.courses, '_blank')
                  }
                >
                  Manage my Vidoes
                </Button>
              </Space>
            </Col>
          </Row>
        ) : (
          <Spin spinning={isLoading} tip="Fetching Courses">
            <CoursesListView courses={courses} />
          </Spin>
        )}
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
