import React from 'react';
import classNames from 'classnames';
import AddToCalendar from 'react-add-to-calendar';

import dateUtil from 'utils/date';
import { generateUrlFromUsername } from 'utils/url';

import styles from './styles.module.scss';

const {
  timeCalculation: { generateCalendarTimeInfo },
} = dateUtil;

const AddToCalendarButton = ({ type = 'link', eventData, showIcon = false, buttonText = 'Add To Cal' }) => {
  const generateEventDescription = () => {
    if (eventData.is_offline) {
      return `You can see the event details in this <a href="${eventData.page_url}">page</a>.\n\nThe event itself is an offline event that will be held in <b>${eventData.offline_event_address}</b>`;
    } else {
      return `You can see the event details in this <a href="${
        eventData.page_url
      }">page</a>.\n\nYou can also join from your <a href="${generateUrlFromUsername(
        eventData?.username || eventData?.creator_username
      )}/attendee/dashboard">dashboard</a> `;
    }
  };

  const eventDetails = {
    title: eventData.name,
    description: generateEventDescription(),
    location: '',
    ...generateCalendarTimeInfo(eventData.start_time, eventData.end_time),
  };

  const icon = { 'calendar-plus-o': 'left' };

  const buttonIconProps = showIcon ? { buttonLabel: buttonText, buttonTemplate: icon } : { buttonLabel: buttonText };

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
