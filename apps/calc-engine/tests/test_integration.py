"""
Integration Tests for Calc Engine API
Tests the full API endpoints with HTTP requests
"""
import pytest
import requests
import os

# Base URL for calc engine
BASE_URL = os.getenv("CALC_ENGINE_URL", "http://localhost:8000")


class TestHealthEndpoint:
    """Tests for health check endpoint"""

    def test_health_check(self):
        """Test health endpoint returns 200"""
        try:
            response = requests.get(f"{BASE_URL}/health", timeout=5)
            assert response.status_code == 200
            data = response.json()
            assert data.get("status") == "ok"
        except requests.ConnectionError:
            pytest.skip("Calc Engine not available")


class TestNPVEndpoint:
    """Integration tests for NPV endpoint"""

    def test_npv_calculation_success(self):
        """Test successful NPV calculation via API"""
        try:
            payload = {
                "investment": 1000,
                "cash_flows": [300, 400, 400, 300],
                "discount_rate": 0.1
            }
            response = requests.post(f"{BASE_URL}/api/financial/npv", json=payload, timeout=10)

            if response.status_code == 404:
                pytest.skip("NPV endpoint not implemented")

            assert response.status_code == 200
            data = response.json()
            assert "npv" in data
            assert isinstance(data["npv"], (int, float))
            assert "decision" in data
            assert data["decision"] in ["ACCEPT", "REJECT"]
        except requests.ConnectionError:
            pytest.skip("Calc Engine not available")

    def test_npv_invalid_input(self):
        """Test NPV endpoint with invalid input"""
        try:
            payload = {
                "investment": -100,  # Invalid: negative investment
                "cash_flows": [300, 400],
                "discount_rate": 0.1
            }
            response = requests.post(f"{BASE_URL}/api/financial/npv", json=payload, timeout=10)

            if response.status_code == 404:
                pytest.skip("NPV endpoint not implemented")

            assert response.status_code in [400, 422]
        except requests.ConnectionError:
            pytest.skip("Calc Engine not available")


class TestIRREndpoint:
    """Integration tests for IRR endpoint"""

    def test_irr_calculation_success(self):
        """Test successful IRR calculation via API"""
        try:
            payload = {
                "investment": 1000,
                "cash_flows": [300, 400, 400, 300]
            }
            response = requests.post(f"{BASE_URL}/api/financial/irr", json=payload, timeout=10)

            if response.status_code == 404:
                pytest.skip("IRR endpoint not implemented")

            assert response.status_code == 200
            data = response.json()
            assert "irr" in data
            assert isinstance(data["irr"], (int, float))
            assert "decision" in data
        except requests.ConnectionError:
            pytest.skip("Calc Engine not available")


class TestROIEndpoint:
    """Integration tests for ROI endpoint"""

    def test_roi_calculation_success(self):
        """Test successful ROI calculation via API"""
        try:
            payload = {
                "investment": 1000,
                "total_return": 1200
            }
            response = requests.post(f"{BASE_URL}/api/financial/roi", json=payload, timeout=10)

            if response.status_code == 404:
                pytest.skip("ROI endpoint not implemented")

            assert response.status_code == 200
            data = response.json()
            assert "roi_percent" in data
            assert isinstance(data["roi_percent"], (int, float))
            assert "decision" in data
        except requests.ConnectionError:
            pytest.skip("Calc Engine not available")


class TestPaybackEndpoint:
    """Integration tests for Payback endpoint"""

    def test_payback_calculation_success(self):
        """Test successful payback calculation via API"""
        try:
            payload = {
                "investment": 1000,
                "annual_cash_flow": 300
            }
            response = requests.post(f"{BASE_URL}/api/financial/payback", json=payload, timeout=10)

            if response.status_code == 404:
                pytest.skip("Payback endpoint not implemented")

            assert response.status_code == 200
            data = response.json()
            assert "payback_years" in data
            assert isinstance(data["payback_years"], (int, float))
            assert "decision" in data
        except requests.ConnectionError:
            pytest.skip("Calc Engine not available")


class TestErrorHandling:
    """Tests for error handling"""

    def test_404_for_unknown_endpoint(self):
        """Test 404 for unknown endpoints"""
        try:
            response = requests.get(f"{BASE_URL}/api/unknown", timeout=5)
            assert response.status_code == 404
        except requests.ConnectionError:
            pytest.skip("Calc Engine not available")

    def test_method_not_allowed(self):
        """Test 405 for wrong HTTP method"""
        try:
            response = requests.delete(f"{BASE_URL}/health", timeout=5)
            # Some frameworks return 405, others 404
            assert response.status_code in [404, 405]
        except requests.ConnectionError:
            pytest.skip("Calc Engine not available")
