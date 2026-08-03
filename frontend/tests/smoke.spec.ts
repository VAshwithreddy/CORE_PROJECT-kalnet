import { test, expect } from '@playwright/test';

test.describe('CORE Management Platform - Smoke & Workflow Tests', () => {

  test('Root page renders and shows 5 personas', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toHaveText('CORE Management Platform');
    await expect(page.locator('h2')).toHaveText('Select a Persona to Begin');
    
    // Should have 7 buttons (one for each DEMO_USER)
    const buttons = page.locator('main button');
    await expect(buttons).toHaveCount(7);
  });

  test('Role routing: Navigates to correct home paths', async ({ page }) => {
    // 1. Employee
    await page.goto('/');
    await page.getByRole('button', { name: /Jane Doe/ }).click();
    await expect(page).toHaveURL(/\/employee\/home/);
    await expect(page.locator('h1').first()).toHaveText('Employee Hub');

    // 2. Department
    await page.goto('/');
    await page.getByRole('button', { name: /Sarah Wong/ }).click();
    await expect(page).toHaveURL(/\/department\/home/);
    await expect(page.locator('h1').first()).toHaveText('Department Overview');

    // 3. Executive
    await page.goto('/');
    await page.getByRole('button', { name: /Michael Kim/ }).click();
    await expect(page).toHaveURL(/\/executive\/overview/);
    await expect(page.locator('h1').first()).toHaveText('Executive Overview');

    // 4. Work Admin
    await page.goto('/');
    await page.getByRole('button', { name: /Priya Kapoor/ }).click();
    await page.getByText('Work Admin').click();
    await expect(page).toHaveURL(/\/work-admin\/home/);
    await expect(page.locator('h1').first()).toHaveText('Operations Command');

    // 5. System Admin
    await page.goto('/');
    await page.getByRole('button', { name: /Ray Torres/ }).click();
    await expect(page).toHaveURL(/\/system\/users/);
    await expect(page.locator('h1').first()).toHaveText('System Users');
  });

  test('Workflow: Approval and System User Workflow', async ({ page }) => {
    // 1. Employee creates request
    await page.goto('/');
    await page.getByRole('button', { name: /Jane Doe/ }).click();
    
    // Switch to Services tab (which might just be a section on home page, or a button)
    // Looking at Employee Home, it might have a "Submit Request" button.
    // For this smoke test, we'll assume the button exists on the page.
    // However, since we haven't built the create request modal yet in full functionality,
    // we'll just check if the UI sections exist.
    await expect(page.locator('text=My Work')).toBeVisible();

    // 2. Work Admin approves request
    await page.goto('/');
    await page.getByRole('button', { name: /Priya Kapoor/ }).click();
    await page.getByRole('link', { name: 'Approvals' }).click();
    await expect(page).toHaveURL(/\/work-admin\/approvals/);
    
    // Click the first "Approve" button
    const approveBtn = page.getByRole('button', { name: 'Approve' }).first();
    await approveBtn.click();
    await expect(page.getByText('approved').first()).toBeVisible();

    // 3. System Admin suspends user
    await page.goto('/');
    await page.getByRole('button', { name: /Ray Torres/ }).click();
    await expect(page).toHaveURL(/\/system\/users/);
    
    const suspendBtn = page.getByRole('button', { name: 'Suspend User' }).first();
    await suspendBtn.click();
    await expect(page.getByText('updated').first()).toBeVisible();
  });

});
