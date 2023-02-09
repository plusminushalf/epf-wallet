import { MainServiceManagerServicesMap } from './services/main';
import MainServiceManager from './services/mainWithStore';

chrome.runtime.onInstalled.addListener((e) => {
  if (e.reason === chrome.runtime.OnInstalledReason.INSTALL) {
    const url = chrome.runtime.getURL('src/app/index.html#onboarding/intro');
    chrome.tabs.create({
      url,
    });
  }
});

const serviceInitializer = async (
  mainServiceManager: MainServiceManager
): Promise<MainServiceManagerServicesMap> => {
  //   const keyringCommunicationService = await KeyringCommunicationService.create({
  //     mainServiceManager: mainServiceManager,
  //   });
  return {
    // [KeyringCommunicationService.name]: keyringCommunicationService,
  };
};

/**
 * Starts the API subsystems, including all services.
 */
export default async function startMain(): Promise<MainServiceManager> {
  const mainService = await MainServiceManager.create(
    'background',
    serviceInitializer
  );
  mainService.startService();
  return mainService.started();
}
