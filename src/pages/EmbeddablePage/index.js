import React from 'react';

import CalendarSessions from '../../components/EmbeddableComponents/CalendarSessions';
import Passes from '../../components/EmbeddableComponents/Passes';
import Videos from '../../components/EmbeddableComponents/Videos';
import Courses from '../../components/EmbeddableComponents/Courses';
import Subscriptions from '../../components/EmbeddableComponents/Subscriptions';

export default function EmbeddablePage({ widget }) {
  let componentToLoad = null;
  if (widget === 'calendar') {
    componentToLoad = <CalendarSessions />;
  } else if (widget === 'passes') {
    componentToLoad = <Passes />;
  } else if (widget === 'videos') {
    componentToLoad = <Videos />;
  } else if (widget === 'courses') {
    componentToLoad = <Courses />;
  } else if (widget === 'memberships') {
    componentToLoad = <Subscriptions />;
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
