from playwright.sync_api import sync_playwright

def run(playwright):
    browser = playwright.chromium.launch()
    page = browser.new_page()

    # Verify admin login and dashboard
    page.goto("http://localhost:3000/admin.html")
    page.fill("#password", "5885@alfalah")
    page.click("button[type='submit']")
    page.wait_for_url("http://localhost:3000/dashboard.html")
    page.screenshot(path="dashboard.png")

    # Verify homepage
    page.goto("http://localhost:3000")
    page.screenshot(path="homepage.png")

    browser.close()

with sync_playwright() as playwright:
    run(playwright)
