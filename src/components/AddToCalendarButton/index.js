import React from 'react';
import classNames from 'classnames';
import AddToCalendar from 'react-add-to-calendar';

import dateUtil from 'utils/date';

import styles from './styles.module.scss';

const {
  timeCalculation: { generateCalendarTimeInfo },
} = dateUtil;

const AddToCalendarButton = ({ type = 'link', eventData, iconOnly = false, buttonText = 'Add To Cal' }) => {
  const eventDetails = {
    title: eventData.name,
    description: eventData.page_url,
    location: '',
    ...generateCalendarTimeInfo(eventData.start_time, eventData.end_time),
  };

  const icon = { 'calendar-o': 'left' };

  const buttonIconProps = iconOnly ? { buttonLabel: '', buttonTemplate: icon } : { buttonLabel: buttonText };

  return (
    <AddToCalendar
      event={eventDetails}
      {...buttonIconProps}
      dropdownClass={styles.atcDropdown}
      buttonWrapperClass={classNames(styles.atcWrapper, type === 'button' ? styles.button : undefined)}
      rootClass={styles.atc}
    />
  );
};

export default AddToCalendarButton;
