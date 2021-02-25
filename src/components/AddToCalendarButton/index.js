import React from 'react';
import moment from 'moment';

import styles from './styles.module.scss';

const AddToCalendarButton = ({ type = 'primary', eventDetails = null }) => {
  const generateGoogleCalendarLink = (eventData) => {
    const gCalEventDate = `${moment(eventData.startTime).utc().format('YYYYMMDD[T]HHmmss[Z]')}/${moment(
      eventData.endTime
    )
      .utc()
      .format('YYYYMMDD[T]HHmmss[Z]')}`;

    const searchParams = [
      `action=TEMPLATE`,
      `text=${encodeURIComponent(eventData.title)}`,
      `dates=${encodeURIComponent(gCalEventDate)}`,
      `details=${encodeURIComponent(eventData.details)}`,
    ].join('&');

    return `https://www.google.com/calendar/render?${searchParams}`;
  };

  return <div></div>;
};

export default AddToCalendarButton;
