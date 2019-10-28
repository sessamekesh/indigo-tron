import { NgModule } from "@angular/core";
import { HudComponent } from './hud.component';
import { BrowserModule } from '@angular/platform-browser';

@NgModule({
  declarations: [
    HudComponent,
  ],
  imports: [
    BrowserModule,
  ],
  exports: [
    HudComponent,
  ],
})
export class HudModule {}
