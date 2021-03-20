import React from 'react';
import classNames from 'classnames';
import AddToCalendar from 'react-add-to-calendar';

import dateUtil from 'utils/date';

import styles from './styles.module.scss';
import { useTranslation } from 'react-i18next';

const {
  timeCalculation: { generateCalendarTimeInfo },
} = dateUtil;

const AddToCalendarButton = ({ type = 'link', eventData, iconOnly = false, buttonText = 'ADD_TO_CAL' }) => {
  const { t: translate } = useTranslation();
  const eventDetails = {
    title: eventData.name,
    description: eventData.page_url,
    location: '',
    ...generateCalendarTimeInfo(eventData.start_time, eventData.end_time),
  };

  const icon = { 'calendar-o': 'left' };

  const buttonIconProps = iconOnly ? { buttonLabel: '', buttonTemplate: icon } : { buttonLabel: translate(buttonText) };

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
