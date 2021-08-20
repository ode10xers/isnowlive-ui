import React, { useCallback } from 'react'
import { Col, Row } from 'antd'
// import { Swiper, SwiperSlide } from 'swiper/react'

import AvailabilityListItem from '../AvailabilityListItem'

import type { Session } from 'types/models/session'
// import { isMobileDevice } from 'utils/device'

import styles from './style.module.scss';

export interface AvailabilityListViewProps {
  availabilities?: Session[]
  isContained?: boolean
}

const AvailabilityListView: React.VFC<AvailabilityListViewProps> = ({
  availabilities = [],
  isContained = false
}) => {
  const renderAvailabilityListItem = useCallback((availability: Session) => (
    // <SwiperSlide key={availability.session_id}>
    <Col xs={isContained ? 24 : 16} md={12} lg={isContained ? 12 : 8}>
      <AvailabilityListItem availability={availability} />
    </Col>
    // </SwiperSlide>
  ), [isContained])

  return (
    <div>
      {availabilities.length > 0 ? (
        // <Row>
        //   <Col span={24}>
        //     <Swiper slidesPerView={isMobileDevice ? 1.2 : 2.2}>
        //       {availabilities.map(renderAvailabilityListItem)}
        //     </Swiper>
        //   </Col>
        // </Row>
        <Row gutter={[12, 4]} className={isContained ? undefined : styles.availabilitiesContainer}>
          {availabilities.map(renderAvailabilityListItem)}
        </Row>
      ) : null}
    </div>
  )
}

export default AvailabilityListView
