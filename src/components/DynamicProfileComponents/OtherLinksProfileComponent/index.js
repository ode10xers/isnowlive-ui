import React from 'react';
import { Card, Typography, Row, Col } from 'antd';
import { LinkOutlined } from '@ant-design/icons';

import OtherLinksEditView from './OtherLinksEditView';
import OtherLinksListView from './OtherLinksListView';
import DragAndDropHandle from '../DragAndDropHandle';

import styles from './style.module.scss';

const { Text } = Typography;

const ContainerTitle = ({ title = 'MY OTHER LINKS' }) => (
  <Text style={{ color: '#0050B3' }}>
    <LinkOutlined className={styles.mr10} />
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

// TODO: Adjust Custom Component Props since this form will be different
const OtherLinksProfileComponent = ({
  identifier = null,
  isEditing = false,
  dragHandleProps,
  updateConfigHandler,
  removeComponentHandler,
  ...customComponentProps
}) => {
  // TODO: Render this properly once confirmed with BE
  const saveEditChanges = (newConfig) => updateConfigHandler(identifier, newConfig);
  const deleteComponent = () => removeComponentHandler(identifier);

  return (!customComponentProps?.values || customComponentProps?.values?.length === 0) && false && !isEditing ? null : (
    <Row className={styles.p10} align="middle" justify="center">
      {isEditing && (
        <Col xs={1}>
          {' '}
          <DragAndDropHandle {...dragHandleProps} />{' '}
        </Col>
      )}
      <Col xs={isEditing ? 22 : 24}>
        <Card
          title={<ContainerTitle title={customComponentProps?.title} />}
          headStyle={cardHeadingStyle}
          className={styles.profileComponentContainer}
          bodyStyle={{ padding: 12 }}
        >
          {isEditing ? (
            <Row justify="center" align="center">
              <Col className={styles.textAlignCenter}>Links that you've entered will show up here</Col>
            </Row>
          ) : (
            // <OtherLinksListView links={customComponentProps?.values ?? []} />
            <OtherLinksListView />
          )}
        </Card>
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
