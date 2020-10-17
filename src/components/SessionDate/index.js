import React from 'react';
import { Divider, Typography } from 'antd';

import isMobileDevice from '../../utils/device';
import dateUtil from '../../utils/date';

import styles from './styles.module.scss';

const { Title, Text } = Typography;
const {
  formatDate: { toLocaleTime, toShortMonth, toDate, toDayOfWeek },
} = dateUtil;

const SessionDate = ({ schedule }) => {
  return (
    <div className={styles.box}>
      <div className={styles.date}>{toDate(schedule?.schedule_date)}</div>
      <Title className={styles.month} level={isMobileDevice ? 5 : 3}>
        {toShortMonth(schedule?.schedule_date)}
      </Title>
      <Divider className={styles.divider} type="vertical" />
      <Title className={styles.day} level={isMobileDevice ? 5 : 3}>
        {toDayOfWeek(schedule?.schedule_date)}
      </Title>
      <Text className={styles.time}>
        {toLocaleTime(schedule?.start_time)} {' -'} {toLocaleTime(schedule?.end_time)}
      </Text>
    </div>
  );
};

export default SessionDate;
