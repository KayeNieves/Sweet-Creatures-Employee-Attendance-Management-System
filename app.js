const attendance = [
  ['Maria Santos', '08:02', 'OnTime'], ['Jun Reyes', '08:20', 'Late'], ['Ana Cruz', '--', 'Flagged'],
  ['Leo Tan', '07:58', 'OnTime'], ['Paolo Garcia', '08:05', 'OnTime'], ['Rina Lopez', '08:11', 'OnTime'],
  ['Jade Ramos', '07:55', 'OnTime'], ['Ben Aquino', '08:29', 'Late'], ['Mark Dizon', '--', 'Absent'], ['Kyle Mendoza', '--', 'Absent']
];
const staff = [
  ['Maria Santos', 'Barista', '80.00', 'Jan 6, 2025', '0917 000 0001', 'Active'],
  ['Jun Reyes', 'Kitchen Staff', '85.00', 'Mar 3, 2025', '0917 000 0002', 'Active'],
  ['Ana Cruz', 'Barista', '80.00', 'Jun 16, 2025', '0917 000 0003', 'Locked'],
  ['Leo Tan', 'Cashier', '80.00', 'Aug 4, 2025', '0917 000 0004', 'Active'],
  ['Paolo Garcia', 'Kitchen Staff', '85.00', 'Sep 1, 2025', '0917 000 0005', 'Active'],
  ['Rina Lopez', 'Barista', '80.00', 'Jan 12, 2026', '0917 000 0006', 'Active'],
  ['Mark Dizon', 'Cashier', '80.00', 'Feb 2, 2026', '0917 000 0007', 'Inactive']
];
const flagged = [
  ['Ana Cruz', 'Nov 7', '--', '17:05', 'Missed Time In'],
  ['Jun Reyes', 'Nov 7', '08:35', '17:00', 'Late beyond grace'],
  ['Leo Tan', 'Nov 6', '08:00', '--', 'Missed Time Out']
];
const payroll = [
  ['Maria Santos', '11', '88.0', '7,040.00', '40.00', '2.0', '200.00', '500.00', '6,700.00'],
  ['Jun Reyes', '12', '96.0', '8,160.00', '42.50', '0.0', '0.00', '0.00', '8,117.50'],
  ['Ana Cruz', '10', '80.0', '6,400.00', '0.00', '0.0', '0.00', '0.00', '6,400.00'],
  ['Leo Tan', '11', '88.0', '7,040.00', '0.00', '0.0', '0.00', '0.00', '7,040.00']
];
const badgeClass = { OnTime: 'green', Late: 'gold', Flagged: 'red', Absent: 'neutral', Active: 'green', Locked: 'red', Inactive: 'neutral' };
document.querySelector('#attendance-rows').innerHTML = attendance.map(([name, time, status]) => `<tr data-status="${status}"><td>${name}</td><td>${time}</td><td>--</td><td>--</td><td><span class="badge badge-${badgeClass[status]}">${status}</span></td><td>${time === '--' ? '--' : '<span class="action-text">View</span>'}</td></tr>`).join('');
document.querySelector('#staff-rows').innerHTML = staff.map(([name, position, rate, hired, contact, status]) => `<tr data-status="${status}"><td>${name}</td><td>Staff</td><td>${position}</td><td>PHP ${rate}</td><td>${hired}</td><td>${contact}</td><td><span class="badge badge-${badgeClass[status]}">${status}</span></td><td class="action-text">${status === 'Inactive' ? 'Edit | Reactivate' : status === 'Locked' ? 'Edit | Unlock | Deactivate' : 'Edit | Reset PIN | Deactivate'}</td></tr>`).join('');
document.querySelector('#flagged-rows').innerHTML = flagged.map(([name, date, timeIn, timeOut, reason]) => `<tr data-status="Pending"><td>${name}</td><td>${date}</td><td>${timeIn}</td><td>${timeOut}</td><td>${reason}</td><td><span class="badge badge-gold">Pending</span></td><td class="action-text">View</td><td><button class="action-button" data-open="review-dialog">Approve | Reject</button></td></tr>`).join('');
document.querySelector('#payroll-rows').innerHTML = payroll.map(row => `<tr>${row.map(value => `<td>${value}</td>`).join('')}<td><span class="badge badge-gold">Draft</span></td><td class="action-text">View</td></tr>`).join('');

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
  const navigation = event.target.closest('[data-page], [data-go]');
  if (navigation) showPage(navigation.dataset.page || navigation.dataset.go);
  const opener = event.target.closest('[data-open]');
  if (opener) {
    const dialog = document.getElementById(opener.dataset.open);
    if (opener.dataset.open === 'review-dialog') {
      const cells = opener.closest('tr').cells;
      dialog.querySelector('h2').textContent = `Review: ${cells[0].textContent}, ${cells[1].textContent}`;
      dialog.querySelector('.modal-description').replaceChildren(`Reason flagged: ${cells[4].textContent}.`, document.createElement('br'), 'Check the photo, then enter the correct times.');
      const inputs = dialog.querySelectorAll('input');
      inputs[0].value = cells[2].textContent === '--' ? '' : cells[2].textContent;
      inputs[1].value = cells[3].textContent === '--' ? '' : cells[3].textContent;
    }
    dialog.showModal();
  }
  const filter = event.target.closest('[data-filter]');
  if (filter) {
    const group = filter.closest('[data-filter-group]');
    group.querySelectorAll('.filter').forEach(button => button.classList.toggle('active', button === filter));
    const rows = document.querySelectorAll(`#${group.dataset.filterGroup}-rows tr`);
    rows.forEach(row => { row.hidden = filter.dataset.filter !== 'all' && row.dataset.status !== filter.dataset.filter; });
  }
});
document.querySelectorAll('[data-demo-form]').forEach(form => form.addEventListener('submit', event => event.preventDefault()));
document.querySelector('#print').addEventListener('click', () => window.print());
