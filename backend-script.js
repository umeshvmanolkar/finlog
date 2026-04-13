/**
 * FINLOG BACKEND SCRIPT
 * 1. Open Google Sheets.
 * 2. Extensions -> Apps Script.
 * 3. Paste this code and save.
 * 4. Deploy -> New Deployment -> Type: Web App.
 * 5. Execute as: Me. Who has access: Anyone.
 * 6. Copy the Web App URL and use it in your React frontend.
 */

const SPREADSHEET_ID = SpreadsheetApp.getActiveSpreadsheet().getId();

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action;

    if (action === 'signup') return handleSignup(data.payload);
    if (action === 'login') return handleLogin(data.payload);
    if (action === 'addAccount') return handleAddAccount(data.payload);
    if (action === 'addTransaction') return handleAddTransaction(data.payload);
    if (action === 'updateTarget') return handleUpdateTarget(data.payload);

    return JSONResponse({ error: 'Invalid action' });
  } catch (error) {
    return JSONResponse({ error: error.message });
  }
}

function doGet(e) {
  try {
    const action = e.parameter.action;

    if (action === 'getDashboardData') return handleGetDashboardData(e.parameter.userId);
    if (action === 'ping') return JSONResponse({ message: 'pong' });

    return JSONResponse({ error: 'Invalid action' });
  } catch (error) {
    return JSONResponse({ error: error.message });
  }
}

function JSONResponse(response) {
  return ContentService.createTextOutput(JSON.stringify(response))
    .setMimeType(ContentService.MimeType.JSON);
}

// Ensure sheets exist
function getSheet(sheetName) {
  let ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    if (sheetName === 'Users') {
      sheet.appendRow(['ID', 'Username', 'Email', 'Password']);
    } else if (sheetName === 'Accounts') {
      sheet.appendRow(['ID', 'UserID', 'AccountName', 'CreatedAt']);
    } else if (sheetName === 'Transactions') {
      sheet.appendRow(['ID', 'UserID', 'AccountID', 'Amount', 'Type', 'Date']);
    } else if (sheetName === 'Targets') {
      sheet.appendRow(['UserID', 'TargetAmount']);
    }
  }
  return sheet;
}

function generateId() {
  return Utilities.getUuid();
}

function handleSignup(payload) {
  const { username, email, password } = payload;
  const sheet = getSheet('Users');
  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (data[i][2] === email) {
      return JSONResponse({ error: 'Email already exists' });
    }
  }

  const id = generateId();
  sheet.appendRow([id, username, email, password]);
  return JSONResponse({ success: true, user: { id, username, email } });
}

function handleLogin(payload) {
  const { email, password } = payload;
  const sheet = getSheet('Users');
  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (data[i][2] === email && String(data[i][3]) === String(password)) {
      return JSONResponse({
        success: true,
        user: { id: data[i][0], username: data[i][1], email: data[i][2] }
      });
    }
  }

  return JSONResponse({ error: 'Invalid email or password' });
}

function handleAddAccount(payload) {
  const { userId, accountName } = payload;
  if(!userId || !accountName) return JSONResponse({ error: 'Missing account info' });
  
  const sheet = getSheet('Accounts');
  const id = generateId();
  const createdAt = new Date().toISOString();
  sheet.appendRow([id, userId, accountName, createdAt]);
  
  return JSONResponse({ success: true, account: { id, userId, accountName, createdAt } });
}

function handleAddTransaction(payload) {
  const { userId, accountId, amount, type } = payload;
  const sheet = getSheet('Transactions');
  const id = generateId();
  const date = new Date().toISOString();
  sheet.appendRow([id, userId, accountId, amount, type, date]);
  
  return JSONResponse({ success: true, transaction: { id, userId, accountId, amount, type, date } });
}

function handleUpdateTarget(payload) {
  const { userId, targetAmount } = payload;
  const sheet = getSheet('Targets');
  // First, verify sheets are made.
  getSheet('Targets'); // Ensure it exists
  const data = sheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === userId) {
      sheet.getRange(i + 1, 2).setValue(targetAmount);
      return JSONResponse({ success: true, targetAmount });
    }
  }
  
  // If not found, create new
  sheet.appendRow([userId, targetAmount]);
  return JSONResponse({ success: true, targetAmount });
}

function handleGetDashboardData(userId) {
  if(!userId) return JSONResponse({ error: 'userId is required' });

  const accSheet = getSheet('Accounts');
  const txSheet = getSheet('Transactions');
  const tgtSheet = getSheet('Targets');
  
  const accountsData = accSheet.getDataRange().getValues();
  const txData = txSheet.getDataRange().getValues();
  const tgtData = tgtSheet.getDataRange().getValues();
  
  let targetAmount = 0;
  for (let i = 1; i < tgtData.length; i++) {
    if (tgtData[i][0] === userId) {
      targetAmount = tgtData[i][1];
      break;
    }
  }
  
  let accounts = [];
  for (let i = 1; i < accountsData.length; i++) {
    if (accountsData[i][1] === userId) {
      accounts.push({
        id: accountsData[i][0],
        userId: accountsData[i][1],
        accountName: accountsData[i][2],
        createdAt: accountsData[i][3]
      });
    }
  }
  
  let transactions = [];
  for (let i = 1; i < txData.length; i++) {
    if (txData[i][1] === userId) {
      transactions.push({
        id: txData[i][0],
        userId: txData[i][1],
        accountId: txData[i][2],
        amount: txData[i][3],
        type: txData[i][4],
        date: txData[i][5]
      });
    }
  }
  
  return JSONResponse({
    success: true,
    data: { targetAmount, accounts, transactions }
  });
}
