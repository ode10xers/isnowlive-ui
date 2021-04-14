import React from 'react';
import { Steps } from 'antd';
import MobileDetect from 'mobile-detect';
import styles from './styles.module.scss';

const stepsList = [
  {
    id: 1,
    title: 'Setup Public Page',
    description: 'Your customer will see this page',
  },
  // {
  //   id: 2,
  //   title: 'Setup Livestream',
  //   description: 'Connect your zoom account',
  // },
  {
    id: 2,
    title: 'Setup Session',
    description: 'Create your first session',
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
