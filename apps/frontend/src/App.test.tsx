import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { describe, expect, it } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import App from './App';
import orderReducer from './features/order/orderSlice';

function renderApp() {
  const store = configureStore({ reducer: { order: orderReducer } });
  return render(
    <Provider store={store}>
      <App />
    </Provider>,
  );
}

describe('App', () => {
  it('renders the constructor form with its main sections', () => {
    renderApp();

    expect(screen.getByText('Ткань')).toBeInTheDocument();
    expect(screen.getByText('Тип изделия')).toBeInTheDocument();
    expect(screen.getByText('Зона размещения принта')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Отправить в сделку' })).toBeInTheDocument();
  });

  it('shows "Новая сделка" when no placement_options is present in the URL', () => {
    renderApp();

    expect(screen.getByText('Новая сделка')).toBeInTheDocument();
  });
});
