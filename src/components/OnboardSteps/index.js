import React from 'react';
import { Steps } from 'antd';
import MobileDetect from 'mobile-detect';
import styles from './styles.module.scss';
import { i18n } from 'utils/i18n';

const stepsList = [
  {
    id: 1,
    title: i18n.t('SETUP_PUBLIC_PAGE'),
    description: i18n.t('SETUP_PUBLIC_PAGE_DESC_TEXT'),
  },
  {
    id: 2,
    title: i18n.t('SETUP_LIVESTREAM'),
    description: i18n.t('SETUP_LIVESTREAM_DESC_TEXT'),
  },
  {
    id: 3,
    title: i18n.t('SETUP_SESSION'),
    description: i18n.t('SETUP_SESSION_DESC_TEXT'),
  },
];

const OnboardSteps = ({ current }) => {
  const md = new MobileDetect(window.navigator.userAgent);
  const isMobileDevice = Boolean(md.mobile());

  return (
    <Steps
      className={styles.stepsLarge}
      size={isMobileDevice ? 'small' : 'default'}
      labelPlacement="horizontal"
      current={current}
    >
      {stepsList.map((step) => {
        return <Steps.Step key={step.id} title={step.title} description={!isMobileDevice ? step.description : null} />;
      })}
    </Steps>
  );
};

export default OnboardSteps;
