import MainServiceManager, { MainServiceManagerServicesMap } from './main';
import { wrapStore } from 'webext-redux';
import { initializeStore } from '../redux-slices';

export default class MainServiceManagerWithStore extends MainServiceManager {
  constructor(readonly name: string, createStore: boolean) {
    super(name);
    if (createStore) {
      this.store = initializeStore(this);
      wrapStore(this.store);
    }
  }

  static async create(
    name: string,
    serviceInitializer: (
      mainServiceManager: MainServiceManager
    ) => Promise<MainServiceManagerServicesMap>,
    createStore: boolean = true
  ) {
    const mainServiceManager = new this(name, createStore);

    await mainServiceManager.init({
      services: await serviceInitializer(mainServiceManager),
    });

    return mainServiceManager;
  }
}
