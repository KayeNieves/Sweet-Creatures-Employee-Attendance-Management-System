const STORAGE_KEY = 'sweet-creatures-attendance-data-v1';
const attendance = [
  ['Maria Santos', '08:02', 'OnTime'], ['Jun Reyes', '08:20', 'Late'], ['Ana Cruz', '--', 'Flagged'],
  ['Leo Tan', '07:58', 'OnTime'], ['Paolo Garcia', '08:05', 'OnTime'], ['Rina Lopez', '08:11', 'OnTime'],
  ['Jade Ramos', '07:55', 'OnTime'], ['Ben Aquino', '08:29', 'Late'], ['Mark Dizon', '--', 'Absent'], ['Kyle Mendoza', '--', 'Absent']
];
const staffSeed = [
  ['Maria Santos', 'Barista', '80.00', 'Jan 6, 2025', '0917 000 0001', 'Active'],
  ['Jun Reyes', 'Kitchen Staff', '85.00', 'Mar 3, 2025', '0917 000 0002', 'Active'],
  ['Ana Cruz', 'Barista', '80.00', 'Jun 16, 2025', '0917 000 0003', 'Locked'],
  ['Leo Tan', 'Cashier', '80.00', 'Aug 4, 2025', '0917 000 0004', 'Active'],
  ['Paolo Garcia', 'Kitchen Staff', '85.00', 'Sep 1, 2025', '0917 000 0005', 'Active'],
  ['Rina Lopez', 'Barista', '80.00', 'Jan 12, 2026', '0917 000 0006', 'Active'],
  ['Mark Dizon', 'Cashier', '80.00', 'Feb 2, 2026', '0917 000 0007', 'Inactive']
];
const flaggedSeed = [
  ['Ana Cruz', 'Nov 7', '--', '17:05', 'Missed Time In'],
  ['Jun Reyes', 'Nov 7', '08:35', '17:00', 'Late beyond grace'],
  ['Leo Tan', 'Nov 6', '08:00', '--', 'Missed Time Out']
];
const PAYROLL_CUTOFFS = [
  { value: '2026-11-01|2026-11-15', label: 'Nov 1 - Nov 15, 2026' },
  { value: '2026-11-16|2026-11-30', label: 'Nov 16 - Nov 30, 2026' }
];
const WAGE_TABLES = [
  { region: 'NCR', category: 'nonAgriculture', dailyMinimum: 755, effectiveDate: '2026-09-26', order: 'NCR-28' },
  { region: 'NCR', category: 'smallRetail', dailyMinimum: 718, effectiveDate: '2026-09-26', order: 'NCR-28' }
];
const payrollInputSeed = [
  { staffName: 'Maria Santos', cutoff: '2026-11-01|2026-11-15', daysWorked: 11, regularHours: 88, lateUndertimeMinutes: 30, overtimeHours: 2 },
  { staffName: 'Jun Reyes', cutoff: '2026-11-01|2026-11-15', daysWorked: 12, regularHours: 96, lateUndertimeMinutes: 30, overtimeHours: 0 },
  { staffName: 'Ana Cruz', cutoff: '2026-11-01|2026-11-15', daysWorked: 10, regularHours: 80, lateUndertimeMinutes: 0, overtimeHours: 0 },
  { staffName: 'Leo Tan', cutoff: '2026-11-01|2026-11-15', daysWorked: 11, regularHours: 88, lateUndertimeMinutes: 0, overtimeHours: 0 }
];
const badgeClass = { OnTime: 'green', Late: 'gold', Flagged: 'red', Absent: 'neutral', Active: 'green', Locked: 'red', Inactive: 'neutral' };
const makeId = () => `${Date.now()}-${Math.random().toString(36).slice(2)}`;
let photoDatabase;
let photoPreviewUrl;
const defaultData = () => ({
  staff: staffSeed.map(([name, position, rate, hired, contact, status]) => ({
    id: makeId(), name, position, rate, hired, contact, status, role: 'Staff',
    rateHistory: [{ rate, effectiveDate: toDateInput(hired) }]
  })),
  flagged: flaggedSeed.map(([name, date, timeIn, timeOut, reason]) => ({ id: makeId(), name, date, timeIn, timeOut, reason, status: 'Pending' })),
  payrollInputs: payrollInputSeed.map(input => ({ ...input })),
  payrollRuns: [],
  payrollSettings: { region: 'NCR', wageCategory: 'smallRetail' },
  cashAdvances: [
    { id: makeId(), staffName: 'Maria Santos', amount: 500, dateGranted: 'Oct 20', cutoff: 'Nov 1 - Nov 15', status: 'Approved', notes: '' },
    { id: makeId(), staffName: 'Jun Reyes', amount: 300, dateGranted: 'Oct 12', cutoff: 'Oct 16 - Oct 31', status: 'Deducted', notes: '' },
    { id: makeId(), staffName: 'Leo Tan', amount: 400, dateGranted: 'Nov 6', cutoff: 'Nov 16 - Nov 30', status: 'Pending', notes: '' },
    { id: makeId(), staffName: 'Paolo Garcia', amount: 600, dateGranted: 'Nov 7', cutoff: 'Nov 16 - Nov 30', status: 'Pending', notes: '' }
  ],
  policies: [
    { id: makeId(), version: 2, effectiveDate: '2026-10-01', savedBy: 'admin.owner', status: 'Current', gracePeriod: 15, lateRule: 'Deduct per minute late, after grace period', undertimeRule: 'Deduct per minute of early Time Out', standardShift: 8, otAfter: 8, otMultiplier: 1.25 },
    { id: makeId(), version: 1, effectiveDate: '2026-09-01', savedBy: 'admin.owner', status: 'Replaced', gracePeriod: 15, lateRule: 'Deduct per minute late, after grace period', undertimeRule: 'Deduct per minute of early Time Out', standardShift: 8, otAfter: 8, otMultiplier: 1.25 }
  ]
});

const message = document.querySelector('#app-message');
function notify(text, isError = false) {
  message.textContent = text;
  message.classList.toggle('is-error', isError);
  message.hidden = false;
  window.clearTimeout(notify.timeout);
  notify.timeout = window.setTimeout(() => { message.hidden = true; }, 6000);
}

function readData() {
  let saved;
  try {
    saved = localStorage.getItem(STORAGE_KEY);
  } catch {
    notify('Browser storage is unavailable. Changes will not be saved.', true);
    return defaultData();
  }
  if (!saved) return defaultData();
  try {
    const parsed = JSON.parse(saved);
    if (parsed.version !== 1 || !['staff', 'flagged', 'cashAdvances', 'policies'].every(key => Array.isArray(parsed[key]))) {
      throw new Error('Stored data has an unexpected format.');
    }
    const restored = { ...defaultData(), ...parsed };
    restored.payrollRuns = restored.payrollRuns.filter(run => run.calculationVersion === 2);
    return restored;
  } catch {
    notify('Saved browser data could not be read. It has not been overwritten.', true);
    return defaultData();
  }
}

let data = readData();
function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, ...data }));
    return true;
  } catch {
    notify('Could not save to browser storage. Check available storage and try again.', true);
    return false;
  }
}

function openPhotoDatabase() {
  if (photoDatabase) return Promise.resolve(photoDatabase);
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('sweet-creatures-attendance-photo-files', 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains('photos')) request.result.createObjectStore('photos');
    };
    request.onsuccess = () => {
      photoDatabase = request.result;
      resolve(photoDatabase);
    };
    request.onerror = () => reject(request.error || new Error('Could not open photo storage.'));
    request.onblocked = () => reject(new Error('Photo storage is busy in another open tab. Close other app tabs and retry.'));
  });
}
async function storePhoto(id, blob) {
  const db = await openPhotoDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('photos', 'readwrite');
    transaction.objectStore('photos').put(blob, id);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error || new Error('Could not save photo.'));
    transaction.onabort = () => reject(transaction.error || new Error('Photo save was canceled.'));
  });
}
async function getPhoto(id) {
  const db = await openPhotoDatabase();
  return new Promise((resolve, reject) => {
    const request = db.transaction('photos', 'readonly').objectStore('photos').get(id);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Could not load photo.'));
  });
}
async function deletePhoto(id) {
  const db = await openPhotoDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('photos', 'readwrite');
    transaction.objectStore('photos').delete(id);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error || new Error('Could not remove photo.'));
  });
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[character]);
}
function formatAmount(value) {
  return Number(value).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function formatDate(value) {
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
function toDateInput(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
function applyFilter(group) {
  const selected = group.querySelector('.filter.active');
  if (!selected) return;
  const rows = document.querySelectorAll(`#${group.dataset.filterGroup}-rows tr`);
  rows.forEach(row => { row.hidden = selected.dataset.filter !== 'all' && row.dataset.status !== selected.dataset.filter; });
}
function renderAttendance() {
  document.querySelector('#attendance-rows').innerHTML = attendance.map(([name, time, status]) => {
    const photoEntry = data.flagged.find(entry => entry.name === name && entry.hasPhoto);
    const photoCell = photoEntry
      ? `<button class="action-button" data-dashboard-photo="${escapeHtml(photoEntry.id)}">View</button>`
      : '--';
    return `<tr data-status="${status}"><td>${name}</td><td>${time}</td><td>--</td><td>--</td><td><span class="badge badge-${badgeClass[status]}">${status}</span></td><td>${photoCell}</td></tr>`;
  }).join('');
}
function renderStaff() {
  document.querySelector('#staff-rows').innerHTML = data.staff.map(person =>
    `<tr data-id="${escapeHtml(person.id)}" data-status="${escapeHtml(person.status)}"><td>${escapeHtml(person.name)}</td><td>${escapeHtml(person.role)}</td><td>${escapeHtml(person.position)}</td><td>PHP ${formatAmount(person.rate)}</td><td>${escapeHtml(person.hired)}</td><td>${escapeHtml(person.contact)}</td><td><span class="badge badge-${badgeClass[person.status] || 'neutral'}">${escapeHtml(person.status)}</span></td><td class="staff-actions"><button class="action-button" data-staff-action="edit">Edit</button>${person.status === 'Inactive' ? '<button class="action-button" data-staff-action="reactivate">Reactivate</button>' : person.status === 'Locked' ? '<button class="action-button" data-staff-action="unlock">Unlock</button>' : '<button class="action-button" data-staff-action="reset-pin">Reset PIN</button><button class="action-button" data-staff-action="deactivate">Deactivate</button>'}</td></tr>`
  ).join('');
  applyFilter(document.querySelector('[data-filter-group="staff"]'));
}
function renderFlagged() {
  document.querySelector('#flagged-rows').innerHTML = data.flagged.map(entry =>
    `<tr data-id="${escapeHtml(entry.id)}" data-status="${escapeHtml(entry.status)}"><td>${escapeHtml(entry.name)}</td><td>${escapeHtml(entry.date)}</td><td>${escapeHtml(entry.timeIn || '--')}</td><td>${escapeHtml(entry.timeOut || '--')}</td><td>${escapeHtml(entry.reason)}</td><td><span class="badge badge-${entry.status === 'Approved' ? 'green' : entry.status === 'Rejected' ? 'red' : 'gold'}">${escapeHtml(entry.status)}</span></td><td><button class="action-button" data-photo-action>${entry.hasPhoto ? 'View' : 'Add photo'}</button></td><td>${entry.status === 'Pending' ? '<button class="action-button" data-open="review-dialog">Review</button>' : '--'}</td></tr>`
  ).join('');
  const pendingCount = data.flagged.filter(entry => entry.status === 'Pending').length;
  document.querySelector('[data-filter-group="flagged"] [data-filter="Pending"]').textContent = `Pending ${pendingCount}`;
  applyFilter(document.querySelector('[data-filter-group="flagged"]'));
}
function renderCashAdvances() {
  document.querySelector('#cash-rows').innerHTML = data.cashAdvances.map(entry => {
    const badge = entry.status === 'Approved' ? 'green' : entry.status === 'Deducted' ? 'dark' : entry.status === 'Rejected' ? 'red' : 'gold';
    const date = entry.dateGranted.includes('-') ? formatDate(entry.dateGranted) : entry.dateGranted;
    return `<tr data-id="${escapeHtml(entry.id)}"><td>${escapeHtml(entry.staffName)}</td><td>${formatAmount(entry.amount)}</td><td>${escapeHtml(date)}</td><td>${escapeHtml(cutoffLabel(entry.cutoff))}</td><td>${escapeHtml(entry.notes)}</td><td><span class="badge badge-${badge}">${escapeHtml(entry.status)}</span></td><td>${entry.status === 'Pending' ? `<button class="action-button" data-cash-action="Approved" data-id="${escapeHtml(entry.id)}">Approve</button> | <button class="action-button" data-cash-action="Rejected" data-id="${escapeHtml(entry.id)}">Reject</button>` : '--'}</td></tr>`;
  }).join('');
}
function cutoffLabel(value) {
  const known = PAYROLL_CUTOFFS.find(cutoff => cutoff.value === normalizeCutoff(value));
  return known?.label || value;
}
function normalizeCutoff(value) {
  if (PAYROLL_CUTOFFS.some(cutoff => cutoff.value === value)) return value;
  const match = String(value).match(/^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{1,2})\s*-\s*(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{1,2})/);
  if (!match) return value;
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = String(months.indexOf(match[1]) + 1).padStart(2, '0');
  const start = `${startYearForLegacyCutoff(value)}-${month}-${match[2].padStart(2, '0')}`;
  const endMonth = String(months.indexOf(match[3]) + 1).padStart(2, '0');
  return `${start}|${startYearForLegacyCutoff(value)}-${endMonth}-${match[4].padStart(2, '0')}`;
}
function startYearForLegacyCutoff(value) {
  return value.includes('2026') ? '2026' : '2026';
}
function renderCashStaffOptions() {
  const select = document.querySelector('#cash-staff');
  const selected = select.value;
  select.innerHTML = data.staff.filter(person => person.status !== 'Inactive')
    .map(person => `<option value="${escapeHtml(person.name)}">${escapeHtml(person.name)}</option>`).join('');
  if (data.staff.some(person => person.name === selected && person.status !== 'Inactive')) select.value = selected;
  updateCashAdvanceLimit();
}
function availableCashAdvanceLimit(person, cutoff, exceptId) {
  const cutoffLimit = Math.min(1640, roundMoney(projectedNetPay(person, cutoff) * 0.5));
  const alreadyReserved = data.cashAdvances
    .filter(item => item.id !== exceptId
      && item.staffName === person.name
      && normalizeCutoff(item.cutoff) === cutoff
      && ['Pending', 'Approved', 'Deducted'].includes(item.status))
    .reduce((total, item) => total + Number(item.amount), 0);
  return Math.max(0, roundMoney(cutoffLimit - alreadyReserved));
}
function updateCashAdvanceLimit() {
  const person = data.staff.find(item => item.name === document.querySelector('#cash-staff').value);
  const cutoff = document.querySelector('#cash-cutoff').value;
  const maximum = person ? availableCashAdvanceLimit(person, cutoff) : 0;
  const amount = document.querySelector('#cash-form').elements.amount;
  amount.max = maximum.toFixed(2);
  document.querySelector('#cash-advance-limit').textContent = `Max PHP 1,640.00 (50% of projected net pay; PHP ${formatAmount(maximum)} available for this cutoff)`;
}
function renderPolicies() {
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const sorted = [...data.policies].sort((a, b) => b.effectiveDate.localeCompare(a.effectiveDate));
  const currentId = sorted.find(policy => policy.effectiveDate <= today)?.id;
  document.querySelector('#policy-rows').innerHTML = sorted.map(policy => {
    const status = policy.effectiveDate > today ? 'Scheduled' : policy.id === currentId ? 'Current' : 'Replaced';
    return `<tr><td>v${escapeHtml(policy.version)}</td><td>${escapeHtml(formatDate(policy.effectiveDate))}</td><td>${escapeHtml(policy.savedBy)}</td><td><span class="badge badge-${status === 'Current' ? 'green' : status === 'Scheduled' ? 'gold' : 'neutral'}">${status}</span></td></tr>`;
  }).join('');
}
function cutoffValue() {
  return document.querySelector('#payroll-cutoff').value;
}
function selectedWageTable(cutoff) {
  const [, endDate] = cutoff.split('|');
  const category = document.querySelector('#wage-category').value;
  return WAGE_TABLES.find(table => table.region === 'NCR' && table.category === category && table.effectiveDate <= endDate);
}
function effectiveRate(person, cutoff) {
  const [, endDate] = cutoff.split('|');
  const history = person.rateHistory || [{ rate: person.rate, effectiveDate: person.rateEffectiveDate || toDateInput(person.hired) }];
  const applicable = history
    .filter(item => item.effectiveDate <= endDate)
    .sort((a, b) => b.effectiveDate.localeCompare(a.effectiveDate))[0];
  return applicable ? Number(applicable.rate) : 0;
}
function roundMoney(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
function projectedNetPay(person, cutoff = cutoffValue()) {
  const input = data.payrollInputs.find(item => item.staffName === person.name && item.cutoff === cutoff);
  const policy = data.policies
    .filter(item => item.effectiveDate <= cutoff.split('|')[1])
    .sort((a, b) => b.effectiveDate.localeCompare(a.effectiveDate))[0] || data.policies[0];
  const rate = effectiveRate(person, cutoff);
  const hours = input?.regularHours ?? policy.standardShift * 10;
  const basicPay = hours * rate;
  const overtimePay = (input?.overtimeHours || 0) * rate * (policy.otMultiplier || 1.25);
  const lateDeduction = ((input?.lateUndertimeMinutes || 0) / 60) * rate;
  return Math.max(0, roundMoney(basicPay + overtimePay - lateDeduction));
}
function computePayroll(cutoff) {
  const [startDate, endDate] = cutoff.split('|');
  const wageTable = selectedWageTable(cutoff);
  if (!wageTable) throw new Error('No effective NCR minimum-wage table is configured for this cutoff.');
  const policy = data.policies
    .filter(item => item.effectiveDate <= endDate)
    .sort((a, b) => b.effectiveDate.localeCompare(a.effectiveDate))[0];
  if (!policy) throw new Error('No attendance policy is effective for this payroll cutoff.');
  const inputs = data.payrollInputs.filter(item => item.cutoff === cutoff);
  const rows = inputs.flatMap(input => {
    const person = data.staff.find(item => item.name === input.staffName && item.status !== 'Inactive');
    if (!person) return [];
    const rate = effectiveRate(person, cutoff);
    const basicPay = roundMoney(input.regularHours * rate);
    const overtimePay = roundMoney(input.overtimeHours * rate * policy.otMultiplier);
    const lateDeduction = roundMoney(input.lateUndertimeMinutes * rate / 60);
    const advance = data.cashAdvances
      .filter(item => item.staffName === person.name && normalizeCutoff(item.cutoff) === cutoff && item.status === 'Approved')
      .reduce((total, item) => total + Number(item.amount), 0);
    const netPay = roundMoney(basicPay + overtimePay - lateDeduction - advance);
    return [{
      id: makeId(), staffName: person.name, daysWorked: input.daysWorked,
      regularHours: input.regularHours, overtimeHours: input.overtimeHours,
      hourlyRate: rate, basicPay, overtimePay, lateDeduction,
      cashAdvanceDeduction: advance, netPay,
      minimumWage: wageTable.dailyMinimum,
      wageCompliant: rate * policy.standardShift >= wageTable.dailyMinimum,
      payrollStatus: 'Draft'
    }];
  });
  if (!rows.length) throw new Error('No payroll attendance inputs are available for this cutoff.');
  return {
    id: makeId(), cutoff, startDate, endDate, region: 'NCR',
    calculationVersion: 2,
    wageCategory: document.querySelector('#wage-category').value,
    wageOrder: wageTable.order, wageEffectiveDate: wageTable.effectiveDate,
    policy: { ...policy }, computedAt: new Date().toISOString(),
    status: 'Draft', rows
  };
}
function unresolvedFlaggedEntries(cutoff) {
  const [startDate, endDate] = cutoff.split('|');
  return data.flagged.filter(entry => {
    if (entry.status !== 'Pending') return false;
    const parsedDate = /^\d{4}-\d{2}-\d{2}$/.test(entry.date)
      ? entry.date
      : (() => {
        const match = entry.date.match(/^([A-Za-z]+)\s+(\d{1,2})$/);
        if (!match) return '';
        const month = new Date(`${match[1]} 1, ${startDate.slice(0, 4)}`).getMonth() + 1;
        return `${startDate.slice(0, 4)}-${String(month).padStart(2, '0')}-${String(Number(match[2])).padStart(2, '0')}`;
      })();
    return parsedDate >= startDate && parsedDate <= endDate;
  });
}
function showPayslip(run, row) {
  const details = [
    ['Employee', row.staffName],
    ['Days worked', row.daysWorked],
    ['Hours worked', formatAmount(row.regularHours)],
    ['Gross pay (PHP)', formatAmount(row.basicPay)],
    ['Late/undertime deduction (PHP)', formatAmount(row.lateDeduction)],
    ['Overtime hours', formatAmount(row.overtimeHours)],
    ['Overtime pay (PHP)', formatAmount(row.overtimePay)],
    ['Cash advance deduction (PHP)', formatAmount(row.cashAdvanceDeduction)],
    ['Net pay (PHP)', formatAmount(row.netPay)],
    ['Payroll status', run.status === 'Finalized' ? 'Finalized' : 'Draft sample']
  ];
  document.querySelector('#payslip-title').textContent = `Payslip - ${row.staffName}`;
  document.querySelector('#payslip-description').textContent = 'Sample payslip preview; figures are calculated from the selected payroll cutoff.';
  document.querySelector('#payslip-details').innerHTML = details
    .map(([label, value]) => `<tr><th scope="row">${escapeHtml(label)}</th><td>${escapeHtml(value)}</td></tr>`)
    .join('');
  document.querySelector('#payslip-dialog').showModal();
}
function renderPayroll() {
  const cutoff = cutoffValue();
  const run = data.payrollRuns.find(item => item.cutoff === cutoff);
  const rows = document.querySelector('#payroll-rows');
  const warning = document.querySelector('#payroll-warning');
  const finalizeButton = document.querySelector('#finalize-payroll');
  document.querySelector('#wage-category').value = run?.wageCategory || data.payrollSettings.wageCategory;
  document.querySelector('#wage-category').disabled = run?.status === 'Finalized';
  document.querySelector('#payroll-compute').disabled = run?.status === 'Finalized';
  if (!run) {
    rows.innerHTML = '<tr><td colspan="11">Select Compute to calculate this cutoff.</td></tr>';
    warning.hidden = true;
    finalizeButton.disabled = true;
    return;
  }
  rows.innerHTML = run.rows.map(row => {
    const status = run.status === 'Finalized' ? 'Finalized' : row.wageCompliant ? 'Draft' : 'Below minimum wage';
    const badge = status === 'Finalized' ? 'green' : row.wageCompliant ? 'gold' : 'red';
    return `<tr><td>${escapeHtml(row.staffName)}</td><td>${row.daysWorked}</td><td>${formatAmount(row.regularHours)}</td><td>${formatAmount(row.basicPay)}</td><td>${formatAmount(row.lateDeduction)}</td><td>${formatAmount(row.overtimeHours)}</td><td>${formatAmount(row.overtimePay)}</td><td>${formatAmount(row.cashAdvanceDeduction)}</td><td>${formatAmount(row.netPay)}</td><td><span class="badge badge-${badge}">${status}</span></td><td><button class="action-button" data-payslip-view="${escapeHtml(row.id)}">View</button></td></tr>`;
  }).join('');
  const pending = unresolvedFlaggedEntries(cutoff);
  const belowMinimum = run.rows.filter(row => !row.wageCompliant);
  const negativeNet = run.rows.filter(row => row.netPay < 0);
  const warnings = [];
  if (pending.length) warnings.push(`${pending.length} flagged attendance entr${pending.length === 1 ? 'y is' : 'ies are'} unresolved; resolve them before finalizing.`);
  if (belowMinimum.length) warnings.push(`${belowMinimum.map(row => row.staffName).join(', ')} have an hourly rate below the selected NCR minimum-wage equivalent.`);
  if (negativeNet.length) warnings.push(`${negativeNet.map(row => row.staffName).join(', ')} have negative net pay.`);
  warning.textContent = warnings.join(' ');
  warning.hidden = warnings.length === 0;
  finalizeButton.disabled = run.status === 'Finalized' || pending.length > 0 || belowMinimum.length > 0 || negativeNet.length > 0;
  finalizeButton.textContent = run.status === 'Finalized' ? 'Payslips Finalized' : 'Finalize Payslips';
}
function renderAll() {
  renderAttendance();
  renderStaff();
  renderFlagged();
  renderCashAdvances();
  renderCashStaffOptions();
  renderPolicies();
  renderPayroll();
}
renderAll();

document.querySelector('#payroll-cutoff').addEventListener('change', () => {
  renderPayroll();
  updateCashAdvanceLimit();
});
document.querySelector('#wage-category').addEventListener('change', event => {
  const previous = data.payrollSettings.wageCategory;
  const cutoff = cutoffValue();
  const previousRuns = [...data.payrollRuns];
  data.payrollSettings.wageCategory = event.currentTarget.value;
  data.payrollRuns = data.payrollRuns.filter(run => run.cutoff !== cutoff || run.status === 'Finalized');
  if (!persist()) {
    data.payrollSettings.wageCategory = previous;
    data.payrollRuns = previousRuns;
  }
  renderPayroll();
});
document.querySelector('#payroll-compute').addEventListener('click', () => {
  const cutoff = cutoffValue();
  if (data.payrollRuns.some(run => run.cutoff === cutoff && run.status === 'Finalized')) {
    notify('Finalized payroll is locked and cannot be recomputed.', true);
    return;
  }
  try {
    const previousRuns = [...data.payrollRuns];
    const run = computePayroll(cutoff);
    data.payrollRuns = [...data.payrollRuns.filter(item => item.cutoff !== cutoff), run];
    if (!persist()) {
      data.payrollRuns = previousRuns;
      return;
    }
    renderPayroll();
    notify(`Payroll computed for ${PAYROLL_CUTOFFS.find(item => item.value === cutoff)?.label || cutoff}. Review warnings before finalizing.`);
  } catch (error) {
    notify(`Could not compute payroll: ${error.message}`, true);
  }
});
document.querySelector('#finalize-payroll').addEventListener('click', () => {
  const cutoff = cutoffValue();
  const run = data.payrollRuns.find(item => item.cutoff === cutoff);
  if (!run || run.status === 'Finalized') return;
  const blockers = [];
  if (unresolvedFlaggedEntries(cutoff).length) blockers.push('resolve flagged attendance');
  if (run.rows.some(row => !row.wageCompliant)) blockers.push('correct hourly rates below minimum wage');
  if (run.rows.some(row => row.netPay < 0)) blockers.push('resolve negative net pay');
  if (blockers.length) {
    notify(`Cannot finalize payroll: ${blockers.join('; ')}.`, true);
    renderPayroll();
    return;
  }
  const previousStatus = run.status;
  const previousAdvanceStatuses = data.cashAdvances.map(entry => entry.status);
  run.status = 'Finalized';
  run.finalizedAt = new Date().toISOString();
  run.rows.forEach(row => { row.payrollStatus = 'Finalized'; });
  data.cashAdvances.forEach(entry => {
    if (normalizeCutoff(entry.cutoff) === cutoff && entry.status === 'Approved') entry.status = 'Deducted';
  });
  if (!persist()) {
    run.status = previousStatus;
    run.rows.forEach(row => { row.payrollStatus = previousStatus; });
    data.cashAdvances.forEach((entry, index) => { entry.status = previousAdvanceStatuses[index]; });
    return;
  }
  renderPayroll();
  renderCashAdvances();
  notify('Payslips finalized and locked. Approved cash advances for this cutoff are marked as deducted.');
});

function openPhotoDialog(entry, allowUpload) {
  const dialog = document.querySelector('#photo-dialog');
  const image = document.querySelector('#photo-preview');
  dialog.dataset.recordId = entry.id;
  image.hidden = true;
  image.removeAttribute('src');
  document.querySelector('#photo-message').textContent = entry.hasPhoto
    ? 'Saved attendance photo for this employee.'
    : 'No photo has been saved for this attendance entry yet.';
  document.querySelector('#photo-form').hidden = !allowUpload;
  document.querySelector('#photo-form').reset();
  dialog.showModal();
  if (entry.hasPhoto) {
    getPhoto(entry.id).then(blob => {
      if (!dialog.open || dialog.dataset.recordId !== entry.id) return;
      if (!blob) {
        document.querySelector('#photo-message').textContent = 'The saved photo is unavailable in this browser.';
        return;
      }
      photoPreviewUrl = URL.createObjectURL(blob);
      image.src = photoPreviewUrl;
      image.hidden = false;
    }).catch(() => notify('Could not load the saved photo from browser storage.', true));
  }
}

function showPage(page) {
  document.querySelectorAll('.page').forEach(section => { section.hidden = section.id !== page; });
  document.querySelectorAll('.nav-link').forEach(button => button.classList.toggle('active', button.dataset.page === (page === 'policy' ? 'flagged' : page)));
}
document.querySelector('#login-form').addEventListener('submit', event => {
  event.preventDefault();
  document.querySelector('#login').hidden = true;
  document.querySelector('#app').hidden = false;
  showPage('dashboard');
});
document.querySelector('#logout').addEventListener('click', () => {
  document.querySelector('#app').hidden = true;
  document.querySelector('#login').hidden = false;
});
document.querySelector('#show-pin').addEventListener('click', event => {
  const pin = document.querySelector('#pin');
  pin.type = pin.type === 'password' ? 'text' : 'password';
  event.currentTarget.textContent = pin.type === 'password' ? 'Show' : 'Hide';
});
document.addEventListener('click', event => {
  const target = event.target;
  const navigation = target.closest('[data-page], [data-go]');
  if (navigation) showPage(navigation.dataset.page || navigation.dataset.go);

  const staffAction = target.closest('[data-staff-action]');
  if (staffAction) {
    const person = data.staff.find(item => item.id === staffAction.closest('tr').dataset.id);
    if (!person) return;
    const action = staffAction.dataset.staffAction;
    if (action === 'reset-pin') {
      notify('PIN reset requires secure authentication and a backend; PINs are not stored in this browser.', true);
      return;
    }
    if (action === 'edit') {
      const dialog = document.querySelector('#staff-dialog');
      const form = document.querySelector('#staff-form');
      dialog.dataset.recordId = person.id;
      form.querySelector('h2').textContent = 'Edit Staff';
      form.querySelector('[value="save"]').textContent = 'Save Changes';
      form.elements.name.value = person.name;
      form.elements.contact.value = person.contact;
      form.elements.role.value = person.role;
      form.elements.position.value = person.position;
      form.elements.rate.value = person.rate;
      form.elements.rateEffectiveDate.value = person.rateEffectiveDate || toDateInput(person.hired);
      form.elements.dateHired.value = toDateInput(person.hired);
      form.elements.pin.required = false;
      form.elements.pin.value = '';
      document.querySelector('#staff-pin-field').hidden = true;
      dialog.showModal();
      return;
    }
    const oldStatus = person.status;
    person.status = action === 'deactivate' ? 'Inactive' : 'Active';
    if (!persist()) {
      person.status = oldStatus;
      return;
    }
    renderStaff();
    notify(`Staff member ${action === 'deactivate' ? 'deactivated' : action === 'unlock' ? 'unlocked' : 'reactivated'}.`);
    return;
  }

  const opener = target.closest('[data-open]');
  if (opener) {
    const dialog = document.getElementById(opener.dataset.open);
    if (opener.dataset.open === 'staff-dialog') {
      const form = document.querySelector('#staff-form');
      delete dialog.dataset.recordId;
      form.reset();
      form.querySelector('h2').textContent = 'Add Staff';
      form.querySelector('[value="save"]').textContent = 'Save Staff';
      form.elements.role.value = 'Staff';
      form.elements.pin.required = true;
      document.querySelector('#staff-pin-field').hidden = false;
    }
    if (opener.dataset.open === 'review-dialog') {
      const entry = data.flagged.find(item => item.id === opener.closest('tr').dataset.id);
      if (!entry) return;
      dialog.dataset.recordId = entry.id;
      dialog.querySelector('h2').textContent = `Review: ${entry.name}, ${entry.date}`;
      dialog.querySelector('.modal-description').textContent = `Reason flagged: ${entry.reason}. Check the photo, then enter the correct times.`;
      const form = dialog.querySelector('form');
      form.elements.timeIn.value = entry.timeIn === '--' ? '' : entry.timeIn;
      form.elements.timeOut.value = entry.timeOut === '--' ? '' : entry.timeOut;
      form.elements.remarks.value = '';
      form.elements.remarks.setCustomValidity('');
    }
    dialog.showModal();
  }

  const payslipButton = target.closest('[data-payslip-view]');
  if (payslipButton) {
    const run = data.payrollRuns.find(item => item.cutoff === cutoffValue());
    const row = run?.rows.find(item => item.id === payslipButton.dataset.payslipView);
    if (run && row) showPayslip(run, row);
  }

  const photoAction = target.closest('[data-photo-action]');
  if (photoAction) {
    const entry = data.flagged.find(item => item.id === photoAction.closest('tr').dataset.id);
    if (!entry) return;
    openPhotoDialog(entry, true);
  }

  const dashboardPhoto = target.closest('[data-dashboard-photo]');
  if (dashboardPhoto) {
    const entry = data.flagged.find(item => item.id === dashboardPhoto.dataset.dashboardPhoto && item.hasPhoto);
    if (entry) openPhotoDialog(entry, false);
  }

  const closeButton = target.closest('[data-close-dialog]');
  if (closeButton) closeButton.closest('dialog').close();

  const filter = target.closest('[data-filter]');
  if (filter) {
    const group = filter.closest('[data-filter-group]');
    group.querySelectorAll('.filter').forEach(button => button.classList.toggle('active', button === filter));
    applyFilter(group);
  }

  const cashAction = target.closest('[data-cash-action]');
  if (cashAction) {
    const entry = data.cashAdvances.find(item => item.id === cashAction.dataset.id);
    if (!entry || entry.status !== 'Pending') return;
    if (cashAction.dataset.cashAction === 'Approved') {
      const person = data.staff.find(item => item.name === entry.staffName);
      const advanceCutoff = normalizeCutoff(entry.cutoff);
      const limit = person ? availableCashAdvanceLimit(person, advanceCutoff, entry.id) : 0;
      if (Number(entry.amount) > limit) {
        notify(`Cannot approve this cash advance. The maximum is PHP ${formatAmount(limit)} (the lower of PHP 1,640.00 or 50% of projected net pay).`, true);
        return;
      }
    }
    const previousStatus = entry.status;
    entry.status = cashAction.dataset.cashAction;
    if (!persist()) {
      entry.status = previousStatus;
      return;
    }
    renderCashAdvances();
    notify(`Cash advance ${entry.status.toLowerCase()}.`);
  }
});

document.querySelector('#staff-form').addEventListener('submit', event => {
  if (event.submitter?.value !== 'save') return;
  event.preventDefault();
  const form = event.currentTarget;
  const values = new FormData(form);
  const existing = data.staff.find(person => person.id === form.closest('dialog').dataset.recordId);
  const person = existing || { id: makeId(), status: 'Active' };
  const previous = existing ? { ...existing } : null;
  const rate = Number(values.get('rate')).toFixed(2);
  const rateEffectiveDate = values.get('rateEffectiveDate');
  const rateHistory = existing?.rateHistory
    ? [...existing.rateHistory]
    : existing
      ? [{ rate: existing.rate, effectiveDate: existing.rateEffectiveDate || toDateInput(existing.hired) }]
      : [];
  if (!existing || rate !== existing.rate) {
    person.rateHistory = [
      ...rateHistory.filter(item => item.effectiveDate !== rateEffectiveDate),
      { rate, effectiveDate: rateEffectiveDate }
    ];
  } else {
    person.rateHistory = rateHistory;
  }
  Object.assign(person, {
    name: values.get('name').trim(),
    role: values.get('role').trim(),
    position: values.get('position').trim(),
    rate,
    hired: formatDate(values.get('dateHired')),
    rateEffectiveDate,
    contact: values.get('contact').trim()
  });
  if (!existing) data.staff.push(person);
  if (!persist()) {
    if (existing) Object.assign(existing, previous);
    else data.staff.pop();
    return;
  }
  form.reset();
  form.elements.role.value = 'Staff';
  form.elements.pin.required = true;
  document.querySelector('#staff-pin-field').hidden = false;
  form.querySelector('h2').textContent = 'Add Staff';
  form.querySelector('[value="save"]').textContent = 'Save Staff';
  delete form.closest('dialog').dataset.recordId;
  form.closest('dialog').close('save');
  renderStaff();
  renderCashStaffOptions();
  notify(existing ? 'Staff details saved in this browser.' : 'Staff member saved in this browser. The PIN was not saved.');
});

document.querySelector('#photo-form').addEventListener('submit', async event => {
  event.preventDefault();
  const form = event.currentTarget;
  const file = form.elements.photo.files[0];
  const entry = data.flagged.find(item => item.id === form.closest('dialog').dataset.recordId);
  if (!entry || !file) return;
  if (!file.type.startsWith('image/')) {
    notify('Choose a valid image file.', true);
    return;
  }
  const hadPhoto = entry.hasPhoto;
  let previousPhoto;
  try {
    if (hadPhoto) previousPhoto = await getPhoto(entry.id);
    await storePhoto(entry.id, file);
    entry.hasPhoto = true;
    if (!persist()) {
      if (previousPhoto) await storePhoto(entry.id, previousPhoto);
      else await deletePhoto(entry.id);
      entry.hasPhoto = hadPhoto;
      return;
    }
    renderFlagged();
    renderAttendance();
    notify('Attendance photo saved in this browser.');
    form.closest('dialog').close();
  } catch (error) {
    entry.hasPhoto = hadPhoto;
    notify(`Could not save the photo: ${error.message || 'browser storage error'}`, true);
  }
});

document.querySelector('#photo-preview').addEventListener('load', () => {
  if (photoPreviewUrl) URL.revokeObjectURL(photoPreviewUrl);
  photoPreviewUrl = null;
});
document.querySelector('#photo-form [name="photo"]').addEventListener('change', event => {
  const file = event.currentTarget.files[0];
  const image = document.querySelector('#photo-preview');
  if (!file || !file.type.startsWith('image/')) return;
  if (photoPreviewUrl) URL.revokeObjectURL(photoPreviewUrl);
  photoPreviewUrl = URL.createObjectURL(file);
  image.src = photoPreviewUrl;
  image.hidden = false;
});
document.querySelector('#photo-dialog').addEventListener('close', () => {
  if (photoPreviewUrl) URL.revokeObjectURL(photoPreviewUrl);
  photoPreviewUrl = null;
  document.querySelector('#photo-preview').removeAttribute('src');
  document.querySelector('#photo-form').hidden = false;
});
document.querySelector('#staff-dialog').addEventListener('close', () => {
  const form = document.querySelector('#staff-form');
  if (form.closest('dialog').dataset.recordId) {
    delete form.closest('dialog').dataset.recordId;
    form.reset();
    form.elements.pin.required = true;
    document.querySelector('#staff-pin-field').hidden = false;
    form.querySelector('h2').textContent = 'Add Staff';
    form.querySelector('[value="save"]').textContent = 'Save Staff';
  }
});

document.querySelector('#cash-form').addEventListener('submit', event => {
  event.preventDefault();
  const form = event.currentTarget;
  const values = new FormData(form);
  const person = data.staff.find(item => item.name === values.get('staffName'));
  if (!person) {
    notify('Select an active staff member for the cash advance.', true);
    return;
  }
  const cutoff = normalizeCutoff(values.get('cutoff'));
  const maximum = availableCashAdvanceLimit(person, cutoff);
  const amount = Number(values.get('amount'));
  if (!Number.isFinite(amount) || amount <= 0 || amount > maximum) {
    notify(`Cash advance must be greater than zero and no more than PHP ${formatAmount(maximum)} (the lower of PHP 1,640.00 or 50% of projected net pay).`, true);
    return;
  }
  const entry = {
    id: makeId(),
    staffName: values.get('staffName').trim(),
    amount,
    dateGranted: values.get('dateGranted'),
    cutoff,
    notes: values.get('notes').trim(),
    status: 'Pending'
  };
  data.cashAdvances.push(entry);
  if (!persist()) {
    data.cashAdvances.pop();
    return;
  }
  event.currentTarget.reset();
  renderCashAdvances();
  renderCashStaffOptions();
  notify('Cash advance saved in this browser as pending.');
});
document.querySelector('#cash-staff').addEventListener('change', updateCashAdvanceLimit);
document.querySelector('#cash-cutoff').addEventListener('change', updateCashAdvanceLimit);

document.querySelector('#policy-form').addEventListener('submit', event => {
  event.preventDefault();
  const values = new FormData(event.currentTarget);
  const policy = {
    id: makeId(),
    version: Math.max(0, ...data.policies.map(item => Number(item.version))) + 1,
    effectiveDate: values.get('effectiveDate'),
    savedBy: 'admin.owner',
    gracePeriod: Number(values.get('gracePeriod')),
    lateRule: values.get('lateRule').trim(),
    undertimeRule: values.get('undertimeRule').trim(),
    standardShift: Number(values.get('standardShift')),
    otAfter: Number(values.get('otAfter')),
    otMultiplier: Number(values.get('otMultiplier'))
  };
  data.policies.push(policy);
  if (!persist()) {
    data.policies.pop();
    return;
  }
  renderPolicies();
  notify(`Policy version v${policy.version} saved in this browser.`);
});

document.querySelector('#review-form').addEventListener('submit', event => {
  event.preventDefault();
  const form = event.currentTarget;
  const decision = event.submitter?.value;
  if (decision === 'cancel') {
    form.closest('dialog').close('cancel');
    return;
  }
  const remarks = form.elements.remarks.value.trim();
  const entry = data.flagged.find(item => item.id === form.closest('dialog').dataset.recordId);
  if (!entry || !['approve', 'reject'].includes(decision)) return;
  if (!remarks) {
    form.elements.remarks.setCustomValidity('Enter remarks before saving the decision.');
    form.elements.remarks.reportValidity();
    return;
  }
  form.elements.remarks.setCustomValidity('');
  if (decision === 'approve' && (!form.elements.timeIn.value || !form.elements.timeOut.value)) {
    notify('Enter both corrected times before approving this entry.', true);
    return;
  }
  const previous = { status: entry.status, timeIn: entry.timeIn, timeOut: entry.timeOut, remarks: entry.remarks, decidedAt: entry.decidedAt };
  entry.status = decision === 'approve' ? 'Approved' : 'Rejected';
  entry.timeIn = form.elements.timeIn.value || entry.timeIn;
  entry.timeOut = form.elements.timeOut.value || entry.timeOut;
  entry.remarks = remarks;
  entry.decidedAt = new Date().toISOString();
  if (!persist()) {
    Object.assign(entry, previous);
    return;
  }
  form.closest('dialog').close(decision);
  renderFlagged();
  notify(`Attendance entry ${entry.status.toLowerCase()}.`);
});
document.querySelector('#print').addEventListener('click', () => window.print());
document.querySelector('#print-payslip').addEventListener('click', () => {
  document.body.classList.add('print-payslip');
  window.print();
});
window.addEventListener('afterprint', () => document.body.classList.remove('print-payslip'));
