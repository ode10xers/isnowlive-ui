import React, { useCallback, useEffect, useState } from 'react'
import { Button, Col, Row, Space, Spin, Typography } from 'antd'
import { ClockCircleOutlined } from '@ant-design/icons';

import apis from 'apis'
import Routes from 'routes'
import DynamicProfileComponentContainer from 'components/DynamicProfileComponentContainer';
import { isAPISuccess } from 'utils/helper'

import AvailabilityListView from './AvailabilityListView';
import AvailabilityEditView from './AvailabilityEditView'
import DragAndDropHandle from '../DragAndDropHandle';

import styles from './style.module.scss'
import type { Session } from 'types/models/session';
import moment from 'moment';

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
      const { data, status } = await apis.session.getSession()

      if (isAPISuccess(status) && data) {
        const now = moment()
        const sessions: Session[] = data
        setAvailableSessions(
          sessions
            .filter(session => session.is_active)
            .filter(session => session.max_participants === 1)
            .filter(session => moment(session.expiry).isAfter(now))
            .map(session => ({
              ...session,
              inventory: session.inventory
                .filter(inv => moment(inv.start_time).isAfter(now))
            }))
            .filter(session => session.inventory.length > 0)
        )
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
        <DynamicProfileComponentContainer
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
                      window.open(Routes.creatorDashboard.rootPath + Routes.creatorDashboard.sessions, '_blank')
                    }
                  >
                    Manage my sessions
                  </Button>
                </Space>
              </Col>
            </Row>
          ) : (
            <Spin spinning={isLoading} tip="Fetching Passes">
              <AvailabilityListView availabilities={availableSessions} />
            </Spin>
          )}
        </DynamicProfileComponentContainer>
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
