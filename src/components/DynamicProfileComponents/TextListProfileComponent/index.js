import React from 'react';

import { Row, Col } from 'antd';
import { OrderedListOutlined } from '@ant-design/icons';

import TextListView from './TextListView';
import TextListEditView from './TextListEditView';
import DragAndDropHandle from '../DragAndDropHandle';
import ContainerCard from 'components/ContainerCard';
import DynamicProfileComponentContainer from 'components/DynamicProfileComponentContainer';

import styles from './style.module.scss';

const TextListProfileComponent = ({
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
    <TextListEditView
      configValues={customComponentProps}
      deleteHandler={deleteComponent}
      updateHandler={saveEditChanges}
      isContained={isContained}
    />
  );

  const componentChildren = isEditing ? (
    <Row justify="center" align="center">
      <Col className={styles.textAlignCenter}>List items that you entered will show up here</Col>
    </Row>
  ) : (
    <TextListView items={customComponentProps?.values} isContained={isContained} />
  );

  const commonContainerProps = {
    title: customComponentProps?.title ?? 'List Items',
    icon: <OrderedListOutlined className={styles.mr10} />,
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

export default TextListProfileComponent;
