import os
import pytest
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service


@pytest.fixture(scope="session")
def frontend_url():
    """Returns the React frontend URL from environment variable or default Vite dev port."""
    return os.getenv("FRONTEND_URL", "http://127.0.0.1:5173").rstrip("/")


@pytest.fixture
def driver():
    """Initializes Selenium WebDriver with explicit cleanup in a finally block."""
    chrome_options = Options()

    # Enable headless mode if specified via environment variable or default headless run
    if os.getenv("HEADLESS", "1").lower() in ("1", "true", "yes"):
        chrome_options.add_argument("--headless=new")
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")
    chrome_options.add_argument("--window-size=1920,1080")

    web_driver = None
    try:
        web_driver = webdriver.Chrome(options=chrome_options)
        web_driver.implicitly_wait(2)
        yield web_driver
    finally:
        if web_driver is not None:
            web_driver.quit()
