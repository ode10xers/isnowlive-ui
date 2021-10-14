import React, { useCallback } from 'react';
import { Col, Row } from 'antd';

import AvailabilityListItem from '../AvailabilityListItem';

import type { Session } from 'types/models/session';

import styles from './style.module.scss';

export interface AvailabilityListViewProps {
  availabilities?: Session[];
  isContained?: boolean;
}

const AvailabilityListView: React.VFC<AvailabilityListViewProps> = ({ availabilities = [], isContained = false }) => {
  const renderAvailabilityListItem = useCallback(
    (availability: Session) => (
      <Col
        xs={isContained ? 24 : 20}
        md={12}
        lg={isContained ? 12 : 8}
        key={availability.session_external_id ?? availability.session_id}
      >
        <AvailabilityListItem availability={availability} />
      </Col>
    ),
    [isContained]
  );

  return (
    <div>
      {availabilities.length > 0 ? (
        <Row gutter={[12, 4]} className={isContained ? undefined : styles.availabilitiesContainer}>
          {availabilities.map(renderAvailabilityListItem)}
        </Row>
      ) : null}
    </div>
  );
};

export default AvailabilityListView;
