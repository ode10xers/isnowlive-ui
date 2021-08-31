import React from 'react';
import ReactHtmlParser from 'react-html-parser';

import { Row, Col } from 'antd';
import { ProfileOutlined } from '@ant-design/icons';

import DragAndDropHandle from '../DragAndDropHandle';
import DescriptionEditView from './DescriptionEditView';
import ContainerCard from 'components/ContainerCard';
import DynamicProfileComponentContainer from 'components/DynamicProfileComponentContainer';

import styles from './style.module.scss';

const DescriptionProfileComponent = ({
  identifier = null,
  isEditing = false,
  isContained = false,
  dragHandleProps,
  updateConfigHandler,
  removeComponentHandler,
  ...customComponentProps
}) => {
  const saveEditChanges = (newConfig) => updateConfigHandler(identifier, newConfig);
  const deleteComponent = () => removeComponentHandler(identifier);

  const dragAndDropHandleComponent = <DragAndDropHandle {...dragHandleProps} />;

  const editingViewComponent = (
    <DescriptionEditView
      configValues={customComponentProps}
      deleteHandler={deleteComponent}
      updateHandler={saveEditChanges}
      isContained={isContained}
    />
  );

  const componentChildren = isEditing ? (
    <Row justify="center" align="center">
      <Col className={styles.textAlignCenter}>Description that you have entered will show up here</Col>
    </Row>
  ) : (
    <div className={styles.contentContainer}>{ReactHtmlParser(customComponentProps?.values ?? '')}</div>
  );

  const commonContainerProps = {
    title: customComponentProps?.title ?? 'About me',
    icon: <ProfileOutlined className={styles.mr10} />,
  };

  return (!customComponentProps?.values || customComponentProps?.values?.length === 0) && !isEditing ? null : (
    <Row className={styles.p10} align="middle" justify="center">
      {isContained ? (
        <>
          {isEditing && <Col xs={1}>{dragAndDropHandleComponent}</Col>}
          <Col xs={isEditing ? 22 : 24}>
            <ContainerCard {...commonContainerProps}>{componentChildren}</ContainerCard>
          </Col>
          {isEditing && <Col xs={1}>{editingViewComponent}</Col>}
        </>
      ) : (
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
      )}
    </Row>
  );
};

export default DescriptionProfileComponent;
