import { test, expect } from "@playwright/test"

test.describe("IP Lookup — Happy Path", () => {
  test("performs a valid IPv4 lookup and displays results", async ({ page }) => {
    await page.goto("/")
    await page.getByTestId("ip-input").fill("8.8.8.8")
    await page.getByTestId("lookup-button").click()

    await page.waitForSelector("[data-testid='results-section']")

    await expect(page.getByTestId("result-ip")).toContainText("8.8.8.8")
    await expect(page.getByTestId("results-section")).toBeVisible()
  })

  test("copy button shows Copied! feedback after clicking", async ({ page }) => {
    await page.goto("/")
    await page.getByTestId("ip-input").fill("8.8.8.8")
    await page.getByTestId("lookup-button").click()

    await page.waitForSelector("[data-testid='results-section']")

    const copyBtn = page.getByTestId("copy-ip")
    await copyBtn.click()
    await expect(copyBtn).toContainText("Copied!")

    await expect(copyBtn).toContainText("Copy")
  })

  test("lookup button is disabled while request is in flight", async ({ page }) => {
    await page.goto("/")
    await page.getByTestId("ip-input").fill("1.1.1.1")

    const button = page.getByTestId("lookup-button")
    await button.click()

    await expect(button).toBeDisabled()
    await page.waitForSelector("[data-testid='results-section']")
    await expect(button).toBeEnabled()
  })
})

test.describe("IP Lookup — Invalid Input", () => {
  test("shows error for a private IP address", async ({ page }) => {
    await page.goto("/")
    await page.getByTestId("ip-input").fill("192.168.1.1")
    await page.getByTestId("lookup-button").click()

    await expect(page.getByTestId("error-message")).toBeVisible()
    await expect(page.getByTestId("results-section")).not.toBeVisible()
  })

  test("shows error for a non-IP string", async ({ page }) => {
    await page.goto("/")
    await page.getByTestId("ip-input").fill("not-an-ip-address")
    await page.getByTestId("lookup-button").click()

    await expect(page.getByTestId("error-message")).toBeVisible()
  })

  test("shows error for loopback address 127.0.0.1", async ({ page }) => {
    await page.goto("/")
    await page.getByTestId("ip-input").fill("127.0.0.1")
    await page.getByTestId("lookup-button").click()

    await expect(page.getByTestId("error-message")).toBeVisible()
  })
})

test.describe("IP Lookup — Edge Cases", () => {
  test("shows validation error when input is empty", async ({ page }) => {
    await page.goto("/")
    await page.getByTestId("lookup-button").click()

    await expect(page.getByTestId("error-message")).toBeVisible()
    await expect(page.getByTestId("error-message")).toContainText(
      "Please enter an IP address",
    )
  })

  test("submits via Enter key press", async ({ page }) => {
    await page.goto("/")
    const input = page.getByTestId("ip-input")
    await input.fill("8.8.8.8")
    await input.press("Enter")

    await page.waitForSelector("[data-testid='results-section']")
    await expect(page.getByTestId("result-ip")).toContainText("8.8.8.8")
  })

  test("clears previous results when making a new lookup", async ({ page }) => {
    await page.goto("/")

    await page.getByTestId("ip-input").fill("8.8.8.8")
    await page.getByTestId("lookup-button").click()
    await page.waitForSelector("[data-testid='results-section']")

    await page.getByTestId("ip-input").fill("192.168.1.1")
    await page.getByTestId("lookup-button").click()

    await expect(page.getByTestId("results-section")).not.toBeVisible()
    await expect(page.getByTestId("error-message")).toBeVisible()
  })
})
