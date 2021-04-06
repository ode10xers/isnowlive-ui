import React, { useState, useEffect, useCallback } from 'react';

import { Typography, Checkbox } from 'antd';

import apis from 'apis';

import { generateUrlFromUsername, isAPISuccess, getUsernameFromUrl } from 'utils/helper';

import styles from './styles.module.scss';
import classNames from 'classnames';

const { Paragraph, Link } = Typography;

const creatorUsername = getUsernameFromUrl();

// This component will have 2 conditional rendering
// 1. Normal case rendering where shouldCheck = false
//    For this case we only show text with some links, no checkbox required
// 2. shouldCheck = true, we need to put checkbox here
//    isChecked and setChecked are passed from parent component
//    Parent component passes a state and setter for that state
const TermsAndConditionsText = ({ shouldCheck = false, isChecked = false, setChecked = () => {} }) => {
  const [creatorName, setCreatorName] = useState('this Creator');

  const getCreatorDetails = useCallback(async () => {
    try {
      if (creatorUsername !== 'app') {
        const { status, data } = await apis.user.getProfileByUsername(creatorUsername);
        if (isAPISuccess(status) && data) {
          setCreatorName(`${data.first_name} ${data.last_name}`);
        }
      }
    } catch (error) {
      console.error(error?.response?.data?.message || 'Failed fetching creator details');
    }
    return null;
  }, []);

  useEffect(() => {
    getCreatorDetails();
  }, [getCreatorDetails]);

  if (!shouldCheck) {
    return (
      <Paragraph type="secondary" className={classNames(styles.textAlignCenter, styles.smallText)}>
        By paying, you agree to the{' '}
        <Link href={`${generateUrlFromUsername(creatorUsername)}/terms`} target="_blank" underline>
          waiver & refund policy
        </Link>{' '}
        set by {creatorName}
      </Paragraph>
    );
  }

  return (
    <div className={styles.tncWrapper}>
      <Checkbox checked={isChecked} onChange={(e) => setChecked(e.target.checked)}>
        <Paragraph type="secondary" className={styles.smallText}>
          I agree to the{' '}
          <Link href={`${generateUrlFromUsername(creatorUsername)}/terms`} target="_blank" underline>
            waiver & refund policy
          </Link>{' '}
          set by {creatorName} and the{' '}
          <Link href="https://passion.do/terms-and-conditions" target="_blank" underline>
            terms of service
          </Link>{' '}
          and{' '}
          <Link href="https://passion.do/privacy" target="_blank" underline>
            privacy policy
          </Link>{' '}
          of passion.do
        </Paragraph>
      </Checkbox>
    </div>
  );
};

export default TermsAndConditionsText;
