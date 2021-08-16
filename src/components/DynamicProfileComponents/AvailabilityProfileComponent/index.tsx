import React, { useCallback, useEffect, useState } from 'react';
import { Button, Col, Row, Space, Spin, Typography } from 'antd';
import { ClockCircleOutlined } from '@ant-design/icons';

import apis from 'apis';
import Routes from 'routes';
import type { Session, UpcomingSessionInventory } from 'types/models/session';

import AvailabilityListView from './AvailabilityListView';
import AvailabilityEditView from './AvailabilityEditView';
import DragAndDropHandle from '../DragAndDropHandle';
import ContainerCard from 'components/ContainerCard';
// import DynamicProfileComponentContainer from 'components/DynamicProfileComponentContainer';

import { isAPISuccess } from 'utils/helper';

import styles from './style.module.scss';

const { Text } = Typography;

export interface AvailabilityProfileComponentProps {
  identifier?: unknown
  isEditing?: boolean
  dragHandleProps?: Record<string, any>
  onUpdate: (identifier: unknown, config: unknown) => void
  onRemove: (identifier: unknown) => void
  title?: string
}

const AvailabilityProfileComponent: React.VFC<AvailabilityProfileComponentProps> = ({
  dragHandleProps,
  identifier,
  isEditing,
  onRemove,
  onUpdate,
  title,
  ...props
}) => {
  const [availableSessions, setAvailableSessions] = useState<Session[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchCreatorSession = useCallback(async () => {
    setIsLoading(true)

    try {
      const { data, status } = await apis.user.getAvailabilitiesByUsername('upcoming')

      if (isAPISuccess(status) && data) {
        const upcomingInventories: UpcomingSessionInventory[] = data
        const sessionIds = Array.from(new Set(upcomingInventories.map(inventory => inventory.session_id)))
        const sessions: Session[] =
          sessionIds
            .map((sessionId) => upcomingInventories.filter((item) => item.session_id === sessionId)!)
            .map((items): Session => ({
              beginning: items[0].beginning,
              color_code: items[0].color_code,
              creator_username: items[0].creator_username,
              currency: items[0].currency,
              description: items[0].description,
              document_urls: items[0].document_urls,
              expiry: items[0].expiry,
              group: items[0].group,
              inventory: items.map((item)  => ({
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
              session_external_id: items[0].prerequisites,
              session_id: items[0].session_id,
              session_image_url: items[0].session_image_url,
              tags: items[0].tags,
              total_price: items[0].total_price,
              type: items[0].type,
              user_timezone: items[0].user_timezone,
              user_timezone_offset: items[0].user_timezone_offset,
              Videos: null,
            }))
        setAvailableSessions(sessions)
      }
    } catch (e) {
      console.error(e)
    }

    setIsLoading(false)
  }, [])

  useEffect(() => {
    fetchCreatorSession()
  }, [fetchCreatorSession])

  const handleUpdate = useCallback(
    (config) => onUpdate(identifier, config),
    [identifier, onUpdate],
  )
  const handleRemove = useCallback(
    () => onRemove(identifier),
    [identifier, onRemove],
  )


  return availableSessions.length > 0 || isEditing === true ? (
    <Row align="middle" className={styles.p10} id="availability" justify="center">
      {isEditing && (
        <Col xs={1}>
          <DragAndDropHandle {...dragHandleProps} />
        </Col>
      )}

      <Col xs={isEditing ? 22 : 24}>
        <ContainerCard
          title={title ?? 'AVAILABILITY'}
          // @ts-ignore
          icon={<ClockCircleOutlined className={styles.mr10} />}
        >
          {isEditing ? (
            <Row gutter={[8, 8]} justify="center" align="middle">
              <Col className={styles.textAlignCenter}>
                <Space align="center" className={styles.textAlignCenter}>
                  <Text> Your upcoming session availability will show up here </Text>
                  <Button
                    type="primary"
                    onClick={() =>
                      window.open(Routes.creatorDashboard.rootPath + Routes.creatorDashboard.availabilities, '_blank')
                    }
                  >
                    Manage my availabilities
                  </Button>
                </Space>
              </Col>
            </Row>
          ) : (
            <Spin spinning={isLoading} tip="Fetching Availabilities">
              <AvailabilityListView availabilities={availableSessions} />
            </Spin>
          )}
        </ContainerCard>
      </Col>

      {isEditing && (
        <Col xs={1}>
          <AvailabilityEditView
            config={props}
            onRemove={handleRemove}
            onUpdate={handleUpdate}
          />
        </Col>
      )}
    </Row>
  ) : null
}

export default AvailabilityProfileComponent
