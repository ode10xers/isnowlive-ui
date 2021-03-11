import React, { useState, useEffect, useRef } from 'react';
import { Calendar, Modal, Button, List, Row, Col, Checkbox, Badge, Select, Tooltip, Typography } from 'antd';
import moment from 'moment';
import classNames from 'classnames';
import { DeleteFilled } from '@ant-design/icons';

import { convertSchedulesToLocal, generateTimes } from 'utils/helper';
import dateUtil from 'utils/date';
import { isMobileDevice } from 'utils/device';

import styles from './style.module.scss';

const { Option } = Select;
const { Paragraph, Text } = Typography;
const {
  formatDate: { toLocaleTime, toLocaleDate, toShortTimeWithPeriod, toLongDate, toDayOfWeek, getTimeDiff },
  timeCalculation: { isBeforeDate },
} = dateUtil;

const Scheduler = ({ sessionSlots, recurring, recurringDatesRange, handleSlotsChange, handleSlotDelete }) => {
  const [form, setForm] = useState(null);
  const [date, setDate] = useState(moment());
  const [selectedDate, setSelectedDate] = useState(moment());
  const [openModal, setOpenModal] = useState(false);
  const [slots, setSlots] = useState(convertSchedulesToLocal(sessionSlots));
  const [dayList, setDayList] = useState(null);
  const [slotsList] = useState(() => generateTimes());
  const [formDeletedIndex, setFormDeletedIndex] = useState([]);
  const isPannelChanged = useRef(false);
  const [disableDuplicateEndTime, setDisableDuplicateEndTime] = useState([]);

  useEffect(() => {
    if (slots) {
      handleSlotsChange(slots);
    }
    // eslint-disable-next-line
  }, [slots]);

  useEffect(() => {
    if (sessionSlots && sessionSlots.length) {
      const sortedSessionSlots = sessionSlots.sort((a, b) =>
        a.start_time > b.start_time ? 1 : b.start_time > a.start_time ? -1 : 0
      );
      setDate(moment(sortedSessionSlots[0].start_time));
    } else {
      if (recurring && recurringDatesRange && recurringDatesRange.length) {
        if (isBeforeDate(recurringDatesRange[0])) {
          setDate(moment(recurringDatesRange[0]));
        } else {
          setDate(moment());
        }
      } else {
        setDate(moment(selectedDate));
      }
    }
    if (sessionSlots.length !== slots.length) {
      setSlots(sessionSlots);
    }
    // eslint-disable-next-line
  }, [recurring, recurringDatesRange, sessionSlots]);

  useEffect(() => {
    if (openModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
  }, [openModal]);

  const onSelect = (selecetedCalendarDate) => {
    if (!isPannelChanged.current) {
      if (moment(selecetedCalendarDate).endOf('day') >= moment().startOf('day')) {
        // check if slots are present for selected date
        const slotsForSelectedDate = slots?.filter(
          (item) => toLocaleDate(item.start_time) === toLocaleDate(selecetedCalendarDate)
        );
        const formattedSlots = slotsForSelectedDate.map((obj) => ({
          inventory_id: obj.inventory_id,
          session_date: obj.start_time,
          start_time: obj.start_time,
          end_time: obj.end_time,
          num_participants: obj.num_participants,
        }));
        const defaultSlot = {
          session_date: moment(selecetedCalendarDate).format(),
          start_time: null,
          end_time: null,
          num_participants: 0,
        };

        setForm(slotsForSelectedDate.length ? [...formattedSlots, defaultSlot] : [defaultSlot]);
        setDate(selecetedCalendarDate);
        setSelectedDate(selecetedCalendarDate);
        setOpenModal(true);
      }
    }
  };

  const onPanelChange = (calendarDate) => {
    isPannelChanged.current = true;
    setDate(calendarDate);
    setTimeout(() => {
      isPannelChanged.current = false;
    }, 500);
  };

  const handleCancel = () => {
    setForm(null);
    setFormDeletedIndex([]);
    setOpenModal(false);
    setDayList(null);
  };

  const getSlotsList = (value) => {
    return slots?.filter((event) => (toLocaleDate(event.start_time) === toLocaleDate(value) ? event : null));
  };

  const renderDateCell = (calendarDate) => {
    const slotsForDate = getSlotsList(calendarDate);
    if (slotsForDate?.length && !isMobileDevice) {
      return (
        <List
          size="small"
          itemLayout="vertical"
          dataSource={slotsForDate}
          renderItem={(item) => (
            <List.Item className={isBeforeDate(item['end_time']) ? styles.slot : styles.pastSlot}>
              {toLocaleTime(item['start_time'])}
              {' - '} {toLocaleTime(item['end_time'])}
            </List.Item>
          )}
        />
      );
    } else if (slotsForDate?.length && isMobileDevice) {
      const badgeColors = {
        backgroundColor: moment(calendarDate).endOf('day') < moment().startOf('day') ? '#eeeeee' : '#096dd9',
        color: moment(calendarDate).endOf('day') < moment().startOf('day') ? '#888888' : '#ffffff',
      };

      return <Badge className={styles.badge} style={badgeColors} size="small" count={slotsForDate?.length} />;
    } else {
      return null;
    }
  };

  const createOneTimeSchedule = (givenDate, givenSlots) => {
    // filter slots for selected and other days
    let otherDateSlots = givenSlots?.filter((item) => toLocaleDate(item.start_time) !== toLocaleDate(givenDate));
    let givenDateSlots = givenSlots?.filter((item) => toLocaleDate(item.start_time) === toLocaleDate(givenDate));

    // Delete the given date slots which match same dates with deleted slot dates
    if (givenDateSlots && givenDateSlots.length && formDeletedIndex && formDeletedIndex.length) {
      formDeletedIndex.forEach((deletedSlot) => {
        let deletedGivenDateSlotsList = givenDateSlots.filter(
          (givenDateSlot) =>
            toShortTimeWithPeriod(givenDateSlot.start_time) === toShortTimeWithPeriod(deletedSlot.start_time) &&
            toShortTimeWithPeriod(givenDateSlot.end_time) === toShortTimeWithPeriod(deletedSlot.end_time)
        );
        if (deletedGivenDateSlotsList && deletedGivenDateSlotsList.length) {
          deletedGivenDateSlotsList.forEach((elementdeletedGivenDateSlot) => {
            if (elementdeletedGivenDateSlot.inventory_id) {
              handleSlotDelete(elementdeletedGivenDateSlot.inventory_id);
            }
            givenDateSlots = givenDateSlots.filter(
              (givenDateSlot) => givenDateSlot.inventory_id !== elementdeletedGivenDateSlot.inventory_id
            );
          });
        }
      });
    }

    // create list of all new slots from form
    let newSlots = [];
    form.forEach((vs) => {
      if (vs.inventory_id) {
        delete vs.inventory_id;
      }

      const givenDateMoment = moment(givenDate);
      const startTimeMoment = moment(vs.start_time);
      const newInventoryTime = [
        givenDateMoment.year(),
        givenDateMoment.month(),
        givenDateMoment.date(),
        startTimeMoment.hour(),
        startTimeMoment.minute(),
      ];

      // Skip creating it if the newly created inventory will exist in the past
      if (
        givenDateMoment.isSameOrBefore(moment(), 'day') &&
        moment(newInventoryTime).isSameOrBefore(moment(), 'minute')
      ) {
        console.log('Past inventory will be created, skipping...');
        return;
      }

      if (vs.start_time && vs.end_time) {
        let value = vs;
        let selected_date = givenDateMoment.format();
        value.start_time = selected_date.split('T')[0] + 'T' + vs.start_time.split('T').pop();
        value.end_time = selected_date.split('T')[0] + 'T' + vs.end_time.split('T').pop();
        value.session_date = value.start_time;
        value.num_participants = 0;

        if (givenDateSlots && givenDateSlots.length) {
          let tempGivenDateSlots = givenDateSlots.filter(
            (givenDateSlot) =>
              toShortTimeWithPeriod(givenDateSlot.start_time) === toShortTimeWithPeriod(value.start_time) &&
              toShortTimeWithPeriod(givenDateSlot.end_time) === toShortTimeWithPeriod(value.end_time)
          );
          if (tempGivenDateSlots && tempGivenDateSlots.length) {
            // NOTE: deep clone the object else moment dates will be mutate
            newSlots.push(JSON.parse(JSON.stringify(tempGivenDateSlots[0])));
          } else {
            // NOTE: deep clone the object else moment dates will be mutate
            newSlots.push(JSON.parse(JSON.stringify(value)));
          }
        } else {
          // NOTE: deep clone the object else moment dates will be mutate
          newSlots.push(JSON.parse(JSON.stringify(value)));
        }
      }
    });

    return [...newSlots, ...otherDateSlots];
  };

  const createSchedulesAllSelectedDay = () => {
    let tempSlots = slots;
    const startDate = recurringDatesRange && toLocaleDate(recurringDatesRange[0]);
    const endDate = recurringDatesRange && toLocaleDate(recurringDatesRange[1]);
    const daysToBeAdded = moment(startDate).day() > selectedDate.day() ? selectedDate.day() + 7 : selectedDate.day();
    let selected_date = toLocaleDate(recurringDatesRange ? moment(startDate).day(daysToBeAdded) : selectedDate);
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
    const endDate = recurringDatesRange && toLocaleDate(recurringDatesRange[1]);
    let selected_date = recurringDatesRange ? startDate : toLocaleDate(selectedDate);

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
        setDayList(null);
        handleCancel();
        break;
      case 1:
        tempSlots = createSchedulesAllSelectedDay();
        setDayList(null);
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
        setDayList(null);
        break;
    }
    setSlots(tempSlots);
  };

  const handleDisableDate = (currentDate) => {
    if (recurring) {
      if (moment(currentDate).endOf('day') < moment().startOf('day')) {
        return true;
      }

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

    // Since the dropdown values uses today's date, it's possible
    // to create an inventory with a later start_time than the
    // end_time. To prevent that, we need to make both the DATES
    // of start_time and end_time the same, and then compare with
    // the getTimeDiff method
    tempForm[index][field] = value;

    const startTimeMoment = moment(tempForm[index].start_time);
    // Need to be careful here since if end_time is null, this moment will use
    // the current datetime value
    // But if end_time is null, the getTimeDiff comparison won't get called anyway
    const endTimeMoment = moment(tempForm[index].end_time)
      .year(startTimeMoment.year())
      .month(startTimeMoment.month())
      .date(startTimeMoment.date());

    if (
      field === 'start_time' &&
      tempForm[index].end_time &&
      getTimeDiff(endTimeMoment, startTimeMoment, 'minute') <= 0
    ) {
      tempForm[index].end_time = null;
    }
    if (field === 'end_time' && !form[index + 1]) {
      tempForm.push({
        session_date: moment(date).format(),
        start_time: null,
        end_time: null,
        num_participants: 0,
      });
      setForm(tempForm);
    } else {
      let duplicateSlots = [];
      tempForm.forEach((slot) => {
        if (toShortTimeWithPeriod(slot.start_time) === toShortTimeWithPeriod(tempForm[index].start_time)) {
          duplicateSlots.push(toShortTimeWithPeriod(slot.end_time));
        }
        return;
      });
      setDisableDuplicateEndTime(duplicateSlots);
      setForm(tempForm);
    }
  };

  const handleDeleteSlot = (index) => {
    let tempForm = [...form];
    if (tempForm[index].inventory_id) {
      handleSlotDelete(tempForm[index].inventory_id);
    }
    setFormDeletedIndex([...formDeletedIndex, tempForm[index]]);
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
        className={styles.modal}
        title={
          recurring ? (
            <>
              <p className={styles.titlePrefix}>Add Session Slot: </p>
              <p className={styles.slotTitle}>
                {recurringDatesRange && toLongDate(recurringDatesRange[0])} -{' '}
                {recurringDatesRange && toLongDate(recurringDatesRange[1])}
              </p>
            </>
          ) : (
            <>
              <p className={styles.titlePrefix}>Create Session Slot for </p>
              <p className={styles.slotTitle}>{selectedDate && toLongDate(selectedDate)}</p>
            </>
          )
        }
        visible={openModal}
        onCancel={handleCancel}
        footer={null}
      >
        <>
          <Row className={classNames(styles.mt10, styles.mb10)}>
            <Col xs={24} md={{ span: 18, offset: 3 }}>
              {form?.map((slot, index) => (
                <Row className={styles.m10} key={slot.start_time}>
                  <Col xs={11} md={11}>
                    <Select
                      value={slot.start_time && toShortTimeWithPeriod(slot.start_time)}
                      style={{ width: 120 }}
                      onChange={(value) => handleSelectChange('start_time', value, index)}
                      placeholder="Start time"
                      disabled={!slot.inventory_id && slot.num_participants === 0 ? false : true}
                    >
                      {slotsList?.map((item) => {
                        if (
                          !(
                            getTimeDiff(toLocaleDate(slot.session_date), toLocaleDate(moment()), 'days') === 0 &&
                            getTimeDiff(item.value, moment(), 'minute') <= 0
                          )
                        ) {
                          return (
                            <Option key={item.value} value={item.value}>
                              {item.label}
                            </Option>
                          );
                        }
                        return null;
                      })}
                    </Select>
                  </Col>
                  <Col xs={11} md={11}>
                    <Select
                      disabled={!slot.inventory_id && slot.start_time && slot.num_participants === 0 ? false : true}
                      value={slot.end_time && toShortTimeWithPeriod(slot.end_time)}
                      style={{ width: 120 }}
                      onChange={(value) => handleSelectChange('end_time', value, index)}
                      placeholder="End time"
                    >
                      {slotsList?.map((item) => {
                        if (
                          !(
                            getTimeDiff(toLocaleDate(slot.session_date), toLocaleDate(moment()), 'days') === 0 &&
                            getTimeDiff(item.value, moment(), 'minute') <= 0
                          ) &&
                          getTimeDiff(item.value, slot.start_time, 'minute') > 0
                        ) {
                          return (
                            <Option
                              key={item.value}
                              value={item.value}
                              disabled={disableDuplicateEndTime.includes(toShortTimeWithPeriod(item.value))}
                            >
                              {item.label}
                            </Option>
                          );
                        }
                        return null;
                      })}
                    </Select>
                  </Col>
                  {form.length > 1 && (
                    <Col xs={2} md={2}>
                      {slot?.num_participants > 0 ? (
                        <Tooltip
                          title={
                            <Paragraph className={styles.textWhite}>
                              This is an existing slot which is already booked but{' '}
                              <Text strong className={styles.textWhite}>
                                {' '}
                                you can still delete it{' '}
                              </Text>{' '}
                              and modify this and future dates
                            </Paragraph>
                          }
                        >
                          <Badge dot>
                            <Button shape="circle" onClick={() => handleDeleteSlot(index)} icon={<DeleteFilled />} />
                          </Badge>
                        </Tooltip>
                      ) : (
                        <Tooltip title="Delete">
                          <Button shape="circle" onClick={() => handleDeleteSlot(index)} icon={<DeleteFilled />} />
                        </Tooltip>
                      )}
                    </Col>
                  )}
                </Row>
              ))}
            </Col>
          </Row>

          {recurring ? (
            <>
              <Row justify="center">
                <Col className={styles.textAlignCenter} xs={24} md={{ span: 10, offset: 1 }}>
                  <Button className={styles.mt10} onClick={() => createSession(1)} type="primary">
                    Apply to all {toDayOfWeek(selectedDate)}
                  </Button>
                </Col>
                <Col className={styles.textAlignCenter} xs={24} md={{ span: 10, offset: 1 }}>
                  <Button className={styles.mt10} onClick={() => createSession(2)} type="primary">
                    Apply to multiple days
                  </Button>
                </Col>
              </Row>
              <Row justify="center">
                <Col className={styles.textAlignCenter} xs={24} md={{ span: 12, offset: 3 }}>
                  <Button className={styles.mt10} onClick={() => createSession(0)} type="link">
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
