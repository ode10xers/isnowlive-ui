import React from 'react';

import CalendarSessions from '../../components/EmbeddableComponents/CalendarSessions';
import parseQueryString from 'utils/parseQueryString';

export default function EmbeddablePage() {
  const location = window.location;
  const { widgetType } = parseQueryString(location.search);

  let componentToLoad = null;
  if (widgetType === 'calendar') {
    componentToLoad = <CalendarSessions />;
  }

  return <div style={{ padding: '20px' }}>{componentToLoad}</div>;
}
