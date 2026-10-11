import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { HelloWorld } from '../CmsUploadDemo/HelloWorld';
ReactDOM.render(React.createElement(HelloWorld, {
  onSubmit: (payload: string): void => {
    const output = document.getElementById('demo-output');
    if (output) output.textContent = payload;
  },
}), document.getElementById('root'));
