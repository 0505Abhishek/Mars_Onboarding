const {insertLog, getRegionBudgetCount,getAsmBugdetCount,getEmail,soData,awsmData,getperiod,dumpQuery,last7Days,last4Weeks,previousPeriod} = require("../../models/sent_mail.model");
const {sendLinkOnMailToSo,sendLinkOnMailToCE, sentMailToMe}= require("../../util/sent_mail");
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const bcrypt = require("bcryptjs");
const dumpformattedResults = [];
var todayDate = new Date().toISOString().slice(0, 10).split('-').reverse().join('/');

function countWeekdays(startDate, endDate) {
  let count = 0;
  let current = new Date(startDate);
  while (current <= endDate) {
      if (current.getDay() !== 0) { 
          count++;
      }
      current.setDate(current.getDate() + 1);
  }
  
  return count;
}

function oldWeekdays(fromDate, toDate) {
  const startDate = new Date(fromDate);
  const endDate = new Date(toDate);
  let count = 0;

  for (let d = startDate; d <= endDate; d.setDate(d.getDate() + 1)) {
      const dayOfWeek = d.getDay();
      if (dayOfWeek !== 0) {
          count++;
      }
  }

  return count;
}

const generateHtmlTable = (data) => {
  try {
    if (!data || !Array.isArray(data) || data.length === 0) {
      return;
    }

    let html = '<table style="border: 1px dotted violet; border-collapse: collapse; width: 100%;">';

    const headers = Object.keys(data[0]);

    // Generate header row
    html += '<tr>';
    headers.forEach((header) => {
      let headerStyle = '';
      if (header === "Present %") {
        headerStyle = 'background-color: #9ACD32;';
      } else if (header === "present %") {
        headerStyle = 'background-color: #9ACD32;';
      } else if (header === "Status") {
        headerStyle = 'background-color: #00BFFF;';
      } else if (header === "Selfie Matching") {
        headerStyle = 'background-color: #9ACD32;';
      }else if (header === "Active") {
        headerStyle = 'background-color: #00BFFF;';
      }else if (header === "No. of Selfie") {
        headerStyle = 'background-color: #FFFF00;';
      }else if (header === "No. of Selfie Matching") {
        headerStyle = 'background-color: #9ACD32;';
      }
      
      html += `<th style="border: 1px dotted violet; padding: 8px; color: black; ${headerStyle}">${header}</th>`;
    });
    html += '</tr>';

    // Generate data rows
    data.forEach((row) => {
      html += '<tr>';
      headers.forEach((header, colIndex) => {
        const cellColor = colIndex === 0 ? 'black' : '#800080'; 
        html += `<td style="border: 1px dotted violet; padding: 8px; color: ${cellColor};">${row[header]}</td>`;
      });
      html += '</tr>';
    });

    html += '</table>';
    return html;
  } catch (error) {
    console.error('Error in generateHtmlTable:', error);
    throw error;
  }
};



const userView = async () => {
  success = 0;
  fail = 0;
  try {
    let data = await getperiod();
    let fromDate = new Date(data[0].FromDate);
    let currentDate = new Date();
    let weekdaysCount = countWeekdays(fromDate, currentDate);
    let oldweekdays = oldWeekdays(data[1].FromDate,data[1].ToDate);

    let dumpData = await dumpQuery({}, data[0], data[1]);
    let last7Day = await last7Days({}, data[0], data[1]);
    let last4Week = await last4Weeks({}, data[0], data[1]);
    let previousPeriods = await previousPeriod({}, data[0], data[1]);
    let RegionBudgetCount = await getRegionBudgetCount();
    let AsmBugdetCount = await getAsmBugdetCount();

    

    dumpData.forEach(item => {
      let awsmCode = item.awsm_code;
  
      let last7DayEntry = last7Day.find(d => d.awsm_code === awsmCode) || {};
      let last4WeekEntry = last4Week.find(d => d.awsm_code === awsmCode) || {};
      let previousPeriodsEntry = previousPeriods.find(d => d.awsm_code === awsmCode) || {};
  
      item.last_7_days_count = last7DayEntry.last_7_days_count || 0;
      item.last_4weeks = last4WeekEntry.last_4_weeks || 0;
      item.previous_period = previousPeriodsEntry.previous_period || 0; 
    });
 
    let emails = await getEmail();

    const processData = async (result) => {
      result.forEach(user => {
        user["present %"] = user["Total Mandays"] !== 0 
          ? ((user["PTD Present"] / user["Total Mandays"]) * 100).toFixed(2) + "%"
          : "0.00%";
    
        user.previous_period = (oldweekdays * user["Budgeted"]) !== 0 
          ? ((user.previous_4weeks / (oldweekdays * user["Budgeted"])) * 100).toFixed(2) + "%"
          : "0.00%";
    
      });
    };
    

    const processAwsmData = (result, weekdaysCount) => {
      result.forEach(user => {
        user.total_mandays = weekdaysCount;
        user.present_ptd = user.last_4weeks !== 0 ? ((user.last_4weeks / user.total_mandays) * 100).toFixed(2) : "0.00";
        user.previous_periodss = user.previous_period !== 0 ? ((user.previous_period/oldweekdays)*100).toFixed(2) : "0.00";
      });
    };

    processAwsmData(dumpData, weekdaysCount);
    let awsmResult = dumpData;
    let aggregatedData = convertInRegion(awsmResult,AsmBugdetCount);
    processData(aggregatedData);
    let dataregion = generateHtmlTable(aggregatedData);

    let convertedCe = convertedInCE(awsmResult,RegionBudgetCount);
    processData(convertedCe);
    let dataCe = generateHtmlTable(convertedCe);
    let dumpsheet = await loopDump(dumpData);

    await sendLinkOnMailToCE( dumpsheet, dataregion, dataCe, todayDate, emails[0].email_to, emails[0].email_cc);

    await processEmails(awsmResult);
   
    await sentMailToMe(success,fail,"abhisharma05052002@gmail.com");
   

    return;
  } catch (error) {
    return;

  }
};


const convertedInCE = (data, RegionBudgetCount) => {
  const result = {};
  let totals = {
    Region: 'Total', 
    Budgeted: 0, 
    Active: 0, 
    Present: 0, 
    "No. of Selfie": 0,
    "No. of Selfie Matching": 0,
    "Present in L7D": 0,
    "Total Mandays": 0,
    "PTD Present": 0,
    'previous_4weeks': 0
  };

  const budgetLookup = RegionBudgetCount.reduce((acc, item) => {
    acc[item.region.trim().toLowerCase()] = item.total_budget_count;
    return acc;
  }, {});

  // Process regions to populate result
  data.forEach(item => {
    let key = item.region.trim().toLowerCase();

    if (item.region === "") {
      return; // Skip empty regions
    }

    // Initialize result object for a new region if it doesn't exist
    if (!result[key]) {
      result[key] = {
        Region: item.region || 'No Region',
        Budgeted: budgetLookup[key] || 0, 
        Active: 0, 
        Present: 0, 
        "No. of Selfie": 0,
        "No. of Selfie Matching": 0,
        "Present in L7D": 0,
        "Total Mandays": 0,
        "PTD Present": 0,
        'previous_4weeks': 0
      };
    }

    // Update region-specific values
    result[key].Active += (item.is_active === '1' ? 1 : 0);
    result[key].Present += (item.status ? 1 : 0);
    result[key]["No. of Selfie"] += (item.status ? 1 : 0);
    result[key]["No. of Selfie Matching"] += (item.status === '601' ? 1 : 0);
    result[key]["Present in L7D"] += item.last_7_days_count || 0;
    result[key]["Total Mandays"] = (item.total_mandays * budgetLookup[key]) || 0;
    result[key]["PTD Present"] += item.last_4weeks || 0;
    result[key]["previous_4weeks"] += item.previous_period || 0;
  });

  // Calculate totals after processing all regions
  Object.values(result).forEach(region => {
    totals.Budgeted += region.Budgeted;
    totals.Active += region.Active;
    totals.Present += region.Present;
    totals["No. of Selfie"] += region["No. of Selfie"];
    totals["No. of Selfie Matching"] += region["No. of Selfie Matching"];
    totals["Present in L7D"] += region["Present in L7D"];
    totals["Total Mandays"] += region["Total Mandays"];
    totals["PTD Present"] += region["PTD Present"];
    totals["previous_4weeks"] += region["previous_4weeks"];
  });

  // Add the totals to the result
  const aggregatedData = Object.values(result);
  aggregatedData.push(totals);

  return aggregatedData;
};


// const convertInRegion = (data) => {
//   const result = {};
//   const regionOrder = [];  

//   data.forEach(item => {

//     const key = `${item.asm_territory_code}`.toUpperCase();
    
//     if (!result[key]) {
//       result[key] = {
//         Region: item.region||"No Region",
//         "ASM HQ'": key,
//         Budgeted: 0, 
//         Active: 0, 
//         Present: 0, 
//         "No. of Selfie": 0,
//         "No. of Selfie Matching": 0,
//         "Present in L7D": 0,
//         "Total Mandays":0,
//         "PTD Present":0,
//         'previous_4weeks':0
//       };

//       if (!regionOrder.includes(item.region)) {
//         regionOrder.push(item.region);
//       }
//     }

//     result[key].Budgeted++;
//     result[key].Active += (item.is_active === '1' ? 1 : 0);
//     result[key].Present += (item.status ? 1 : 0);
//     result[key]["No. of Selfie"] += (item.status ? 1 : 0);
//     result[key]["No. of Selfie Matching"] += (item.status === '601' ? 1 : 0);
//     result[key]["Present in L7D"] += item.last_7_days_count || 0;
//     result[key]["Total Mandays"] += item.total_mandays || 0;
//     result[key]["PTD Present"] += item.last_4weeks || 0;
//     result[key]["previous_4weeks"] += item.previous_period || 0;
//   });

//   const aggregatedData = Object.values(result);

//   aggregatedData.sort((a, b) => {
//     return regionOrder.indexOf(a.Region) - regionOrder.indexOf(b.Region);
//   });

//   return aggregatedData;
// };


const convertInRegion = (data, AsmBugdetCount = []) => {
  const result = {};
  const regionOrder = [];

  const budgetCountLookup = AsmBugdetCount.reduce((acc, item) => {
    const key = `${item.region}_${item.asm_territory_code}`.toUpperCase();
    acc[key] = item.total_budget_count;
    return acc;
  }, {});
  
  
  // Modify the data processing loop to use region and asm_territory_code as keys
  data.forEach(item => {
    if (item.region === "") {
      return;
    }
  
    const key = `${item.region}_${item.asm_territory_code}`.toUpperCase();
  
    if (!result[key]) {
      result[key] = {
        Region: item.region || "No Region",
        "ASM HQ": item.asm_territory_code.toUpperCase(),
        Budgeted: budgetCountLookup[key] || 0, // Use the combined key for budget lookup
        Active: 0,
        Present: 0,
        "No. of Selfie": 0,
        "No. of Selfie Matching": 0,
        "Present in L7D": 0,
        "Total Mandays": (budgetCountLookup[key]*item.total_mandays)||0,
        "PTD Present": 0,
        'previous_4weeks': 0
      };
  
      if (!regionOrder.includes(item.region)) {
        regionOrder.push(item.region);
      }
    }
  
    result[key].Active += (item.is_active === '1' ? 1 : 0);
    result[key].Present += (item.status ? 1 : 0);
    result[key]["No. of Selfie"] += (item.status ? 1 : 0);
    result[key]["No. of Selfie Matching"] += (item.status === '601' ? 1 : 0);
    result[key]["Present in L7D"] += item.last_7_days_count || 0;
    result[key]["PTD Present"] += item.last_4weeks || 0;
    result[key]["previous_4weeks"] += item.previous_period || 0;
  });

  const aggregatedData = Object.values(result);

  aggregatedData.sort((a, b) => {
    return regionOrder.indexOf(a.Region) - regionOrder.indexOf(b.Region);
  });

  return aggregatedData;
};


const loopDump = async (dumpData) => {
  let dumpformattedResults = [];
  for (let i = 0; i < dumpData.length; i++) {
    try {
      const data = dumpData[i];
      const formattedData = dumpformate(data); 

      if (formattedData !== null) {
        dumpformattedResults.push(formattedData);
      }
    } catch (error) {
      console.error(`Error processing dump data at index ${i}:`, error);
    }
  }

  var todayDate = new Date().toISOString().slice(0, 10).split('-').reverse().join('/');
  const dumpexcel = await sentMailDump(dumpformattedResults);
  return dumpexcel;
};


const sentMailDump = async (data) => {
  try {
    if (!Array.isArray(data) || data.length === 0) {
      throw new Error('Data should be a non-empty array');
    }

    const workbook = XLSX.utils.book_new();

    const transformedData = data.map(row => ({
      ...row,
      "Register Image": row["Register Image"] ? { f: `HYPERLINK("${row["Register Image"]}", "View Register")` } : '',
      "Recognition Image": row["Recognition Image"] ? { f: `HYPERLINK("${row["Recognition Image"]}", "View Recognition")` } : ''
    }));

    const worksheet = XLSX.utils.json_to_sheet(transformedData);

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet 1');

    const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });

    return buffer;

  } catch (error) {
    console.error('Error in sentMailDump:', error);
  }
};



// const processEmails = async (awsmResult)=>{
//   const emailGroups = awsmResult.reduce((acc, item)=>{
//     const email = item.ase_email_id;
//     if (!acc[email]) {
//       acc[email] = [];
//     }
//     acc[email].push(item);
//     return acc;
//   }, {});

//   for (const email in emailGroups) {
//     if (emailGroups.hasOwnProperty(email)) {
//       const awsmData = awsmformate(emailGroups[email]);

//       const todayDate = new Date().toISOString().slice(0, 10).split('-').reverse().join('/');
//       let data = generateHtmlTable(awsmData);
//       await sendLinkOnMailToSo(data,todayDate,email);

//     }
//   }
// };

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

let count = 0;
const processEmails = async (awsmResult) => {

  const logData = [];
  const emailGroups = awsmResult.reduce((acc, item) => {
    const email = item.ase_email_id.trim();
    if (!acc[email]) acc[email] = [];
    acc[email].push(item);
    return acc;
  }, {});

  const batchSize = 10;
  const emailAddresses = Object.keys(emailGroups);

  for (let i = 0; i < emailAddresses.length; i += batchSize) {
    const batch = emailAddresses.slice(i, i + batchSize);
    
    const emailPromises = batch.map(async (email) => {
      const awsmData = awsmformate(emailGroups[email]);
      const data = generateHtmlTable(awsmData);

      try {
        const soReturn = await sendLinkOnMailToSo(data, todayDate, email);
   

        if (soReturn.success) { success++; count++;}
        else { fail++; count++;}

        logData.push({
          email: email,
          response: soReturn.success ? "Success" : "Failure",
          error: soReturn.success ? null : soReturn.error
        });
        
        
      } catch (error) {
        logData.push({
          email: email,
          response: "Failure",
          error: error.message
        });
        fail++;
      }
    });

    await Promise.allSettled(emailPromises);

    await delay(60000);
  }

  const currentDate = new Date();

  logData.forEach((item) => {
    insertLog(item, currentDate);
  });

};



const awsmformate = (data) => {
  return data.map(row => {
    return {
      DB: row.name||"",
      DSR: row.awsm_name||"",
      "DSR Code":row.awsm_code||"",
      Status: row.is_active=="1"?"Active":"IN Active",
      Present: (!row.status || row.status === "" || row.status === null) ? "NO" : "YES",
      "Check In Time": row.time||"",
      Selfie:  (!row.status || row.status === "" || row.status === null) ? "NO" : "YES",
      "Selfie Matching": row.status==601?'YES':'NO',
      "Present in L7D": row.last_7_days_count|| 0,
      "Total Mandays": row.total_mandays||0,  
      "PTD present": row.last_4weeks||0,
      "Present %": row.present_ptd+"%",
      "Last Period Attendance": row.previous_period+"%"
    };
  });
};

const dumpformate = (row) => {
  if(row.is_active=='0'){
     return null;
  }
  return {
      Region: row.region||'No Region',
      ASM: row.asm_territory_code,
      "ASM Name": row.ASM_Name,
      SO: row.ase_territory_code,
      "So Name": row.ase_name,
      DB: row.name,
      "DSR CODE": row.awsm_code,
      DSR: row.awsm_name,
      Status: 'Active',
      Present: (!row.time || row.time === "" || row.time === null) ? "no" : "yes",
      "Check In Time": row.time || "",
      Selfie: (!row.time || row.time === "" || row.time === null) ? "no" : "yes",
      "Selfie Matching": row.status==601?'yes':'no',
      "Present in L7D": row.last_7_days_count,
      "Total Mandays": row.total_mandays,
      "PTD present": row.last_4weeks,
      "Present %": row.present_ptd+"%",
      "Last Period Attendance": row.previous_periodss+"%",
      "Register Image" : row.img ? `https://smartdecisionpoints.com/upload/kyc/${row.img}` : '',
      "Recognition Image": row.awsm_code ? `https://face.m4u-kyc.com/brit_image/${row.awsm_code}` : ''
  };
}



module.exports = {
    userView,sentMailDump}