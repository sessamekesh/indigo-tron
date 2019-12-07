import { NgModule } from "@angular/core";
import { AppRootComponent } from './approot.component';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { Ng2Harness } from './ng2harness';
import { TestsModule } from '../tests/testmain';

@NgModule({
  declarations: [
    AppRootComponent,
  ],
  imports: [
    BrowserModule,
    FormsModule,
    TestsModule,
  ],
  providers: [Ng2Harness],
  bootstrap: [AppRootComponent],
})
export class TestAppRootModule {}
