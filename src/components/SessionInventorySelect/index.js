import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { Row, Col, Calendar, Typography, Button } from 'antd';
import { CheckCircleOutlined, CheckCircleTwoTone } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

import moment from 'moment';

import dateUtil from 'utils/date';

import styles from './style.module.scss';

const { Title, Text } = Typography;

const {
  formatDate: { toLongDate, toLocaleDate, toLocaleTime },
  timeCalculation: { isSameOrBeforeToday, isBeforeDate },
  timezoneUtils: { getCurrentLongTimezone },
} = dateUtil;

const SessionInventorySelect = ({ inventories, selectedSlot, handleSubmit }) => {
  const { t } = useTranslation();

  const [selectedDate, setSelectedDate] = useState(moment(selectedSlot?.start_time).format());
  const [slots, setSlots] = useState([]);

  const filterSessionByDate = useCallback(
    (date) =>
      inventories?.filter((i) => toLocaleDate(i.start_time) === toLocaleDate(date) && isBeforeDate(i.end_time)) || [],
    [inventories]
  );

  const handleDisableDate = (currentDate) => {
    const filteredInventory = filterSessionByDate(currentDate);
    return isSameOrBeforeToday(currentDate) || filteredInventory.length === 0;
  };

  const handleOnSelect = useCallback(
    (date) => {
      setSelectedDate(date);
      const filteredInventory = filterSessionByDate(date);
      if (filteredInventory && filteredInventory.length) {
        setSlots(filteredInventory);

        if (selectedSlot && !moment(date).isSame(moment(selectedSlot.start_time), 'day')) {
          handleSubmit(filteredInventory[0]);
        }
      } else {
        setSlots([]);
      }
    },
    [filterSessionByDate, handleSubmit, selectedSlot]
  );

  useEffect(() => {
    if (selectedSlot) {
      handleOnSelect(moment(selectedSlot.start_time));
    } else {
      handleOnSelect(moment());
    }
  }, [handleOnSelect, selectedSlot]);

  const dateCellRender = (date) => {
    const filteredInventory = filterSessionByDate(date);
    return filteredInventory.length ? (
      <ul className={isSameOrBeforeToday(date) ? styles.pastEvents : styles.events}></ul>
    ) : null;
  };

  const showSlots = (slot) => {
    if (selectedSlot && selectedSlot.inventory_id === slot.inventory_id) {
      return (
        <Col xs={24} key={slot.inventory_id}>
          <Button
            shape="round"
            type="primary"
            className={styles.slotBtn}
            onClick={() => handleSubmit(null)}
            icon={<CheckCircleTwoTone twoToneColor="#52c41a" />}
          >
            {toLocaleTime(slot.start_time)} - {toLocaleTime(slot.end_time)}
          </Button>
        </Col>
      );
    }
    return (
      <Col xs={24} key={slot.inventory_id}>
        <Button
          shape="round"
          type="secondary"
          className={styles.slotBtn}
          onClick={() => handleSubmit(slot)}
          icon={<CheckCircleOutlined />}
        >
          {toLocaleTime(slot.start_time)} - {toLocaleTime(slot.end_time)}
        </Button>
      </Col>
    );
  };

  return (
    <div className={classNames(styles.box, styles.p10, styles.mb20)}>
      <Row>
        <Col xs={24}>
          <Title className={styles.textAlignCenter} level={3}>
            {t('SELECT_DATE_AND_TIME')}
          </Title>
          <Title className={styles.textAlignCenter} level={5}>
            {t('TIME_SHOWN_IN_LOCAL_TIMEZONE')} ({getCurrentLongTimezone()})
          </Title>
          <div className={styles.siteCalendarCard}>
            <Calendar
              fullscreen={false}
              disabledDate={handleDisableDate}
              onSelect={handleOnSelect}
              dateCellRender={dateCellRender}
              value={moment(selectedDate)}
            />
          </div>
        </Col>
        <Col xs={24}>
          <Row className={styles.slotWrapper}>
            <Col xs={24}>
              <Title level={4}>{toLongDate(selectedDate)}</Title>
              <Text type="secondary"> {slots?.length > 0 ? t('SELECT_TIME') : t('NO_TIMESLOT_AVAILABLE')} </Text>
            </Col>
            <Col xs={24} className={styles.mt10}>
              <Row justify="center" gutter={[8, 8]}>
                {slots?.map(showSlots)}
              </Row>
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

export default SessionInventorySelect;
