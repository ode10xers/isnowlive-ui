import React from 'react';

import { Row, Col, Space, Typography, Image } from 'antd';

import Routes from 'routes';

import { generateUrlFromUsername, getUsernameFromUrl } from 'utils/url';

import PassionLogo from 'assets/images/passion-orange-logo.png';

import styles from './styles.module.scss';

const { Link, Text } = Typography;

const PassionFooter = () => {
  const generateHrefLink = (path = Routes.root) => `${generateUrlFromUsername(getUsernameFromUrl())}${path}`;

  const passionMarketingBaseUrl = `https://www.passion.do`;
  const tncLink = `${passionMarketingBaseUrl}/terms-and-conditions`;
  const privacyPolicyLink = `${passionMarketingBaseUrl}/privacy`;

  return (
    <div className={styles.footerContainer}>
      <Row gutter={[12, 12]} justify="center">
        <Col xs={24} className={styles.alignCenter}>
          <Space className={styles.linkTextContainer} split="/" align="center">
            <Link className={styles.linkText} target="_blank" href={generateHrefLink(Routes.legals)}>
              Waiver & Refund Policy
            </Link>
            <Link className={styles.linkText} target="_blank" href={tncLink}>
              Terms and conditions
            </Link>
            <Link className={styles.linkText} target="_blank" href={privacyPolicyLink}>
              Privacy policy
            </Link>
          </Space>
        </Col>
        <Col xs={24} className={styles.alignCenter}>
          <Space size={4} className={styles.passionBrandContainer} align="center">
            <Text className={styles.brandHelpText}> Powered by </Text>
            <Link href={passionMarketingBaseUrl} target="_blank">
              <Image preview={false} src={PassionLogo} loading="lazy" alt="Passion.do" className={styles.logo} />
            </Link>
          </Space>
        </Col>
      </Row>
    </div>
  );
};

export default PassionFooter;
