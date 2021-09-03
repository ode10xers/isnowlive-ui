import React, { MouseEvent, useCallback, useRef } from 'react'
import ReactHtmlParser from 'react-html-parser'
import moment from 'moment'

import { Row, Col, Typography, Card, Image } from 'antd'

import type { Session } from 'types/models/session'

import dateUtil from 'utils/date'
import { preventDefaults } from 'utils/helper'
import { redirectToSessionsPage } from 'utils/redirect'

import styles from './style.module.scss'

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
      preventDefaults(e);
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
        bodyStyle={{ 
          padding : 8,
          backgroundColor: 'var(--availability-card-background-color, #ffffff)',
          borderRadius: 10,
        }}
      >
        <Row gutter={[12, 4]} justify="center" align="stretch">
          <Col sm={8} xs={10} ref={avatarContainer}>
            <div className={styles.availabilityImageContainer}>
            <Image
              // shape="square"
              // size={(avatarContainer.current?.offsetWidth ?? 0) - 20}
              preview={false}
              src={availability.session_image_url}
              className={styles.availabilityImage}
            />
            </div>
          </Col>
          <Col sm={16} xs={14}>
            <Row>
              <Text className={styles.availabilityInfo}>
                {availability.total_price > 0 ? `${availability.currency.toUpperCase()} ${availability.total_price}` : 'Free'}
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
            <Paragraph className={styles.availabilityDescription}>
              {ReactHtmlParser(availability.description)}
            </Paragraph>
          </Col>
        </Row>
      </Card>
    </div>
  )
}

export default AvailabilityListItem
