import React from 'react';

import { Row, Col, Tooltip, Typography, Button } from 'antd';
import {
  DeleteOutlined,
  EyeInvisibleTwoTone,
  EyeOutlined,
  CopyOutlined,
  EditTwoTone,
  VideoCameraAddOutlined,
} from '@ant-design/icons';

import Table from 'components/Table';

import dateUtil from 'utils/date';

import Icons from 'assets/icons';
import styles from './styles.module.scss';

const { Text } = Typography;

const {
  formatDate: { toShortDateWithYear },
} = dateUtil;

const LiveCourses = ({ liveCourses }) => {
  const liveCourseColumns = [
    {
      title: 'Course Name',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => {
        return {
          props: {
            style: {
              borderLeft: `6px solid ${record.color_code || '#FFF'}`,
            },
          },
          children: <Text className={styles.textAlignLeft}> {record?.name} </Text>,
        };
      },
    },
    {
      title: 'Duration',
      dataIndex: 'start_time',
      key: 'start_time',
      width: '180px',
      render: (text, record) => `${toShortDateWithYear(record.start_date)} - ${toShortDateWithYear(record.end_date)}`,
    },
    {
      title: 'Course Session',
      dataIndex: 'session',
      key: 'session',
      render: (text, record) => record.session.name,
    },
    {
      title: 'Price',
      dataIndex: 'price',
      key: 'price',
      width: '100px',
      render: (text, record) => `${record.currency?.toUpperCase()} ${record.price}`,
    },
    {
      title: 'Actions',
      width: '180px',
      render: (text, record) => (
        <Row gutter={8} justify="end">
          <Col xs={4}>
            <Tooltip title="Delete">
              <Button danger block type="text" onClick={() => console.log('Clicked')} icon={<DeleteOutlined />} />
            </Tooltip>
          </Col>
          <Col xs={4}>
            <Tooltip title="Copy Page Link">
              <Button block type="text" onClick={() => console.log('Clicked')} icon={<CopyOutlined />} />
            </Tooltip>
          </Col>
          <Col xs={4}>
            <Tooltip title="Edit Course">
              <Button
                block
                type="text"
                onClick={() => console.log('Clicked')}
                icon={<EditTwoTone twoToneColor="#08979c" />}
              />
            </Tooltip>
          </Col>
          <Col xs={4}>
            {record.is_published ? (
              <Tooltip title="Hide Course">
                <Button block type="link" onClick={() => console.log('Clicked')} icon={<EyeOutlined />} />
              </Tooltip>
            ) : (
              <Tooltip title="Unhide Course">
                <Button
                  block
                  type="text"
                  onClick={() => console.log('Clicked')}
                  icon={<EyeInvisibleTwoTone twoToneColor="#888888" />}
                />
              </Tooltip>
            )}
          </Col>
          <Col xs={4}>
            <Tooltip title="Add Zoom Meeting Details">
              <Button block type="link" onClick={() => console.log('Clicked')} icon={<VideoCameraAddOutlined />} />
            </Tooltip>
          </Col>
          <Col xs={4}>
            <Tooltip title="Show Zoom Meeting Details">
              <Button block type="link" onClick={() => console.log('Clicked')} icon={<Icons.VideoLink />} />
            </Tooltip>
          </Col>
        </Row>
      ),
    },
  ];
  //TODO: Add Buyers and expand mechanic here

  return (
    <div>
      <Table size="small" columns={liveCourseColumns} data={liveCourses} />
    </div>
  );
};

export default LiveCourses;
