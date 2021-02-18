import React from 'react';

import { Row, Col, Tooltip, Typography, Button } from 'antd';
import {
  CopyOutlined,
  EditTwoTone,
  DownOutlined,
  // UpOutlined,
} from '@ant-design/icons';

import Table from 'components/Table';

import dateUtil from 'utils/date';

import styles from './styles.module.scss';

const { Text } = Typography;

const {
  formatDate: { toShortDateWithYear },
} = dateUtil;

const LiveCourses = ({ liveCourses, showEditModal }) => {
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
      width: '170px',
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
      width: '85px',
      render: (text, record) => `${record.currency?.toUpperCase()} ${record.price}`,
    },
    {
      title: 'Actions',
      width: '250px',
      render: (text, record) => (
        <Row gutter={8} justify="end">
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
                onClick={() => showEditModal(record)}
                icon={<EditTwoTone twoToneColor="#08979c" />}
              />
            </Tooltip>
          </Col>
          <Col xs={6}>
            {record.is_published ? (
              <Tooltip title="Hide Course">
                <Button danger block type="link" onClick={() => console.log('Clicked')}>
                  Hide
                </Button>
              </Tooltip>
            ) : (
              <Tooltip title="Unhide Course">
                <Button block className={styles.successBtn} onClick={() => console.log('Clicked')}>
                  Show
                </Button>
              </Tooltip>
            )}
          </Col>
          <Col xs={10}>
            <Button block type="link" onClick={() => console.log('Clicked')}>
              {record.buyers?.length} Buyers <DownOutlined />
            </Button>
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
