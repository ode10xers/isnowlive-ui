import React from 'react';
import moment from 'moment';
import { Divider, Typography } from 'antd';
import MobileDetect from 'mobile-detect';

import styles from './styles.module.scss';

const { Title, Text } = Typography;

const SessionDate = ({ schedule }) => {
  const md = new MobileDetect(window.navigator.userAgent);
  const isMobileDevice = Boolean(md.mobile());
  return (
    <div className={styles.box}>
      <div className={styles.date}>{moment(schedule?.schedule_date).format('DD')}</div>
      <Title className={styles.month} level={isMobileDevice ? 5 : 3}>
        {moment(schedule?.schedule_date).format('MMM')}
      </Title>
      <Divider className={styles.divider} type="vertical" />
      <Title className={styles.day} level={isMobileDevice ? 5 : 3}>
        {moment(schedule?.schedule_date).format('dddd')}
      </Title>
      <Text className={styles.time}>
        {moment(schedule?.start_time).format('LT')} {' -'} {moment(schedule?.end_time).format('LT')}
      </Text>
    </div>
  );
};

export default SessionDate;
