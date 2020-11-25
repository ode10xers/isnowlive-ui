import React, { useState, useEffect } from 'react';
import { Calendar, Popover, Modal, Button, List, Row, Col, Checkbox, Badge, Select, Tooltip } from 'antd';
import moment from 'moment';
import { DeleteFilled } from '@ant-design/icons';

import { convertSchedulesToLocal } from '../../utils/helper';
import dateUtil from '../../utils/date';

import styles from './style.module.scss';
import { isMobileDevice } from 'utils/device';
import { generateTimes } from 'utils/helper';

const { Option } = Select;
const {
  formatDate: { toLocaleTime, toLocaleDate, toShortTimeWithPeriod, toLongDate, toDayOfWeek },
} = dateUtil;

const Scheduler = ({ sessionSlots, recurring, recurringDatesRange, handleSlotsChange, handleSlotDelete }) => {
  const [form, setForm] = useState(null);
  const [date, setDate] = useState(moment());
  const [selectedDate, setSelectedDate] = useState(moment());
  const [openModal, setOpenModal] = useState(false);
  const [slots, setSlots] = useState(convertSchedulesToLocal(sessionSlots));
  const [dayList, setDayList] = useState(null);
  const [slotsList] = useState(() => generateTimes());

  useEffect(() => {
    if (slots) {
      handleSlotsChange(slots);
    }
    // eslint-disable-next-line
  }, [slots]);

  useEffect(() => {
    if (openModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
  }, [openModal]);

  const onSelect = (selecetedCalendarDate) => {
    if (moment(selecetedCalendarDate).endOf('day') >= moment().startOf('day')) {
      // check if slots are present for selected date
      const slotsForSelectedDate = slots?.filter(
        (item) => toLocaleDate(item.session_date) === toLocaleDate(selecetedCalendarDate)
      );
      const formattedSlots = slotsForSelectedDate.map((obj) => ({
        id: obj.inventory_id,
        session_date: moment(obj.session_date),
        start_time: obj.start_time,
        end_time: obj.end_time,
      }));
      const defaultSlot = {
        session_date: moment(selecetedCalendarDate).format(),
        start_time: null,
        end_time: null,
      };

      setForm(slotsForSelectedDate.length ? [...formattedSlots, defaultSlot] : [defaultSlot]);
      setDate(selecetedCalendarDate);
      setSelectedDate(selecetedCalendarDate);
      setOpenModal(true);
    }
  };

  const onPanelChange = (calendarDate) => {
    setDate(calendarDate);
  };

  const handleCancel = () => {
    setForm(null);
    setOpenModal(false);
  };

  const getSlotsList = (value) => {
    return slots?.filter((event) => (toLocaleDate(event.session_date) === toLocaleDate(value) ? event : null));
  };

  const renderDateCell = (calendarDate) => {
    const slotsForDate = getSlotsList(calendarDate);
    if (slotsForDate?.length && !isMobileDevice) {
      return (
        <Popover
          content={
            <List
              size="small"
              bordered
              dataSource={slotsForDate}
              renderItem={(item) => (
                <List.Item className={styles.slot}>
                  {toLocaleTime(item['start_time'])}
                  {' - '} {toLocaleTime(item['end_time'])}
                </List.Item>
              )}
            />
          }
          title="Slot"
        >
          <List
            size="small"
            bordered
            dataSource={slotsForDate}
            renderItem={(item) => (
              <List.Item className={styles.slot}>
                {toLocaleTime(item['start_time'])}
                {' - '} {toLocaleTime(item['end_time'])}
              </List.Item>
            )}
          />
        </Popover>
      );
    } else if (slotsForDate?.length && isMobileDevice) {
      return <Badge className={styles.badge} size="small" count={slotsForDate?.length}></Badge>;
    } else {
      return null;
    }
  };

  const createOneTimeSchedule = (givenDate, givenSlots) => {
    // remove all the slots for selected date
    let tempSlots = givenSlots?.filter((item) => toLocaleDate(item.session_date) !== toLocaleDate(givenDate));

    form.forEach((vs) => {
      if (vs.start_time && vs.end_time) {
        let value = vs;
        let selected_date = moment(givenDate);
        value.session_date = selected_date.format();
        value.start_time = value.session_date.split('T')[0] + 'T' + vs.start_time.split('T').pop();
        value.end_time = value.session_date.split('T')[0] + 'T' + vs.end_time.split('T').pop();

        // remove slot as BE does not need it(Strong params check)
        delete value.slot;

        // NOTE: deep clone the object else moment dates will be mutate
        tempSlots.push(JSON.parse(JSON.stringify(value)));
      }
    });
    return tempSlots;
  };

  const createSchedulesAllSelectedDay = () => {
    let tempSlots = slots;
    const startDate = recurringDatesRange && toLocaleDate(recurringDatesRange[0]);
    const endDate = recurringDatesRange && toLocaleDate(moment(recurringDatesRange[1]).add(1, 'days'));
    let selected_date = toLocaleDate(selectedDate);
    while (
      moment(selected_date).isBetween(startDate, endDate) ||
      moment(selected_date).isSame(startDate) ||
      moment(selected_date).isSame(endDate)
    ) {
      tempSlots = createOneTimeSchedule(selected_date, tempSlots);
      selected_date = toLocaleDate(moment(selected_date).add(7, 'days'));
    }
    return tempSlots;
  };

  const createSchedulesMultipleDays = () => {
    let tempSlots = slots;
    const startDate = recurringDatesRange && toLocaleDate(recurringDatesRange[0]);
    const endDate = recurringDatesRange && toLocaleDate(moment(recurringDatesRange[1]).add(1, 'days'));
    let selected_date = toLocaleDate(selectedDate);

    let slotdates = [];
    while (
      moment(selected_date).isBetween(startDate, endDate) ||
      moment(selected_date).isSame(startDate) ||
      moment(selected_date).isSame(endDate)
    ) {
      if (dayList.includes(toDayOfWeek(selected_date))) {
        slotdates.push(selected_date);
      }
      selected_date = toLocaleDate(moment(selected_date).add(1, 'days'));
    }

    slotdates.forEach((date) => {
      tempSlots = createOneTimeSchedule(date, tempSlots);
    });
    return tempSlots;
  };

  const createSession = (typeOfSessionCreation) => {
    let tempSlots = slots;
    switch (typeOfSessionCreation) {
      case 0:
        tempSlots = createOneTimeSchedule(selectedDate, slots);
        handleCancel();
        break;
      case 1:
        tempSlots = createSchedulesAllSelectedDay();
        handleCancel();
        break;
      case 2:
        setDayList([toDayOfWeek(selectedDate)]);
        break;
      case 3:
        tempSlots = createSchedulesMultipleDays();
        setDayList(null);
        handleCancel();
        break;
      default:
        createOneTimeSchedule(selectedDate, slots);
        break;
    }
    setSlots(tempSlots);
  };

  const handleDisableDate = (currentDate) => {
    if (recurring) {
      const startDate = recurringDatesRange ? moment(recurringDatesRange[0]).startOf('day') : moment().startOf('day');
      const endDate = recurringDatesRange ? moment(recurringDatesRange[1]).endOf('day') : moment().endOf('day');
      // check if current date is in between recuring dates range
      if (moment(currentDate).isBetween(startDate, endDate)) {
        return false;
      } else {
        // check if it's within defined schedules
        if (slots?.filter((item) => toLocaleDate(item.session_date) === toLocaleDate(currentDate)).length) {
          return false;
        } else {
          return true;
        }
      }
    } else {
      if (moment(currentDate).endOf('day') < moment().startOf('day')) {
        // check if it's within defined schedules
        if (slots?.filter((item) => toLocaleDate(item.session_date) === toLocaleDate(currentDate)).length) {
          return false;
        } else {
          return true;
        }
      }
      return false;
    }
  };

  const handleSelectChange = (field, value, index) => {
    // Need to deepclone as react does not rerender on change state
    let tempForm = JSON.parse(JSON.stringify(form));
    tempForm[index][field] = value;
    if (
      field === 'start_time' &&
      tempForm[index].end_time &&
      moment(tempForm[index].end_time).diff(tempForm[index].start_time, 'minute') <= 0
    ) {
      tempForm[index].end_time = null;
    }
    if (field === 'end_time' && !form[index + 1]) {
      tempForm.push({
        session_date: moment(date).format(),
        start_time: null,
        end_time: null,
      });
      setForm(tempForm);
    } else {
      setForm(tempForm);
    }
  };

  const handleDeleteSlot = (index) => {
    let tempForm = [...form];
    if (tempForm[index].id) {
      handleSlotDelete(tempForm[index].id);
    }
    tempForm.splice(index, 1);
    setForm(tempForm);
  };

  return (
    <>
      <Calendar
        fullscreen={isMobileDevice ? false : true}
        value={date}
        disabledDate={handleDisableDate}
        onSelect={onSelect}
        onPanelChange={onPanelChange}
        dateCellRender={renderDateCell}
      />

      <Modal
        title={
          recurring
            ? `Add Session Slot: ${recurringDatesRange && toLongDate(recurringDatesRange[0])} - ${
                recurringDatesRange && toLongDate(recurringDatesRange[1])
              }`
            : `Create Session Slot for ${selectedDate && toLongDate(selectedDate)}`
        }
        visible={openModal}
        onCancel={handleCancel}
        footer={null}
      >
        <>
          <Row className={styles.m10}>
            <Col span={18} offset={3}>
              {form?.map((slot, index) => (
                <Row className={styles.m10}>
                  <Col xs={11} md={11}>
                    <Select
                      value={slot.start_time && toShortTimeWithPeriod(slot.start_time)}
                      style={{ width: 120 }}
                      onChange={(value) => handleSelectChange('start_time', value, index)}
                      placeholder="Start time"
                    >
                      {slotsList?.map((item) => (
                        <Option value={item.value} disabled={moment(item.value).diff(moment(), 'minute') <= 0}>
                          {item.label}
                        </Option>
                      ))}
                    </Select>
                  </Col>
                  <Col xs={11} md={11}>
                    <Select
                      disabled={slot.start_time ? false : true}
                      value={slot.end_time && toShortTimeWithPeriod(slot.end_time)}
                      style={{ width: 120 }}
                      onChange={(value) => handleSelectChange('end_time', value, index)}
                      placeholder="End time"
                    >
                      {slotsList?.map((item) => (
                        <Option disabled={moment(item.value).diff(slot.start_time, 'minute') <= 0} value={item.value}>
                          {item.label}
                        </Option>
                      ))}
                    </Select>
                  </Col>
                  {form.length > 1 && (
                    <Col xs={2} md={2}>
                      <Tooltip title="Delete">
                        <Button
                          disabled={slot?.num_participants && slot?.num_participants > 0}
                          shape="circle"
                          onClick={() => handleDeleteSlot(index)}
                          icon={<DeleteFilled />}
                        />
                      </Tooltip>
                    </Col>
                  )}
                </Row>
              ))}
            </Col>
          </Row>

          {recurring ? (
            <>
              <Row justify="center">
                <Col span={10} offset={1}>
                  <Button onClick={() => createSession(1)} type="primary">
                    Apply to all {toDayOfWeek(selectedDate)}
                  </Button>
                </Col>
                <Col span={10} offset={1}>
                  <Button onClick={() => createSession(2)} type="primary">
                    Apply to multiple days
                  </Button>
                </Col>
              </Row>
              <Row justify="center">
                <Col span={12} offset={3}>
                  <Button onClick={() => createSession(0)} type="link">
                    Apply to {toLongDate(selectedDate)} only
                  </Button>
                </Col>
              </Row>
              {dayList && (
                <Row>
                  <Col span={24}>
                    <Checkbox.Group
                      className={styles.checkboxs}
                      defaultValue={dayList}
                      options={moment.weekdays()}
                      onChange={(value) => setDayList(value)}
                    />
                  </Col>
                  <Col span={4} offset={4}>
                    <Button onClick={() => createSession(3)} type="primary" ghost>
                      Apply
                    </Button>
                  </Col>
                  <Col span={4} offset={4}>
                    <Button className={styles.ml20} onClick={handleCancel}>
                      Cancel
                    </Button>
                  </Col>
                </Row>
              )}
            </>
          ) : (
            <Row>
              <Col span={4} offset={4}>
                <Button onClick={() => createSession(0)} type="primary" ghost>
                  Apply
                </Button>
              </Col>
              <Col span={4} offset={4}>
                <Button className={styles.ml20} onClick={handleCancel}>
                  Cancel
                </Button>
              </Col>
            </Row>
          )}
        </>
      </Modal>
    </>
  );
};

export default Scheduler;
