import React, { useState, useEffect, useCallback } from 'react';
import ReactHtmlParser from 'react-html-parser';

import { Row, Col, Select, Typography, Button, Tooltip } from 'antd';
import { CopyOutlined } from '@ant-design/icons';

import { copyToClipboard } from 'utils/helper';
import { generateWidgetLink, widgetComponentsName } from 'utils/widgets';

import styles from './styles.module.scss';

const { Title, Text } = Typography;

const ExternalSiteSettings = () => {
  const [widgetLink, setWidgetLink] = useState('');
  const [selectedWidget, setSelectedWidget] = useState(widgetComponentsName['CALENDAR'].value);

  const generateWidgetText = useCallback(() => {
    return `<iframe src="${widgetLink}" />`;
  }, [widgetLink]);

  useEffect(() => {
    const generatedWidgetLink = generateWidgetLink(selectedWidget);
    setWidgetLink(generatedWidgetLink);
    console.log(generatedWidgetLink);
  }, [selectedWidget]);

  const handleSelectWidgetComponentChange = (val) => {
    console.log(val);
    setSelectedWidget(val);
  };

  const copyWidgetSnippet = () => {
    copyToClipboard(generateWidgetText());
  };

  return (
    <div className={styles.box}>
      <Row gutter={[8, 16]}>
        <Col xs={24}>
          <Title level={4}> Widgets </Title>
        </Col>
        <Col xs={24} lg={12}>
          <Row gutter={[8, 16]}>
            <Col xs={24} lg={12}>
              <Text strong> Select Page </Text>
            </Col>
            <Col xs={24} lg={12}>
              <Select
                className={styles.widgetSelect}
                placeholder="Select page to show"
                value={selectedWidget}
                options={Object.entries(widgetComponentsName).map(([key, val]) => val)}
                onChange={handleSelectWidgetComponentChange}
              />
            </Col>
            <Col xs={24}>
              <div className={styles.codeSnippetContainer}>
                <div className={styles.copySnippetBtnContainer}>
                  <Tooltip title="Copy code snippet">
                    <Button onClick={() => copyWidgetSnippet()} icon={<CopyOutlined />} />
                  </Tooltip>
                </div>
                <Text code className={styles.codeSnippet}>
                  {generateWidgetText()}
                </Text>
              </div>
            </Col>
          </Row>
        </Col>
        <Col xs={24} lg={12}>
          <Row gutter={[8, 16]}>
            <Col xs={24}>
              <Text strong> Preview </Text>
            </Col>
            <Col xs={24}>{ReactHtmlParser(generateWidgetText())}</Col>
          </Row>
        </Col>
      </Row>
    </div>
  );
};

export default ExternalSiteSettings;
