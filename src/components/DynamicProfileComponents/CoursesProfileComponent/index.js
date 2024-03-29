import React, { useState, useCallback, useEffect } from 'react';
import { Spin, Row, Col, Space, Button, Typography, message } from 'antd';
import { BookOutlined } from '@ant-design/icons';

import apis from 'apis';
import Routes from 'routes';
import dummy from 'data/dummy';

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
  isContained = false,
  isLiveData = true,
  dummyTemplateType = 'YOGA',
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
      console.error(error);
      message.error('Failed to fetch courses for creator');
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (!isLiveData) {
      setCourses(dummy[dummyTemplateType].COURSES ?? []);
      setTimeout(() => setIsLoading(false), 800);
    } else {
      fetchCreatorCourses();
    }
  }, [fetchCreatorCourses, dummyTemplateType, isLiveData]);

  const saveEditChanges = (newConfig) => updateConfigHandler(identifier, newConfig);

  const dragAndDropHandleComponent = <DragAndDropHandle {...dragHandleProps} />;

  const editingViewComponent = <CoursesEditView configValues={customComponentProps} updateHandler={saveEditChanges} />;

  const componentChildren = isEditing ? (
    <Row gutter={[8, 8]} justify="center" align="center">
      <Col className={styles.textAlignCenter}>
        <Space align="center" className={styles.textAlignCenter}>
          <Text> The courses you have created will show up here </Text>
          <Button
            type="primary"
            onClick={() => window.open(Routes.creatorDashboard.rootPath + Routes.creatorDashboard.courses, '_blank')}
          >
            Manage my courses
          </Button>
        </Space>
      </Col>
    </Row>
  ) : (
    <Spin spinning={isLoading} tip="Fetching Courses">
      <CoursesListView courses={courses} isContained={false} />
    </Spin>
  );

  const commonContainerProps = {
    title: customComponentProps?.title ?? 'COURSES',
    icon: <BookOutlined className={styles.mr10} />,
  };

  return !isContained && (courses.length > 0 || isEditing) ? (
    <Row className={styles.p10} align="middle" justify="center">
      <Col xs={24}>
        <DynamicProfileComponentContainer
          {...commonContainerProps}
          isEditing={isEditing}
          dragDropHandle={dragAndDropHandleComponent}
          editView={editingViewComponent}
        >
          {componentChildren}
        </DynamicProfileComponentContainer>
      </Col>
    </Row>
  ) : null;
};

export default CoursesProfileComponent;
