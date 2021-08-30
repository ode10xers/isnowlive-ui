import React from 'react';
import { Divider, Typography } from 'antd';

import dateUtil from 'utils/date';

import styles from './styles.module.scss';

const { Title, Text } = Typography;
const {
  formatDate: { toLocaleTime, toShortMonth, toDate, toShortDayOfWeek },
  timezoneUtils: { getCurrentLongTimezone },
} = dateUtil;

const SessionDate = ({ schedule }) => {
  return (
    <div className={styles.box}>
      <div className={styles.date}>{toDate(schedule?.start_time)}</div>
      <Title className={styles.month} level={4}>
        {toShortMonth(schedule?.start_time)}
      </Title>
      <Divider className={styles.divider} type="vertical" />
      <Title className={styles.shortday} level={4}>
        {toShortDayOfWeek(schedule?.start_time)}
      </Title>
      <div className={styles.container}>
        <Text className={styles.time}>
          {toLocaleTime(schedule?.start_time)} {' -'} {toLocaleTime(schedule?.end_time)}
        </Text>
        <br />
        <Text className={styles.timezone}>{getCurrentLongTimezone()}</Text>
      </div>
      <Divider className={styles.divider} type="vertical" />
      <Text className={styles.shortday} type="secondary">
        Session Type
      </Text>
      <br />
      <Text className={styles.subText}>{schedule?.group ? 'Group' : '1-on-1'}</Text>
    </div>
  );
};

export default SessionDate;
