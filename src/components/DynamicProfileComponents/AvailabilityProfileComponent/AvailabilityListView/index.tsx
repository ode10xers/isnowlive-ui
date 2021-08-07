import React, { useCallback } from 'react'
import { Col, Row } from 'antd'
import { Swiper, SwiperSlide } from 'swiper/react'

import type { Session } from 'types/models/session'
import AvailabilityListItem from '../AvailabilityListItem'
import { isMobileDevice } from 'utils/device'

export interface AvailabilityListViewProps {
  availabilities?: Session[]
}

const AvailabilityListView: React.VFC<AvailabilityListViewProps> = ({
  availabilities = []
}) => {
  const renderAvailabilityListItem = useCallback((availability: Session) => (
    <SwiperSlide>
      <AvailabilityListItem availability={availability} />
    </SwiperSlide>
  ), [])

  return (
    <div>
      {availabilities.length > 0 ? (
        <Row>
          <Col span={24}>
            <Swiper slidesPerView={isMobileDevice ? 1.3 : 3.1}>
              {availabilities.map(renderAvailabilityListItem)}
            </Swiper>
          </Col>
        </Row>
      ) : null}
    </div>
  )
}

export default AvailabilityListView
