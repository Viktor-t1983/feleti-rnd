import { test, expect } from '@playwright/test';

test.describe('Projects CRUD', () => {
  const testProject = {
    name: 'Test Project E2E',
    code: 'TEST-E2E-001',
    description: 'Test project created by E2E tests',
    stage: 'IDEA' as const,
    status: 'ACTIVE' as const,
    targetDate: '2026-12-31',
  };

  test.beforeEach(async ({ page }) => {
    // Navigate to login page
    await page.goto('http://localhost:5173/login');
    
    // Fill login form
    await page.getByTestId('login-email').fill('admin@feleti.com');
    await page.getByTestId('login-password').fill('admin123');
    
    // Submit form
    await page.getByTestId('login-submit').click();
    
    // Wait for navigation to dashboard
    await page.waitForURL('**/dashboard');
    
    // Navigate to projects page
    await page.goto('http://localhost:5173/projects');
    await page.waitForLoadState('networkidle');
  });

  test('should display projects list', async ({ page }) => {
    // Check page title
    await expect(page.getByRole('heading', { name: /projects/i })).toBeVisible();
    
    // Check for project cards (should have at least one)
    const projectCards = page.getByTestId('project-card');
    await expect(projectCards.first()).toBeVisible();
    
    // Check for filters
    await expect(page.getByPlaceholder('Search projects')).toBeVisible();
    await expect(page.getByLabel('Stage')).toBeVisible();
    await expect(page.getByLabel('Status')).toBeVisible();
  });

  test('should create a new project', async ({ page }) => {
    // Click create button
    await page.getByRole('link', { name: /create project/i }).click();
    await page.waitForURL('**/projects/create');
    
    // Fill project form
    await page.getByLabel('Project Name').fill(testProject.name);
    await page.getByLabel('Project Code').fill(testProject.code);
    await page.getByLabel('Description').fill(testProject.description);
    await page.getByLabel('Stage').selectOption(testProject.stage);
    await page.getByLabel('Status').selectOption(testProject.status);
    await page.getByLabel('Target Date').fill(testProject.targetDate);
    
    // Submit form
    await page.getByRole('button', { name: /create project/i }).click();
    
    // Wait for redirect to projects list
    await page.waitForURL('**/projects');
    
    // Verify project was created
    await expect(page.getByText(testProject.name)).toBeVisible();
    await expect(page.getByText(testProject.code)).toBeVisible();
  });

  test('should view project details', async ({ page }) => {
    // Click on first project card
    await page.getByTestId('project-card').first().click();
    
    // Wait for project detail page
    await page.waitForURL('**/projects/**');
    
    // Check project details are displayed
    await expect(page.getByRole('heading', { name: /project details/i })).toBeVisible();
    await expect(page.getByText(/stage:/i)).toBeVisible();
    await expect(page.getByText(/status:/i)).toBeVisible();
    await expect(page.getByText(/created:/i)).toBeVisible();
  });

  test('should edit project', async ({ page }) => {
    // Navigate to first project detail
    await page.getByTestId('project-card').first().click();
    await page.waitForURL('**/projects/**');
    
    // Click edit button
    await page.getByRole('button', { name: /edit/i }).click();
    
    // Wait for edit form
    await page.waitForURL('**/edit');
    
    // Update project name
    const updatedName = 'Updated Project Name';
    await page.getByLabel('Project Name').fill(updatedName);
    
    // Save changes
    await page.getByRole('button', { name: /save changes/i }).click();
    
    // Wait for redirect back to detail page
    await page.waitForURL('**/projects/**');
    
    // Verify update
    await expect(page.getByText(updatedName)).toBeVisible();
  });

  test('should filter projects', async ({ page }) => {
    // Filter by stage
    await page.getByLabel('Stage').selectOption('IDEA');
    await page.waitForLoadState('networkidle');
    
    // Verify filtered results
    const projectCards = page.getByTestId('project-card');
    const count = await projectCards.count();
    
    if (count > 0) {
      // At least one project should have IDEA stage badge
      await expect(page.getByText('IDEA')).toBeVisible();
    }
    
    // Clear filter
    await page.getByLabel('Stage').selectOption('');
    await page.waitForLoadState('networkidle');
  });

  test('should search projects', async ({ page }) => {
    // Search for a project
    await page.getByPlaceholder('Search projects').fill('Demo');
    await page.waitForLoadState('networkidle');
    
    // Verify search results
    await expect(page.getByText(/demo/i).first()).toBeVisible();
    
    // Clear search
    await page.getByPlaceholder('Search projects').fill('');
    await page.waitForLoadState('networkidle');
  });

  test('should delete project', async ({ page }) => {
    // First create a project to delete
    await page.getByRole('link', { name: /create project/i }).click();
    await page.waitForURL('**/projects/create');
    
    const deleteProject = {
      name: 'Project to Delete',
      code: 'DELETE-001',
      description: 'This project will be deleted',
      stage: 'IDEA' as const,
      status: 'ACTIVE' as const,
    };
    
    await page.getByLabel('Project Name').fill(deleteProject.name);
    await page.getByLabel('Project Code').fill(deleteProject.code);
    await page.getByLabel('Description').fill(deleteProject.description);
    await page.getByLabel('Stage').selectOption(deleteProject.stage);
    await page.getByLabel('Status').selectOption(deleteProject.status);
    
    await page.getByRole('button', { name: /create project/i }).click();
    await page.waitForURL('**/projects');
    
    // Find and click on the newly created project
    await page.getByText(deleteProject.name).click();
    await page.waitForURL('**/projects/**');
    
    // Click delete button
    await page.getByRole('button', { name: /delete/i }).click();
    
    // Confirm deletion in dialog
    await page.getByRole('button', { name: /confirm/i }).click();
    
    // Wait for redirect to projects list
    await page.waitForURL('**/projects');
    
    // Verify project is no longer visible
    await expect(page.getByText(deleteProject.name)).not.toBeVisible();
  });
});