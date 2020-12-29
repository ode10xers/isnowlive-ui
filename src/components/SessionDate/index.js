import React from 'react';
import { Divider, Typography } from 'antd';

import { isMobileDevice } from 'utils/device';
import dateUtil from 'utils/date';

import styles from './styles.module.scss';

const { Title, Text } = Typography;
const {
  formatDate: { toLocaleTime, toShortMonth, toDate, toDayOfWeek, toShortDayOfWeek },
  timezoneUtils: { getCurrentLongTimezone },
} = dateUtil;

const SessionDate = ({ schedule }) => {
  return (
    <div className={styles.box}>
      <div className={styles.date}>{toDate(schedule?.start_time)}</div>
      <Title className={styles.month} level={isMobileDevice ? 5 : 3}>
        {toShortMonth(schedule?.start_time)}
      </Title>
      <Divider className={styles.divider} type="vertical" />
      <Title className={styles.shortday} level={5}>
        {toShortDayOfWeek(schedule?.start_time)}
      </Title>
      <Title className={styles.longday} level={3}>
        {toDayOfWeek(schedule?.start_time)}
      </Title>
      <Text className={styles.time}>
        {toLocaleTime(schedule?.start_time)} {' -'} {toLocaleTime(schedule?.end_time)} <br />
        {getCurrentLongTimezone()}
      </Text>
    </div>
  );
};

export default SessionDate;
