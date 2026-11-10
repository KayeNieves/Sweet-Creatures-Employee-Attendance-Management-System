# Sweet Creatures Employee Attendance and Payroll

## Payroll prototype

The Payroll page computes the selected cutoff from the demo attendance totals, the employee's effective-dated hourly rate, and the active attendance policy. Payslips show the fields in the current sample: staff, days and hours worked, gross pay, late/undertime deduction, overtime hours and pay, cash advance deduction, net pay, and payroll status. Net pay is gross pay plus overtime pay minus late/undertime and approved cash advances. Finalized runs are stored as snapshots and cannot be recomputed.

The initial wage region is NCR. For the café's apparent small service/retail category (15 or fewer workers), the configured daily minimum is PHP 718 under Wage Order NCR-28, effective September 26, 2026. Other non-agriculture businesses use PHP 755/day. Select the establishment category on the Payroll page; the system flags rates below its hourly equivalent and prevents finalization while minimum-wage or unresolved-attendance warnings remain.

Cash advances are limited to the remaining available amount under the lower of PHP 1,640.00 or 50% of projected net pay for the selected cutoff. Pending, approved, and already-deducted advances reserve part of that cap.

## Important limitations

This remains a browser-only prototype. Payroll attendance inputs are seeded demo aggregates, not time-clock records; the dashboard attendance display is also sample data. The prototype does not calculate statutory contributions or withholding taxes and does not implement all pay scenarios (for example holidays, rest days, night differential, 13th-month pay, or multiple monthly payroll adjustments). Confirm the applicable wage-order category before using actual payroll or payslips. Do not enter real employee or payroll information.

Official references:

- [NWPC NCR wage rates](https://nwpc.dole.gov.ph/ncr/)