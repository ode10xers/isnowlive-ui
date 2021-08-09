import React, { useState, useCallback, useEffect } from 'react';
import { Spin, Row, Col, Space, Button, Typography } from 'antd';

import apis from 'apis';
import Routes from 'routes';

import SessionListView from './SessionListView';
import SessionEditView from './SessionEditView';
import DragAndDropHandle from '../DragAndDropHandle';

import { isAPISuccess } from 'utils/helper';

import styles from './style.module.scss';

const { Text } = Typography;

const SessionsProfileComponent = ({
  identifier = null,
  isEditing = false,
  dragHandleProps,
  updateConfigHandler,
  removeComponentHandler,
  ...customComponentProps
}) => {
  const [sessions, setSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCreatorSessions = useCallback(async () => {
    setIsLoading(true);

    try {
      const { status, data } = await apis.user.getSessionsByUsername('upcoming');

      if (isAPISuccess(status) && data) {
        setSessions(data);
      }
    } catch (error) {
      console.error(error);
    }

    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchCreatorSessions();
  }, [fetchCreatorSessions]);

  const saveEditChanges = (newConfig) => updateConfigHandler(identifier, newConfig);

  return sessions.length > 0 || isEditing ? (
    <Row className={styles.p10} align="middle" justify="center" id="sessions">
      {isEditing && (
        <Col xs={1}>
          {' '}
          <DragAndDropHandle {...dragHandleProps} />{' '}
        </Col>
      )}
      <Col xs={isEditing ? 22 : 24}>
        {isEditing ? (
          <Row gutter={[8, 8]} justify="center" align="center">
            <Col className={styles.textAlignCenter}>
              <Space align="center" className={styles.textAlignCenter}>
                <Text> The sessions you have created will show up here </Text>
                <Button
                  type="primary"
                  onClick={() =>
                    window.open(Routes.creatorDashboard.rootPath + Routes.creatorDashboard.sessions, '_blank')
                  }
                >
                  Manage my sessions
                </Button>
              </Space>
            </Col>
          </Row>
        ) : (
          <Spin spinning={isLoading} tip="Fetching sessions">
            <SessionListView sessions={sessions || []} />
          </Spin>
        )}
      </Col>
      {isEditing && (
        <Col xs={1}>
          {' '}
          <SessionEditView configValues={customComponentProps} updateHandler={saveEditChanges} />{' '}
        </Col>
      )}
    </Row>
  ) : null;
};

export default SessionsProfileComponent;
