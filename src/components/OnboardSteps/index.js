import React from 'react';
import { Steps } from 'antd';

import { isMobileDevice } from 'utils/device';

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
    title: 'Create Product',
    description: 'Create your first product',
  },
];

const OnboardSteps = ({ current }) => {
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
