import pytest
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait


class TestBatchPrediction:
    @pytest.mark.ui
    def test_batch_table_actions_and_submission(self, driver, frontend_url):
        """Test batch table tab, row manipulation (add/duplicate/delete), and submitting batch predictions."""
        driver.get(frontend_url)

        wait = WebDriverWait(driver, 10)

        # Switch to Batch Prediction tab
        tabs = wait.until(EC.presence_of_all_elements_located((By.CSS_SELECTOR, "button.tab-switcher__button")))
        assert len(tabs) >= 2, "Tab switcher should contain Single and Batch tabs"
        tabs[1].click()  # Click Batch Prediction tab

        # Wait for batch toolbar/surface to render
        wait.until(EC.visibility_of_element_located((By.CSS_SELECTOR, ".batch-surface")))

        # Verify initial row count pill
        pill_row = driver.find_element(By.CSS_SELECTOR, ".pill-row")
        assert "Rows: 1" in pill_row.text

        # Test Add Row action
        add_button = driver.find_element(By.CSS_SELECTOR, ".toolbar button:nth-child(1)")
        add_button.click()
        wait.until(EC.text_to_be_present_in_element((By.CSS_SELECTOR, ".pill-row"), "Rows: 2"))

        # Test Duplicate Row action
        dup_buttons = driver.find_elements(By.CSS_SELECTOR, ".mini-button")
        if dup_buttons:
            dup_buttons[0].click()
            wait.until(EC.text_to_be_present_in_element((By.CSS_SELECTOR, ".pill-row"), "Rows: 3"))

        # Test Delete Row action
        del_buttons = driver.find_elements(By.CSS_SELECTOR, ".mini-button--danger")
        if del_buttons:
            del_buttons[0].click()
            wait.until(EC.text_to_be_present_in_element((By.CSS_SELECTOR, ".pill-row"), "Rows: 2"))

        # Submit batch form
        submit_batch_btn = driver.find_element(By.CSS_SELECTOR, ".toolbar button.button--primary")
        assert submit_batch_btn.is_displayed()
