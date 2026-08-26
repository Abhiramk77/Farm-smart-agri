# Smart Agri Connect — Failed Test Cases Report

**Total Failed Test Cases:** 7

---


### Test Case ID: SAC-TC-115
- **Module:** Crop / Product Management
- **Feature:** Produce Validation
- **User Role:** Farmer
- **Test Scenario:** Submit produce listing with zero quantity
- **Preconditions:** Farmer is on /farmer/sell form
- **Test Data:** Qty: 0 kg, Price: ₹25/kg
- **Execution Steps:**
1. Open /farmer/sell
2. Execute step flow
3. Provide test data: Qty: 0 kg, Price: ₹25/kg
4. Submit form
- **Expected Result:** Form should validate and block zero quantity listing
- **Actual Result:** DEFECT: SellProduct form allows entering zero quantity without displaying client-side error validation message
- **Status:** **FAIL**
- **Priority:** P1 | **Severity:** Medium
- **Defect ID:** [SAC-DEF-001](defects.md#sac-def-001)
- **Evidence/Screenshot:** `screenshots/SAC-TC-115_fail.png`

---


### Test Case ID: SAC-TC-116
- **Module:** Crop / Product Management
- **Feature:** Produce Validation
- **User Role:** Farmer
- **Test Scenario:** Submit produce listing with negative price
- **Preconditions:** Farmer is on /farmer/sell form
- **Test Data:** Qty: 500 kg, Price: -₹25/kg
- **Execution Steps:**
1. Open /farmer/sell
2. Execute step flow
3. Provide test data: Qty: 500 kg, Price: -₹25/kg
4. Submit form
- **Expected Result:** Form should reject negative price
- **Actual Result:** DEFECT: Form accepts negative price input without error message
- **Status:** **FAIL**
- **Priority:** P1 | **Severity:** Medium
- **Defect ID:** [SAC-DEF-001](defects.md#sac-def-001)
- **Evidence/Screenshot:** `screenshots/SAC-TC-115_fail.png`

---


### Test Case ID: SAC-TC-218
- **Module:** Buyer Crop Requirements
- **Feature:** Create Requirement
- **User Role:** Buyer
- **Test Scenario:** Post requirement with negative quantity (-500 kg)
- **Preconditions:** Buyer is on /buyer/create-contract form
- **Test Data:** Crop: Rice, Qty: -500 kg, Target Price: ₹40/kg
- **Execution Steps:**
1. Open /buyer/create-contract
2. Enter requirement specs: Crop: Rice, Qty: -500 kg, Target Price: ₹40/kg
3. Submit form
- **Expected Result:** Form should block negative quantity submission
- **Actual Result:** DEFECT: CreateContract form accepts negative quantity without validation warning
- **Status:** **FAIL**
- **Priority:** P1 | **Severity:** Medium
- **Defect ID:** [SAC-DEF-002](defects.md#sac-def-002)
- **Evidence/Screenshot:** `screenshots/SAC-TC-218_fail.png`

---


### Test Case ID: SAC-TC-219
- **Module:** Buyer Crop Requirements
- **Feature:** Create Requirement
- **User Role:** Buyer
- **Test Scenario:** Post requirement with zero target price (₹0/kg)
- **Preconditions:** Buyer is on /buyer/create-contract form
- **Test Data:** Crop: Tomato, Qty: 500 kg, Target Price: ₹0/kg
- **Execution Steps:**
1. Open /buyer/create-contract
2. Enter requirement specs: Crop: Tomato, Qty: 500 kg, Target Price: ₹0/kg
3. Submit form
- **Expected Result:** Form should require positive price per unit
- **Actual Result:** DEFECT: CreateContract form accepts zero price without error
- **Status:** **FAIL**
- **Priority:** P1 | **Severity:** Medium
- **Defect ID:** [SAC-DEF-002](defects.md#sac-def-002)
- **Evidence/Screenshot:** `screenshots/SAC-TC-219_fail.png`

---


### Test Case ID: SAC-TC-220
- **Module:** Buyer Crop Requirements
- **Feature:** Create Requirement
- **User Role:** Buyer
- **Test Scenario:** Post requirement with HTML script tag in quality specs
- **Preconditions:** Buyer is on /buyer/create-contract form
- **Test Data:** Specs: <b>Fresh</b><script>alert("XSS")</script>
- **Execution Steps:**
1. Open /buyer/create-contract
2. Enter requirement specs: Specs: <b>Fresh</b><script>alert("XSS")</script>
3. Submit form
- **Expected Result:** Input textarea should sanitize HTML script tags
- **Actual Result:** DEFECT: Quality specs textarea accepts raw HTML script tag without stripping tags
- **Status:** **FAIL**
- **Priority:** P1 | **Severity:** Medium
- **Defect ID:** [SAC-DEF-005](defects.md#sac-def-005)
- **Evidence/Screenshot:** `screenshots/SAC-TC-220_fail.png`

---


### Test Case ID: SAC-TC-284
- **Module:** Marketplace
- **Feature:** Filter Combination
- **User Role:** Farmer
- **Test Scenario:** Combine category filter + location search filter and clear rapidly
- **Preconditions:** Farmer is on /farmer/marketplace page
- **Test Data:** Category: Vegetables + Search: Chennai
- **Execution Steps:**
1. Open /farmer/marketplace
2. Apply action: Category: Vegetables + Search: Chennai
3. Verify product list
- **Expected Result:** List should update cleanly without showing stale items
- **Actual Result:** DEFECT: Rapid search filter clearing can occasionally retain stale cached items until reload
- **Status:** **FAIL**
- **Priority:** P1 | **Severity:** Medium
- **Defect ID:** [SAC-DEF-003](defects.md#sac-def-003)
- **Evidence/Screenshot:** `screenshots/SAC-TC-284_fail.png`

---


### Test Case ID: SAC-TC-486
- **Module:** Responsive Design
- **Feature:** Viewport Layout 320px
- **User Role:** Farmer
- **Test Scenario:** Verify responsive layout and navigation at width 320px
- **Preconditions:** Application loaded
- **Test Data:** Viewport: 320px
- **Execution Steps:**
1. Set browser window width to 320px
2. Open /farmer/dashboard
3. Check overflow, text clipping, and navigation menu
- **Expected Result:** Layout should render cleanly without text overflow
- **Actual Result:** DEFECT: Minor text tag clipping observed on contract cards at 320px viewport
- **Status:** **FAIL**
- **Priority:** P2 | **Severity:** Low
- **Defect ID:** [SAC-DEF-004](defects.md#sac-def-004)
- **Evidence/Screenshot:** `screenshots/SAC-TC-486_fail.png`

---

