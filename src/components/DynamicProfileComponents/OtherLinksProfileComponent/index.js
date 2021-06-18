import React from 'react';
import { Card, Typography, Row, Col } from 'antd';
import { LinkOutlined } from '@ant-design/icons';

import styles from './style.module.scss';
import OtherLinksEditView from './OtherLinksEditView';
import OtherLinksListView from './OtherLinksListView';

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
  updateConfigHandler,
  ...customComponentProps
}) => {
  // TODO: Adjust this method since the actual form names and the data stored in API is different
  const saveEditChanges = (newConfig) => updateConfigHandler(identifier, newConfig);

  return (!customComponentProps?.values || customComponentProps?.values?.length === 0) && !isEditing ? null : (
    <div className={styles.p10}>
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
          <OtherLinksListView links={customComponentProps?.values ?? []} />
        )}
      </Card>
      {isEditing && <OtherLinksEditView configValues={customComponentProps} updateHandler={saveEditChanges} />}
    </div>
  );
};

export default OtherLinksProfileComponent;
