import React from 'react';

import CalendarSessions from '../../components/EmbeddableComponents/CalendarSessions';
import Passes from '../../components/EmbeddableComponents/Passes';
import Videos from '../../components/EmbeddableComponents/Videos';

export default function EmbeddablePage({ widget }) {
  const profileUsername = window.location.hostname.split('.')[0] || '';

  let componentToLoad = null;
  if (widget === 'calendar') {
    componentToLoad = <CalendarSessions profileUsername={profileUsername} />;
  } else if (widget === 'passes') {
    componentToLoad = <Passes profileUsername={profileUsername} />;
  } else if (widget === 'videos') {
    componentToLoad = <Videos profileUsername={profileUsername} />;
  }

  return <div style={{ padding: '20px' }}>{componentToLoad}</div>;
}
