import React, { useCallback } from 'react'
import { Col, Row } from 'antd'
// import { Swiper, SwiperSlide } from 'swiper/react'

import AvailabilityListItem from '../AvailabilityListItem'

import type { Session } from 'types/models/session'
// import { isMobileDevice } from 'utils/device'

import styles from './style.module.scss';

export interface AvailabilityListViewProps {
  availabilities?: Session[]
}

const AvailabilityListView: React.VFC<AvailabilityListViewProps> = ({
  availabilities = []
}) => {
  const renderAvailabilityListItem = useCallback((availability: Session) => (
    // <SwiperSlide key={availability.session_id}>
    <Col xs={24} sm={12}>
      <AvailabilityListItem availability={availability} />
    </Col>
    // </SwiperSlide>
  ), [])

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
        <Row gutter={[12, 4]} className={styles.availabilitiesContainer}>
          {availabilities.map(renderAvailabilityListItem)}
        </Row>
      ) : null}
    </div>
  )
}

export default AvailabilityListView
