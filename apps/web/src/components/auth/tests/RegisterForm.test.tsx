import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock react-router-dom
vi.mock('react-router-dom', () => ({
  BrowserRouter: ({ children }: { children: React.ReactNode }) => children,
  useNavigate: () => vi.fn(),
  useLocation: () => ({ pathname: '/' }),
  Link: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock AuthContext
vi.mock('../../../contexts/AuthContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
  useAuth: () => ({
    register: vi.fn(),
    isLoading: false,
    error: null,
  }),
}));

// Mock axios
vi.mock('axios', () => ({
  default: {
    create: () => ({
      get: vi.fn(),
      post: vi.fn(),
      interceptors: { request: { use: vi.fn() }, response: { use: vi.fn() } },
    }),
  },
  create: () => ({
    get: vi.fn(),
    post: vi.fn(),
    interceptors: { request: { use: vi.fn() }, response: { use: vi.fn() } },
  }),
}));

// Mock react-hot-toast
vi.mock('react-hot-toast', () => ({
  toast: vi.fn(),
}));

import { RegisterForm } from '../RegisterForm';

describe('RegisterForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render form fields', () => {
    render(<RegisterForm />);

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/имя пользователя/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/пароль/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/полное имя/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /регистрация/i })).toBeInTheDocument();
  });

  it('should show validation errors when submitting empty form', async () => {
    const user = userEvent.setup();
    render(<RegisterForm />);

    const submitButton = screen.getByRole('button', { name: /регистрация/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/неверный email/i)).toBeInTheDocument();
      expect(screen.getByText(/имя пользователя обязательно для заполнения/i)).toBeInTheDocument();
    });
  });

  it('should have all required input fields', () => {
    render(<RegisterForm />);

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
    render(<RegisterForm />);

    const submitButton = screen.getByRole('button', { name: /регистрация/i });

    expect(submitButton).toBeInTheDocument();
    expect(submitButton).toHaveAttribute('type', 'submit');
  });
});
