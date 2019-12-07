import { platformBrowserDynamic } from "@angular/platform-browser-dynamic";
import { TestAppRootModule } from './approot/approot.module';

// enableProdMode?
platformBrowserDynamic().bootstrapModule(TestAppRootModule)
  .catch(err => console.error(err));
