import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';

// Mock react-router-dom
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useLocation: () => ({ pathname: '/' }),
  };
});

// Mock ThemeContext
vi.mock('../../../contexts/ThemeContext', () => ({
  useTheme: () => ({ theme: 'light', toggleTheme: vi.fn() }),
}));

// Mock AuthContext
vi.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { email: 'test@test.com', role: { name: 'Admin' } },
    logout: vi.fn(),
  }),
}));

// Mock components
vi.mock('../../notifications/NotificationBell', () => ({
  NotificationBell: () => <div data-testid="notification-bell">Bell</div>,
}));

vi.mock('../../ui/SearchModal', () => ({
  SearchModal: () => <div data-testid="search-modal">Search</div>,
}));

// Mock react-hot-toast
vi.mock('react-hot-toast', () => ({
  toast: vi.fn(),
}));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
  },
});

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>{component}</BrowserRouter>
    </QueryClientProvider>
  );
};

import { Header } from '../Header';

describe('Header', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render header', () => {
    renderWithProviders(<Header />);

    const header = screen.getByRole('banner');
    expect(header).toBeInTheDocument();
  });

  it('should have correct styling classes', () => {
    renderWithProviders(<Header />);

    const header = screen.getByRole('banner');
    expect(header).toHaveClass('bg-white');
  });

  it('should have border bottom', () => {
    renderWithProviders(<Header />);

    const header = screen.getByRole('banner');
    expect(header).toHaveClass('border-b');
  });

  it('should have shadow', () => {
    renderWithProviders(<Header />);

    const header = screen.getByRole('banner');
    expect(header).toHaveClass('shadow-sm');
  });

  it('should render navigation links', () => {
    renderWithProviders(<Header />);

    const links = screen.getAllByRole('link');
    expect(links.length).toBeGreaterThan(0);
  });

  it('should render theme toggle button', () => {
    renderWithProviders(<Header />);

    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
  });
});
