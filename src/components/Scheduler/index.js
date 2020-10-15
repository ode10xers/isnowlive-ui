import React, { useState, useEffect, useRef } from 'react';
import { Calendar, Popover, Modal, Button, List, TimePicker, Form, Space, Input, Row, Col, Checkbox } from 'antd';
import moment from 'moment';
import { DeleteFilled } from '@ant-design/icons';

import validationRules from '../../utils/validation';
import {
  convertSchedulesToLocal,
  getLocalTimeFormat,
  getLocalDateFormat,
  getLocalDayFormat,
  getLocalDateFormat2,
  getLocalTimeFormat2,
  getLocalDateFormat3,
} from '../../utils/helper';

import styles from './style.module.scss';

const { RangePicker } = TimePicker;

const Scheduler = ({ sessionSlots, recurring, recurringDatesRange, handleSlotsChange }) => {
  const typeOfSessionCreation = useRef(0);
  const [form] = Form.useForm();
  const [date, setDate] = useState(moment());
  const [selectedDate, setSelectedDate] = useState(moment());
  const [openModal, setOpenModal] = useState(false);
  const [slots, setSlots] = useState(convertSchedulesToLocal(sessionSlots));
  const [dayList, setDayList] = useState(null);

  useEffect(() => {
    if (slots) {
      handleSlotsChange(slots);
    }
    // eslint-disable-next-line
  }, [slots]);

  const onSelect = (value) => {
    if (moment(value).endOf('day') >= moment().startOf('day')) {
      // check if slots are presents for selected date
      const slotsForSelectedDate = slots.filter(
        (item) => getLocalDateFormat(item.session_date) === getLocalDateFormat(value)
      );
      const tempSlots = slotsForSelectedDate.map((obj) => ({
        id: obj.id,
        session_date: moment(obj.session_date),
        slot: [moment(obj.start_time), moment(obj.end_time)],
      }));
      let defaultSlot = { id: undefined, session_date: moment(value).format(), slot: [] };

      form.setFieldsValue({
        slots: slotsForSelectedDate.length ? [...tempSlots, defaultSlot] : [defaultSlot],
      });
      setDate(value);
      setSelectedDate(value);
      setOpenModal(true);
    }
  };

  const onPanelChange = (value) => {
    setDate(value);
  };

  const handleCancel = () => {
    setOpenModal(false);
  };

  const getSlotsList = (value) => {
    return slots.filter((event) =>
      getLocalDateFormat(event.session_date) === getLocalDateFormat(value) ? event : null
    );
  };

  const dateCellRender = (value) => {
    const tempSlots = getSlotsList(value);
    if (tempSlots.length) {
      return (
        <Popover
          content={
            <List
              size="small"
              bordered
              dataSource={tempSlots}
              renderItem={(item) => (
                <List.Item className={styles.slot}>
                  {getLocalTimeFormat(item['start_time'])}
                  {' - '} {getLocalTimeFormat(item['end_time'])}
                </List.Item>
              )}
            />
          }
          title="Slot"
        >
          <List
            size="small"
            bordered
            dataSource={tempSlots}
            renderItem={(item) => (
              <List.Item className={styles.slot}>
                {getLocalTimeFormat(item['start_time'])}
                {' - '} {getLocalTimeFormat(item['end_time'])}
              </List.Item>
            )}
          />
        </Popover>
      );
    } else {
      return null;
    }
  };

  const createOneTimeSchedule = (values, givenDate, givenSlots) => {
    // remove all the slots for selected date
    let tempSlots = givenSlots.filter(
      (item) => getLocalDateFormat(item.session_date) !== getLocalDateFormat(givenDate)
    );
    // adding slots values for that selected date
    const { slots: valuesSlots } = values;

    valuesSlots.forEach((vs) => {
      if (vs.slot?.length) {
        let value = vs;
        // work around get concat selected date and slot times as timepicker gives date as current date
        let start_time = getLocalTimeFormat2(vs.slot[0]);
        let end_time = getLocalTimeFormat2(vs.slot[1]);
        let selected_date = moment(givenDate);

        value.session_date = selected_date.format();
        value.start_time = moment(getLocalDateFormat3(selected_date) + ' ' + start_time).format();
        value.end_time = moment(getLocalDateFormat3(selected_date) + ' ' + end_time).format();

        // NOTE: deep clone the object else moment dates will be mutate
        tempSlots.push(JSON.parse(JSON.stringify(value)));
      }
    });

    return tempSlots;
  };

  const createSchedulesAllSelectedDay = (values) => {
    let tempSlots = slots;
    const startDate = recurringDatesRange && getLocalDateFormat(recurringDatesRange[0]);
    const endDate = recurringDatesRange && getLocalDateFormat(moment(recurringDatesRange[1]).add(1, 'days'));
    let selected_date = getLocalDateFormat(selectedDate);

    while (moment(selected_date).isBetween(startDate, endDate)) {
      tempSlots = createOneTimeSchedule(values, selected_date, tempSlots);
      selected_date = getLocalDateFormat(moment(selected_date).add(7, 'days'));
    }
    return tempSlots;
  };

  const createSchedulesMultipleDays = (values) => {
    let tempSlots = slots;
    const startDate = recurringDatesRange && getLocalDateFormat(recurringDatesRange[0]);
    const endDate = recurringDatesRange && getLocalDateFormat(moment(recurringDatesRange[1]).add(1, 'days'));
    let selected_date = getLocalDateFormat(selectedDate);

    let slotdates = [];
    while (moment(selected_date).isBetween(startDate, endDate)) {
      if (dayList.includes(getLocalDayFormat(selected_date))) {
        slotdates.push(selected_date);
      }
      selected_date = getLocalDateFormat(moment(selected_date).add(1, 'days'));
    }

    slotdates.forEach((date) => {
      tempSlots = createOneTimeSchedule(values, date, tempSlots);
    });
    return tempSlots;
  };

  const createSession = (values) => {
    let tempSlots = slots;
    switch (typeOfSessionCreation.current) {
      case 0:
        tempSlots = createOneTimeSchedule(values, selectedDate, slots);
        handleCancel();
        break;
      case 1:
        tempSlots = createSchedulesAllSelectedDay(values);
        handleCancel();
        break;
      case 2:
        setDayList([getLocalDayFormat(selectedDate)]);
        break;
      case 3:
        tempSlots = createSchedulesMultipleDays(values);
        setDayList(null);
        handleCancel();
        break;
      default:
        createOneTimeSchedule(values, selectedDate, slots);
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
        if (slots.filter((item) => getLocalDateFormat(item.session_date) === getLocalDateFormat(currentDate)).length) {
          return false;
        } else {
          return true;
        }
      }
    } else {
      if (moment(currentDate).endOf('day') < moment().startOf('day')) {
        // check if it's within defined schedules
        if (slots.filter((item) => getLocalDateFormat(item.session_date) === getLocalDateFormat(currentDate)).length) {
          return false;
        } else {
          return true;
        }
      }
      return false;
    }
  };

  return (
    <>
      <Calendar
        value={date}
        disabledDate={handleDisableDate}
        onSelect={onSelect}
        onPanelChange={onPanelChange}
        dateCellRender={dateCellRender}
      />

      <Modal
        title={
          recurring
            ? `Add Session Slot: ${recurringDatesRange && getLocalDateFormat2(recurringDatesRange[0])} - ${
                recurringDatesRange && getLocalDateFormat2(recurringDatesRange[1])
              }`
            : `Create Session Slot for ${selectedDate && getLocalDateFormat2(selectedDate)}`
        }
        visible={openModal}
        onCancel={handleCancel}
        footer={null}
      >
        <Form form={form} name="slots" onFinish={createSession} autoComplete="off">
          <Row>
            <Col span={18} offset={3}>
              <Form.List name="slots">
                {(fields, { add, remove }) => {
                  return (
                    <div>
                      {fields.map((field) => {
                        return (
                          <Space key={field.key} className={styles.inline} align="start">
                            <Form.Item {...field} name={[field.name, 'id']}>
                              <Input type="hidden" />
                            </Form.Item>
                            <Form.Item {...field} name={[field.name, 'session_date']}>
                              <Input type="hidden" />
                            </Form.Item>
                            <Form.Item
                              {...field}
                              name={[field.name, 'slot']}
                              rules={fields.length === 1 ? validationRules.requiredValidation : null}
                            >
                              <RangePicker format="HH:mm" onChange={() => add()} />
                            </Form.Item>

                            {fields.length > 1 && (
                              <DeleteFilled
                                onClick={() => {
                                  remove(field.name);
                                }}
                              />
                            )}
                          </Space>
                        );
                      })}
                    </div>
                  );
                }}
              </Form.List>
            </Col>
          </Row>
          {recurring ? (
            <>
              <Row justify="center">
                <Col span={10} offset={1}>
                  <Form.Item>
                    <Button htmlType="submit" onClick={() => (typeOfSessionCreation.current = 1)} type="primary">
                      Apply to all {getLocalDayFormat(selectedDate)}
                    </Button>
                  </Form.Item>
                </Col>
                <Col span={10} offset={1}>
                  <Form.Item>
                    <Button htmlType="submit" onClick={() => (typeOfSessionCreation.current = 2)} type="primary">
                      Apply to multiple days
                    </Button>
                  </Form.Item>
                </Col>
              </Row>
              <Row justify="center">
                <Col span={12} offset={3}>
                  <Form.Item>
                    <Button htmlType="submit" onClick={() => (typeOfSessionCreation.current = 0)} type="link">
                      Apply to {getLocalDateFormat2(selectedDate)} only
                    </Button>
                  </Form.Item>
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
                    <Form.Item>
                      <Button
                        htmlType="submit"
                        onClick={() => (typeOfSessionCreation.current = 3)}
                        type="primary"
                        ghost
                      >
                        Apply
                      </Button>
                    </Form.Item>
                  </Col>
                  <Col span={4} offset={4}>
                    <Form.Item className={styles.ml20}>
                      <Button onClick={handleCancel}>Cancel</Button>
                    </Form.Item>
                  </Col>
                </Row>
              )}
            </>
          ) : (
            <Row>
              <Col span={4} offset={4}>
                <Form.Item>
                  <Button htmlType="submit" onClick={() => (typeOfSessionCreation.current = 0)} type="primary" ghost>
                    Apply
                  </Button>
                </Form.Item>
              </Col>
              <Col span={4} offset={4}>
                <Form.Item className={styles.ml20}>
                  <Button onClick={handleCancel}>Cancel</Button>
                </Form.Item>
              </Col>
            </Row>
          )}
        </Form>
      </Modal>
    </>
  );
};

export default Scheduler;
