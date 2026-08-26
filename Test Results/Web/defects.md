# Smart Agri Connect — Detailed Defect Report

**Total Identified Defects:** 5

---


## Defect ID: SAC-DEF-001 — SellProduct form accepts zero quantity & negative price without client error validation

- **Associated Test Case ID:** `SAC-TC-115`
- **Module:** Crop / Product Management
- **Severity:** **Medium** | **Priority:** **P1**
- **Status:** **OPEN**

### Description
The SellProduct wizard step 3 allows submitting produce listings with zero quantity (0 kg) or negative prices (-₹25) without displaying client-side form validation error callout.

### Steps to Reproduce
```
1. Log in as Farmer
2. Open /farmer/sell
3. Select Agriculture -> Tomato
4. Enter Quantity = 0 kg, Price = -₹25
5. Click Next & Publish Listing
```

### Expected Result
Form validation error callouts "Quantity must be greater than zero" and "Price must be positive" should be displayed, blocking form submission.

### Actual Result
Form allows progression to step 4 review and publishes listing with invalid metrics.

---


## Defect ID: SAC-DEF-002 — CreateContract form accepts negative quantity & zero target price

- **Associated Test Case ID:** `SAC-TC-218`
- **Module:** Buyer Crop Requirements
- **Severity:** **Medium** | **Priority:** **P1**
- **Status:** **OPEN**

### Description
When creating a buyer contract requirement, entering negative quantity (e.g. -500 kg) or zero price (₹0/kg) is accepted without triggering input validation.

### Steps to Reproduce
```
1. Log in as Buyer
2. Open /buyer/create-contract
3. Select crop Rice
4. Enter Quantity = -500 kg, Target Price = ₹0/kg
5. Submit contract requirement
```

### Expected Result
Client-side form validation should highlight invalid fields in red and display error warning.

### Actual Result
Contract requirement is created and posted with negative quantity.

---


## Defect ID: SAC-DEF-003 — Rapid search filter clearing in FarmerMarketplace retains stale cached search items

- **Associated Test Case ID:** `SAC-TC-284`
- **Module:** Marketplace
- **Severity:** **Medium** | **Priority:** **P2**
- **Status:** **OPEN**

### Description
Rapidly clearing the location search input while a category filter is active in FarmerMarketplace can briefly display stale cached requirement cards until browser reload.

### Steps to Reproduce
```
1. Log in as Farmer
2. Open /farmer/marketplace
3. Select Category = Vegetables
4. Type search query "Chennai"
5. Rapidly clear search query using Backspace
```

### Expected Result
Marketplace card list updates instantly to show all vegetable requirements.

### Actual Result
Stale filtered list items remain displayed until filter is toggled again.

---


## Defect ID: SAC-DEF-004 — Minor text clipping on produce status tags at 320px mobile viewport width

- **Associated Test Case ID:** `SAC-TC-486`
- **Module:** Responsive Design
- **Severity:** **Low** | **Priority:** **P2**
- **Status:** **OPEN**

### Description
At 320px extra small mobile viewport width, status badge tags on contract cards in FarmerDashboard experience minor horizontal text clipping.

### Steps to Reproduce
```
1. Open Developer Tools and set viewport width to 320px
2. Log in as Farmer
3. Open /farmer/dashboard
4. Inspect active produce contract cards
```

### Expected Result
Text badges wrap or shrink cleanly to fit within 320px viewport without clipping.

### Actual Result
Status text tag edge is slightly clipped by card container boundary.

---


## Defect ID: SAC-DEF-005 — Quality specifications description textarea accepts un-sanitized raw HTML script tags

- **Associated Test Case ID:** `SAC-TC-220`
- **Module:** Buyer Crop Requirements
- **Severity:** **Low** | **Priority:** **P2**
- **Status:** **OPEN**

### Description
In CreateContract requirement form, the quality specifications description textarea accepts raw HTML script tags without stripping or escaping HTML tags in review step preview.

### Steps to Reproduce
```
1. Log in as Buyer
2. Open /buyer/create-contract
3. Enter quality specs: <b>Fresh</b><script>alert("XSS")</script>
4. Proceed to step 4 review summary
```

### Expected Result
Textarea input should strip or sanitize HTML script tags.

### Actual Result
Raw HTML text is stored and rendered without input sanitization.

---

