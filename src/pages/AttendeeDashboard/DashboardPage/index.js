import React, { useState, useCallback, useEffect } from 'react';

import { Row, Col, Typography, message } from 'antd';
import { BookTwoTone } from '@ant-design/icons';

import apis from 'apis';

import dateUtil from 'utils/date';

import Table from 'components/Table';

import { getDuration, isAPISuccess, isUnapprovedUserError } from 'utils/helper';

import styles from './styles.module.scss';

const {
  formatDate: { toLocaleTime, toLongDateWithDay, toLocaleDate },
} = dateUtil;

const { Text } = Typography;

const whiteColor = '#ffffff';

const DashboardPage = ({ match, history }) => {
  const [isSessionLoading, setIsSessionLoading] = useState(false);
  const [upcomingSessions, setUpcomingSessions] = useState([]);
  const [filteredByDateSessions, setFilteredByDateSessions] = useState([]);

  //#region Start of API Calls

  const fetchAttendeeUpcomingSessions = useCallback(async () => {
    setIsSessionLoading(true);

    try {
      const { status, data } = await apis.session.getAttendeeUpcomingSession();

      if (isAPISuccess(status) && data) {
        console.log('Session Data');
        console.log(data.slice(0, 2));

        let filterByDateSessions = [];
        // NOTE: How much date to show in the UI
        const dayLimit = 4;

        data.forEach((session) => {
          if (filterByDateSessions.length >= dayLimit) {
            return;
          }

          const foundIndex = filterByDateSessions.findIndex(
            (val) => val.start_time === toLocaleDate(session.start_time)
          );

          if (foundIndex >= 0) {
            filterByDateSessions[foundIndex].children.push(session);
          } else {
            filterByDateSessions.push({
              start_time: toLocaleDate(session.start_time),
              name: session.start_time,
              is_date: true,
              children: [session],
            });
          }
        });

        setUpcomingSessions(data);
        setFilteredByDateSessions(filterByDateSessions);

        // if (filterByDateSessions.length > 0) {
        //   setExpandedRowKeys([filterByDateSessions[0].start_time]);
        // }
      }
    } catch (error) {
      if (!isUnapprovedUserError(error.response)) {
        message.error(error.response?.data?.message || 'Something went wrong.');
      }
    }

    setIsSessionLoading(false);
  }, []);

  //#endregion End of API Calls

  //#region Start of Use Effects

  useEffect(() => {
    fetchAttendeeUpcomingSessions();
  }, [fetchAttendeeUpcomingSessions]);

  //#endregion End of Use Effects

  //#region Start of Business Logics

  //#endregion End of Business Logics

  //#region Start of Table Columns

  const sessionTableColumns = [
    {
      title: 'Session Name',
      dataIndex: 'name',
      key: 'name',
      width: '220px',
      render: (text, record) => ({
        props: {
          style: {
            borderLeft: `6px solid ${record.color_code || whiteColor}`,
          },
        },
        children: (
          <>
            <Text className={styles.sessionNameWrapper}>{record.name}</Text>{' '}
            {record.is_course ? <BookTwoTone twoToneColor="#1890ff" /> : null}
          </>
        ),
      }),
    },
    {
      title: 'Type',
      dataIndex: 'max_participants',
      key: 'max_participants',
      width: '72px',
      render: (text, record) => (record?.max_participants > 1 ? 'Group' : '1-on-1'),
    },
    {
      title: 'Day',
      // TODO: use other keys
      dataIndex: 'start_time',
      key: 'start_time',
      width: '100px',
      render: (text, record) => (record?.start_time ? toLongDateWithDay(record?.start_time) : '-'),
    },
    {
      title: 'Duration',
      dataIndex: 'start_time',
      key: 'start_time',
      width: '90px',
      render: (text, record) =>
        record?.start_time && record?.end_time ? getDuration(record?.start_time, record?.end_time) : '-',
    },
    {
      title: 'Time',
      dataIndex: 'end_time',
      key: 'end_time',
      width: '165px',
      render: (text, record) =>
        record?.start_time && record?.end_time
          ? `${toLocaleTime(record?.start_time)} - ${toLocaleTime(record?.end_time)}`
          : '-',
    },
  ];
  //#endregion End of Table Columns

  //#region Start of Render Methods

  //#endregion End of Render Methods

  //#region Start of Mobile UI Handlers

  //#endregion End of Mobile UI Handlers

  return (
    <div className={styles.dashboardContainer}>
      <Row gutter={[12, 12]} justify="center" align="middle">
        {/* Sessions Section */}
        <Col xs={24}>
          <div className={styles.sessionsContainer}>
            <Table
              columns={sessionTableColumns}
              data={upcomingSessions.slice(0, 4)}
              loading={isSessionLoading}
              rowKey={(record) => record.session_external_id}
            />
          </div>
        </Col>
        {/* Videos Section */}
        <Col xs={24}></Col>
        {/* Courses Section */}
        <Col xs={24}></Col>
      </Row>
    </div>
  );
};

export default DashboardPage;
