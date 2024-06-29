document.addEventListener('DOMContentLoaded', function() {
    // Load settings from storage
    chrome.storage.local.get(['apiKey', 'baseId', 'tableName'], function(result) {
      document.getElementById('apiKey').value = result.apiKey || '';
      document.getElementById('baseId').value = result.baseId || '';
      document.getElementById('tableName').value = result.tableName || '';
    });
  
    document.getElementById('saveSettings').addEventListener('click', function() {
      const apiKey = document.getElementById('apiKey').value;
      const baseId = document.getElementById('baseId').value;
      const tableName = document.getElementById('tableName').value;
  
      // Save settings to storage
      chrome.storage.local.set({ apiKey, baseId, tableName }, function() {
        console.log('Settings saved');
      });
    });
  });