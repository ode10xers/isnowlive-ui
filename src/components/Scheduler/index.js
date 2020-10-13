import React, { useState, useRef } from 'react';
import { Calendar, Popover, Modal, Button, List, TimePicker, Form, Space, Input, Row, Col } from 'antd';
import moment from 'moment';
import { DeleteFilled } from '@ant-design/icons';

import validationRules from '../../utils/validation';
import { convertSchedulesToLocal } from '../../utils/helper';

import styles from './style.module.scss';

const { RangePicker } = TimePicker;

const Scheduler = ({ sessionSlots, recurring, recurringDatesRange }) => {
  const [value, setValue] = useState(moment());
  const [selectedValue, setSelectedValue] = useState(moment());
  const [openModal, setOpenModal] = useState(false);
  const [slots, setSlots] = useState(convertSchedulesToLocal(sessionSlots));
  const typeOfSessionCreation = useRef(0);
  const [form] = Form.useForm();

  const onSelect = (value) => {
    if (moment(value).endOf('day') >= moment().startOf('day')) {
      // check if slots are presents for selected date
      let slotsForSelectedDate = slots.filter(
        (item) => moment(item.session_date).format('L') === moment(value).format('L')
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
      setValue(value);
      setSelectedValue(value);
      setOpenModal(true);
    }
  };

  const onPanelChange = (value) => {
    setValue(value);
  };

  const handleCancel = () => {
    setOpenModal(false);
  };

  const getSlotsList = (value) => {
    return slots.filter((event) =>
      moment(event.session_date).format('L') === moment(value).format('L') ? event : null
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
                  {moment(item['start_time']).format('LT')}
                  {' - '} {moment(item['end_time']).format('LT')}
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
                {moment(item['start_time']).format('LT')}
                {' - '} {moment(item['end_time']).format('LT')}
              </List.Item>
            )}
          />
        </Popover>
      );
    } else {
      return null;
    }
  };

  const createOneTimeSession = (values) => {
    console.log('Timepicker values:', values);
    // remove all the slots for selected date
    let tempslots = slots.filter((item) => moment(item.session_date).format('L') !== moment(value).format('L'));
    // adding slots values for that dat
    for (let i = 0; i < values.slots.length; i++) {
      if (values.slots[i].slot?.length) {
        let value = values.slots[i];
        // work around get concat selected date and slot times as timepicker gives date as current date
        let start_time = moment(values.slots[i].slot[0]).format('hh:mm');
        let end_time = moment(values.slots[i].slot[1]).format('hh:mm');
        let selected_date = moment(selectedValue).format('YYYY-MM-DD');

        value.session_date = moment(selectedValue).format();
        value.start_time = moment(selected_date + ' ' + start_time).format();
        value.end_time = moment(selected_date + ' ' + end_time).format();
        tempslots = [...tempslots, value];
      }
    }
    console.log('Final Slots:', tempslots);
    return tempslots;
  };

  const createSchedulesAllSelectedDay = (values) => {};

  const createSession = (values) => {
    let tempSlots = slots;
    switch (typeOfSessionCreation.current) {
      case 0:
        tempSlots = createOneTimeSession(values);
        handleCancel();
        break;
      case 1:
        tempSlots = createSchedulesAllSelectedDay(values);
        handleCancel();
        break;
      case 2:
        break;
      case 3:
        tempSlots = createOneTimeSession(values);
        handleCancel();
        break;
      default:
        createOneTimeSession(values);
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
        if (slots.filter((item) => moment(item.session_date).format('L') === moment(currentDate).format('L')).length) {
          return false;
        } else {
          return true;
        }
      }
    } else {
      if (moment(currentDate).endOf('day') < moment().startOf('day')) {
        // check if it's within defined schedules
        if (slots.filter((item) => moment(item.session_date).format('L') === moment(currentDate).format('L')).length) {
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
        value={value}
        disabledDate={handleDisableDate}
        onSelect={onSelect}
        onPanelChange={onPanelChange}
        dateCellRender={dateCellRender}
      />

      <Modal
        title={
          recurring
            ? `Add Session Slot: ${recurringDatesRange && moment(recurringDatesRange[0]).format('Do MMM YYYY')} - ${
                recurringDatesRange && moment(recurringDatesRange[1]).format('Do MMM YYYY')
              }`
            : `Create Session Slot for ${selectedValue && selectedValue.format('Do MMM YYYY')}`
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
                      {fields.map((field, index) => {
                        return (
                          <Space key={field.key} style={{ display: 'flex' }} align="start">
                            <Form.Item {...field} name={[field.name, 'id']}>
                              <Input type="hidden" />
                            </Form.Item>
                            <Form.Item {...field} name={[field.name, 'session_date']}>
                              <Input type="hidden" />
                            </Form.Item>
                            <Form.Item
                              {...field}
                              name={[field.name, 'slot']}
                              rules={index === 0 ? validationRules.requiredValidation : null}
                            >
                              <RangePicker format="HH:mm" onChange={() => add()} />
                            </Form.Item>

                            {index > 0 && (
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
            <Row>
              <Col span={4} offset={4}>
                <Form.Item>
                  <Button htmlType="submit" onClick={() => (typeOfSessionCreation.current = 1)} type="primary">
                    Apply to all {moment(selectedValue).format('dddd')}
                  </Button>
                </Form.Item>
              </Col>
              <Col span={4} offset={4}>
                <Form.Item>
                  <Button htmlType="submit" onClick={() => (typeOfSessionCreation.current = 2)} type="primary">
                    Apply to multiple days
                  </Button>
                </Form.Item>
              </Col>
              <Col span={12} offset={6}>
                <Form.Item>
                  <Button htmlType="submit" onClick={() => (typeOfSessionCreation.current = 0)} type="link">
                    Apply to {moment(selectedValue).format('Do MMM YYYY')} only
                  </Button>
                </Form.Item>
              </Col>
            </Row>
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
