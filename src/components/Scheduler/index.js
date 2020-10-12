import React, { useState } from 'react';
import { Calendar, Popover, Modal, Button, List, TimePicker, Form, Space } from 'antd';
import moment from 'moment';
import { MinusCircleOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';

import validationRules from '../../utils/validation';
import { convertSchedulesToLocal } from '../../utils/helper';

import styles from './style.module.scss';

const { RangePicker } = TimePicker;

const Scheduler = ({ sessionSlots, recurring, recurringDatesRange }) => {
  const [value, setValue] = useState(moment());
  const [selectedValue, setSelectedValue] = useState(moment());
  const [visible, setVisible] = useState(false);
  const [slots, setSlots] = useState(convertSchedulesToLocal(sessionSlots));
  const [form] = Form.useForm();

  const onSelect = (value) => {
    // check if slots are presents for selected date
    let slotsForSelectedDate = slots.filter(
      (item) => moment(item.session_date).format('L') === moment(value).format('L')
    );
    form.setFieldsValue({ slots: slotsForSelectedDate.length ? slotsForSelectedDate : [[]] });
    setValue(value);
    setSelectedValue(value);
    setVisible(true);
  };

  const onPanelChange = (value) => {
    setValue(value);
  };

  const handleCancel = () => {
    setVisible(false);
  };

  const getSlotsList = (value) => {
    return slots.filter((event) =>
      moment(event.session_date).format('L') === moment(value).format('L') ? event : null
    );
  };

  const deleteSlot = (slot) => {
    if (window.confirm('Are you sure you want to delete the schedule?')) {
      setSlots(slots.filter((item) => item.id !== slot.id));
    }
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
                <List.Item
                  className={styles.slot}
                  actions={[<EditOutlined />, <DeleteOutlined onClick={() => deleteSlot(item)} />]}
                >
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
    console.log(values);
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
    }
    return false;
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
        title={`Select slot for ${selectedValue && selectedValue.format('Do MMM')}`}
        visible={visible}
        onCancel={handleCancel}
        footer={null}
      >
        <Form form={form} name="slots" onFinish={createOneTimeSession} autoComplete="off">
          <Form.List name="slots">
            {(fields, { add, remove }) => {
              return (
                <div>
                  {fields.map((field, index) => {
                    return (
                      <Space key={field.key} style={{ display: 'flex' }} align="start">
                        <Form.Item {...field} rules={index === 0 ? validationRules.requiredValidation : null}>
                          <RangePicker
                            defaultValue={[field.start_time, field.end_time]}
                            format="HH:mm"
                            onChange={() => add()}
                          />
                        </Form.Item>

                        {index > 0 && (
                          <MinusCircleOutlined
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

          <Form.Item>
            <Button type="primary" htmlType="submit">
              Create Slots
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default Scheduler;
