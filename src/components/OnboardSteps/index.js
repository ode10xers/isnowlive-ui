import React from 'react';
import { Steps } from 'antd';
import MobileDetect from 'mobile-detect';
import styles from './styles.module.scss';
import { useTranslation } from 'react-i18next';

const stepsList = [
  {
    id: 1,
    title: 'SETUP_PUBLIC_PAGE',
    description: 'SETUP_PUBLIC_PAGE_DESC_TEXT',
  },
  {
    id: 2,
    title: 'SETUP_LIVESTREAM',
    description: 'SETUP_LIVESTREAM_DESC_TEXT',
  },
  {
    id: 3,
    title: 'SETUP_SESSION',
    description: 'SETUP_SESSION_DESC_TEXT',
  },
];

const OnboardSteps = ({ current }) => {
  const md = new MobileDetect(window.navigator.userAgent);
  const isMobileDevice = Boolean(md.mobile());
  const { t } = useTranslation();

  return (
    <Steps
      className={styles.stepsLarge}
      size={isMobileDevice ? 'small' : 'default'}
      labelPlacement="horizontal"
      current={current}
    >
      {stepsList.map((step) => {
        return (
          <Steps.Step key={step.id} title={t(step.title)} description={!isMobileDevice ? t(step.description) : null} />
        );
      })}
    </Steps>
  );
};

export default OnboardSteps;
