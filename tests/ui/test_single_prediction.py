import pytest
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import Select, WebDriverWait


class TestSinglePrediction:
    @pytest.mark.ui
    def test_fill_and_submit_single_prediction(self, driver, frontend_url):
        """Test filling the single prediction form with valid values, submitting, and asserting prediction result."""
        driver.get(frontend_url)

        wait = WebDriverWait(driver, 10)

        # Wait for single prediction form to render
        age_input = wait.until(EC.visibility_of_element_located((By.CSS_SELECTOR, "#single-age")))

        # Fill text/numeric fields using CSS selectors
        field_values = {
            "#single-age": "34",
            "#single-years_employed": "7.5",
            "#single-annual_income": "72000",
            "#single-credit_score": "710",
            "#single-credit_history_years": "10.2",
            "#single-savings_assets": "18000",
            "#single-current_debt": "9500",
            "#single-defaults_on_file": "0",
            "#single-delinquencies_last_2yrs": "1",
            "#single-derogatory_marks": "0",
            "#single-loan_amount": "12000",
            "#single-interest_rate": "11.5",
        }

        for css_selector, val in field_values.items():
            element = driver.find_element(By.CSS_SELECTOR, css_selector)
            element.clear()
            element.send_keys(val)

        # Select dropdown values
        Select(driver.find_element(By.CSS_SELECTOR, "#single-occupation_status")).select_by_visible_text("Employed")
        Select(driver.find_element(By.CSS_SELECTOR, "#single-product_type")).select_by_visible_text("Personal Loan")
        Select(driver.find_element(By.CSS_SELECTOR, "#single-loan_intent")).select_by_visible_text("Home Improvement")

        # Submit form
        predict_button = driver.find_element(By.CSS_SELECTOR, "button.button--predict")
        predict_button.click()

        # Explicit wait for prediction summary result to display (Approved or Rejected badge/text)
        result_element = wait.until(
            EC.presence_of_element_located(
                (By.CSS_SELECTOR, ".prediction-summary, .summary-card, .result-header, .pill")
            )
        )

        assert result_element.is_displayed(), "Prediction result element should be visible after form submission"
