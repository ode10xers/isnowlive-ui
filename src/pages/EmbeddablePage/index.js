import React, { lazy, Suspense } from 'react';

import { localStoragePluginStylingKeyPrefix, widgetComponentsName } from 'utils/widgets';

const Passes = lazy(() => import('components/EmbeddableComponents/Passes'));
const Videos = lazy(() => import('components/EmbeddableComponents/Videos'));
const Courses = lazy(() => import('components/EmbeddableComponents/Courses'));
const SessionsList = lazy(() => import('components/EmbeddableComponents/SessionsCardsList'));
const Subscriptions = lazy(() => import('components/EmbeddableComponents/Subscriptions'));
const CalendarSessions = lazy(() => import('components/EmbeddableComponents/CalendarSessions'));
const AvailabilitiesPlugin = lazy(() => import('components/EmbeddableComponents/AvailabilitiesPlugin'));
const InventoryList = lazy(() => import('components/EmbeddableComponents/InventoryList'));

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
  } else if (widget === widgetComponentsName.LIST.value) {
    componentToLoad = <SessionsList />;
  } else if (widget === widgetComponentsName.AVAILABILITY.value) {
    componentToLoad = <AvailabilitiesPlugin />;
  } else if (widget === widgetComponentsName.INVENTORIES.value) {
    componentToLoad = <InventoryList />;
  }

  localStorage.removeItem(`${localStoragePluginStylingKeyPrefix}${widget}`);

  window.addEventListener('message', (e) => {
    const { command, data: customStyles } = e.data;

    console.log(command);
    if (command && command === 'add-custom-styling') {
      // NOTE : Hack, we save this to LS and do the same thing whenever we need it
      localStorage.setItem(`${localStoragePluginStylingKeyPrefix}${widget}`, customStyles);
      document.head.insertAdjacentHTML('beforeend', `<style>${customStyles}</style>`);
    }
  });

  return (
    <div>
      <Suspense fallback={<div>Loading plugins...</div>}>{componentToLoad}</Suspense>
    </div>
  );
}
