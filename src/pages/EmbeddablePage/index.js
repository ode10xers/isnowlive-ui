import React from 'react';

import Passes from 'components/EmbeddableComponents/Passes';
import Videos from 'components/EmbeddableComponents/Videos';
import Courses from 'components/EmbeddableComponents/Courses';
import SessionsList from 'components/EmbeddableComponents/SessionsList';
import Subscriptions from 'components/EmbeddableComponents/Subscriptions';
import CalendarSessions from 'components/EmbeddableComponents/CalendarSessions';
import { widgetComponentsName } from 'utils/widgets';

export default function EmbeddablePage({ widget }) {
  let componentToLoad = null;
  if (widget === widgetComponentsName.CALENDAR.value) {
    componentToLoad = <CalendarSessions />;
  } else if (widget === widgetComponentsName.PASSES.value) {
    componentToLoad = <Passes />;
  } else if (widget === widgetComponentsName.VIDEOS.value) {
    componentToLoad = <Videos />;
  } else if (widget === widgetComponentsName.COURSES.value) {
    componentToLoad = <Courses />;
  } else if (widget === widgetComponentsName.MEMBERSHIPS.value) {
    componentToLoad = <Subscriptions />;
  } else if (widget === 'list') {
    componentToLoad = <SessionsList />;
  }

  window.addEventListener('message', (e) => {
    const { command, data: customStyles } = e.data;

    if (command && command === 'add-custom-styling') {
      console.log('Adding custom styling...');
      console.log(customStyles);
      document.head.insertAdjacentHTML('beforeend', `<style>${customStyles}</style>`);
    }
  });

  return <div>{componentToLoad}</div>;
}
