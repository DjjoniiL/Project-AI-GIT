import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { ConfigProvider, theme } from 'antd';
import './index.css';
import App from './App.tsx';
import { store } from './store.ts';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
      <ConfigProvider
        theme={{
          algorithm: theme.compactAlgorithm,
          token: {
            borderRadius: 6,
            fontSize: 13,
            controlHeight: 28,
          },
        }}
      >
        <App />
      </ConfigProvider>
    </Provider>
  </StrictMode>,
);
