interface ModuleRegistration {
  moduleId: string;
  activate: () => void;
  permissions: string[];
}

export class OSModuleBridge {
  private static validateRegistration(config: ModuleRegistration) {
    const REQUIRED_FIELDS = ['moduleId', 'activate', 'permissions'];
    REQUIRED_FIELDS.forEach(field => {
      if (!(field in config)) {
        throw new Error(`Missing required field in module registration: ${field}`);
      }
    });
    if (!Array.isArray(config.permissions)) {
      throw new Error('Permissions must be an array');
    }
  }

  static registerModule(config: ModuleRegistration) {
    this.validateRegistration(config);
    return window.osBridge.registerModule(config);
  }

  static getServices() {
    return window.osBridge.getServices();
  }

  static onActivate(callback: () => void) {
    window.osBridge.activateModule(callback);
  }
}
