import React from 'react';
import { Card, Row, Col } from 'antd';

import SessionListView from './SessionListView';

import styles from './style.module.scss';

// NOTE : Currently unused
const SessionsProfileComponent = ({ isEditing = false, sessions = [], cardHeader }) => (
  <div className={styles.p10}>
    <Card
      // title={<ContainerTitle title={customComponentProps.title} />}
      // headStyle={cardHeadingStyle}
      {...cardHeader}
      className={styles.profileComponentContainer}
      bodyStyle={{ padding: 12 }}
    >
      {isEditing ? (
        <Row justify="center" align="middle">
          <Col className={styles.textAlignCenter}>Upcoming sessions that are published will be shown here</Col>
        </Row>
      ) : (
        <SessionListView sessions={sessions} />
      )}
    </Card>
  </div>
);

export default SessionsProfileComponent;
