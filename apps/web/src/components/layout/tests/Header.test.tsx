import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AuthProvider } from '../../../contexts/AuthContext';
import { ThemeProvider } from '../../../contexts/ThemeContext';
import { Header } from '../Header';

// Mock useNavigate
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});

describe('Header', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderHeader = () => {
    return render(
      <BrowserRouter>
        <ThemeProvider>
          <AuthProvider>
            <Header />
          </AuthProvider>
        </ThemeProvider>
      </BrowserRouter>
    );
  };

  it('should render header', () => {
    renderHeader();

    const header = screen.getByRole('banner');
    expect(header).toBeInTheDocument();
  });

  it('should render logo', () => {
    renderHeader();

    const logo = screen.getByText('FELETI');
    expect(logo).toBeInTheDocument();
  });

  it('should render R&D subtitle', () => {
    renderHeader();

    const subtitle = screen.getByText('R&D');
    expect(subtitle).toBeInTheDocument();
  });

  it('should render navigation links', () => {
    renderHeader();

    expect(screen.getByText('Дашборд')).toBeInTheDocument();
    expect(screen.getByText('Проекты')).toBeInTheDocument();
    expect(screen.getByText('Калькуляторы')).toBeInTheDocument();
  });

  it('should render theme toggle button', () => {
    renderHeader();

    // Find button by role
    const themeToggle = screen.getByRole('button');
    expect(themeToggle).toBeInTheDocument();
  });

  it('should have correct link to dashboard', () => {
    renderHeader();

    const dashboardLink = screen.getByText('Дашборд');
    expect(dashboardLink.closest('a')).toHaveAttribute('href', '/dashboard');
  });

  it('should have correct link to projects', () => {
    renderHeader();

    const projectsLink = screen.getByText('Проекты');
    expect(projectsLink.closest('a')).toHaveAttribute('href', '/projects');
  });

  it('should have correct link to calculators', () => {
    renderHeader();

    const calculatorsLink = screen.getByText('Калькуляторы');
    expect(calculatorsLink.closest('a')).toHaveAttribute('href', '/calculators');
  });

  it('should have correct styling classes', () => {
    renderHeader();

    const header = screen.getByRole('banner');
    expect(header).toHaveClass('bg-white', 'dark:bg-gray-900');
  });

  it('should have border bottom', () => {
    renderHeader();

    const header = screen.getByRole('banner');
    expect(header).toHaveClass('border-b', 'border-gray-200', 'dark:border-gray-700');
  });

  it('should have shadow', () => {
    renderHeader();

    const header = screen.getByRole('banner');
    expect(header).toHaveClass('shadow-sm');
  });
});
