import React from 'react';

import { Row, Col } from 'antd';
import { YoutubeOutlined } from '@ant-design/icons';

import DragAndDropHandle from '../DragAndDropHandle';
import ContainerCard from 'components/ContainerCard';
import DynamicProfileComponentContainer from 'components/DynamicProfileComponentContainer';

import styles from './style.module.scss';
import YoutubeEmbedEditView from './YoutubeEmbedEditView';
import YoutubeEmbedListView from './YoutubeEmbedListView';

const YoutubeEmbedComponent = ({
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
    <YoutubeEmbedEditView
      configValues={customComponentProps}
      deleteHandler={deleteComponent}
      updateHandler={saveEditChanges}
      isContained={isContained}
    />
  );

  const componentChildren = isEditing ? (
    <Row justify="center" align="center">
      <Col className={styles.textAlignCenter}>Youtube Video links that you entered will show up here</Col>
    </Row>
  ) : (
    <YoutubeEmbedListView urls={customComponentProps?.values ?? []} isContained={isContained} />
  );

  const commonContainerProps = {
    title: customComponentProps?.title ?? 'Youtube Videos',
    icon: <YoutubeOutlined className={styles.mr10} />,
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

export default YoutubeEmbedComponent;
