import React from 'react';
import { Row, Col } from 'antd';
import { LinkOutlined } from '@ant-design/icons';

import OtherLinksEditView from './OtherLinksEditView';
import OtherLinksListView from './OtherLinksListView';
import DragAndDropHandle from '../DragAndDropHandle';
import ContainerCard from 'components/ContainerCard';
import DynamicProfileComponentContainer from 'components/DynamicProfileComponentContainer';

import styles from './style.module.scss';

const OtherLinksProfileComponent = ({
  identifier = null,
  isEditing = false,
  dragHandleProps,
  updateConfigHandler,
  removeComponentHandler,
  isContained = false,
  ...customComponentProps
}) => {
  const saveEditChanges = (newConfig) => updateConfigHandler(identifier, newConfig);
  const deleteComponent = () => removeComponentHandler(identifier);

  const dragAndDropHandleComponent = <DragAndDropHandle {...dragHandleProps} />;

  const editingViewComponent = (
    <OtherLinksEditView
      configValues={customComponentProps}
      deleteHandler={deleteComponent}
      updateHandler={saveEditChanges}
      isContained={isContained}
    />
  );

  const componentChildren = isEditing ? (
    <Row justify="center" align="center">
      <Col className={styles.textAlignCenter}>Links that you've entered will show up here</Col>
    </Row>
  ) : (
    <OtherLinksListView links={customComponentProps?.values ?? []} />
  );

  const commonContainerProps = {
    title: customComponentProps?.title ?? 'OTHER LINKS',
    icon: <LinkOutlined className={styles.mr10} />,
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

export default OtherLinksProfileComponent;
