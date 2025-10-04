# Demo Data Reference - What's Actually in the Projects

## 📋 Residential Complex - Phase 1

**Contract Value:** $850,000  
**Status:** Active (75% complete)  
**Expected Completion:** June 15, 2024

### Milestones:

#### 1. Foundation Complete (Month 1 - February 2024)
- **Income:** $150,000
- **Status:** Completed ✓
- **Cost Model:** Simple (single payment)
- **Total Cost:** $120,000
- **Payment Timing:** -14 days (paid 14 days BEFORE receiving income)
- **Margin:** $30,000 (20%)

#### 2. Frame & Roof (Month 2 - March 2024)
- **Income:** $200,000
- **Status:** Completed ✓
- **Cost Model:** Detailed (itemized)
- **Cost Items:**
  - Timber Supply: $80,000 (paid 7 days before income, -7d)
  - Roofing Materials: $50,000 (paid same day as income, 0d)
  - Labor: $30,000 (paid 7 days after income, +7d)
- **Total Cost:** $160,000
- **Margin:** $40,000 (20%)

#### 3. Interior Rough-in (Month 3 - April 2024)
- **Income:** $180,000
- **Status:** Completed ✓
- **Cost Model:** Simple (single payment)
- **Total Cost:** $140,000
- **Payment Timing:** +7 days (paid 7 days AFTER receiving income)
- **Margin:** $40,000 (22.2%)

#### 4. Finishing Work (Month 4 - May 2024)
- **Income:** $220,000
- **Status:** In Progress ⟳
- **Cost Model:** Detailed (itemized)
- **Cost Items:**
  - Paint & Finishes: $60,000 (same day, 0d)
  - Flooring: $70,000 (14 days after, +14d)
  - Fixtures: $50,000 (30 days after, +30d)
- **Total Cost:** $180,000
- **Margin:** $40,000 (18.2%)

#### 5. Final Completion (Month 5 - June 2024)
- **Income:** $100,000
- **Status:** Pending ○
- **Cost Model:** Simple (single payment)
- **Total Cost:** $80,000
- **Payment Timing:** 0 days (same day as income)
- **Margin:** $20,000 (20%)

**PROJECT TOTALS:**
- Total Income: $850,000
- Total Costs: $680,000
- Net Margin: $170,000 (20%)

---

## 📋 Commercial Office Building

**Contract Value:** $1,200,000  
**Status:** Planning (25% complete)  
**Expected Completion:** September 30, 2024

### Milestones:

#### 1. Site Preparation (Month 1 - March 2024)
- **Income:** $50,000
- **Status:** Pending ○
- **Cost Model:** Simple
- **Total Cost:** $40,000
- **Payment Timing:** -30 days (deposit, paid 30 days before income)
- **Margin:** $10,000 (20%)

#### 2. Foundation & Structure (Month 3 - May 2024)
- **Income:** $400,000
- **Status:** Pending ○
- **Cost Model:** Detailed (itemized)
- **Cost Items:**
  - Concrete: $150,000 (14 days before, -14d)
  - Steel: $100,000 (7 days before, -7d)
  - Labor: $70,000 (7 days after, +7d)
- **Total Cost:** $320,000
- **Margin:** $80,000 (20%)

#### 3. Building Shell (Month 5 - July 2024)
- **Income:** $350,000
- **Status:** Pending ○
- **Cost Model:** Simple
- **Total Cost:** $280,000
- **Payment Timing:** 0 days (same day)
- **Margin:** $70,000 (20%)

#### 4. Interior Fitout (Month 7 - September 2024)
- **Income:** $400,000
- **Status:** Pending ○
- **Cost Model:** Detailed (itemized)
- **Cost Items:**
  - HVAC Systems: $120,000 (same day, 0d)
  - Electrical: $80,000 (7 days after, +7d)
  - Finishes: $90,000 (14 days after, +14d)
- **Total Cost:** $290,000
- **Margin:** $110,000 (27.5%)

**PROJECT TOTALS:**
- Total Income: $1,200,000
- Total Costs: $930,000
- Net Margin: $270,000 (22.5%)

---

## 📋 School Renovation Project

**Contract Value:** $450,000  
**Status:** Active (90% complete)  
**Expected Completion:** April 20, 2024

### Milestones:

#### 1. Demolition & Prep (Month 0 - January 2024)
- **Income:** $50,000
- **Status:** Completed ✓
- **Cost Model:** Simple
- **Total Cost:** $40,000
- **Payment Timing:** -7 days (paid 7 days before income)
- **Margin:** $10,000 (20%)

#### 2. Structural Repairs (Month 1 - February 2024)
- **Income:** $150,000
- **Status:** Completed ✓
- **Cost Model:** Detailed (itemized)
- **Cost Items:**
  - Materials: $60,000 (same day, 0d)
  - Labor: $50,000 (7 days after, +7d)
- **Total Cost:** $110,000
- **Margin:** $40,000 (26.7%)

#### 3. New Systems (Month 2 - March 2024)
- **Income:** $150,000
- **Status:** Completed ✓
- **Cost Model:** Simple
- **Total Cost:** $120,000
- **Payment Timing:** 0 days (same day)
- **Margin:** $30,000 (20%)

#### 4. Final Touches (Month 3 - April 2024)
- **Income:** $100,000
- **Status:** In Progress ⟳
- **Cost Model:** Simple
- **Total Cost:** $90,000
- **Payment Timing:** +14 days (paid 14 days after income)
- **Margin:** $10,000 (10%)

**PROJECT TOTALS:**
- Total Income: $450,000
- Total Costs: $360,000
- Net Margin: $90,000 (20%)

---

## 💡 Key Points

### **Cost Models:**

**Simple Cost Model** (usesSimpleCost: true):
- Single total cost amount
- One payment timing offset
- Example: Foundation Complete - $120,000 paid 14 days before income

**Detailed Cost Model** (usesSimpleCost: false):
- Multiple itemized cost items
- Each item has its own description, amount, and payment offset
- Example: Frame & Roof - Timber ($80k, -7d), Roofing ($50k, 0d), Labor ($30k, +7d)

### **Payment Offsets:**
- **Negative** (e.g., -14d): Paid BEFORE receiving income (upfront/deposit)
- **Zero** (0d): Paid same day as income received
- **Positive** (e.g., +7d): Paid AFTER receiving income (delayed payment)

### **This is the ACTUAL data** displayed in the demo
The cost breakdown should show exactly these amounts and descriptions!

---

## ✅ Verification Checklist

When you expand the cost breakdown for **Residential Complex - Phase 1**, you should see:

✓ Foundation Complete: $120,000 (simple cost, -14 days)  
✓ Frame & Roof: $160,000 total
  - Timber Supply: $80,000 (-7d)
  - Roofing Materials: $50,000 (0d)
  - Labor: $30,000 (+7d)  
✓ Interior Rough-in: $140,000 (simple cost, +7 days)  
✓ Finishing Work: $180,000 total
  - Paint & Finishes: $60,000 (0d)
  - Flooring: $70,000 (+14d)
  - Fixtures: $50,000 (+30d)  
✓ Final Completion: $80,000 (simple cost, 0 days)  

**Total: $680,000**

If you're seeing different descriptions or amounts, that would indicate a display bug!
