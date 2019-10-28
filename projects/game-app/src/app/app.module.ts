import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { HudModule } from './hud/hud.module';

@NgModule({
  declarations: [
    AppComponent,
  ],
  imports: [
    BrowserModule,
    HudModule,
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule {}
