import React from 'react';

import { Card, Typography } from 'antd';
import { BookTwoTone } from '@ant-design/icons';

import styles from './style.module.scss';
import CoursesEditView from './CoursesEditView';
import CoursesListView from './CoursesListView';

const { Text } = Typography;

const ContainerTitle = ({ title = 'COURSES' }) => (
  <Text style={{ color: '#0050B3' }}>
    <BookTwoTone className={styles.mr10} twoToneColor="#0050B3" />
    {title}
  </Text>
);

// TODO : Later we might want these colors to be customized
const cardHeadingStyle = {
  background: '#F1FBFF',
  boxShadow: 'inset 0px -1px 0px #E6F5FB',
  color: '#0050B3',
  borderRadius: '12px 12px 0 0',
};

const CoursesProfileComponent = ({
  identifier = null,
  isEditing = false,
  updateConfigHandler,
  ...customComponentProps
}) => {
  const saveEditChanges = (newConfig) => updateConfigHandler(identifier, newConfig);

  return (
    <div className={styles.p10}>
      <Card
        title={<ContainerTitle title={customComponentProps.title} />}
        headStyle={cardHeadingStyle}
        className={styles.profileComponentContainer}
        bodyStyle={{ padding: 12, position: 'relative' }}
      >
        <CoursesListView />
        {isEditing && <div className={styles.clickDisableOverlay} />}
      </Card>
      {isEditing && <CoursesEditView configValues={customComponentProps} updateHandler={saveEditChanges} />}
    </div>
  );
};

export default CoursesProfileComponent;
