import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AuthProvider } from '../../../contexts/AuthContext';
import { RegisterForm } from '../RegisterForm';

// Mock useNavigate
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});

describe('RegisterForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderForm = () => {
    return render(
      <BrowserRouter>
        <AuthProvider>
          <RegisterForm />
        </AuthProvider>
      </BrowserRouter>
    );
  };

  it('should render form fields', () => {
    renderForm();

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/имя пользователя/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/пароль/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/полное имя/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /регистрация/i })).toBeInTheDocument();
  });

  it('should show validation errors when submitting empty form', async () => {
    const user = userEvent.setup();
    renderForm();

    const submitButton = screen.getByRole('button', { name: /регистрация/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/неверный email/i)).toBeInTheDocument();
      expect(screen.getByText(/имя пользователя обязательно для заполнения/i)).toBeInTheDocument();
      expect(screen.getByText(/пароль обязателен/i)).toBeInTheDocument();
      expect(screen.getByText(/полное имя обязательно для заполнения/i)).toBeInTheDocument();
    });
  });

  it('should have all required input fields', () => {
    renderForm();

    const emailInput = screen.getByLabelText(/email/i);
    const usernameInput = screen.getByLabelText(/имя пользователя/i);
    const passwordInput = screen.getByLabelText(/пароль/i);
    const fullNameInput = screen.getByLabelText(/полное имя/i);

    expect(emailInput).toHaveAttribute('type', 'email');
    expect(usernameInput).toHaveAttribute('type', 'text');
    expect(passwordInput).toHaveAttribute('type', 'password');
    expect(fullNameInput).toHaveAttribute('type', 'text');
  });

  it('should have submit button', () => {
    renderForm();

    const submitButton = screen.getByRole('button', { name: /регистрация/i });

    expect(submitButton).toBeInTheDocument();
    expect(submitButton).toHaveAttribute('type', 'submit');
  });
});
