import React, { useRef } from 'react';
import { Stream } from '@cloudflare/stream-react';

const VideoPlayer = () => {
  const ref = useRef(null);
  return (
    <div>
      <Stream
        streamRef={ref}
        src="eyJhbGciOiJSUzI1NiIsImtpZCI6ImVmNjIzNTc4MTA5MjRhYzQ5NjY1MDdiM2RiNTcxYjIxIiwidHlwIjoiSldUIn0.eyJleHAiOjE2MTI2Mzg5ODcsImtpZCI6ImVmNjIzNTc4MTA5MjRhYzQ5NjY1MDdiM2RiNTcxYjIxIiwic3ViIjoiYTA1N2ExODBmNDg1NWY2Y2FmMDg2MmIyMDlmZDRjNWUifQ.PqUR4lKdIsb8V_ibyNtRo4APyY0nksCD_gLGUNt9j8zei4ma158WGK9--3rwt6Oghd9P9PqEHDEiJ_eVwm51miEQ9sIdDkmYlbfzL6Z-cgoENRRzZDNdDfOggoDVUeC8SvHVjmQu1cdFlm43LrskBnMxySYl9CvFfYX2USt2eiyePyzRxOJvAe0lYHVxMFUA2xbxW79-ARQ81rZp1Ag5WjOS0okbhAI2PD6lsfat5BZecZiCTNz3YZySRY5GqH-GqS_B61txkPg8SQzqG3AkdWrWsNaxENygmuD5f8avJLerf5-G9IzhUqkE_Sg11vGElkEWWEpWGHlJmqBe9g3Jww"
        muted
        controls
      />
    </div>
  );
};

export default VideoPlayer;
