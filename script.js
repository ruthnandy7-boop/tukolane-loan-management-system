/* Tukolane Loan Management System - simple JavaScript database (browser storage)
   For coursework demonstration only. Do not enter real borrower information.
   The accompanying tukolane_database.db shows the intended production database design. */
const STORE_KEY = "tukolaneLoanSystem";
let database = JSON.parse(localStorage.getItem(STORE_KEY)) || {
  customers: [], applications: [], loans: [], repayments: [], complaints: []
};
function saveDatabase(){ localStorage.setItem(STORE_KEY, JSON.stringify(database)); }
function money(amount){ return "UGX " + Number(amount || 0).toLocaleString("en-UG"); }
function showMessage(elementId, message, isError){
  const box = document.getElementById(elementId);
  box.textContent = message; box.style.display = "block";
  box.className = "msg " + (isError ? "err" : "ok");
  setTimeout(()=> box.style.display="none", 4000);
}
function nextId(list){ return list.length ? Math.max(...list.map(x=>x.id)) + 1 : 1; }
function findCustomer(id){ return database.customers.find(c=>c.id === Number(id)); }
function findLoan(id){ return database.loans.find(l=>l.id === Number(id)); }
function totalRepayable(loan){ return Math.round(loan.principal * (1 + loan.interestRate/100 * loan.months)); }
function amountPaid(loanId){ return database.repayments.filter(r=>r.loanId===loanId).reduce((s,r)=>s+r.amountPaid,0); }
function outstandingBalance(loan){ return Math.max(0, totalRepayable(loan) - amountPaid(loan.id)); }
function dueDate(loan, monthNumber){
  const start = new Date(loan.startDate);
  const due = new Date(start);
  due.setMonth(due.getMonth() + monthNumber);
  return due;
}
function overdueAmount(loan){
  if(loan.status !== "Active") return 0;
  const today = new Date(); let dueSoFar = 0;
  for(let m=1; m<=loan.months; m++){ if(dueDate(loan,m) <= today) dueSoFar += Math.round(totalRepayable(loan)/loan.months); }
  return Math.max(0, dueSoFar - amountPaid(loan.id));
}
function customerOptions(selectId, emptyText){
  const select = document.getElementById(selectId); select.innerHTML = "";
  const empty = document.createElement("option"); empty.value=""; empty.textContent=emptyText; select.appendChild(empty);
  database.customers.forEach(c=>{ const o=document.createElement("option"); o.value=c.id; o.textContent=c.fullName+" ("+c.phone+")"; select.appendChild(o); });
}
function loanOptions(selectId, emptyText){
  const select=document.getElementById(selectId); select.innerHTML="";
  const empty=document.createElement("option"); empty.value=""; empty.textContent=emptyText; select.appendChild(empty);
  database.loans.filter(l=>l.status==="Active").forEach(l=>{ const o=document.createElement("option"); o.value=l.id; o.textContent="Loan "+l.id+" - "+findCustomer(l.customerId).fullName; select.appendChild(o); });
}
function registerCustomer(event){
  event.preventDefault();
  const fullName=document.getElementById("customerName").value.trim();
  const phone=document.getElementById("customerPhone").value.trim();
  const nationalId=document.getElementById("nationalId").value.trim();
  const businessType=document.getElementById("businessType").value;
  const address=document.getElementById("address").value.trim();
  const monthlyIncome=Number(document.getElementById("monthlyIncome").value)||0;
  if(!fullName || !phone){ showMessage("customerMessage","Enter customer name and phone number.",true); return; }
  if(database.customers.some(c=>c.phone===phone)){ showMessage("customerMessage","A customer with this phone number already exists.",true); return; }
  database.customers.push({id:nextId(database.customers),fullName,phone,nationalId,businessType,address,monthlyIncome,registrationDate:new Date().toISOString().slice(0,10)});
  saveDatabase(); event.target.reset(); showMessage("customerMessage","Customer registered successfully."); displayCustomers(); customerOptions("applicationCustomer","Select customer");
}
function displayCustomers(){
  const table=document.getElementById("customerTable"); if(!table) return;
  table.innerHTML="<tr><th>ID</th><th>Name</th><th>Phone</th><th>Business</th><th>Monthly income</th><th>Registered</th></tr>";
  database.customers.forEach(c=>{ const row=table.insertRow(); [c.id,c.fullName,c.phone,c.businessType,money(c.monthlyIncome),c.registrationDate].forEach(v=>{ const cell=row.insertCell(); cell.textContent=v; }); });
}
function submitApplication(event){
  event.preventDefault();
  const customerId=Number(document.getElementById("applicationCustomer").value);
  const amount=Number(document.getElementById("loanAmount").value);
  const months=Number(document.getElementById("repaymentMonths").value);
  const rate=Number(document.getElementById("interestRate").value);
  const purpose=document.getElementById("loanPurpose").value;
  if(!customerId){ showMessage("applicationMessage","Select a customer.",true); return; }
  if(!amount || amount<=0 || !months || months<=0 || rate<0){ showMessage("applicationMessage","Enter valid loan details.",true); return; }
  const application={id:nextId(database.applications),customerId,amount,months,rate,purpose,status:"Pending",applicationDate:new Date().toISOString().slice(0,10),decision:null};
  database.applications.push(application); saveDatabase(); event.target.reset();
  showMessage("applicationMessage","Loan application submitted successfully."); displayApplications(); customerOptions("applicationCustomer","Select customer");
}
function displayApplications(){
  const table=document.getElementById("applicationTable"); if(!table) return;
  table.innerHTML="<tr><th>ID</th><th>Customer</th><th>Amount</th><th>Period</th><th>Rate</th><th>Total repayable</th><th>Status</th><th>Action</th></tr>";
  database.applications.forEach(a=>{
    const c=findCustomer(a.customerId); const row=table.insertRow();
    [a.id,c?c.fullName:"Unknown",money(a.amount),a.months+" months",a.rate+"%",money(Math.round(a.amount*(1+a.rate/100*a.months))),"", ""].forEach((v,i)=>{ const cell=row.insertCell(); if(i===5) cell.innerHTML='<span class="badge '+a.status.toLowerCase()+'">'+a.status+'</span>'; else if(i!==7) cell.textContent=v; });
    const actionCell=row.cells[7];
    if(a.status==="Pending"){ const approve=document.createElement("button"); approve.textContent="Approve"; approve.onclick=()=>decideApplication(a.id,"Approved"); const reject=document.createElement("button"); reject.textContent="Reject"; reject.className="secondary"; reject.onclick=()=>decideApplication(a.id,"Rejected"); actionCell.append(approve,reject); }
  });
}
function decideApplication(id,decision){
  const application=database.applications.find(a=>a.id===id); if(!application) return;
  application.status=decision; application.decision=new Date().toISOString().slice(0,10);
  if(decision==="Approved"){
    const total=Math.round(application.amount*(1+application.rate/100*application.months));
    database.loans.push({id:nextId(database.loans),applicationId:application.id,customerId:application.customerId,principal:application.amount,interestRate:application.rate,months:application.months,totalRepayable:total,outstandingBalance:total,status:"Active",startDate:new Date().toISOString().slice(0,10)});
  }
  saveDatabase(); displayApplications(); displayLoans(); loanOptions("repaymentLoan","Select active loan"); showMessage("applicationMessage","Application "+decision.toLowerCase()+".");
}
function displayLoans(){
  const table=document.getElementById("loanTable"); if(!table) return;
  table.innerHTML="<tr><th>Loan ID</th><th>Customer</th><th>Principal</th><th>Total repayable</th><th>Paid</th><th>Balance</th><th>Overdue</th><th>Status</th></tr>";
  database.loans.forEach(l=>{ const c=findCustomer(l.customerId); const row=table.insertRow();
    [l.id,c?c.fullName:"Unknown",money(l.principal),money(totalRepayable(l)),money(amountPaid(l.id)),money(outstandingBalance(l)),money(overdueAmount(l)),""].forEach((v,i)=>{ const cell=row.insertCell(); if(i===7) cell.innerHTML='<span class="badge '+l.status.toLowerCase()+'">'+l.status+'</span>'; else cell.textContent=v; }); });
}
function recordRepayment(event){
  event.preventDefault();
  const loan=findLoan(document.getElementById("repaymentLoan").value);
  const amount=Number(document.getElementById("repaymentAmount").value);
  const reference=document.getElementById("paymentReference").value.trim();
  const method=document.getElementById("paymentMethod").value;
  if(!loan){ showMessage("repaymentMessage","Select an active loan.",true); return; }
  if(!amount || amount<=0){ showMessage("repaymentMessage","Enter a valid repayment amount.",true); return; }
  if(!reference){ showMessage("repaymentMessage","Enter a payment reference.",true); return; }
  if(database.repayments.some(r=>r.reference===reference)){ showMessage("repaymentMessage","This payment reference already exists.",true); return; }
  const balance=outstandingBalance(loan);
  if(amount>balance){ showMessage("repaymentMessage","Payment cannot exceed the outstanding balance of "+money(balance)+".",true); return; }
  const newBalance=balance-amount;
  database.repayments.push({id:nextId(database.repayments),loanId:loan.id,amountPaid:amount,method,reference,paymentDate:new Date().toISOString().slice(0,10),balanceAfter:newBalance});
  if(newBalance===0) loan.status="Closed";
  saveDatabase(); event.target.reset();
  showMessage("repaymentMessage","Repayment recorded. Receipt "+reference+" | New balance: "+money(newBalance));
  displayLoans(); displayRepayments(); loanOptions("repaymentLoan","Select active loan");
}
function displayRepayments(){
  const table=document.getElementById("repaymentTable"); if(!table) return;
  table.innerHTML="<tr><th>Receipt</th><th>Loan ID</th><th>Customer</th><th>Amount</th><th>Method</th><th>Date</th><th>Balance after</th></tr>";
  database.repayments.slice().reverse().forEach(r=>{ const loan=findLoan(r.loanId); const row=table.insertRow();
    [r.reference,r.loanId,loan?findCustomer(loan.customerId).fullName:"Unknown",money(r.amountPaid),r.method,r.paymentDate,money(r.balanceAfter)].forEach(v=>{ const cell=row.insertCell(); cell.textContent=v; }); });
}
function displayDashboard(){
  const active=database.loans.filter(l=>l.status==="Active");
  const disbursed=database.loans.reduce((s,l)=>s+l.principal,0);
  const collected=database.repayments.reduce((s,r)=>s+r.amountPaid,0);
  const balance=active.reduce((s,l)=>s+outstandingBalance(l),0);
  const overdue=active.reduce((s,l)=>s+overdueAmount(l),0);
  document.getElementById("statCustomers").textContent=database.customers.length;
  document.getElementById("statLoans").textContent=database.loans.length;
  document.getElementById("statDisbursed").textContent=money(disbursed);
  document.getElementById("statCollected").textContent=money(collected);
  document.getElementById("statBalance").textContent=money(balance);
  document.getElementById("statOverdue").textContent=money(overdue);
  const list=document.getElementById("arrearsList"); if(list){ list.innerHTML=""; const arrears=active.filter(l=>overdueAmount(l)>0);
    if(!arrears.length) list.innerHTML="<li>No overdue loans recorded.</li>";
    arrears.forEach(l=>{ const item=document.createElement("li"); item.textContent=findCustomer(l.customerId).fullName+" - Loan "+l.id+" - Overdue: "+money(overdueAmount(l)); list.appendChild(item); }); }
}
document.addEventListener("DOMContentLoaded",()=>{
  const customerForm=document.getElementById("customerForm"); if(customerForm){ customerForm.addEventListener("submit",registerCustomer); displayCustomers(); customerOptions("applicationCustomer","Select customer"); }
  const applicationForm=document.getElementById("applicationForm"); if(applicationForm){ applicationForm.addEventListener("submit",submitApplication); displayApplications(); customerOptions("applicationCustomer","Select customer"); }
  const repaymentForm=document.getElementById("repaymentForm"); if(repaymentForm){ repaymentForm.addEventListener("submit",recordRepayment); displayLoans(); displayRepayments(); loanOptions("repaymentLoan","Select active loan"); }
  if(document.getElementById("dashboardStats")) displayDashboard();
});