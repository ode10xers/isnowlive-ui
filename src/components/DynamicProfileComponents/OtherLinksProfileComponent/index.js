import React from 'react';
import { Row, Col } from 'antd';
import { LinkOutlined } from '@ant-design/icons';

import ContainerCard from 'components/ContainerCard';
import OtherLinksEditView from './OtherLinksEditView';
import OtherLinksListView from './OtherLinksListView';
import DragAndDropHandle from '../DragAndDropHandle';

import styles from './style.module.scss';

const OtherLinksProfileComponent = ({
  identifier = null,
  isEditing = false,
  dragHandleProps,
  updateConfigHandler,
  removeComponentHandler,
  ...customComponentProps
}) => {
  const saveEditChanges = (newConfig) => updateConfigHandler(identifier, newConfig);
  const deleteComponent = () => removeComponentHandler(identifier);

  return (!customComponentProps?.values || customComponentProps?.values?.length === 0) && !isEditing ? null : (
    <Row className={styles.p10} align="middle" justify="center">
      {isEditing && (
        <Col xs={1}>
          {' '}
          <DragAndDropHandle {...dragHandleProps} />{' '}
        </Col>
      )}
      <Col xs={isEditing ? 22 : 24}>
        <ContainerCard
          title={customComponentProps?.title ?? 'OTHER LINKS'}
          icon={<LinkOutlined className={styles.mr10} />}
        >
          {isEditing ? (
            <Row justify="center" align="center">
              <Col className={styles.textAlignCenter}>Links that you've entered will show up here</Col>
            </Row>
          ) : (
            <OtherLinksListView links={customComponentProps?.values ?? []} />
          )}
        </ContainerCard>
      </Col>
      {isEditing && (
        <Col xs={1}>
          <OtherLinksEditView
            configValues={customComponentProps}
            deleteHandler={deleteComponent}
            updateHandler={saveEditChanges}
          />
        </Col>
      )}
    </Row>
  );
};

export default OtherLinksProfileComponent;
