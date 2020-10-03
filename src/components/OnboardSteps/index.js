import React from 'react';
import { Steps } from 'antd';
import MobileDetect from 'mobile-detect';
import { STEPS } from '../../utils/constants';
import styles from './styles.module.scss';

const OnboardSteps = ({ current }) => {
  const md = new MobileDetect(window.navigator.userAgent);
  const isMobileDevice = Boolean(md.mobile());
  return (
    <Steps
      className={!isMobileDevice ? styles.stepsLarge : null}
      size={isMobileDevice ? 'small' : 'default'}
      labelPlacement="horizontal"
      current={current}
    >
      {STEPS.map((step) => {
        return <Steps.Step key={step.id} title={step.title} description={!isMobileDevice ? step.description : null} />;
      })}
    </Steps>
  );
};

export default OnboardSteps;
