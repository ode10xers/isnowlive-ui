import React, { useMemo, useState } from 'react';
import { useHistory } from 'react-router-dom';
import moment from 'moment';

import { Row, Col, Button, Space, Typography, DatePicker } from 'antd';

import Routes from 'routes';

import SessionListCard from '../SessionListCard';

import dateUtil from 'utils/date';
import { getLocalUserDetails } from 'utils/storage';
import { generateUrlFromUsername, isInCreatorDashboard, preventDefaults } from 'utils/helper';

import styles from './style.module.scss';

const {
  formatDate: { toLongDateWithDay },
} = dateUtil;

const { Title } = Typography;

// NOTE: The actual data that is shown here is inventories
const SessionListView = ({ limit = 2, sessions = [] }) => {
  const history = useHistory();

  const [selectedStartDate, setSelectedStartDate] = useState(moment());
  const [selectedDatePickerDate, setSelectedDatePickerDate] = useState(moment());

  const handleMoreClicked = (e) => {
    preventDefaults(e);

    if (isInCreatorDashboard()) {
      const localUserDetails = getLocalUserDetails();

      window.open(generateUrlFromUsername(localUserDetails?.username ?? 'app') + Routes.list.sessions);
    } else {
      history.push(Routes.list.sessions);
    }
  };

  const filteredByDateSessions = useMemo(() => {
    let filteredByDate = [];

    sessions
      .slice(0, limit)
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
  }, [selectedStartDate, sessions, limit]);

  const renderSessionDateList = (sessionDateData) => (
    <Col xs={24} key={sessionDateData.key}>
      <Space direction="vertical">
        <Title level={4} className={styles.sessionDateSeparator}>
          {sessionDateData.title}
        </Title>
        <Row gutter={[8, 8]}>{sessionDateData.children.map(renderSessionCards)}</Row>
      </Space>
    </Col>
  );

  const renderSessionCards = (session) => (
    <Col xs={24} sm={12} key={`${session.session_external_id}_${session.inventory_id}`}>
      <SessionListCard session={session} />
    </Col>
  );

  const handleDisabledDate = (current) => current.isBefore(moment().startOf('day'));

  const handleChangeDate = (date, dateString) => {
    setSelectedStartDate(date);
    setSelectedDatePickerDate(date);
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'smooth',
    });
  };

  return (
    <div>
      <Row gutter={[16, 16]}>
        <Col xs={24}>
          <div className={styles.sessionDatePickerContainer}>
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
          </div>
        </Col>
        {sessions?.length > 0 && filteredByDateSessions.map(renderSessionDateList)}
        {sessions?.length > limit && (
          <Col xs={24}>
            <Row justify="center">
              <Col>
                <Button className={styles.moreButton} type="primary" onClick={handleMoreClicked}>
                  MORE
                </Button>
              </Col>
            </Row>
          </Col>
        )}
      </Row>
    </div>
  );
};

export default SessionListView;
