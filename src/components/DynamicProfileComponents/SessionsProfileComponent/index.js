import React, { useState, useCallback, useEffect } from 'react';
import { Spin, Row, Col, Space, Button, Typography, message } from 'antd';
import { VideoCameraOutlined } from '@ant-design/icons';

import apis from 'apis';
import Routes from 'routes';

import SessionListView from './SessionListView';
import SessionEditView from './SessionEditView';
import DragAndDropHandle from '../DragAndDropHandle';
import DynamicProfileComponentContainer from 'components/DynamicProfileComponentContainer';

import { isAPISuccess } from 'utils/helper';

import styles from './style.module.scss';

const { Text } = Typography;

const SessionsProfileComponent = ({
  identifier = null,
  isEditing = false,
  dragHandleProps,
  updateConfigHandler,
  removeComponentHandler,
  isContained = false,
  ...customComponentProps
}) => {
  const [sessions, setSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCreatorSessions = useCallback(async () => {
    setIsLoading(true);

    try {
      const { status, data } = await apis.user.getSessionsByUsername('upcoming');

      if (isAPISuccess(status) && data) {
        const upcomingInventories = data;
        const sessionIds = Array.from(new Set(upcomingInventories.map((inventory) => inventory.session_id)));
        const adjustedSessions = sessionIds
          .map((sessionId) => upcomingInventories.filter((item) => item.session_id === sessionId))
          .map((items) => ({
            beginning: items[0].beginning,
            color_code: items[0].color_code,
            creator_username: items[0].creator_username,
            currency: items[0].currency,
            description: items[0].description,
            document_urls: items[0].document_urls,
            expiry: items[0].expiry,
            group: items[0].group,
            inventory: items.map((item) => ({
              end_time: item.end_time,
              inventory_external_id: item.inventory_external_id,
              inventory_id: item.inventory_id,
              is_published: item.is_published,
              num_participants: item.num_participants,
              offline_event_address: item.offline_event_address,
              participants: item.participants,
              session_date: item.session_date,
              start_time: item.start_time,
              start_url: item.start_url,
            })),
            is_active: items[0].is_active,
            is_course: items[0].is_course,
            is_offline: items[0].is_offline,
            is_refundable: items[0].is_refundable,
            max_participants: items[0].max_participants,
            name: items[0].name,
            offline_event_address: items[0].offline_event_address,
            pay_what_you_want: items[0].pay_what_you_want,
            prerequisites: items[0].prerequisites,
            price: items[0].price,
            recurring: items[0].recurring,
            refund_before_hours: items[0].refund_before_hours,
            session_external_id: items[0].session_external_id,
            session_id: items[0].session_id,
            session_image_url: items[0].session_image_url,
            tags: items[0].tags,
            total_price: items[0].total_price,
            type: items[0].type,
            user_timezone: items[0].user_timezone,
            user_timezone_offset: items[0].user_timezone_offset,
          }));
        setSessions(adjustedSessions);
      }
    } catch (error) {
      console.error(error);
      message.error('Failed fetching upcoming sessions data');
    }

    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchCreatorSessions();
  }, [fetchCreatorSessions]);

  const saveEditChanges = (newConfig) => updateConfigHandler(identifier, newConfig);

  const dragAndDropHandleComponent = <DragAndDropHandle {...dragHandleProps} />;

  const componentChildren = isEditing ? (
    <Row gutter={[8, 8]} justify="center" align="center">
      <Col className={styles.textAlignCenter}>
        <Space align="center" className={styles.textAlignCenter}>
          <Text> The sessions you have created will show up here </Text>
          <Button
            type="primary"
            onClick={() => window.open(Routes.creatorDashboard.rootPath + Routes.creatorDashboard.sessions, '_blank')}
          >
            Manage my sessions
          </Button>
        </Space>
      </Col>
    </Row>
  ) : (
    <Spin spinning={isLoading} tip="Fetching sessions">
      <SessionListView sessions={sessions || []} isContained={false} />
    </Spin>
  );

  const commonContainerProps = {
    title: customComponentProps?.title ?? 'SESSIONS',
    icon: <VideoCameraOutlined className={styles.mr10} />,
  };

  const editingViewComponent = <SessionEditView configValues={customComponentProps} updateHandler={saveEditChanges} />;

  return !isContained && (sessions.length > 0 || isEditing) ? (
    <Row className={styles.p10} align="middle" justify="center">
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
    </Row>
  ) : null;
};

export default SessionsProfileComponent;
