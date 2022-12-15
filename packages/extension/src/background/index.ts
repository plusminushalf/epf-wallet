import MainServiceManager from './services/main';

chrome.runtime.onInstalled.addListener((e) => {
  if (e.reason === chrome.runtime.OnInstalledReason.INSTALL) {
    const url = chrome.runtime.getURL('src/app/index.html#onboarding');
    chrome.tabs.create({
      url,
    });
  }
});

/**
 * Starts the API subsystems, including all services.
 */
export async function startMain(): Promise<MainServiceManager> {
  const mainService = await MainServiceManager.create();

  mainService.startService();

  return mainService.started();
}

startMain();
