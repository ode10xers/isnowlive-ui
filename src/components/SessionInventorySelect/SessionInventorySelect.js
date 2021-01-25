import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { Row, Col, Calendar, Typography, Button } from 'antd';

import moment from 'moment';

import dateUtil from 'utils/date';

import styles from './style.module.scss';

const { Title, Text } = Typography;

const {
  formatDate: { toLongDate, toLocaleDate, toLocaleTime },
  timeCalculation: { isSameOrBeforeToday },
} = dateUtil;

export const SessionInventorySelect = ({ inventories, selectedSlot, handleSubmit }) => {
  const [selectedDate, setSelectedDate] = useState(toLongDate(moment()));
  const [slots, setSlots] = useState([]);

  const filterSessionByDate = useCallback(
    (date) => inventories?.filter((i) => toLocaleDate(i.start_time) === toLocaleDate(date)) || [],
    [inventories]
  );

  const handleDisableDate = (currentDate) => {
    const filteredInventory = filterSessionByDate(currentDate);
    return isSameOrBeforeToday(currentDate) || filteredInventory.length === 0;
  };

  const handleOnSelect = useCallback(
    (date) => {
      setSelectedDate(toLongDate(date));
      const filteredInventory = filterSessionByDate(date);
      if (filteredInventory && filteredInventory.length) {
        setSlots(filteredInventory);
      } else {
        setSlots([]);
      }
    },
    [filterSessionByDate]
  );

  useEffect(() => {
    handleOnSelect(moment());
  }, [handleOnSelect]);

  const dateCellRender = (date) => {
    const filteredInventory = filterSessionByDate(date);
    return filteredInventory.length ? <ul className={styles.events}></ul> : null;
  };

  const showSlots = (slot) => {
    if (selectedSlot && selectedSlot.inventory_id === slot.inventory_id) {
      return (
        <>
          <Col xs={12}>
            <Button shape="round" className={styles.slotBtn} type="primary" onClick={() => handleSubmit(null)}>
              {toLocaleTime(slot.start_time)} - {toLocaleTime(slot.end_time)}
            </Button>
          </Col>
        </>
      );
    }
    return (
      <Col xs={12}>
        <Button shape="round" className={styles.slotBtn} type="secondary" onClick={() => handleSubmit(slot)}>
          {toLocaleTime(slot.start_time)} - {toLocaleTime(slot.end_time)}
        </Button>
      </Col>
    );
  };

  return (
    <div className={classNames(styles.box, styles.p10, styles.mb20)}>
      <Row>
        <Col xs={24}>
          <Title className={styles.textAlignCenter} level={4}>
            Select date and time
          </Title>
          <div className={styles.siteCalendarCard}>
            <Calendar
              fullscreen={false}
              disabledDate={handleDisableDate}
              onSelect={handleOnSelect}
              dateCellRender={dateCellRender}
            />
          </div>
        </Col>
        <Col xs={24}>
          <Row className={styles.slotWrapper}>
            <Col xs={24}>
              <Title level={4}>{selectedDate}</Title>
              <Text type="secondary"> {slots?.length > 0 ? 'Select time' : 'No timeslot available'} </Text>
            </Col>
            <Col xs={24} className={styles.mt10}>
              <Row justify="center">{slots?.map(showSlots)}</Row>
            </Col>
          </Row>
        </Col>
      </Row>
    </div>
  );
};

SessionInventorySelect.propTypes = {
  inventories: PropTypes.arrayOf(PropTypes.object).isRequired,
  handleSubmit: PropTypes.func.isRequired,
};
