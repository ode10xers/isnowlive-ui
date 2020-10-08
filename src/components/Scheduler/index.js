import React from 'react';
import { Calendar, Alert, Modal, Button, Badge } from 'antd';
import moment from 'moment';

class Scheduler extends React.Component {
  state = {
    value: moment(),
    selectedValue: moment(),
    visible: false,
    listData: [
      {
        datetime: moment().format(),
        type: 'success',
        content: 'This is usual event.',
      },
      {
        datetime: moment().add(7, 'days').format(),
        type: 'success',
        content: 'This is usual event.',
      },
    ],
  };

  onSelect = (value) => {
    this.setState({
      value,
      selectedValue: value,
      visible: true,
    });
  };

  onPanelChange = (value) => {
    this.setState({ value });
  };

  handleCancel = () => {
    this.setState({ visible: false });
  };

  getListData = (value) => {
    return this.state.listData.filter((event) => {
      return moment(event.datetime).format() === moment(value).format() ? event : null;
    });
  };

  dateCellRender = (value) => {
    const listData = this.getListData(value);
    return (
      <ul className="events">
        {listData.map((item) => (
          <li key={item.content}>
            <Badge status={item.type} text={item.content} />
          </li>
        ))}
      </ul>
    );
  };

  getMonthData = (value) => {
    if (value.month() === 8) {
      return 1394;
    }
  };

  monthCellRender = (value) => {
    const num = this.getMonthData(value);
    return num ? (
      <div className="notes-month">
        <section>{num}</section>
        <span>Backlog number</span>
      </div>
    ) : null;
  };

  createNewEvent = () => {
    const { selectedValue } = this.state;
    let tempDate = selectedValue.format();

    let tempEvent = [
      {
        datetime: tempDate,
        type: 'success',
        content: 'This is usual event.',
      },
    ];

    while (tempDate < moment().endOf('month').format()) {
      tempDate = moment(tempDate).add(7, 'days').format();
      tempEvent.push({
        datetime: tempDate,
        type: 'success',
        content: 'This is usual event.',
      });
    }
    console.log('=====', tempEvent);
    this.setState({
      listData: [...this.state.listData, ...tempEvent],
      visible: false,
    });
  };

  render() {
    const { value, selectedValue } = this.state;
    return (
      <>
        <Calendar
          value={value}
          onSelect={this.onSelect}
          onPanelChange={this.onPanelChange}
          dateCellRender={this.dateCellRender}
          monthCellRender={this.monthCellRender}
        />
        <Modal
          title={<Alert message={`You selected date: ${selectedValue && selectedValue.format('YYYY-MM-DD')}`} />}
          visible={this.state.visible}
          onOk={this.handleCancel}
          onCancel={this.handleCancel}
        >
          <Button type="primary" onClick={this.createNewEvent}>
            {'Select all ' + selectedValue.format('dddd')}
          </Button>
        </Modal>
      </>
    );
  }
}

export default Scheduler;
