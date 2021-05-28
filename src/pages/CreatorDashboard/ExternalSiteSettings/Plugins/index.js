import React, { useState, useEffect, useCallback } from 'react';
import ReactHtmlParser from 'react-html-parser';
import SyntaxHighlighter from 'react-syntax-highlighter';
import { atomOneLight } from 'react-syntax-highlighter/dist/esm/styles/hljs';

import { Row, Col, Select, Typography, Button, Tooltip } from 'antd';
import { CopyOutlined } from '@ant-design/icons';

import { copyToClipboard } from 'utils/helper';
import { generateWidgetLink, widgetComponentsName } from 'utils/widgets';

import styles from './styles.module.scss';

const { Title, Text, Paragraph } = Typography;

const Plugins = () => {
  const [widgetLink, setWidgetLink] = useState('');
  const [selectedWidget, setSelectedWidget] = useState(widgetComponentsName['CALENDAR'].value);

  const generateWidgetText = useCallback(() => {
    return `<iframe title="Passion.do Plugin Container" src="${widgetLink}" width="100%" height="700px" allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture; payment;" allowpaymentrequest="true" allowfullscreen="true"> </iframe>`;
  }, [widgetLink]);

  useEffect(() => {
    const generatedWidgetLink = generateWidgetLink(selectedWidget);
    setWidgetLink(generatedWidgetLink);
  }, [selectedWidget]);

  const handleSelectWidgetComponentChange = (val) => setSelectedWidget(val);

  const copyWidgetSnippet = () => copyToClipboard(generateWidgetText());

  return (
    <div className={styles.box}>
      <Row gutter={[20, 16]}>
        <Col xs={24}>
          <Title level={4}> Plugins </Title>
        </Col>
        <Col xs={24}>
          <Row gutter={[8, 16]}>
            <Col xs={24}>
              <Paragraph>Select a plugin that you want to embed below.</Paragraph>
            </Col>
            <Col xs={24}>
              <Row gutter={[10, 10]}>
                <Col xs={24} lg={4}>
                  <Text strong> Select Plugin </Text>
                </Col>
                <Col xs={24} lg={20}>
                  <Select
                    size="small"
                    className={styles.widgetSelect}
                    placeholder="Select page to show"
                    value={selectedWidget}
                    options={Object.entries(widgetComponentsName).map(([key, val]) => val)}
                    onChange={handleSelectWidgetComponentChange}
                  />
                </Col>
              </Row>
            </Col>
            <Col xs={24}>
              <Paragraph>You can copy the code snippet below to where you want to show the plugin</Paragraph>
            </Col>
            <Col xs={24}>
              <div className={styles.codeSnippetContainer}>
                <SyntaxHighlighter
                  wrapLongLines={true}
                  language="htmlbars"
                  style={atomOneLight}
                  className={styles.codeSnippet}
                >
                  {generateWidgetText()}
                </SyntaxHighlighter>
                <div className={styles.copySnippetBtnContainer}>
                  <Tooltip title="Copy code snippet" trigger="hover">
                    <Button ghost type="primary" onClick={() => copyWidgetSnippet()} icon={<CopyOutlined />} />
                  </Tooltip>
                </div>
              </div>
            </Col>
          </Row>
        </Col>
        <Col xs={24}>
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

export default Plugins;