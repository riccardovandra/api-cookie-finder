document.addEventListener('DOMContentLoaded', function() {
  chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
    let activeTab = tabs[0];
    let activeTabUrl = new URL(activeTab.url);
    console.log("Active tab URL:", activeTabUrl.origin);
    document.getElementById('website').value = activeTabUrl.origin;
  });

  document.getElementById('openSettings').addEventListener('click', function() {
    chrome.runtime.openOptionsPage();
  });
});

document.getElementById('searchCookie').addEventListener('click', function() {
  const website = document.getElementById('website').value;
  console.log("Website to search cookies for:", website);

  if (website) {
    chrome.runtime.sendMessage({ action: 'searchCookies', website }, function(response) {
      console.log("Response from background script:", response);
      if (response.cookies && response.cookies.length > 0) {
        const resultText = response.cookies.map(cookie => `${cookie.name}=${cookie.value}`).join('; ');
        document.getElementById('result').innerText = resultText;

        // Store the website URL for future updates
        chrome.storage.local.get(['websites'], function(result) {
          const websites = result.websites || [];
          if (!websites.includes(website)) {
            websites.push(website);
            chrome.storage.local.set({ websites: websites }, function() {
              console.log("Website URL stored for future updates.");
            });
          }
        });
      } else {
        document.getElementById('result').innerText = 'No cookies found';
      }
    });
  } else {
    document.getElementById('result').innerText = 'Please fill in all fields';
  }
});