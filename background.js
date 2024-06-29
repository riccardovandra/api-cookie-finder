chrome.runtime.onInstalled.addListener(() => {
  console.log("Extension installed.");
  
  // Create an alarm to trigger every week
  chrome.alarms.create('weeklyCookieUpdate', {
    periodInMinutes: 10080 // 10080 minutes in a week
  });
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'weeklyCookieUpdate') {
    console.log("Weekly cookie update alarm triggered.");
    updateCookies();
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'searchCookies') {
    const { website } = message;
    console.log("Searching cookies for website:", website);

    // Ensure the URL has a valid scheme
    let url = website;
    if (!/^https?:\/\//i.test(url)) {
      url = 'http://' + url;
    }

    chrome.cookies.getAll({ url: url }, (cookies) => {
      console.log("Cookies found:", cookies);
      if (cookies && cookies.length > 0) {
        sendToAirtable(url, cookies);
        sendResponse({ cookies });
      } else {
        sendResponse({ cookies: [] });
      }
    });

    // Keep the message channel open for the async response
    return true;
  }
});

function updateCookies() {
  // Retrieve the stored website URLs
  chrome.storage.local.get(['websites'], function(result) {
    const websites = result.websites || [];
    websites.forEach((website) => {
      chrome.cookies.getAll({ url: website }, (cookies) => {
        console.log(`Updating cookies for website: ${website}`);
        sendToAirtable(website, cookies);
      });
    });
  });
}

function sendToAirtable(website, cookies) {
  chrome.storage.local.get(['apiKey', 'baseId', 'tableName'], function(result) {
    const airtableApiKey = result.apiKey;
    const airtableBaseId = result.baseId;
    const airtableTableName = result.tableName;
    
    if (!airtableApiKey || !airtableBaseId || !airtableTableName) {
      console.error("Airtable settings are not configured");
      return;
    }

    const cookieData = cookies.map(cookie => `${cookie.name}=${cookie.value}`).join('; ');
    console.log("Sending to Airtable:", cookieData);

    fetch(`https://api.airtable.com/v0/${airtableBaseId}/${airtableTableName}`, {
      headers: {
        'Authorization': `Bearer ${airtableApiKey}`
      }
    })
    .then(response => response.json())
    .then(data => {
      const existingRecord = data.records.find(record => record.fields.Website === website);
      if (existingRecord) {
        // Update existing record
        const recordId = existingRecord.id;
        fetch(`https://api.airtable.com/v0/${airtableBaseId}/${airtableTableName}/${recordId}`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${airtableApiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            fields: {
              'Cookies': cookieData
            }
          })
        })
        .then(response => response.json())
        .then(data => console.log('Record updated:', data))
        .catch(error => console.error('Error updating record:', error));
      } else {
        // Create new record
        fetch(`https://api.airtable.com/v0/${airtableBaseId}/${airtableTableName}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${airtableApiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            fields: {
              'Website': website,
              'Cookies': cookieData
            }
          })
        })
        .then(response => response.json())
        .then(data => console.log('Record created:', data))
        .catch(error => console.error('Error creating record:', error));
      }
    })
    .catch(error => console.error('Error fetching records:', error));
  });
}