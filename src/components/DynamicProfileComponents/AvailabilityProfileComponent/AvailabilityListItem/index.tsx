import React, { MouseEvent, useCallback, useRef } from 'react'
import ReactHtmlParser from 'react-html-parser'
import { Row, Col, Typography, Card, Avatar } from 'antd'

import type { Session } from 'types/models/session'
import styles from './style.module.scss'
import { redirectToSessionsPage } from 'utils/redirect'
import dateUtil from 'utils/date'
import moment from 'moment'

const { Paragraph, Text, Title } = Typography
const { formatDate: { getTimeDiff } } = dateUtil


export interface AvailabilityListItemProps {
  availability: Session
  onClick?: (() => void) | undefined
}

const AvailabilityListItem: React.VFC<AvailabilityListItemProps> = ({ availability, onClick }) => {
  const avatarContainer = useRef<HTMLDivElement>(null)
  const handleClick = useCallback((e: MouseEvent) => {
    if (typeof onClick === 'function') onClick()
    else {
      e.preventDefault()
      redirectToSessionsPage(availability)
    }
  }, [availability, onClick])

  return (
    <div className={styles.availabilityItem} onClick={handleClick}>
      <Card
        style={{
          boxShadow: '0px 0px 5.18291px rgba(0, 0, 0, 0.08), 0px 0px 20.7317px 2.59146px rgba(0, 0, 0, 0.05)',
          borderRadius: 10,
        }}
      >
        <Row gutter={[20, 4]} justify="center">
          <Col xl={4} md={6} xs={8} ref={avatarContainer}>
            <Avatar
              shape="square"
              src={availability.session_image_url}
              size={(avatarContainer.current?.offsetWidth ?? 0) - 20}
            />
          </Col>
          <Col xl={20} md={18} xs={16}>
            <Row>
              <Text className={styles.availabilityInfo}>
                {availability.currency.toUpperCase()}
                {' '}
                {availability.price}
              </Text>
              <Text className={styles.availabilityInfoSeparator}>
                {' ● '}
              </Text>
              <Text className={styles.availabilityInfo} >
                {/* @ts-ignore */}
                {getTimeDiff(moment(availability.inventory[0].end_time), moment(availability.inventory[0].start_time), 'minutes')} mins
              </Text>
            </Row>
            <Title level={5} ellipsis={{ rows: 1 }} className={styles.availabilityTitle}>
              {availability.name}
            </Title>
            <Paragraph className={styles.availabilityDescription} ellipsis={{ rows: 2 }}>
              {ReactHtmlParser(availability.description)}
            </Paragraph>
          </Col>
        </Row>
      </Card>
    </div>
  )
}

export default AvailabilityListItem
