import React, { useState, useCallback, useEffect, useMemo } from 'react';
import moment from 'moment';

import { Row, Col, Spin, Empty, Button, Affix, Space, Typography, DatePicker, message } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';

import apis from 'apis';

import SessionListCard from 'components/DynamicProfileComponents/SessionsProfileComponent/SessionListCard';

import { isAPISuccess } from 'utils/helper';

import styles from './style.module.scss';
import dateUtil from 'utils/date';

const { Title } = Typography;

const {
  formatDate: { toLongDateWithDay },
} = dateUtil;

// TODO: Consider adding virtualized scroll later
// See react-infinite-load or react-virtualized
const SessionDetailedListView = ({ history }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [selectedStartDate, setSelectedStartDate] = useState(moment());
  const [selectedDatePickerDate, setselectedDatePickerDate] = useState(moment());

  const fetchUpcomingSessions = useCallback(async () => {
    setIsLoading(true);

    try {
      const { status, data } = await apis.user.getSessionsByUsername('upcoming');

      if (isAPISuccess(status) && data) {
        setSessions(data);
      }
    } catch (error) {
      message.error('Failed to fetch sessions for creator');
      console.error(error);
    }

    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchUpcomingSessions();
  }, [fetchUpcomingSessions]);

  const handleBackClicked = () => history.goBack();

  const filteredByDateSessions = useMemo(() => {
    let filteredByDate = [];

    sessions
      .filter((session) => moment(session.start_time).isSameOrAfter(selectedStartDate.startOf('day')))
      .forEach((session) => {
        const formattedStartTime = toLongDateWithDay(session.start_time);
        const foundIndex = filteredByDate.findIndex((val) => val.key === formattedStartTime);

        if (foundIndex >= 0) {
          filteredByDate[foundIndex].children.push(session);
        } else {
          filteredByDate.push({
            key: formattedStartTime,
            title: formattedStartTime,
            children: [session],
          });
        }
      });

    return filteredByDate;
  }, [selectedStartDate, sessions]);

  const renderSessionCards = (session) => (
    <Col xs={24} sm={12} key={`${session.session_external_id}_${session.inventory_id}`}>
      <SessionListCard session={session} />
    </Col>
  );

  const renderSessionDateList = (sessionDateData) => (
    <Col xs={24} key={sessionDateData.key}>
      <Space direction="vertical">
        <Title level={4} className={styles.blueText}>
          {' '}
          {sessionDateData.title}{' '}
        </Title>
        <Row gutter={[8, 8]}>{sessionDateData.children.map(renderSessionCards)}</Row>
      </Space>
    </Col>
  );

  const handleDisabledDate = (current) => current.isBefore(moment().startOf('day'));

  const handleChangeDate = (date, dateString) => {
    setSelectedStartDate(date);
    setselectedDatePickerDate(date);
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'smooth',
    });
  };

  return (
    <div className={styles.p10}>
      <Spin size="large" spinning={isLoading} tip="Fetching creator sessions...">
        {sessions.length > 0 ? (
          <>
            <Affix offsetTop={80}>
              <Row gutter={8} className={styles.stickyHeader}>
                <Col xs={4}>
                  <Button
                    className={styles.blueText}
                    size="large"
                    icon={<ArrowLeftOutlined />}
                    onClick={handleBackClicked}
                  />
                </Col>
                <Col xs={20}>
                  <DatePicker
                    size="large"
                    inputReadOnly={true}
                    allowClear={false}
                    className={styles.sessionDatePicker}
                    value={selectedDatePickerDate}
                    format="ddd, DD MMM YYYY"
                    disabledDate={handleDisabledDate}
                    onChange={handleChangeDate}
                  />
                </Col>
              </Row>
            </Affix>
            <Row className={styles.mt30} gutter={[16, 16]} justify="center">
              {filteredByDateSessions.map(renderSessionDateList)}
            </Row>
          </>
        ) : (
          <Empty className={styles.w100} description="No sessions found for creator" />
        )}
      </Spin>
    </div>
  );
};

export default SessionDetailedListView;
